const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { categoryName, description, justification } = req.body;
    const etr = await prisma.eventTypeRequest.create({
      data: { requesterId: req.user.id, categoryName, description, justification },
      include: { requester: { select: { id: true, name: true, email: true, role: true } } },
    });
    const superAdmins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' }, select: { id: true } });
    if (superAdmins.length > 0) {
      await prisma.notification.createMany({
        data: superAdmins.map(sa => ({
          userId: sa.id, title: 'Nueva solicitud de tipo de evento',
          message: `${req.user.name} (${req.user.role}) solicita: "${categoryName}".`,
          type: 'WARNING', link: '/event-type-requests',
        })),
      });
    }
    res.status(201).json(etr);
  } catch (error) {
    console.error('Error creando solicitud de tipo de evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function list(req, res) {
  try {
    const where = {};
    if (req.user.role !== 'SUPER_ADMIN') where.requesterId = req.user.id;
    const { status } = req.query;
    if (status) where.status = status;
    const requests = await prisma.eventTypeRequest.findMany({
      where, include: { requester: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    console.error('Error listando solicitudes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function resolve(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { status, adminResponse } = req.body;
    if (!['APPROVED', 'DENIED'].includes(status)) return res.status(400).json({ error: 'Estado debe ser APPROVED o DENIED' });
    const existing = await prisma.eventTypeRequest.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (existing.status !== 'PENDING') return res.status(400).json({ error: 'Ya fue procesada' });
    const updated = await prisma.eventTypeRequest.update({
      where: { id }, data: { status, adminResponse: adminResponse || null, resolvedAt: new Date() },
      include: { requester: { select: { id: true, name: true, email: true, role: true } } },
    });
    const isApproved = status === 'APPROVED';
    await prisma.notification.create({
      data: {
        userId: existing.requesterId,
        title: isApproved ? 'Solicitud aprobada' : 'Solicitud denegada',
        message: isApproved
          ? `Tu solicitud "${existing.categoryName}" fue APROBADA. ${adminResponse || ''}`
          : `Tu solicitud "${existing.categoryName}" fue DENEGADA. ${adminResponse ? 'Razón: ' + adminResponse : ''}`,
        type: isApproved ? 'SUCCESS' : 'ERROR', link: '/event-type-requests',
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('Error resolviendo solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { create, list, resolve };
