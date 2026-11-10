const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId, eventId, type, reason, amount, expiresAt } = req.body;

    const penalty = await prisma.penalty.create({
      data: {
        userId,
        eventId,
        type,
        reason,
        amount: amount || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(penalty);
  } catch (error) {
    console.error('Error creando penalidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function listByEvent(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);

    const penalties = await prisma.penalty.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(penalties);
  } catch (error) {
    console.error('Error listando penalidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function listByUser(req, res) {
  try {
    const userId = parseInt(req.params.userId);

    const penalties = await prisma.penalty.findMany({
      where: { userId },
      include: {
        event: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(penalties);
  } catch (error) {
    console.error('Error listando penalidades del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function deactivate(req, res) {
  try {
    const id = parseInt(req.params.id);

    const penalty = await prisma.penalty.update({
      where: { id },
      data: { active: false },
    });

    res.json(penalty);
  } catch (error) {
    console.error('Error desactivando penalidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { create, listByEvent, listByUser, deactivate };
