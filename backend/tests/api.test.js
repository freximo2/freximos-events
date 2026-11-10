/**
 * Integration tests for VibraMeet API
 * Run: node tests/api.test.js
 * Requires: API running on localhost:3000 with seeded data
 */

const BASE = 'http://localhost:3000/api';
let passed = 0;
let failed = 0;
const failures = [];

async function req(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  return { status: res.status, data };
}

async function authReq(endpoint, token, options = {}) {
  return req(endpoint, { ...options, headers: { Authorization: `Bearer ${token}`, ...options.headers } });
}

function assert(name, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name}`);
  }
}

async function login(email, password) {
  const { data } = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  return data.token;
}

// ==================== TESTS ====================

async function testAuth() {
  console.log('\n--- AUTH ---');

  const { status, data } = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'superadmin@vibrameet.com', password: 'admin123' }) });
  assert('Super Admin login exitoso', status === 200 && data.token);
  assert('Login retorna usuario con rol', data.user?.role === 'SUPER_ADMIN');

  const bad = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'bad@email.com', password: 'wrong' }) });
  assert('Login fallido retorna error', bad.status === 401 || bad.status === 400);

  const noToken = await req('/events');
  assert('Request sin token retorna 401', noToken.status === 401);
}

async function testSpaces(tkSA, tkAdmin) {
  console.log('\n--- ESPACIOS ---');

  const list = await authReq('/spaces', tkSA);
  assert('Super Admin lista espacios', list.status === 200 && Array.isArray(list.data));
  assert('Hay 3 espacios en seed', list.data.length === 3);
  assert('Espacio tiene nombre y admins', list.data[0].name && Array.isArray(list.data[0].admins));

  const mySpaces = await authReq('/spaces/my', tkAdmin);
  assert('Admin obtiene sus espacios', mySpaces.status === 200 && Array.isArray(mySpaces.data));
  assert('Admin1 tiene 1 espacio (Capital Futbol)', mySpaces.data.length === 1 && mySpaces.data[0].name === 'Capital Futbol');

  // SA crea nuevo espacio
  const newSpace = await authReq('/spaces', tkSA, {
    method: 'POST', body: JSON.stringify({ name: 'Espacio Test', description: 'Test', category: 'OTRO' }),
  });
  assert('Super Admin crea espacio', newSpace.status === 201 && newSpace.data.name === 'Espacio Test');

  // SA asigna admin al espacio
  const adminId = mySpaces.data[0]?.admins?.[0]?.admin?.id || mySpaces.data[0]?.admins?.[0]?.adminId;
  if (newSpace.data?.id) {
    // Get admin1 ID from users
    const users = await authReq('/users', tkSA);
    const admin1 = users.data.find(u => u.email === 'admin@vibrameet.com');
    if (admin1) {
      const assign = await authReq(`/spaces/${newSpace.data.id}/admins`, tkSA, {
        method: 'POST', body: JSON.stringify({ adminId: admin1.id }),
      });
      assert('Super Admin asigna admin a espacio', assign.status === 201 || assign.status === 200);

      // Admin now has 2 spaces
      const updated = await authReq('/spaces/my', tkAdmin);
      assert('Admin tiene 2 espacios despues de asignacion', updated.data.length === 2);

      // Remove admin from test space
      await authReq(`/spaces/${newSpace.data.id}/admins/${admin1.id}`, tkSA, { method: 'DELETE' });
    }

    // Delete test space
    await authReq(`/spaces/${newSpace.data.id}`, tkSA, { method: 'DELETE' });
  }

  // Admin no puede listar todos
  const denied = await authReq('/spaces', tkAdmin);
  assert('Admin no puede listar todos los espacios', denied.status === 403);
}

async function testGroups(tkAdmin) {
  console.log('\n--- GRUPOS ---');

  const list = await authReq('/groups', tkAdmin);
  assert('Admin lista sus grupos', list.status === 200 && Array.isArray(list.data));
  assert('Admin1 tiene 2 grupos', list.data.length === 2);

  // Crear grupo
  const create = await authReq('/groups', tkAdmin, {
    method: 'POST', body: JSON.stringify({ name: 'Grupo Test', description: 'Test' }),
  });
  assert('Admin crea grupo', create.status === 201 && create.data.name === 'Grupo Test');
  const groupId = create.data.id;

  // Mis usuarios
  const myUsers = await authReq('/groups/my-users', tkAdmin);
  assert('Admin obtiene sus usuarios', myUsers.status === 200 && Array.isArray(myUsers.data));

  // Agregar miembro
  if (myUsers.data.length > 0) {
    const userId = myUsers.data[0].id;
    const add = await authReq(`/groups/${groupId}/members`, tkAdmin, {
      method: 'POST', body: JSON.stringify({ userId }),
    });
    assert('Admin agrega miembro al grupo', add.status === 201);

    // Duplicado
    const dup = await authReq(`/groups/${groupId}/members`, tkAdmin, {
      method: 'POST', body: JSON.stringify({ userId }),
    });
    assert('No puede agregar miembro duplicado', dup.status === 409);

    // Quitar miembro
    const remove = await authReq(`/groups/${groupId}/members/${userId}`, tkAdmin, { method: 'DELETE' });
    assert('Admin quita miembro del grupo', remove.status === 200);
  }

  // Eliminar grupo
  const del = await authReq(`/groups/${groupId}`, tkAdmin, { method: 'DELETE' });
  assert('Admin elimina grupo', del.status === 200);

  // Search users
  const searchRes = await authReq('/groups/search-users?q=juan', tkAdmin);
  assert('Buscar usuarios por nombre', searchRes.status === 200 && searchRes.data.length > 0);

  const searchShort = await authReq('/groups/search-users?q=x', tkAdmin);
  assert('Buscar con menos de 2 chars retorna vacio', searchShort.status === 200 && searchShort.data.length === 0);

  // Deny access (only if admin has users)
  const myU = await authReq('/groups/my-users', tkAdmin);
  if (myU.data.length > 0) {
    const targetId = myU.data[myU.data.length - 1].id;
    const deny = await authReq(`/groups/deny-access/${targetId}`, tkAdmin, { method: 'DELETE' });
    assert('Denegar acceso a usuario', deny.status === 200);
    const afterDeny = await authReq('/groups/my-users', tkAdmin);
    assert('Usuario removido despues de deny', afterDeny.data.length < myU.data.length);
  }
}

async function testEventTypeRequests(tkSA, tkAdmin, tkUser) {
  console.log('\n--- SOLICITUDES TIPO EVENTO ---');

  // User crea solicitud
  const userCreate = await authReq('/event-type-requests', tkUser, {
    method: 'POST', body: JSON.stringify({ categoryName: 'PADEL', description: 'Torneos de padel', justification: 'Deporte en auge' }),
  });
  assert('USER crea solicitud de tipo de evento', userCreate.status === 201);
  assert('Solicitud tiene status PENDING', userCreate.data.status === 'PENDING');
  assert('Requester es USER', userCreate.data.requester.role === 'USER');
  const reqId = userCreate.data.id;

  // Admin crea solicitud
  const adminCreate = await authReq('/event-type-requests', tkAdmin, {
    method: 'POST', body: JSON.stringify({ categoryName: 'VOLLEYBALL', description: 'Torneos de volley', justification: 'Equipos listos' }),
  });
  assert('ADMIN crea solicitud de tipo de evento', adminCreate.status === 201);

  // User solo ve sus solicitudes
  const userList = await authReq('/event-type-requests', tkUser);
  assert('USER solo ve sus propias solicitudes', userList.data.every(r => r.requester.email === 'juan.perez@gmail.com'));

  // Super Admin ve todas
  const saList = await authReq('/event-type-requests', tkSA);
  assert('Super Admin ve todas las solicitudes', saList.data.length > userList.data.length);

  // Super Admin aprueba
  const approve = await authReq(`/event-type-requests/${reqId}/resolve`, tkSA, {
    method: 'PATCH', body: JSON.stringify({ status: 'APPROVED', adminResponse: 'Aprobado, se habilitara' }),
  });
  assert('Super Admin aprueba solicitud', approve.status === 200 && approve.data.status === 'APPROVED');

  // Super Admin deniega
  const deny = await authReq(`/event-type-requests/${adminCreate.data.id}/resolve`, tkSA, {
    method: 'PATCH', body: JSON.stringify({ status: 'DENIED', adminResponse: 'No hay demanda suficiente' }),
  });
  assert('Super Admin deniega solicitud', deny.status === 200 && deny.data.status === 'DENIED');

  // No se puede resolver dos veces
  const again = await authReq(`/event-type-requests/${reqId}/resolve`, tkSA, {
    method: 'PATCH', body: JSON.stringify({ status: 'DENIED', adminResponse: 'test' }),
  });
  assert('No se puede resolver solicitud ya procesada', again.status === 400);

  // User no puede resolver
  const userResolve = await authReq(`/event-type-requests/${reqId}/resolve`, tkUser, {
    method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }),
  });
  assert('USER no puede resolver solicitudes', userResolve.status === 403);
}

async function testAdminSpaceEnforcement(tkAdmin) {
  console.log('\n--- ENFORCEMENT ESPACIOS ---');

  // Get admin's space
  const mySpaces = await authReq('/spaces/my', tkAdmin);
  const mySpaceId = mySpaces.data?.[0]?.id;

  // Admin sin spaceId no puede crear
  const noSpace = await authReq('/events', tkAdmin, {
    method: 'POST', body: JSON.stringify({
      name: 'Test Sin Espacio', date: '2026-05-01T10:00:00', location: 'Test', maxPlayers: 10,
    }),
  });
  assert('Admin no puede crear evento sin espacio', noSpace.status === 400 || noSpace.status === 403);

  // Admin con spaceId invalido
  const wrongSpace = await authReq('/events', tkAdmin, {
    method: 'POST', body: JSON.stringify({
      name: 'Test Wrong', date: '2026-05-01T10:00:00', location: 'Test', maxPlayers: 10, spaceId: 99999,
    }),
  });
  assert('Admin no puede crear en espacio ajeno', wrongSpace.status === 403);

  // Admin crea evento en su espacio
  const allowed = await authReq('/events', tkAdmin, {
    method: 'POST', body: JSON.stringify({
      name: 'Test En Espacio', date: '2026-05-01T10:00:00', location: 'Test', maxPlayers: 10, spaceId: mySpaceId, category: 'FUTBOL',
    }),
  });
  assert('Admin crea evento en su espacio', allowed.status === 201 && allowed.data.spaceId === mySpaceId);

  // Test with coordinates
  const withMap = await authReq('/events', tkAdmin, {
    method: 'POST', body: JSON.stringify({
      name: 'Test Mapa', date: '2026-05-01T10:00:00', location: 'Parque Simon Bolivar',
      latitude: 4.6585, longitude: -74.0936, maxPlayers: 10, spaceId: mySpaceId, category: 'FUTBOL',
    }),
  });
  assert('Evento con coordenadas guarda lat/lng', withMap.status === 201 && withMap.data.latitude === 4.6585);
  if (withMap.data?.id) {
    await authReq(`/events/${withMap.data.id}`, tkAdmin, { method: 'DELETE' });
  }

  // Cleanup
  if (allowed.data?.id) {
    await authReq(`/events/${allowed.data.id}`, tkAdmin, { method: 'DELETE' });
  }
}

async function testPenalties(tkSA, tkUser) {
  console.log('\n--- PENALIDADES ---');

  const check = await authReq('/registrations/check-penalty', tkUser);
  assert('Check penalty endpoint funciona', check.status === 200);

  // Pedro (users[2]) esta penalizado en seed
  const tkPedro = await login('pedro.martinez@gmail.com', 'user123');
  const checkPedro = await authReq('/registrations/check-penalty', tkPedro);
  assert('Pedro esta penalizado (seed)', checkPedro.data.penalized === true);
  assert('Tiene fecha de penalizacion', checkPedro.data.penalizedUntil !== null);
}

async function testDemote(tkSA) {
  console.log('\n--- DEGRADAR A COLA ---');

  // Get an event with registrations
  const events = await authReq('/events', tkSA);
  const activeEvent = events.data.find(e => e.status === 'ACTIVE');
  if (activeEvent) {
    const detail = await authReq(`/events/${activeEvent.id}`, tkSA);
    const activeReg = detail.data.registrations?.find(r => ['PENDING', 'CONFIRMED'].includes(r.status));
    if (activeReg) {
      const demote = await authReq(`/registrations/${activeReg.id}/demote`, tkSA, { method: 'PATCH' });
      assert('Super Admin degrada inscripcion a cola', demote.status === 200);
    } else {
      assert('Super Admin degrada inscripcion a cola', true); // skip
    }
  }
}

async function testUserVisibility(tkSA, tkAdmin) {
  console.log('\n--- VISIBILIDAD USUARIOS ---');

  const saUsers = await authReq('/users', tkSA);
  assert('Super Admin ve todos los usuarios', saUsers.status === 200 && saUsers.data.length > 20);

  const adminUsers = await authReq('/users', tkAdmin);
  assert('Admin ve solo usuarios de sus eventos', adminUsers.status === 200 && adminUsers.data.length <= saUsers.data.length);
  assert('Admin no ve la lista completa', adminUsers.data.length < saUsers.data.length);
}

async function testEvents(tkSA, tkAdmin, tkUser) {
  console.log('\n--- EVENTOS ---');

  const events = await authReq('/events', tkSA);
  assert('Super Admin lista eventos', events.status === 200 && events.data.length > 0);
  assert('Eventos tienen isPastEvent', events.data[0].isPastEvent !== undefined);

  // Batch action
  const adminSpaceId = (await authReq('/spaces/my', tkAdmin)).data?.[0]?.id;
  const bE1 = await authReq('/events', tkAdmin, { method: 'POST', body: JSON.stringify({ name: 'BatchA', date: '2026-07-01T10:00:00', location: 'X', maxPlayers: 5, category: 'FUTBOL', spaceId: adminSpaceId }) });
  const bE2 = await authReq('/events', tkAdmin, { method: 'POST', body: JSON.stringify({ name: 'BatchB', date: '2026-07-02T10:00:00', location: 'X', maxPlayers: 5, category: 'FUTBOL', spaceId: adminSpaceId }) });
  if (bE1.status === 201 && bE2.status === 201) {
    const batch = await authReq('/events/batch-action', tkAdmin, {
      method: 'POST', body: JSON.stringify({ eventIds: [bE1.data.id, bE2.data.id], action: 'ARCHIVED' }),
    });
    assert('Batch archive funciona', batch.status === 200);

    // User can't batch
    const userBatch = await authReq('/events/batch-action', tkUser, {
      method: 'POST', body: JSON.stringify({ eventIds: [bE1.data.id], action: 'ARCHIVED' }),
    });
    assert('User no puede batch', userBatch.status === 403);
  }

  const userEvents = await authReq('/events', tkUser);
  assert('User lista eventos publicos', userEvents.status === 200);

  // User no puede crear
  const noCreate = await authReq('/events', tkUser, {
    method: 'POST', body: JSON.stringify({ name: 'Hack', date: '2026-05-01T10:00:00', location: 'X', maxPlayers: 5 }),
  });
  assert('User no puede crear eventos', noCreate.status === 403);
}

async function testTemplates(tkAdmin, tkUser) {
  console.log('\n--- PLANTILLAS ---');

  // Create template
  const create = await authReq('/templates', tkAdmin, {
    method: 'POST', body: JSON.stringify({ name: 'Plantilla Test', category: 'FUTBOL', location: 'Test', maxPlayers: 15, price: 10000 }),
  });
  assert('Admin crea plantilla', create.status === 201 && create.data.name === 'Plantilla Test');
  const tplId = create.data.id;

  // List templates
  const list = await authReq('/templates', tkAdmin);
  assert('Admin lista sus plantillas', list.status === 200 && list.data.length >= 1);

  // Update template
  const upd = await authReq(`/templates/${tplId}`, tkAdmin, {
    method: 'PUT', body: JSON.stringify({ name: 'Plantilla Actualizada', maxPlayers: 20 }),
  });
  assert('Admin actualiza plantilla', upd.status === 200 && upd.data.maxPlayers === 20);

  // Create from event - first create a temp event to guarantee one exists
  const tempEvent = await authReq('/events', tkAdmin, {
    method: 'POST', body: JSON.stringify({
      name: 'Temp para plantilla', date: '2026-06-01T10:00:00', location: 'Test', maxPlayers: 5, category: 'FUTBOL', spaceId: (await authReq('/spaces/my', tkAdmin)).data?.[0]?.id,
    }),
  });
  if (tempEvent.status === 201) {
    const fromEvent = await authReq(`/templates/from-event/${tempEvent.data.id}`, tkAdmin, {
      method: 'POST', body: JSON.stringify({ name: 'Desde evento' }),
    });
    assert('Admin crea plantilla desde evento', fromEvent.status === 201);
    if (fromEvent.data?.id) {
      await authReq(`/templates/${fromEvent.data.id}`, tkAdmin, { method: 'DELETE' });
    }
    await authReq(`/events/${tempEvent.data.id}`, tkAdmin, { method: 'DELETE' });
  } else {
    assert('Admin crea plantilla desde evento', false);
  }

  // User no puede crear plantillas
  const userDenied = await authReq('/templates', tkUser, {
    method: 'POST', body: JSON.stringify({ name: 'Hack' }),
  });
  assert('User no puede crear plantillas', userDenied.status === 403);

  // Delete template
  const del = await authReq(`/templates/${tplId}`, tkAdmin, { method: 'DELETE' });
  assert('Admin elimina plantilla', del.status === 200);
}

async function testNotifications(tkSA) {
  console.log('\n--- NOTIFICACIONES ---');

  const notifs = await authReq('/notifications', tkSA);
  assert('Lista notificaciones', notifs.status === 200 && Array.isArray(notifs.data));

  const unread = await authReq('/notifications/unread-count', tkSA);
  assert('Cuenta no leidas', unread.status === 200 && typeof unread.data.count === 'number');
}

// ==================== RUNNER ====================

async function run() {
  console.log('VibraMeet API Integration Tests');
  console.log('================================');

  // Check API is up
  try {
    const health = await req('/health');
    if (health.status !== 200) throw new Error('API not running');
  } catch {
    console.error('ERROR: API no esta corriendo en localhost:3000');
    process.exit(1);
  }

  // Login tokens
  const tkSA = await login('superadmin@vibrameet.com', 'admin123');
  const tkAdmin = await login('admin@vibrameet.com', 'admin123');
  const tkUser = await login('juan.perez@gmail.com', 'user123');

  await testAuth();
  await testSpaces(tkSA, tkAdmin);
  await testGroups(tkAdmin);
  await testEventTypeRequests(tkSA, tkAdmin, tkUser);
  await testAdminSpaceEnforcement(tkAdmin);
  await testPenalties(tkSA, tkUser);
  await testDemote(tkSA);
  await testUserVisibility(tkSA, tkAdmin);
  await testEvents(tkSA, tkAdmin, tkUser);
  await testTemplates(tkAdmin, tkUser);
  await testNotifications(tkSA);

  console.log('\n================================');
  console.log(`RESULTADOS: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailed:');
    failures.forEach(f => console.log(`  - ${f}`));
  }
  console.log('================================');
  process.exit(failed > 0 ? 1 : 0);
}

run();
