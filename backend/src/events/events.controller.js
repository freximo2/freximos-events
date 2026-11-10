const { validationResult } = require('express-validator');
const prisma = require('../config/db');

// Notify all registered users of an event
async function notifyEventUsers(eventId, title, message, type = 'INFO') {
  const registrations = await prisma.registration.findMany({
    where: { eventId, status: { in: ['PENDING', 'CONFIRMED', 'WAITLISTED'] } },
    select: { userId: true },
  });

  if (registrations.length > 0) {
    await prisma.notification.createMany({
      data: registrations.map((r) => ({
        userId: r.userId,
        title,
        message,
        type,
        link: `/events/${eventId}`,
      })),
    });
  }
}

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      name,
      description,
      type,
      category,
      date,
      endDate,
      location,
      latitude,
      longitude,
      maxPlayers,
      price,
      spaceId,
      targetUserIds,
      targetGroupIds,
    } = req.body;

    // Parse spaceId safely
    const parsedSpaceId = spaceId ? parseInt(spaceId) : null;

    // If ADMIN, check they have access to the space
    if (req.user.role === 'ADMIN') {
      if (!parsedSpaceId) return res.status(400).json({ error: 'Debes seleccionar un espacio' });
      const spaceAdmin = await prisma.spaceAdmin.findUnique({
        where: { spaceId_adminId: { spaceId: parsedSpaceId, adminId: req.user.id } },
      });
      if (!spaceAdmin) return res.status(403).json({ error: 'No tienes acceso a este espacio' });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        type,
        category: category || 'FUTBOL',
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location,
        latitude: latitude || null,
        longitude: longitude || null,
        maxPlayers,
        price: price || 0,
        creatorId: req.user.id,
        spaceId: parsedSpaceId,
        status: 'ACTIVE',
      },
      include: { creator: { select: { id: true, name: true, email: true } } },
    });

    // Notify all users about the new public event
    if (type === 'PUBLIC' || !type) {
      const allUsers = await prisma.user.findMany({
        where: { role: 'USER' },
        select: { id: true },
      });

      if (allUsers.length > 0) {
        await prisma.notification.createMany({
          data: allUsers.map((u) => ({
            userId: u.id,
            title: 'Nuevo evento disponible',
            message: `Se ha creado el evento "${name}". ¡Revisa los detalles e inscríbete!`,
            type: 'INFO',
            link: `/events/${event.id}`,
          })),
        });
      }
    } else if (type === 'PRIVATE') {
      // Collect all invited user IDs
      const invitedUserIds = new Set();
      if (Array.isArray(targetUserIds)) targetUserIds.forEach((id) => invitedUserIds.add(id));
      if (Array.isArray(targetGroupIds) && targetGroupIds.length > 0) {
        const groupMembers = await prisma.userGroupMember.findMany({
          where: { groupId: { in: targetGroupIds } },
          select: { userId: true },
        });
        groupMembers.forEach((m) => invitedUserIds.add(m.userId));
      }

      // Create invitations (NOT registrations) + notifications
      for (const uid of invitedUserIds) {
        try {
          await prisma.eventInvitation.create({
            data: { userId: uid, eventId: event.id },
          });
        } catch (e) {
          // Skip duplicates
        }

        await prisma.notification.create({
          data: {
            userId: uid,
            title: 'Invitacion a evento privado',
            message: `Has sido invitado al evento "${name}". Revisa los detalles e inscribete si deseas participar.`,
            type: 'INFO',
            link: `/events/${event.id}`,
          },
        });
      }
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function list(req, res) {
  try {
    const now = new Date();

    // Auto-archive events that ended more than 8 hours ago
    const archiveCutoff = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    await prisma.event.updateMany({
      where: {
        status: { in: ['ACTIVE', 'COMPLETED'] },
        OR: [
          { endDate: { not: null, lt: archiveCutoff } },
          { endDate: null, date: { lt: archiveCutoff } },
        ],
      },
      data: { status: 'ARCHIVED' },
    });

    const { type, status, category } = req.query;
    const where = {};

    if (req.query.spaceId) where.spaceId = parseInt(req.query.spaceId);
    if (category) where.category = category;

    // ARCHIVED events never appear in UI for anyone
    // They stay in DB but are hidden from all roles
    where.status = { notIn: ['ARCHIVED'] };

    if (req.user.role === 'USER') {
      // Private events where user has invitation OR registration
      const myPrivateRegs = await prisma.registration.findMany({
        where: { userId: req.user.id, event: { type: 'PRIVATE' }, status: { not: 'CANCELLED' } },
        select: { eventId: true },
      });
      const myInvitations = await prisma.eventInvitation.findMany({
        where: { userId: req.user.id, event: { type: 'PRIVATE' } },
        select: { eventId: true },
      });
      const privateIds = [
        ...new Set([
          ...myPrivateRegs.map((r) => r.eventId),
          ...myInvitations.map((i) => i.eventId),
        ]),
      ];

      where.AND = [
        { status: { notIn: ['ARCHIVED', 'DRAFT'] } },
        {
          OR: [
            { type: 'PUBLIC', status: { in: ['ACTIVE', 'COMPLETED', 'CANCELLED'] } },
            ...(privateIds.length > 0
              ? [
                  {
                    id: { in: privateIds },
                    type: 'PRIVATE',
                    status: { in: ['ACTIVE', 'COMPLETED', 'CANCELLED'] },
                  },
                ]
              : []),
          ],
        },
      ];
    } else if (req.user.role === 'ADMIN') {
      // ADMIN: own events (not archived) + public active from others
      where.AND = [
        { status: { notIn: ['ARCHIVED'] } },
        {
          OR: [
            { creatorId: req.user.id },
            { type: 'PUBLIC', status: 'ACTIVE', creatorId: { not: req.user.id } },
          ],
        },
      ];
    } else {
      // SUPER_ADMIN: sees all except archived
      if (type) where.type = type;
      if (status && status !== 'ARCHIVED') where.status = status;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Add timing info for frontend (hours until it disappears for users)
    const enriched = events.map((e) => {
      const eventEnd = e.endDate || e.date;
      const endTime = new Date(eventEnd).getTime();
      const archiveAt = endTime + 8 * 60 * 60 * 1000;
      const msLeft = archiveAt - now.getTime();
      const isPastEvent = endTime < now.getTime();
      return {
        ...e,
        isPastEvent,
        hoursUntilHide: isPastEvent ? Math.max(0, msLeft / (60 * 60 * 1000)) : null,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error listando eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getById(req, res) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        space: { select: { id: true, name: true, category: true } },
        registrations: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // ARCHIVED events only visible to admin/super_admin
    if (event.status === 'ARCHIVED' && req.user.role === 'USER') {
      return res.status(403).json({ error: 'Este evento ha sido archivado' });
    }

    // Users can see public events, or private events where they're registered OR invited
    if (req.user.role === 'USER' && event.type === 'PRIVATE' && event.creatorId !== req.user.id) {
      const isRegistered = event.registrations.some((r) => r.userId === req.user.id);
      const isInvited = await prisma.eventInvitation.findUnique({
        where: { userId_eventId: { userId: req.user.id, eventId: event.id } },
      });
      if (!isRegistered && !isInvited) {
        return res.status(403).json({ error: 'No tienes acceso a este evento' });
      }
    }

    res.json(event);
  } catch (error) {
    console.error('Error obteniendo evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function update(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const eventId = parseInt(req.params.id);
    const existing = await prisma.event.findUnique({ where: { id: eventId } });

    if (!existing) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'No tienes permisos para editar este evento' });
    }
    if (req.user.role === 'ADMIN' && existing.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes editar tus propios eventos' });
    }

    const {
      name,
      description,
      type,
      category,
      status,
      date,
      endDate,
      location,
      latitude,
      longitude,
      maxPlayers,
      price,
      spaceId,
    } = req.body;

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(category && { category }),
        ...(status && { status }),
        ...(date && { date: new Date(date) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(location && { location }),
        ...(latitude !== undefined && { latitude: latitude || null }),
        ...(longitude !== undefined && { longitude: longitude || null }),
        ...(maxPlayers && { maxPlayers }),
        ...(price !== undefined && { price }),
        ...(spaceId !== undefined && { spaceId: spaceId ? parseInt(spaceId) : null }),
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    res.json(event);
  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function cancelEvent(req, res) {
  try {
    const eventId = parseInt(req.params.id);
    const existing = await prisma.event.findUnique({ where: { id: eventId } });

    if (!existing) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'No tienes permisos para cancelar este evento' });
    }
    if (req.user.role === 'ADMIN' && existing.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes cancelar tus propios eventos' });
    }

    if (existing.status === 'CANCELLED') {
      return res.status(400).json({ error: 'El evento ya está cancelado' });
    }

    // Cancel the event
    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'CANCELLED' },
      include: { creator: { select: { id: true, name: true } } },
    });

    // Notify all registered users
    await notifyEventUsers(
      eventId,
      'Evento cancelado',
      `El evento "${existing.name}" ha sido cancelado. Lamentamos los inconvenientes.`,
      'ERROR'
    );

    // Cancel all active registrations
    await prisma.registration.updateMany({
      where: { eventId, status: { in: ['PENDING', 'CONFIRMED', 'WAITLISTED'] } },
      data: { status: 'CANCELLED' },
    });

    res.json(event);
  } catch (error) {
    console.error('Error cancelando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function archiveExpiredEvents(req, res) {
  try {
    const now = new Date();

    // Archive events whose endDate (or date if no endDate) has passed
    const expiredEvents = await prisma.event.findMany({
      where: {
        status: { in: ['ACTIVE', 'COMPLETED'] },
        OR: [
          { endDate: { not: null, lt: now } },
          { endDate: null, date: { lt: now } },
        ],
      },
    });

    if (expiredEvents.length > 0) {
      await prisma.event.updateMany({
        where: { id: { in: expiredEvents.map((e) => e.id) } },
        data: { status: 'ARCHIVED' },
      });
    }

    res.json({ archived: expiredEvents.length });
  } catch (error) {
    console.error('Error archivando eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function remove(req, res) {
  try {
    const eventId = parseInt(req.params.id);
    const existing = await prisma.event.findUnique({ where: { id: eventId } });

    if (!existing) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este evento' });
    }
    if (req.user.role === 'ADMIN' && existing.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes eliminar tus propios eventos' });
    }

    // Soft delete: archive instead of deleting, track who archived
    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'ARCHIVED', archivedBy: req.user.id },
    });

    res.json({ message: 'Evento archivado correctamente' });
  } catch (error) {
    console.error('Error archivando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Batch: archive or cancel multiple events
async function batchAction(req, res) {
  try {
    const { eventIds, action } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos un evento' });
    }
    if (!['ARCHIVED', 'CANCELLED'].includes(action)) {
      return res.status(400).json({ error: 'Accion debe ser ARCHIVED o CANCELLED' });
    }

    // Verify permissions
    const events = await prisma.event.findMany({ where: { id: { in: eventIds } } });

    if (req.user.role === 'ADMIN') {
      const notMine = events.filter((e) => e.creatorId !== req.user.id);
      if (notMine.length > 0) {
        return res.status(403).json({ error: 'Solo puedes modificar tus propios eventos' });
      }
    }

    // Update each event with archivedBy tracking
    for (const eid of eventIds) {
      const data = { status: action };
      if (action === 'ARCHIVED') data.archivedBy = req.user.id;
      await prisma.event.update({ where: { id: eid }, data });
    }

    // If cancelling, notify users and cancel registrations
    if (action === 'CANCELLED') {
      for (const event of events) {
        if (event.status === 'CANCELLED') continue;
        await notifyEventUsers(
          event.id,
          'Evento cancelado',
          `El evento "${event.name}" ha sido cancelado.`,
          'ERROR'
        );
        await prisma.registration.updateMany({
          where: { eventId: event.id, status: { in: ['PENDING', 'CONFIRMED', 'WAITLISTED'] } },
          data: { status: 'CANCELLED' },
        });
      }
    }

    res.json({
      message: `${eventIds.length} evento(s) ${action === 'ARCHIVED' ? 'archivados' : 'cancelados'}`,
    });
  } catch (error) {
    console.error('Error en accion batch:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se proporciono imagen' });
    const eventId = parseInt(req.params.id);
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });
    if (req.user.role === 'ADMIN' && existing.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes modificar tus eventos' });
    }
    const imagePath = `/uploads/events/${req.file.filename}`;
    const event = await prisma.event.update({ where: { id: eventId }, data: { image: imagePath } });
    res.json(event);
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  cancelEvent,
  archiveExpiredEvents,
  remove,
  batchAction,
  uploadImage,
};
