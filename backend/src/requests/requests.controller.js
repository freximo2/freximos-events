const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, type, priority, eventId } = req.body;

    const request = await prisma.request.create({
      data: {
        title,
        description,
        type: type || 'GENERAL',
        priority: priority || 'MEDIUM',
        eventId: eventId || null,
        creatorId: req.user.id,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function list(req, res) {
  try {
    const { status, type, priority } = req.query;
    const where = {};

    // Regular users only see their own requests
    if (req.user.role === 'USER') {
      where.creatorId = req.user.id;
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const requests = await prisma.request.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    console.error('Error listando solicitudes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = parseInt(req.params.id);

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true } },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Users can only see their own
    if (req.user.role === 'USER' && request.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Admin: validate/assign
async function validate(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { status, response, assigneeId } = req.body;

    const data = {};
    if (status) data.status = status;
    if (response) data.response = response;
    if (assigneeId) data.assigneeId = assigneeId;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      data.resolvedAt = new Date();
    }

    const request = await prisma.request.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    res.json(request);
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Escalate to SUPER_ADMIN
async function escalate(req, res) {
  try {
    const id = parseInt(req.params.id);

    const request = await prisma.request.update({
      where: { id },
      data: { status: 'ESCALATED', assigneeId: null },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    res.json(request);
  } catch (error) {
    console.error('Error escalando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { create, list, getById, validate, escalate };
