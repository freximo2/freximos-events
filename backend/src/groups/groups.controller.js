const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function list(req, res) {
  try {
    const groups = await prisma.userGroup.findMany({
      where: { adminId: req.user.id },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, photo: true } } } }, _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(groups);
  } catch (error) {
    console.error('Error listando grupos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, description } = req.body;
    const group = await prisma.userGroup.create({ data: { name, description, adminId: req.user.id }, include: { _count: { select: { members: true } } } });
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creando grupo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function update(req, res) {
  try {
    const groupId = parseInt(req.params.id);
    const existing = await prisma.userGroup.findUnique({ where: { id: groupId } });
    if (!existing) return res.status(404).json({ error: 'Grupo no encontrado' });
    if (existing.adminId !== req.user.id && req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'No tienes permisos' });
    const { name, description } = req.body;
    const group = await prisma.userGroup.update({ where: { id: groupId }, data: { ...(name && { name }), ...(description !== undefined && { description }) } });
    res.json(group);
  } catch (error) {
    console.error('Error actualizando grupo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function remove(req, res) {
  try {
    const groupId = parseInt(req.params.id);
    const existing = await prisma.userGroup.findUnique({ where: { id: groupId } });
    if (!existing) return res.status(404).json({ error: 'Grupo no encontrado' });
    if (existing.adminId !== req.user.id && req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'No tienes permisos' });
    await prisma.userGroup.delete({ where: { id: groupId } });
    res.json({ message: 'Grupo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando grupo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function addMember(req, res) {
  try {
    const groupId = parseInt(req.params.id);
    const { userId } = req.body;
    const group = await prisma.userGroup.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });
    if (group.adminId !== req.user.id && req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'No tienes permisos' });
    const member = await prisma.userGroupMember.create({ data: { groupId, userId }, include: { user: { select: { id: true, name: true, email: true } } } });
    res.status(201).json(member);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'El usuario ya es miembro de este grupo' });
    console.error('Error agregando miembro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function removeMember(req, res) {
  try {
    const groupId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const group = await prisma.userGroup.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });
    if (group.adminId !== req.user.id && req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'No tienes permisos' });
    await prisma.userGroupMember.delete({ where: { groupId_userId: { groupId, userId } } });
    res.json({ message: 'Miembro eliminado del grupo' });
  } catch (error) {
    console.error('Error eliminando miembro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function myUsers(req, res) {
  try {
    const myEventIds = await prisma.event.findMany({ where: { creatorId: req.user.id }, select: { id: true } });
    const eventIds = myEventIds.map(e => e.id);
    if (eventIds.length === 0) return res.json([]);
    const registrations = await prisma.registration.findMany({
      where: { eventId: { in: eventIds }, status: { not: 'CANCELLED' } },
      select: { userId: true }, distinct: ['userId'],
    });
    const userIds = registrations.map(r => r.userId);
    if (userIds.length === 0) return res.json([]);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, phone: true, photo: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error obteniendo mis usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Search users by name or email (for inviting to private events)
async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true, photo: true },
      take: 10,
      orderBy: { name: 'asc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Deny access: cancel all registrations of a user in admin's events + remove from groups
async function denyAccess(req, res) {
  try {
    const userId = parseInt(req.params.userId);

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Get all events by this admin
    const myEventIds = await prisma.event.findMany({
      where: { creatorId: req.user.id },
      select: { id: true },
    });
    const eventIds = myEventIds.map(e => e.id);

    // Cancel all registrations of this user in admin's events
    const cancelled = await prisma.registration.updateMany({
      where: { userId, eventId: { in: eventIds }, status: { notIn: ['CANCELLED'] } },
      data: { status: 'CANCELLED' },
    });

    // Remove all invitations to admin's events
    await prisma.eventInvitation.deleteMany({
      where: { userId, eventId: { in: eventIds } },
    });

    // Remove from admin's groups
    const myGroups = await prisma.userGroup.findMany({
      where: { adminId: req.user.id },
      select: { id: true },
    });
    if (myGroups.length > 0) {
      await prisma.userGroupMember.deleteMany({
        where: { userId, groupId: { in: myGroups.map(g => g.id) } },
      });
    }

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        title: 'Acceso denegado',
        message: `Tu acceso a los eventos de ${req.user.name || 'un administrador'} ha sido revocado.`,
        type: 'WARNING',
      },
    });

    res.json({ message: `Acceso denegado a ${target.name}. ${cancelled.count} inscripciones canceladas.` });
  } catch (error) {
    console.error('Error denegando acceso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { list, create, update, remove, addMember, removeMember, myUsers, searchUsers, denyAccess };
