const prisma = require('../config/db');

async function list(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error listando notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function unreadCount(req, res) {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error contando notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function markAsRead(req, res) {
  try {
    const id = parseInt(req.params.id);

    await prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { read: true },
    });

    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error marcando notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function markAllAsRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marcando notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Helper to create notifications (used internally by other modules)
async function createNotification(userId, title, message, type = 'INFO', link = null) {
  return prisma.notification.create({
    data: { userId, title, message, type, link },
  });
}

module.exports = { list, unreadCount, markAsRead, markAllAsRead, createNotification };
