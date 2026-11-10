const API_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

export const authService = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email, password, name) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
};

export const userService = {
  getProfile: () => request('/users/me'),
  updateProfile: (data) =>
    request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadPhoto: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_URL}/users/me/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  },
  listUsers: () => request('/users'),
  changeRole: (id, role) =>
    request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  invite: (data) =>
    request('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteUser: (id) =>
    request(`/users/${id}`, { method: 'DELETE' }),
};

export const eventService = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/events${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/events/${id}`),
  create: (data) =>
    request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancel: (id) =>
    request(`/events/${id}/cancel`, { method: 'PATCH' }),
  remove: (id) =>
    request(`/events/${id}`, { method: 'DELETE' }),
  batchAction: (eventIds, action) =>
    request('/events/batch-action', {
      method: 'POST',
      body: JSON.stringify({ eventIds, action }),
    }),
  uploadImage: async (eventId, file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/events/${eventId}/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  },
};

export const registrationService = {
  myRegistrations: () => request('/registrations/my'),
  register: (eventId, notes) =>
    request(`/registrations/event/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  cancel: (eventId) =>
    request(`/registrations/event/${eventId}`, { method: 'DELETE' }),
  updateStatus: (id, status, reason = '') =>
    request(`/registrations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),
  getWaitlistPosition: (eventId) =>
    request(`/registrations/event/${eventId}/waitlist-position`),
  checkPenalty: () => request('/registrations/check-penalty'),
  demoteToWaitlist: (id) => request(`/registrations/${id}/demote`, { method: 'PATCH' }),
  applyNoShow: (eventId, absentUserIds) => request(`/registrations/event/${eventId}/no-show`, { method: 'POST', body: JSON.stringify({ absentUserIds }) }),
  removeFromEvent: (id, reason) =>
    request(`/registrations/${id}/remove`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
};

export const paymentService = {
  myPayments: () => request('/payments/my'),
  listByEvent: (eventId) => request(`/payments/event/${eventId}`),
  create: (data) =>
    request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) =>
    request(`/payments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const ownershipService = {
  listByEvent: (eventId) => request(`/ownerships/event/${eventId}`),
  assign: (data) =>
    request('/ownerships', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id) =>
    request(`/ownerships/${id}`, { method: 'DELETE' }),
};

export const requestService = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/requests${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/requests/${id}`),
  create: (data) =>
    request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  validate: (id, data) =>
    request(`/requests/${id}/validate`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  escalate: (id) =>
    request(`/requests/${id}/escalate`, { method: 'PATCH' }),
};

export const penaltyService = {
  listByEvent: (eventId) => request(`/penalties/event/${eventId}`),
  listByUser: (userId) => request(`/penalties/user/${userId}`),
  create: (data) =>
    request('/penalties', { method: 'POST', body: JSON.stringify(data) }),
  deactivate: (id) =>
    request(`/penalties/${id}/deactivate`, { method: 'PATCH' }),
};

export const statsService = {
  dashboard: () => request('/stats/dashboard'),
  myStats: () => request('/stats/my'),
  eventStats: (eventId) => request(`/stats/event/${eventId}`),
  playerStats: (userId) => request(`/stats/player/${userId}`),
};

export const sponsorService = {
  list: () => request('/sponsors'),
  getById: (id) => request(`/sponsors/${id}`),
  create: (data) =>
    request('/sponsors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/sponsors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) =>
    request(`/sponsors/${id}`, { method: 'DELETE' }),
  assignToEvent: (data) =>
    request('/sponsors/assign', { method: 'POST', body: JSON.stringify(data) }),
  removeFromEvent: (id) =>
    request(`/sponsors/event/${id}`, { method: 'DELETE' }),
};

export const clientService = {
  list: () => request('/clients'),
  getById: (id) => request(`/clients/${id}`),
  create: (data) =>
    request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) =>
    request(`/clients/${id}`, { method: 'DELETE' }),
};

export const notificationService = {
  list: () => request('/notifications'),
  unreadCount: () => request('/notifications/unread-count'),
  markAsRead: (id) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    request('/notifications/read-all', { method: 'PATCH' }),
};

export const spaceService = {
  list: () => request('/spaces'),
  mySpaces: () => request('/spaces/my'),
  getById: (id) => request(`/spaces/${id}`),
  create: (data) => request('/spaces', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/spaces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/spaces/${id}`, { method: 'DELETE' }),
  assignAdmin: (spaceId, adminId) => request(`/spaces/${spaceId}/admins`, { method: 'POST', body: JSON.stringify({ adminId }) }),
  removeAdmin: (spaceId, adminId) => request(`/spaces/${spaceId}/admins/${adminId}`, { method: 'DELETE' }),
};

export const groupService = {
  list: () => request('/groups'),
  myUsers: () => request('/groups/my-users'),
  create: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
  addMember: (groupId, userId) => request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeMember: (groupId, userId) => request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
  searchUsers: (q) => request(`/groups/search-users?q=${encodeURIComponent(q)}`),
  denyAccess: (userId) => request(`/groups/deny-access/${userId}`, { method: 'DELETE' }),
};

export const eventTypeRequestService = {
  list: (params = {}) => { const query = new URLSearchParams(params).toString(); return request(`/event-type-requests${query ? `?${query}` : ''}`); },
  create: (data) => request('/event-type-requests', { method: 'POST', body: JSON.stringify(data) }),
  resolve: (id, data) => request(`/event-type-requests/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const templateService = {
  list: () => request('/templates'),
  create: (data) =>
    request('/templates', { method: 'POST', body: JSON.stringify(data) }),
  createFromEvent: (eventId, name) =>
    request(`/templates/from-event/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  update: (id, data) =>
    request(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) =>
    request(`/templates/${id}`, { method: 'DELETE' }),
};
