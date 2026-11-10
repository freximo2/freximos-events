const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function assign(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId, eventId, type, position, number } = req.body;

    // Verify registration exists and is confirmed
    const registration = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!registration || registration.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'El jugador debe tener inscripción confirmada' });
    }

    const ownership = await prisma.ownership.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: { userId, eventId, type, position, number },
      update: { type, position, number },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(ownership);
  } catch (error) {
    console.error('Error asignando titularidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function listByEvent(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);

    const ownerships = await prisma.ownership.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ type: 'asc' }, { number: 'asc' }],
    });

    res.json(ownerships);
  } catch (error) {
    console.error('Error listando titularidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id);

    await prisma.ownership.delete({ where: { id } });

    res.json({ message: 'Titularidad removida' });
  } catch (error) {
    console.error('Error removiendo titularidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { assign, listByEvent, remove };
