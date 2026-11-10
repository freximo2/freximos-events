const prisma = require('../config/db');

// Pick the best waitlisted user: most confirmed events wins, tie-break by createdAt
async function pickBestWaitlisted(eventId, tx) {
  const db = tx || prisma;

  const waitlisted = await db.registration.findMany({
    where: { eventId, status: 'WAITLISTED' },
    include: { event: { select: { name: true } } },
  });

  if (waitlisted.length === 0) return null;

  // Count confirmed registrations for each waitlisted user
  const userIds = waitlisted.map((w) => w.userId);
  const activityCounts = await db.registration.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds }, status: 'CONFIRMED' },
    _count: { id: true },
  });

  const activityMap = {};
  for (const a of activityCounts) {
    activityMap[a.userId] = a._count.id;
  }

  // Sort: most confirmed events first, then earliest createdAt
  waitlisted.sort((a, b) => {
    const actA = activityMap[a.userId] || 0;
    const actB = activityMap[b.userId] || 0;
    if (actB !== actA) return actB - actA; // more activity = higher priority
    return new Date(a.createdAt) - new Date(b.createdAt); // earlier = higher priority
  });

  return waitlisted[0];
}

async function promoteFromWaitlist(eventId, tx) {
  const db = tx || prisma;
  const best = await pickBestWaitlisted(eventId, db);

  if (best) {
    await db.registration.update({
      where: { id: best.id },
      data: { status: 'PENDING' },
    });

    await db.notification.create({
      data: {
        userId: best.userId,
        title: 'Plaza disponible',
        message: `Se ha liberado una plaza en "${best.event.name}". Tu inscripción pasó de lista de espera a pendiente. ¡Tu actividad en la plataforma te dio prioridad!`,
        type: 'SUCCESS',
        link: `/events/${eventId}`,
      },
    });
  }
}

async function register(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = req.user.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    if (event.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'El evento no está activo' });
    }

    // Private events require invitation
    if (event.type === 'PRIVATE') {
      const isInvited = await prisma.eventInvitation.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      if (!isInvited) {
        return res.status(403).json({ error: 'Necesitas invitacion para inscribirte a este evento privado' });
      }
    }

    // Check if user is penalized
    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { penalizedUntil: true } });
    const isPenalized = userRecord?.penalizedUntil && new Date(userRecord.penalizedUntil) > new Date();

    const confirmedCount = await prisma.registration.count({
      where: { eventId, status: { in: ['PENDING', 'CONFIRMED'] } },
    });

    const isFull = confirmedCount >= event.maxPlayers;
    let status;
    if (isPenalized && isFull) {
      status = 'WAITLISTED';
    } else {
      status = isFull ? 'WAITLISTED' : 'PENDING';
    }

    const registration = await prisma.registration.create({
      data: {
        userId,
        eventId,
        status,
        notes: req.body.notes || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true } },
      },
    });

    const result = { ...registration };
    if (isPenalized) {
      result.penaltyWarning = `Estás penalizado hasta ${new Date(userRecord.penalizedUntil).toLocaleDateString('es')}. ${isFull ? 'Quedas en lista de espera.' : 'Tienes acceso porque hay cupo.'}`;
    }
    res.status(201).json(result);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya estás inscrito en este evento' });
    }
    console.error('Error en inscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function cancel(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = req.user.id;

    const registration = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    const wasActive = ['PENDING', 'CONFIRMED'].includes(registration.status);

    await prisma.$transaction(async (tx) => {
      await tx.registration.update({
        where: { id: registration.id },
        data: { status: 'CANCELLED' },
      });

      if (wasActive) {
        await promoteFromWaitlist(eventId, tx);
      }
    });

    res.json({ message: 'Inscripción cancelada' });
  } catch (error) {
    console.error('Error cancelando inscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function updateStatus(req, res) {
  try {
    const registrationId = parseInt(req.params.id);
    const { status, reason } = req.body;

    if (!['CONFIRMED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    if (registration.event.creatorId !== req.user.id && req.user.role === 'USER') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    const wasActive = ['PENDING', 'CONFIRMED'].includes(registration.status);
    const isBeingDeactivated = ['REJECTED', 'CANCELLED'].includes(status);

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify user of status change
    if (status === 'CONFIRMED') {
      await prisma.notification.create({
        data: {
          userId: registration.userId,
          title: 'Inscripción aceptada',
          message: `Tu solicitud para "${registration.event.name}" fue aceptada. ¡Estás dentro!`,
          type: 'SUCCESS',
          link: `/events/${registration.eventId}`,
        },
      });
    } else if (status === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId: registration.userId,
          title: 'Inscripción rechazada',
          message: `Tu solicitud para "${registration.event.name}" fue rechazada.${reason ? ' Motivo: ' + reason : ''}`,
          type: 'ERROR',
          link: `/events/${registration.eventId}`,
        },
      });
    }

    if (wasActive && isBeingDeactivated) {
      await promoteFromWaitlist(registration.eventId);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error actualizando inscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function myRegistrations(req, res) {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          include: {
            creator: { select: { id: true, name: true } },
            _count: { select: { registrations: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add counts per event: active (PENDING+CONFIRMED), waitlisted
    const eventIds = [...new Set(registrations.map((r) => r.eventId))];
    const counts = await prisma.registration.groupBy({
      by: ['eventId', 'status'],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
    });

    const countMap = {};
    for (const c of counts) {
      if (!countMap[c.eventId]) countMap[c.eventId] = { active: 0, waitlisted: 0 };
      if (['PENDING', 'CONFIRMED'].includes(c.status)) {
        countMap[c.eventId].active += c._count.id;
      }
      if (c.status === 'WAITLISTED') {
        countMap[c.eventId].waitlisted += c._count.id;
      }
    }

    const result = registrations.map((r) => ({
      ...r,
      eventCounts: {
        maxPlayers: r.event.maxPlayers,
        active: countMap[r.eventId]?.active || 0,
        waitlisted: countMap[r.eventId]?.waitlisted || 0,
      },
    }));

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo inscripciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getWaitlistPosition(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = req.user.id;

    const myReg = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!myReg || myReg.status !== 'WAITLISTED') {
      return res.status(404).json({ error: 'No estás en lista de espera para este evento' });
    }

    // Get all waitlisted and rank by activity then createdAt
    const waitlisted = await prisma.registration.findMany({
      where: { eventId, status: 'WAITLISTED' },
    });

    const userIds = waitlisted.map((w) => w.userId);
    const activityCounts = await prisma.registration.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, status: 'CONFIRMED' },
      _count: { id: true },
    });

    const activityMap = {};
    for (const a of activityCounts) {
      activityMap[a.userId] = a._count.id;
    }

    waitlisted.sort((a, b) => {
      const actA = activityMap[a.userId] || 0;
      const actB = activityMap[b.userId] || 0;
      if (actB !== actA) return actB - actA;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const position = waitlisted.findIndex((w) => w.userId === userId) + 1;

    res.json({ position });
  } catch (error) {
    console.error('Error obteniendo posición en lista de espera:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function checkPenalty(req, res) {
  try {
    const userRecord = await prisma.user.findUnique({ where: { id: req.user.id }, select: { penalizedUntil: true } });
    const isPenalized = userRecord?.penalizedUntil && new Date(userRecord.penalizedUntil) > new Date();
    res.json({ penalized: isPenalized, penalizedUntil: isPenalized ? userRecord.penalizedUntil : null });
  } catch (error) {
    console.error('Error verificando penalidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function demoteToWaitlist(req, res) {
  try {
    const registrationId = parseInt(req.params.id);
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } },
    });
    if (!registration) return res.status(404).json({ error: 'Inscripción no encontrada' });
    if (!['PENDING', 'CONFIRMED'].includes(registration.status)) return res.status(400).json({ error: 'Solo se pueden degradar inscripciones activas' });
    await prisma.$transaction(async (tx) => {
      await tx.registration.update({ where: { id: registrationId }, data: { status: 'WAITLISTED' } });
      await tx.notification.create({
        data: { userId: registration.userId, title: 'Inscripción movida a cola', message: `Tu inscripción al evento "${registration.event.name}" fue movida a lista de espera.`, type: 'WARNING', link: `/events/${registration.eventId}` },
      });
    });
    res.json({ message: `${registration.user.name} movido a lista de espera` });
  } catch (error) {
    console.error('Error degradando inscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function applyNoShowPenalties(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    if (!['COMPLETED', 'ARCHIVED'].includes(event.status)) return res.status(400).json({ error: 'Evento debe estar completado o archivado' });
    const { absentUserIds } = req.body;
    if (!Array.isArray(absentUserIds) || absentUserIds.length === 0) return res.status(400).json({ error: 'Lista de ausentes requerida' });
    const penaltyDays = 7;
    const penalizedUntil = new Date();
    penalizedUntil.setDate(penalizedUntil.getDate() + penaltyDays);
    let penalized = 0;
    for (const userId of absentUserIds) {
      const reg = await prisma.registration.findUnique({ where: { userId_eventId: { userId, eventId } } });
      if (reg && ['PENDING', 'CONFIRMED'].includes(reg.status)) {
        await prisma.penalty.create({ data: { userId, eventId, type: 'NO_SHOW', reason: `No se presentó al evento "${event.name}"`, active: true, expiresAt: penalizedUntil } });
        await prisma.user.update({ where: { id: userId }, data: { penalizedUntil } });
        await prisma.notification.create({ data: { userId, title: 'Penalización por inasistencia', message: `Penalizado por no asistir a "${event.name}". Hasta ${penalizedUntil.toLocaleDateString('es')}.`, type: 'ERROR', link: `/events/${eventId}` } });
        penalized++;
      }
    }
    res.json({ message: `${penalized} usuarios penalizados` });
  } catch (error) {
    console.error('Error aplicando penalidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Admin: remove user from event with reason + notification
async function removeFromEvent(req, res) {
  try {
    const registrationId = parseInt(req.params.id);
    const { reason } = req.body;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: { select: { id: true, name: true, creatorId: true } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Inscripcion no encontrada' });
    }

    // Admin can only remove from their own events
    if (req.user.role === 'ADMIN' && registration.event.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes gestionar tus propios eventos' });
    }

    const wasActive = ['PENDING', 'CONFIRMED'].includes(registration.status);

    await prisma.$transaction(async (tx) => {
      await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'CANCELLED' },
      });

      // Remove invitation too if exists
      try {
        await tx.eventInvitation.delete({
          where: { userId_eventId: { userId: registration.userId, eventId: registration.eventId } },
        });
      } catch (e) { /* no invitation, ok */ }

      // Notify user
      await tx.notification.create({
        data: {
          userId: registration.userId,
          title: 'Removido de evento',
          message: `Has sido removido del evento "${registration.event.name}".${reason ? ' Motivo: ' + reason : ''}`,
          type: 'WARNING',
          link: `/events/${registration.eventId}`,
        },
      });

      // Promote from waitlist if spot opened
      if (wasActive) {
        await promoteFromWaitlist(registration.eventId, tx);
      }
    });

    res.json({ message: `${registration.user.name} removido del evento` });
  } catch (error) {
    console.error('Error removiendo del evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { register, cancel, updateStatus, myRegistrations, getWaitlistPosition, checkPenalty, demoteToWaitlist, applyNoShowPenalties, removeFromEvent };
