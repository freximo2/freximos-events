const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function list(req, res) {
  try {
    const where = {};
    // Admin sees only their templates, Super Admin sees all
    if (req.user.role === 'ADMIN') {
      where.creatorId = req.user.id;
    }

    const templates = await prisma.eventTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    res.json(templates);
  } catch (error) {
    console.error('Error listando plantillas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, type, category, location, latitude, longitude, maxPlayers, price, spaceId } = req.body;

    const template = await prisma.eventTemplate.create({
      data: {
        name,
        description,
        type: type || 'PUBLIC',
        category: category || 'FUTBOL',
        location,
        latitude: latitude || null,
        longitude: longitude || null,
        maxPlayers: maxPlayers || 10,
        price: price || 0,
        creatorId: req.user.id,
        spaceId: spaceId || null,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creando plantilla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Save an existing event as template
async function createFromEvent(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    if (req.user.role === 'ADMIN' && event.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes crear plantillas de tus eventos' });
    }

    const { name } = req.body;

    const template = await prisma.eventTemplate.create({
      data: {
        name: name || `Plantilla: ${event.name}`,
        description: event.description,
        type: event.type,
        category: event.category,
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        maxPlayers: event.maxPlayers,
        price: event.price,
        creatorId: req.user.id,
        spaceId: event.spaceId,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creando plantilla desde evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.eventTemplate.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    if (req.user.role === 'ADMIN' && existing.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    const { name, description, type, category, location, latitude, longitude, maxPlayers, price } = req.body;

    const template = await prisma.eventTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(category && { category }),
        ...(location !== undefined && { location }),
        ...(latitude !== undefined && { latitude: latitude || null }),
        ...(longitude !== undefined && { longitude: longitude || null }),
        ...(maxPlayers && { maxPlayers }),
        ...(price !== undefined && { price }),
      },
    });

    res.json(template);
  } catch (error) {
    console.error('Error actualizando plantilla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.eventTemplate.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    if (req.user.role === 'ADMIN' && existing.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    await prisma.eventTemplate.delete({ where: { id } });
    res.json({ message: 'Plantilla eliminada' });
  } catch (error) {
    console.error('Error eliminando plantilla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { list, create, createFromEvent, update, remove };
