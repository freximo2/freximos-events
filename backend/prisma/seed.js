const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando datos existentes...');
  await prisma.notification.deleteMany();
  await prisma.eventInvitation.deleteMany();
  await prisma.eventTypeRequest.deleteMany();
  await prisma.userGroupMember.deleteMany();
  await prisma.userGroup.deleteMany();
  await prisma.spaceAdmin.deleteMany();
  await prisma.space.deleteMany();
  await prisma.penalty.deleteMany();
  await prisma.eventSponsor.deleteMany();
  await prisma.ownership.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.request.deleteMany();
  await prisma.event.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creando usuarios...');
  const password = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@vibrameet.com',
      password,
      name: 'Carlos Mendoza',
      phone: '3001234567',
      address: 'Calle 45 #12-30, Bogotá',
      emergencyContact: 'María Mendoza - 3009876543',
      role: 'SUPER_ADMIN',
    },
  });

  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@vibrameet.com',
      password,
      name: 'Capital Futbol',
      phone: '3112345678',
      address: 'Carrera 7 #85-20, Bogota',
      emergencyContact: 'Contacto Capital - 3118765432',
      role: 'ADMIN',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin2@vibrameet.com',
      password,
      name: 'Campin 5',
      phone: '3153456789',
      address: 'Av. El Dorado #68-51, Bogota',
      emergencyContact: 'Contacto Campin - 3157654321',
      role: 'ADMIN',
    },
  });

  const admin3 = await prisma.user.create({
    data: {
      email: 'admin3@vibrameet.com',
      password,
      name: 'Golaya Kevin McAllister',
      phone: '3164567890',
      address: 'Calle 26 #30-15, Bogota',
      emergencyContact: 'Contacto Golaya - 3168765432',
      role: 'ADMIN',
    },
  });

  const usersData = [
    { email: 'juan.perez@gmail.com', name: 'Juan Pérez', phone: '3201111111', address: 'Calle 100 #15-20, Bogotá' },
    { email: 'maria.rodriguez@gmail.com', name: 'María Rodríguez', phone: '3202222222', address: 'Carrera 15 #90-10, Bogotá' },
    { email: 'pedro.martinez@gmail.com', name: 'Pedro Martínez', phone: '3203333333', address: 'Calle 72 #10-45, Bogotá' },
    { email: 'ana.gomez@gmail.com', name: 'Ana Gómez', phone: '3204444444', address: 'Carrera 11 #82-30, Bogotá' },
    { email: 'luis.hernandez@gmail.com', name: 'Luis Hernández', phone: '3205555555', address: 'Calle 53 #25-60, Bogotá' },
    { email: 'sofia.diaz@gmail.com', name: 'Sofía Díaz', phone: '3206666666', address: 'Av. Boyacá #65-40, Bogotá' },
    { email: 'diego.torres@gmail.com', name: 'Diego Torres', phone: '3207777777', address: 'Carrera 30 #45-15, Bogotá' },
    { email: 'camila.vargas@gmail.com', name: 'Camila Vargas', phone: '3208888888', address: 'Calle 26 #55-70, Bogotá' },
    { email: 'santiago.castro@gmail.com', name: 'Santiago Castro', phone: '3209999999', address: 'Carrera 50 #30-25, Medellín' },
    { email: 'valentina.mora@gmail.com', name: 'Valentina Mora', phone: '3210000000', address: 'Calle 10 #42-18, Medellín' },
    { email: 'mateo.rios@gmail.com', name: 'Mateo Ríos', phone: '3211111111', address: 'Av. Las Palmas #20-55, Medellín' },
    { email: 'isabella.silva@gmail.com', name: 'Isabella Silva', phone: '3212222222', address: 'Carrera 43A #1-50, Medellín' },
    { email: 'nicolas.rojas@gmail.com', name: 'Nicolás Rojas', phone: '3213333333', address: 'Calle 5 #38-72, Cali' },
    { email: 'mariana.ortiz@gmail.com', name: 'Mariana Ortiz', phone: '3214444444', address: 'Av. Roosevelt #35-20, Cali' },
    { email: 'daniel.mejia@gmail.com', name: 'Daniel Mejía', phone: '3215555555', address: 'Carrera 1 #60-10, Cali' },
    { email: 'laura.pineda@gmail.com', name: 'Laura Pineda', phone: '3216666666', address: 'Calle 13 #100-40, Cali' },
    { email: 'alejandro.restrepo@gmail.com', name: 'Alejandro Restrepo', phone: '3217777777', address: 'Carrera 23 #18-50, Pereira' },
    { email: 'gabriela.salazar@gmail.com', name: 'Gabriela Salazar', phone: '3218888888', address: 'Calle 19 #7-30, Pereira' },
    { email: 'samuel.cardenas@gmail.com', name: 'Samuel Cárdenas', phone: '3219999999', address: 'Av. 30 de Agosto #50-15, Pereira' },
    { email: 'paula.bernal@gmail.com', name: 'Paula Bernal', phone: '3220000000', address: 'Carrera 8 #22-60, Bucaramanga' },
    { email: 'julian.ospina@gmail.com', name: 'Julián Ospina', phone: '3221111111', address: 'Calle 36 #15-45, Bucaramanga' },
    { email: 'natalia.aguilar@gmail.com', name: 'Natalia Aguilar', phone: '3222222222', address: 'Carrera 27 #42-80, Barranquilla' },
    { email: 'andres.munoz@gmail.com', name: 'Andrés Muñoz', phone: '3223333333', address: 'Calle 84 #50-30, Barranquilla' },
    { email: 'carolina.leon@gmail.com', name: 'Carolina León', phone: '3224444444', address: 'Av. Olaya Herrera #60-12, Cartagena' },
    { email: 'felipe.guerrero@gmail.com', name: 'Felipe Guerrero', phone: '3225555555', address: 'Calle del Arsenal #10-25, Cartagena' },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        ...u,
        password: userPassword,
        emergencyContact: `Familiar de ${u.name} - 300${Math.floor(Math.random() * 9000000 + 1000000)}`,
        role: 'USER',
      },
    });
    users.push(user);
  }

  console.log(`${users.length + 4} usuarios creados`);

  // ==================== SPACES ====================
  console.log('Creando espacios...');
  const space1 = await prisma.space.create({ data: { name: 'Capital Futbol', description: 'Espacio de futbol y basketball', category: 'FUTBOL', isPublic: true } });
  const space2 = await prisma.space.create({ data: { name: 'Campin 5 Baile', description: 'Espacio de baile y eventos sociales', category: 'BAILE', isPublic: true } });
  const space3 = await prisma.space.create({ data: { name: 'Golaya Sports', description: 'Bolos, reuniones y otros', category: 'BOLOS', isPublic: true } });

  await prisma.spaceAdmin.createMany({ data: [
    { spaceId: space1.id, adminId: admin1.id },
    { spaceId: space2.id, adminId: admin2.id },
    { spaceId: space3.id, adminId: admin3.id },
  ] });
  console.log('3 espacios creados con admins asignados');

  // ==================== GRUPOS ====================
  console.log('Creando grupos...');
  const grupo1 = await prisma.userGroup.create({ data: { name: 'Equipo Futbol A', description: 'Equipo principal de futbol', adminId: admin1.id } });
  const grupo2 = await prisma.userGroup.create({ data: { name: 'Equipo Basketball', description: 'Jugadores de basketball', adminId: admin1.id } });
  const grupo3 = await prisma.userGroup.create({ data: { name: 'Grupo Baile Salsa', description: 'Participantes de salsa', adminId: admin2.id } });
  for (let i = 0; i < 8; i++) await prisma.userGroupMember.create({ data: { groupId: grupo1.id, userId: users[i].id } });
  for (let i = 5; i < 12; i++) await prisma.userGroupMember.create({ data: { groupId: grupo2.id, userId: users[i].id } });
  for (let i = 10; i < 18; i++) await prisma.userGroupMember.create({ data: { groupId: grupo3.id, userId: users[i].id } });
  console.log('3 grupos creados con miembros');

  // ==================== EVENTOS (solo 2: 1 publico + 1 privado) ====================
  console.log('Creando eventos...');

  const eventsData = [
    {
      name: 'Torneo Relampago Capital',
      description: 'Torneo eliminacion directa organizado por Capital Futbol. Equipos de 7 jugadores. Canchas sinteticas.',
      type: 'PUBLIC', status: 'ACTIVE', category: 'FUTBOL',
      date: new Date('2026-04-12T08:00:00'), endDate: new Date('2026-04-12T18:00:00'),
      location: 'Canchas Sinteticas El Campin, Bogota', latitude: 4.6476, longitude: -74.0775,
      maxPlayers: 28, price: 25000, creatorId: admin1.id, spaceId: space1.id,
    },
    {
      name: 'Copa Privada Campin 5',
      description: 'Evento exclusivo por invitacion. Torneo interno entre equipos seleccionados por Campin 5.',
      type: 'PRIVATE', status: 'ACTIVE', category: 'FUTBOL',
      date: new Date('2026-04-19T14:00:00'), endDate: new Date('2026-04-19T20:00:00'),
      location: 'Complejo Deportivo Campin 5, Bogota', latitude: 4.6510, longitude: -74.0830,
      maxPlayers: 20, price: 30000, creatorId: admin2.id, spaceId: space2.id,
    },
  ];

  const events = [];
  for (const e of eventsData) {
    const event = await prisma.event.create({ data: e });
    events.push(event);
  }

  console.log(`${events.length} eventos creados`);

  // ==================== INSCRIPCIONES ====================
  console.log('Creando inscripciones...');

  let regCount = 0;
  const registrations = [];

  for (const event of events) {
    const numRegs = Math.min(Math.floor(Math.random() * 8) + 5, users.length, event.maxPlayers + 2);
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    const selectedUsers = shuffled.slice(0, numRegs);

    for (let i = 0; i < selectedUsers.length; i++) {
      const isOverCapacity = i >= event.maxPlayers;
      const statuses = ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'PENDING'];
      const status = isOverCapacity ? 'WAITLISTED' : statuses[Math.floor(Math.random() * statuses.length)];

      const reg = await prisma.registration.create({
        data: {
          userId: selectedUsers[i].id,
          eventId: event.id,
          status,
        },
      });
      registrations.push(reg);
      regCount++;
    }
  }

  console.log(`${regCount} inscripciones creadas`);

  // ==================== PAGOS ====================
  console.log('Creando pagos...');

  let payCount = 0;
  const confirmedRegs = registrations.filter((r) => r.status === 'CONFIRMED');

  for (const reg of confirmedRegs) {
    const event = events.find((e) => e.id === reg.eventId);
    if (!event || parseFloat(event.price) === 0) continue;

    const price = parseFloat(event.price);
    const rand = Math.random();
    let type, amount, status;

    if (rand < 0.7) {
      type = 'FULL';
      amount = price;
      status = 'COMPLETED';
    } else if (rand < 0.9) {
      type = 'ADVANCE';
      amount = Math.round(price * 0.5);
      status = Math.random() < 0.5 ? 'COMPLETED' : 'PENDING';
    } else {
      type = 'CUSTOM';
      amount = Math.round(price * (0.3 + Math.random() * 0.4));
      status = 'PENDING';
    }

    await prisma.payment.create({
      data: {
        userId: reg.userId,
        eventId: reg.eventId,
        registrationId: reg.id,
        amount,
        type,
        status,
        reference: status === 'COMPLETED' ? `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}` : null,
        notes: type === 'ADVANCE' ? 'Pago parcial, resta por pagar' : null,
      },
    });
    payCount++;
  }

  const pendingRegs = registrations.filter((r) => r.status === 'PENDING').slice(0, 8);
  for (const reg of pendingRegs) {
    const event = events.find((e) => e.id === reg.eventId);
    if (!event || parseFloat(event.price) === 0) continue;

    await prisma.payment.create({
      data: {
        userId: reg.userId,
        eventId: reg.eventId,
        registrationId: reg.id,
        amount: parseFloat(event.price),
        type: 'FULL',
        status: 'PENDING',
      },
    });
    payCount++;
  }

  console.log(`${payCount} pagos creados`);

  // ==================== NOTIFICACIONES ====================
  console.log('Creando notificaciones...');

  let notifCount = 0;
  for (const u of users.slice(0, 5)) {
    await prisma.notification.create({
      data: { userId: u.id, title: 'Bienvenido a VibraMeet', message: 'Explora los eventos disponibles.', type: 'INFO', read: false },
    });
    notifCount++;
  }

  for (const admin of [superAdmin, admin1, admin2, admin3]) {
    await prisma.notification.create({
      data: { userId: admin.id, title: 'Panel listo', message: 'Tu espacio de administracion esta configurado.', type: 'SUCCESS', read: false },
    });
    notifCount++;
  }

  console.log(`${notifCount} notificaciones creadas`);

  // ==================== SOLICITUDES TIPO EVENTO ====================
  console.log('Creando solicitudes de tipo de evento...');
  await prisma.eventTypeRequest.create({ data: { requesterId: admin1.id, categoryName: 'YOGA', description: 'Eventos de yoga al aire libre', justification: 'Mucha demanda de usuarios', status: 'PENDING' } });
  await prisma.eventTypeRequest.create({ data: { requesterId: users[0].id, categoryName: 'RUNNING', description: 'Carreras y maratones', justification: 'Grupo de 50+ corredores', status: 'PENDING' } });
  console.log('2 solicitudes de tipo de evento creadas');

  // ==================== PENALIDAD NO_SHOW ====================
  const penalizedUntil = new Date();
  penalizedUntil.setDate(penalizedUntil.getDate() + 5);
  await prisma.penalty.create({ data: { userId: users[2].id, eventId: events[0].id, type: 'NO_SHOW', reason: 'No asistio al evento', active: true, expiresAt: penalizedUntil } });
  await prisma.user.update({ where: { id: users[2].id }, data: { penalizedUntil } });
  console.log('1 penalidad NO_SHOW creada');

  console.log('\n========================================');
  console.log('SEED COMPLETADO EXITOSAMENTE');
  console.log('========================================');
  console.log('Credenciales de acceso:');
  console.log('  Super Admin:  superadmin@vibrameet.com / admin123');
  console.log('  Capital Futbol: admin@vibrameet.com / admin123');
  console.log('  Campin 5:     admin2@vibrameet.com / admin123');
  console.log('  Golaya Kevin: admin3@vibrameet.com / admin123');
  console.log('  Usuarios:     [email]@gmail.com / user123');
  console.log('========================================');
  console.log('2 eventos: 1 publico + 1 privado');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
