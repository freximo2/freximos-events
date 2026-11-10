const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./auth/auth.routes');
const usersRoutes = require('./users/users.routes');
const eventsRoutes = require('./events/events.routes');
const registrationsRoutes = require('./registrations/registrations.routes');
const paymentsRoutes = require('./payments/payments.routes');
const ownershipsRoutes = require('./ownerships/ownerships.routes');
const requestsRoutes = require('./requests/requests.routes');
const penaltiesRoutes = require('./penalties/penalties.routes');
const statsRoutes = require('./stats/stats.routes');
const sponsorsRoutes = require('./sponsors/sponsors.routes');
const clientsRoutes = require('./clients/clients.routes');
const notificationsRoutes = require('./notifications/notifications.routes');
const spacesRoutes = require('./spaces/spaces.routes');
const groupsRoutes = require('./groups/groups.routes');
const eventTypeRequestsRoutes = require('./event-type-requests/event-type-requests.routes');
const templatesRoutes = require('./templates/templates.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/ownerships', ownershipsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/penalties', penaltiesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/spaces', spacesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/event-type-requests', eventTypeRequestsRoutes);
app.use('/api/templates', templatesRoutes);

app.listen(PORT, () => {
  console.log(`VibraMeet API corriendo en puerto ${PORT}`);
});
