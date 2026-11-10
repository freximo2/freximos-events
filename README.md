# VibraMeet (módulo de eventos)

> Esta aplicación vive en la carpeta `eventos/` del repositorio [freximos-ia-systems](../README.md). Todos los comandos de esta guía se ejecutan desde `eventos/`.

Plataforma de gestión de eventos multi-categoría con sistema de roles, inscripciones con lista de espera inteligente, pagos, solicitudes, notificaciones y estadísticas.

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIOS                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐                  │
│  │   USER   │    │  ADMIN   │    │ SUPER_ADMIN  │                  │
│  │          │    │          │    │              │                  │
│  │ Ver/Insc │    │ CRUD sus │    │ Control total│                  │
│  │ eventos  │    │ eventos  │    │ + usuarios   │                  │
│  └────┬─────┘    └────┬─────┘    └──────┬───────┘                  │
│       └───────────────┼─────────────────┘                          │
└───────────────────────┼─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19 + Vite)                       │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌───────┐ ┌───────────────┐  │
│  │ Eventos │ │Inscripc. │ │ Pagos  │ │ Stats │ │   Admin Panel │  │
│  │ Grid/   │ │ + Lista  │ │        │ │       │ │ + Invitaciones│  │
│  │ Lista   │ │ espera   │ │        │ │       │ │ + Roles       │  │
│  └─────────┘ └──────────┘ └────────┘ └───────┘ └───────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          Filtros y búsqueda en todos los módulos             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                        │ HTTP (proxy /api → :3000)                  │
└────────────────────────┼────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                        │
│                                                                     │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Auth   │  │    Events     │  │ Registrations│  │  Payments │ │
│  │ JWT+bcrypt│  │ Multi-categ.  │  │ + Waitlist   │  │           │ │
│  └──────────┘  │ Auto-archive  │  │ + Prioridad  │  └───────────┘ │
│                │ Cancel+Notify │  │   actividad  │                 │
│  ┌──────────┐  └───────────────┘  └──────────────┘  ┌───────────┐ │
│  │  Users   │  ┌───────────────┐  ┌──────────────┐  │ Penalties │ │
│  │ Invite   │  │   Requests    │  │    Stats     │  └───────────┘ │
│  │ Roles    │  └───────────────┘  │ Personal +   │                 │
│  │ Photo    │  ┌───────────────┐  │ Dashboard    │  ┌───────────┐ │
│  │ Delete   │  │ Notifications │  └──────────────┘  │ Sponsors  │ │
│  └──────────┘  └───────────────┘                    │ Clients   │ │
│                                                     └───────────┘ │
│                        │ Prisma ORM                                 │
└────────────────────────┼────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PostgreSQL 16                                     │
│  ┌───────┐ ┌────────┐ ┌──────────────┐ ┌─────────┐ ┌───────────┐  │
│  │ Users │ │ Events │ │Registrations │ │Payments │ │ Requests  │  │
│  └───────┘ └────────┘ └──────────────┘ └─────────┘ └───────────┘  │
│  ┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ Penalties  │ │Ownerships│ │Notifications │ │Sponsors/Clients│  │
│  └────────────┘ └──────────┘ └──────────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Flujo de la Lista de Espera

```
  Usuario se inscribe
         │
         ▼
  ┌──────────────┐    SÍ    ┌──────────────┐
  │ ¿Hay cupo?   │────────▶ │  PENDING     │
  └──────┬───────┘          └──────────────┘
         │ NO
         ▼
  ┌──────────────┐
  │  WAITLISTED  │
  └──────┬───────┘
         │
         │  Cuando alguien cancela o es rechazado:
         ▼
  ┌────────────────────────────────────────┐
  │ Seleccionar mejor waitlisted:          │
  │  1. Más eventos confirmados (activo)  │
  │  2. Desempate: orden de llegada       │
  └──────────────────┬─────────────────────┘
                     ▼
  ┌──────────────┐
  │  PENDING     │ + Notificación automática
  └──────────────┘
```

## Ciclo de Vida de un Evento

```
  DRAFT ──▶ ACTIVE ──┬──▶ CANCELLED (manual por admin)
                      │       │
                      │       └── Notifica a todos los inscritos
                      │           Cancela inscripciones activas
                      │
                      └──▶ ARCHIVED (automático al pasar la fecha)
                               │
                               └── Solo visible para Admin/Super Admin
```

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + TailwindCSS |
| Backend | Node.js + Express + Multer |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT + bcryptjs |
| Contenedores | Docker + Docker Compose |

## Estructura del Proyecto

```
eventos/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── uploads/              # Fotos de perfil (volumen persistente)
│   ├── prisma/
│   │   ├── schema.prisma     # Modelos de datos
│   │   ├── migrations/       # Migraciones SQL
│   │   └── seed.js           # Datos iniciales
│   └── src/
│       ├── index.js          # Entry point + static files
│       ├── config/db.js      # Cliente Prisma
│       ├── middleware/auth.js # JWT authenticate & authorize
│       ├── auth/             # Login y registro
│       ├── users/            # Perfil, foto, roles, invitaciones
│       ├── events/           # CRUD eventos + cancelar + archivar
│       ├── registrations/    # Inscripciones + waitlist inteligente
│       ├── payments/         # Pagos (completo/adelanto/personalizado)
│       ├── ownerships/       # Titularidades
│       ├── requests/         # Solicitudes (PQRS)
│       ├── penalties/        # Penalidades
│       ├── stats/            # Estadísticas personales + dashboard
│       ├── sponsors/         # Patrocinadores
│       ├── clients/          # Clientes
│       └── notifications/    # Notificaciones en tiempo real
└── frontend/
    ├── Dockerfile
    └── src/
        ├── App.jsx           # Rutas principales
        ├── components/
        │   ├── Navbar.jsx
        │   └── NotificationBell.jsx
        ├── guards/
        │   └── ProtectedRoute.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── Profile.jsx          # + Avatar upload
        │   ├── Events.jsx           # Grid/Lista + filtros
        │   ├── EventDetail.jsx      # Detalle + waitlist + cancelar
        │   ├── EventForm.jsx        # Crear/editar + categoría
        │   ├── MyRegistrations.jsx  # Grid/Lista + cupos/cola
        │   ├── Payments.jsx         # + Filtros estado/tipo
        │   ├── Requests.jsx         # + Filtros estado/prioridad/tipo
        │   ├── Stats.jsx            # Personal (user) / Dashboard (admin)
        │   ├── AdminDashboard.jsx   # Invitaciones + roles + eliminar
        │   ├── Sponsors.jsx         # + Búsqueda
        │   ├── Clients.jsx          # + Búsqueda
        │   └── auth/
        └── services/
            ├── api.js              # Cliente HTTP
            └── AuthContext.jsx     # Estado global de auth
```

## Inicio Rápido con Docker

```bash
# Levantar todos los servicios
docker compose up --build -d

# Cargar datos de prueba
docker compose exec backend npm run seed
```

Una vez levantado:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health check**: http://localhost:3000/api/health

## Publicación en freximos.com (Cloudflare Tunnel desde macOS)

Estado actual: la app corre en el Mac y se expone en internet con un **Cloudflare Tunnel**. No necesita abrir puertos en el router ni tener un servidor contratado. El sitio solo está disponible mientras el Mac esté encendido, con Docker y el túnel activos.

### Requisitos (una sola vez)

```bash
brew install colima docker docker-compose cloudflared
colima start --cpu 2 --memory 4
```

Colima reemplaza a Docker Desktop. Usa `docker-compose` (versión standalone) en lugar de `docker compose`.

### Levantar la app

```bash
cd eventos
docker-compose up --build -d
```

Comprueba que responda: `http://localhost:3000/api/health` y `http://localhost:5173`.

> No cargues el seed (`npm run seed`) en una instancia pública: crea cuentas con contraseña `admin123`, incluido el SUPER_ADMIN. Cambia esas contraseñas o crea usuarios desde la app antes de exponer el sitio.

### Configuración del túnel (una sola vez)

```bash
cloudflared tunnel login                       # autoriza en el navegador, eligiendo freximos.com
cloudflared tunnel create eventhub             # genera ~/.cloudflared/<UUID>.json
cloudflared tunnel route dns eventhub freximos.com
cloudflared tunnel route dns eventhub www.freximos.com
```

Crea `~/.cloudflared/config.yml` (reemplaza `<UUID>` por el id del túnel):

```yaml
tunnel: <UUID>
credentials-file: /Users/<tu-usuario>/.cloudflared/<UUID>.json

ingress:
  - hostname: freximos.com
    service: http://localhost:5173
  - hostname: www.freximos.com
    service: http://localhost:5173
  - service: http_status:404
```

El frontend es el único punto de entrada: Vite reenvía `/api` y `/uploads` al backend, así que el túnel solo necesita el puerto 5173.

### Arrancar el túnel

```bash
cloudflared tunnel --config ~/.cloudflared/config.yml run eventhub
```

### Cambio necesario en el frontend

`frontend/vite.config.js` incluye `allowedHosts: ['freximos.com', 'www.freximos.com']`. Sin esa línea, Vite responde 403 al dominio público. Si cambias de dominio, actualiza esta lista y reconstruye el frontend (`docker-compose up --build -d frontend`), porque `vite.config.js` no está montado como volumen.

### Limitaciones y próximos pasos

- El frontend corre en **modo desarrollo de Vite**. Es aceptable para una demo, pero no para un lanzamiento real: hay que compilarlo a archivos estáticos (`npm run build`) y servirlos con un servidor web.
- El backend ejecuta `prisma db push --accept-data-loss` al arrancar. En producción debe cambiarse a `prisma migrate deploy` para no borrar datos.
- `docker-compose.yml` tiene `JWT_SECRET` y la contraseña de Postgres de desarrollo. Cámbialos antes de publicar.
- **Para mover la app a un VPS:** instala `cloudflared` en el servidor, copia `config.yml` y el archivo de credenciales del túnel, y apaga el túnel en el Mac. El código no cambia.

## Desarrollo Local (sin Docker)

### Requisitos

- Node.js >= 20
- PostgreSQL >= 16

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run seed    # Opcional: carga datos de prueba
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> Al desarrollar localmente, cambia el proxy en `vite.config.js` de `http://backend:3000` a `http://localhost:3000`.

## Categorías de Eventos

| Categoría | Icono Color |
|---|---|
| Fútbol | Verde |
| Basketball | Naranja |
| Baile | Rosa |
| Bolos | Índigo |
| Reunión | Teal |
| Otro | Gris |

## API Endpoints

### Auth

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro (notifica a Super Admins) |
| POST | `/api/auth/login` | Inicio de sesión |

### Users

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/users/me` | Token | Perfil propio |
| PUT | `/api/users/me` | Token | Actualizar perfil |
| POST | `/api/users/me/photo` | Token | Subir foto de perfil |
| GET | `/api/users` | Admin+ | Listar usuarios |
| PATCH | `/api/users/:id/role` | Super Admin | Cambiar rol |
| POST | `/api/users/invite` | Super Admin | Invitar admin |
| DELETE | `/api/users/:id` | Super Admin | Eliminar usuario |

### Events

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/events` | Token | Listar (filtrado por rol) |
| GET | `/api/events/:id` | Token | Detalle del evento |
| POST | `/api/events` | Admin+ | Crear evento |
| PUT | `/api/events/:id` | Admin+ | Editar evento |
| PATCH | `/api/events/:id/cancel` | Admin+ | Cancelar evento |
| DELETE | `/api/events/:id` | Admin+ | Eliminar evento |

### Registrations

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/registrations/my` | Token | Mis inscripciones + conteos |
| POST | `/api/registrations/event/:id` | Token | Inscribirse (o waitlist) |
| DELETE | `/api/registrations/event/:id` | Token | Cancelar inscripción |
| GET | `/api/registrations/event/:id/waitlist-position` | Token | Posición en cola |
| PATCH | `/api/registrations/:id/status` | Admin+ | Confirmar/rechazar |

### Stats

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/stats/my` | Token | Stats personales |
| GET | `/api/stats/dashboard` | Admin+ | Dashboard general |
| GET | `/api/stats/event/:id` | Token | Stats de evento público |

## Roles y Permisos

```
SUPER_ADMIN (control total)
├── Todo lo de ADMIN
├── Ver todos los eventos (cualquier estado)
├── Invitar admins/super admins
├── Cambiar roles de usuarios
├── Eliminar usuarios
├── Gestionar patrocinadores y clientes
├── Recibe notificación de nuevos registros
└── Ve tabla completa de usuarios

ADMIN (espacio propio)
├── Todo lo de USER
├── CRUD de sus propios eventos
├── Gestionar inscripciones de sus eventos
├── Ver sus eventos en cualquier estado
├── Ver dashboard de estadísticas
└── Gestionar solicitudes

USER (participante)
├── Ver eventos públicos (activos + cancelados)
├── Ver eventos privados donde fue invitado
├── Inscribirse / lista de espera
├── Ver posición en cola
├── Ver estadísticas personales
├── Ver stats de eventos públicos
├── Modificar perfil y avatar
├── Crear solicitudes
└── Ver sus pagos e inscripciones
```

## Usuarios de Prueba

| Email | Contraseña | Rol |
|---|---|---|
| superadmin@vibrameet.com | admin123 | SUPER_ADMIN |
| admin@vibrameet.com | admin123 | ADMIN |
| admin2@vibrameet.com | admin123 | ADMIN |
| juan.perez@gmail.com | user123 | USER |
| *(25 usuarios más)* | user123 | USER |

## Fases de Desarrollo

- [x] **Fase 1** - Autenticación, roles, perfil de usuario, Docker
- [x] **Fase 2** - CRUD de eventos (privados/públicos) + inscripciones
- [x] **Fase 3** - Sistema de pagos (adelantado/personalizado) + titularidad
- [x] **Fase 4** - Solicitudes (crear, validar, escalar, cerrar)
- [x] **Fase 5** - Estadísticas (penalidades, participantes, eventos)
- [x] **Fase 6** - CRUD Patrocinadores/Clientes (Super Admin)
- [x] **Fase 7** - Notificaciones + UI mejorada
- [x] **Fase 8** - Multi-categoría, lista de espera inteligente, rebranding
- [x] **Fase 9** - Roles refinados, invitaciones, foto perfil, auto-archivo
- [x] **Fase 10** - Filtros y búsqueda en todos los módulos, vistas grid/lista

---

## Flujo de ramas (GitFlow)

| Rama | Propósito | Entorno |
|---|---|---|
| `main` | Producción. Solo código probado y desplegado | `eventos.freximos.com` |
| `develop` | Integración y desarrollo. Base de las nuevas funciones | `dev-eventos.freximos.com` |
| `feature/*` | Nuevas funciones, creadas desde `develop` | Local |
| `release/vX.Y.Z` | Preparación de una versión, desde `develop` hacia `main` | Pruebas |
| `hotfix/*` | Correcciones urgentes en producción, desde `main` | Producción |

Reglas:
- Los cambios entran a `develop` por pull request desde `feature/*`.
- Un `release/*` se fusiona en `main` y en `develop`, y se etiqueta con su versión.
- Un `hotfix/*` se fusiona en `main` y en `develop`.
- Nunca se hace commit directo a `main`.

## Configuración por entorno

- Desarrollo usa `docker-compose.yml` con `.env` (no versionado).
- Producción usa `docker-compose.prod.yml` con `.env.prod` (no versionado).
- Los nombres de proyecto de Docker se fijan con `-p` para no mezclar volúmenes:
  - Desarrollo: `docker-compose -p eventos-dev up -d`
  - Producción: `docker-compose -p eventos-prod -f docker-compose.prod.yml --env-file .env.prod up -d`
