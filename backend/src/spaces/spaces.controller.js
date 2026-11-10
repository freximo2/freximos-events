const prisma = require('../config/db');

async function list(req, res) {
  try {
    if (req.user.role === 'SUPER_ADMIN') {
      const spaces = await prisma.space.findMany({
        include: {
          admins: { include: { admin: { select: { id: true, name: true, email: true, role: true } } } },
          _count: { select: { events: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(spaces);
    }

    // ADMIN: only their assigned spaces
    const spaceAdmins = await prisma.spaceAdmin.findMany({
      where: { adminId: req.user.id },
      include: {
        space: {
          include: {
            admins: { include: { admin: { select: { id: true, name: true, email: true, role: true } } } },
            _count: { select: { events: true } },
          },
        },
      },
    });
    res.json(spaceAdmins.map(sa => sa.space));
  } catch (error) {
    console.error('Error listando espacios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        admins: { include: { admin: { select: { id: true, name: true, email: true, role: true } } } },
        _count: { select: { events: true } },
      },
    });

    if (!space) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }

    res.json(space);
  } catch (error) {
    console.error('Error obteniendo espacio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function create(req, res) {
  try {
    const { name, description, category, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const space = await prisma.space.create({
      data: {
        name,
        description: description || null,
        category: category || 'FUTBOL',
        isPublic: isPublic !== undefined ? isPublic : true,
      },
      include: {
        admins: { include: { admin: { select: { id: true, name: true, email: true, role: true } } } },
      },
    });

    res.status(201).json(space);
  } catch (error) {
    console.error('Error creando espacio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.space.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }

    const { name, description, category, isPublic } = req.body;

    const space = await prisma.space.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        admins: { include: { admin: { select: { id: true, name: true, email: true, role: true } } } },
      },
    });

    res.json(space);
  } catch (error) {
    console.error('Error actualizando espacio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.space.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }

    // Cascade: delete space admins first
    await prisma.spaceAdmin.deleteMany({ where: { spaceId: id } });
    await prisma.space.delete({ where: { id } });

    res.json({ message: 'Espacio eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando espacio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function assignAdmin(req, res) {
  try {
    const spaceId = parseInt(req.params.id);
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'adminId es requerido' });
    }

    const space = await prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return res.status(400).json({ error: 'Usuario no es un admin válido' });
    }

    const existing = await prisma.spaceAdmin.findUnique({
      where: { spaceId_adminId: { spaceId, adminId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Este admin ya está asignado a este espacio' });
    }

    const spaceAdmin = await prisma.spaceAdmin.create({
      data: { spaceId, adminId },
      include: { admin: { select: { id: true, name: true, email: true, role: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: adminId,
        title: 'Espacio asignado',
        message: `Se te ha asignado al espacio "${space.name}".`,
        type: 'INFO',
      },
    });

    res.status(201).json(spaceAdmin);
  } catch (error) {
    console.error('Error asignando admin a espacio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function removeAdmin(req, res) {
  try {
    const spaceId = parseInt(req.params.id);
    const adminId = parseInt(req.params.adminId);

    const existing = await prisma.spaceAdmin.findUnique({
      where: { spaceId_adminId: { spaceId, adminId } },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    await prisma.spaceAdmin.delete({
      where: { spaceId_adminId: { spaceId, adminId } },
    });

    const space = await prisma.space.findUnique({ where: { id: spaceId } });

    await prisma.notification.create({
      data: {
        userId: adminId,
        title: 'Espacio removido',
        message: `Se te ha removido del espacio "${space?.name || spaceId}".`,
        type: 'INFO',
      },
    });

    res.json({ message: 'Admin removido del espacio' });
  } catch (error) {
    console.error('Error removiendo admin de espacio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function mySpaces(req, res) {
  try {
    const spaceAdmins = await prisma.spaceAdmin.findMany({
      where: { adminId: req.user.id },
      include: {
        space: {
          include: {
            _count: { select: { events: true } },
          },
        },
      },
    });
    res.json(spaceAdmins.map(sa => sa.space));
  } catch (error) {
    console.error('Error obteniendo mis espacios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { list, getById, create, update, remove, assignAdmin, removeAdmin, mySpaces };
