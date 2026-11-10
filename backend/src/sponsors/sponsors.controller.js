const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const sponsor = await prisma.sponsor.create({ data: req.body });
    res.status(201).json(sponsor);
  } catch (error) {
    console.error('Error creando patrocinador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function list(req, res) {
  try {
    const sponsors = await prisma.sponsor.findMany({
      include: { _count: { select: { events: true } } },
      orderBy: { name: 'asc' },
    });

    res.json(sponsors);
  } catch (error) {
    console.error('Error listando patrocinadores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = parseInt(req.params.id);

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        events: {
          include: { event: { select: { id: true, name: true, date: true } } },
        },
      },
    });

    if (!sponsor) {
      return res.status(404).json({ error: 'Patrocinador no encontrado' });
    }

    res.json(sponsor);
  } catch (error) {
    console.error('Error obteniendo patrocinador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id);

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: req.body,
    });

    res.json(sponsor);
  } catch (error) {
    console.error('Error actualizando patrocinador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id);

    await prisma.eventSponsor.deleteMany({ where: { sponsorId: id } });
    await prisma.sponsor.delete({ where: { id } });

    res.json({ message: 'Patrocinador eliminado' });
  } catch (error) {
    console.error('Error eliminando patrocinador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function assignToEvent(req, res) {
  try {
    const { sponsorId, eventId, contribution } = req.body;

    const eventSponsor = await prisma.eventSponsor.create({
      data: { sponsorId, eventId, contribution },
      include: {
        sponsor: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(eventSponsor);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El patrocinador ya está asignado a este evento' });
    }
    console.error('Error asignando patrocinador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function removeFromEvent(req, res) {
  try {
    const id = parseInt(req.params.id);

    await prisma.eventSponsor.delete({ where: { id } });

    res.json({ message: 'Patrocinador removido del evento' });
  } catch (error) {
    console.error('Error removiendo patrocinador del evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { create, list, getById, update, remove, assignToEvent, removeFromEvent };
