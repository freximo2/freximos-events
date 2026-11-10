const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const prisma = require('../config/db');

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  address: true,
  photo: true,
  emergencyContact: true,
  role: true,
  createdAt: true,
};

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: USER_SELECT,
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function updateProfile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, phone, address, photo, emergencyContact } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(photo !== undefined && { photo }),
        ...(emergencyContact !== undefined && { emergencyContact }),
      },
      select: USER_SELECT,
    });

    res.json(user);
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function listUsers(req, res) {
  try {
    if (req.user.role === 'SUPER_ADMIN') {
      // SA sees all users with penalty info
      const users = await prisma.user.findMany({ select: { ...USER_SELECT, penalizedUntil: true }, orderBy: { createdAt: 'desc' } });
      return res.json(users);
    }

    // ADMIN sees all registered users in the app (role USER)
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function uploadPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const photoPath = `/uploads/photos/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { photo: photoPath },
      select: USER_SELECT,
    });

    res.json(user);
  } catch (error) {
    console.error('Error subiendo foto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function changeRole(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Solo un Super Admin puede asignar este rol' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Can't change own role
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: USER_SELECT,
    });

    // Notify user about role change
    await prisma.notification.create({
      data: {
        userId,
        title: 'Rol actualizado',
        message: `Tu rol ha sido actualizado a ${role}.`,
        type: 'INFO',
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error cambiando rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function invite(req, res) {
  try {
    const { email, name, role } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email y nombre son requeridos' });
    }

    // Determine allowed roles based on who is inviting
    let inviteRole = role || 'USER';

    if (req.user.role === 'ADMIN') {
      // Admin can invite USER or ADMIN
      if (!['USER', 'ADMIN'].includes(inviteRole)) {
        return res.status(403).json({ error: 'Solo puedes invitar como USER o ADMIN' });
      }
    } else if (req.user.role === 'SUPER_ADMIN') {
      // Super Admin can invite any role
      if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(inviteRole)) {
        return res.status(400).json({ error: 'Rol invalido' });
      }
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Este email ya esta registrado' });
    }

    // Create user with temporary password
    const bcrypt = require('bcryptjs');
    const tempPassword = `VibraMeet_${Date.now().toString(36)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword, role: inviteRole },
      select: USER_SELECT,
    });

    // Notify the inviter
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Invitacion enviada',
        message: `Se creo la cuenta de ${name} (${email}) como ${inviteRole}.`,
        type: 'SUCCESS',
      },
    });

    res.status(201).json({ user, tempPassword });
  } catch (error) {
    console.error('Error invitando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Delete related data (Fase 9)
    await prisma.eventInvitation.deleteMany({ where: { userId } });
    await prisma.eventTypeRequest.deleteMany({ where: { requesterId: userId } });
    await prisma.userGroupMember.deleteMany({ where: { userId } });
    await prisma.spaceAdmin.deleteMany({ where: { adminId: userId } });
    const userGroups = await prisma.userGroup.findMany({ where: { adminId: userId }, select: { id: true } });
    if (userGroups.length > 0) {
      await prisma.userGroupMember.deleteMany({ where: { groupId: { in: userGroups.map(g => g.id) } } });
      await prisma.userGroup.deleteMany({ where: { adminId: userId } });
    }
    // Delete related data
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.penalty.deleteMany({ where: { userId } });
    await prisma.ownership.deleteMany({ where: { userId } });
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.registration.deleteMany({ where: { userId } });
    await prisma.request.deleteMany({ where: { creatorId: userId } });
    await prisma.request.updateMany({ where: { assigneeId: userId }, data: { assigneeId: null } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: `Usuario ${target.name} eliminado correctamente` });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Cambio de contraseña del propio usuario (requiere la contraseña actual)
async function changeOwnPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Restablecimiento de contraseña por un SUPER_ADMIN para cualquier usuario
async function resetUserPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hash } });
    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getProfile, updateProfile, listUsers, uploadPhoto, changeRole, invite, deleteUser, changeOwnPassword, resetUserPassword };
