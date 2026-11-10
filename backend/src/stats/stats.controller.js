const prisma = require('../config/db');

async function dashboard(req, res) {
  try {
    const [
      totalUsers,
      totalEvents,
      activeEvents,
      totalRegistrations,
      totalPayments,
      pendingRequests,
      totalPenalties,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.event.count({ where: { status: 'ACTIVE' } }),
      prisma.registration.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
      prisma.request.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } } }),
      prisma.penalty.count({ where: { active: true } }),
    ]);

    res.json({
      users: totalUsers,
      events: { total: totalEvents, active: activeEvents },
      registrations: totalRegistrations,
      revenue: totalPayments._sum.amount || 0,
      pendingRequests,
      activePenalties: totalPenalties,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function eventStats(req, res) {
  try {
    const eventId = parseInt(req.params.eventId);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { registrations: true, payments: true, penalties: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // USER can only see stats of public events
    if (req.user.role === 'USER' && event.type !== 'PUBLIC') {
      return res.status(403).json({ error: 'No tienes acceso a las estadísticas de este evento' });
    }

    const [registrationsByStatus, paymentStats, penaltiesByType] = await Promise.all([
      prisma.registration.groupBy({
        by: ['status'],
        where: { eventId },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { eventId, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.penalty.groupBy({
        by: ['type'],
        where: { eventId },
        _count: true,
      }),
    ]);

    res.json({
      event: { id: event.id, name: event.name, status: event.status },
      registrations: {
        total: event._count.registrations,
        byStatus: registrationsByStatus,
      },
      payments: {
        total: paymentStats._count,
        revenue: paymentStats._sum.amount || 0,
      },
      penalties: {
        total: event._count.penalties,
        byType: penaltiesByType,
      },
    });
  } catch (error) {
    console.error('Error obteniendo stats del evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function playerStats(req, res) {
  try {
    const userId = parseInt(req.params.userId);

    const [
      user,
      totalEvents,
      confirmedEvents,
      totalPayments,
      penalties,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      }),
      prisma.registration.count({ where: { userId } }),
      prisma.registration.count({ where: { userId, status: 'CONFIRMED' } }),
      prisma.payment.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.penalty.findMany({
        where: { userId, active: true },
        include: { event: { select: { id: true, name: true } } },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      user,
      events: { total: totalEvents, confirmed: confirmedEvents },
      payments: {
        total: totalPayments._count,
        amount: totalPayments._sum.amount || 0,
      },
      penalties: {
        active: penalties.length,
        list: penalties,
      },
    });
  } catch (error) {
    console.error('Error obteniendo stats del jugador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function myStats(req, res) {
  try {
    const userId = req.user.id;

    const [
      totalEvents,
      confirmedEvents,
      waitlistedEvents,
      totalPayments,
      penalties,
    ] = await Promise.all([
      prisma.registration.count({ where: { userId } }),
      prisma.registration.count({ where: { userId, status: 'CONFIRMED' } }),
      prisma.registration.count({ where: { userId, status: 'WAITLISTED' } }),
      prisma.payment.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.penalty.count({ where: { userId, active: true } }),
    ]);

    res.json({
      events: { total: totalEvents, confirmed: confirmedEvents, waitlisted: waitlistedEvents },
      payments: {
        total: totalPayments._count,
        amount: totalPayments._sum.amount || 0,
      },
      activePenalties: penalties,
    });
  } catch (error) {
    console.error('Error obteniendo mis stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { dashboard, eventStats, playerStats, myStats };
