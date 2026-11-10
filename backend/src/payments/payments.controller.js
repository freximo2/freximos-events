const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { registrationId, amount, type, reference, notes } = req.body;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    // Only the registered user or admin can create payment
    if (registration.userId !== req.user.id && req.user.role === 'USER') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: registration.userId,
        eventId: registration.eventId,
        registrationId,
        amount,
        type: type || 'FULL',
        reference,
        notes,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creando pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function listByEvent(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);

    const payments = await prisma.payment.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        registration: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    console.error('Error listando pagos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function myPayments(req, res) {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        event: { select: { id: true, name: true, date: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function updateStatus(req, res) {
  try {
    const paymentId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['COMPLETED', 'REFUNDED'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
      include: {
        user: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
      },
    });

    // If payment completed, auto-confirm registration
    if (status === 'COMPLETED') {
      await prisma.registration.update({
        where: { id: payment.registrationId },
        data: { status: 'CONFIRMED' },
      });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error actualizando pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { create, listByEvent, myPayments, updateStatus };
