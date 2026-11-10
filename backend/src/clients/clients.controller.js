const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const client = await prisma.client.create({ data: req.body });
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function list(req, res) {
  try {
    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
    res.json(clients);
  } catch (error) {
    console.error('Error listando clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const client = await prisma.client.findUnique({ where: { id } });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id);
    const client = await prisma.client.update({ where: { id }, data: req.body });
    res.json(client);
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id);
    await prisma.client.delete({ where: { id } });
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { create, list, getById, update, remove };
