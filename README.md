# IPTV SaaS - Sistema de TV por Internet

Sistema IPTV web para ISP local. Clientes acceden desde Smart TV / navegador. Panel admin para gestión de usuarios, canales, packs y facturación.

---

## 📋 Requisitos

- Node.js 20+
- PostgreSQL 15+
- npm o pnpm

---

## 🚀 Instalación Local

### 1. Base de datos

```bash
# Crear base de datos PostgreSQL
createdb iptv_devbyte
```

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev   # puerto 3002
```

### 3. Frontend Admin

```bash
cd frontend-admin
npm install
npm run dev   # puerto 3003
```

### 4. Frontend TV (solo abrir en navegador)

```bash
cd frontend-tv
# Abrir index.html en navegador, o servir con:
npx serve --port 3000
```

---

## 🔑 Credenciales de prueba

### Admin
- Usuario: `admin`
- Contraseña: `admin123` (configurable via `ADMIN_INITIAL_PASSWORD`)

### Clientes
| Usuario | Contraseña | Estado |
|---------|------------|--------|
| usuario1 | usuario123 | ACTIVE |
| usuario2 | usuario123 | TRIAL |
| usuario3 | usuario123 | SUSPENDED |

---

## 🌐 URLs del sistema (desarrollo local)

- **TV Client:** http://localhost:3000 (o abrir `frontend-tv/index.html`)
- **Admin Panel:** http://localhost:3003
- **API Backend:** http://localhost:3002

---

## 🧪 Testing con Thunder Client / Postman

### Login cliente
```
POST http://localhost:3002/api/auth/login
Body: { "username": "usuario1", "password": "usuario123" }
```

### Login admin
```
POST http://localhost:3002/api/admin/login
Body: { "username": "admin", "password": "admin123" }
```

---

## 📁 Estructura del proyecto

```
iptv-saas-devbyte/
├── backend/              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/      # Database
│   │   ├── middlewares/ # Auth, rate limit, validation
│   │   ├── modules/     # auth, channels, users, packs, etc
│   │   └── utils/       # jwt, password, response, cronJobs
│   └── prisma/          # Schema y seed
│
├── frontend-admin/       # React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── components/   # UI y Layout
│       ├── pages/       # Dashboard, Users, Channels, Packs, etc
│       ├── hooks/       # Custom hooks
│       ├── lib/         # Axios, queryClient
│       ├── context/     # AuthContext
│       └── types/       # TypeScript interfaces
│
├── frontend-tv/         # HTML + Vanilla JS
│   ├── index.html       # Login
│   ├── app.html         # Lista de canales + player
│   ├── css/styles.css   # Estilos
│   └── js/              # auth.js, channels.js
│
├── scripts/             # Deploy scripts
│   ├── deploy.sh        # Script de deploy
│   └── nginx.conf       # Config Nginx
│
├── ecosystem.config.js  # PM2 config
└── README.md
```

---

## 🔧 Variables de entorno (Backend)

```env
DATABASE_URL="postgresql://postgres:<TU_PASSWORD>@localhost:5432/<TU_DB>"
JWT_SECRET="tu_secret_largo_aqui"
JWT_REFRESH_SECRET="otro_secret_largo_aqui"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3002
ADMIN_INITIAL_PASSWORD="admin123"
MAX_SESSIONS_DEFAULT=2
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
```

---

## 🚢 Deploy en servidor

1. Copiar archivos al servidor
2. Configurar PostgreSQL y crear base de datos
3. Ejecutar `scripts/deploy.sh` o hacer manualmente:
   - `npm install` en backend y frontend-admin
   - `npx prisma migrate deploy` en backend
   - `npm run build` en frontend-admin
   - Copiar dist a `/var/www/iptv-admin`
   - Copiar frontend-tv a `/var/www/iptv-tv`
   - Configurar Nginx con `scripts/nginx.conf`
   - `pm2 start ecosystem.config.js`

---

## 📡 API Endpoints

### Auth (clientes)
```
POST /api/auth/login     → Login
POST /api/auth/logout    → Logout
POST /api/auth/refresh   → Refresh token
GET  /api/auth/me       → Datos del usuario
```

### Canales (clientes)
```
GET /api/channels           → Lista de canales segun packs
GET /api/channels/:id/stream → Obtener streamUrl
```

### Admin Auth
```
POST /api/admin/login
GET  /api/admin/me
```

### Admin Users
```
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
PATCH  /api/admin/users/:id/status
DELETE /api/admin/users/:id
```

### Admin Channels
```
GET    /api/admin/channels
POST   /api/admin/channels
PUT    /api/admin/channels/:id
DELETE /api/admin/channels/:id
PATCH  /api/admin/channels/:id/toggle
PATCH  /api/admin/channels/reorder
```

### Admin Packs
```
GET    /api/admin/packs
POST   /api/admin/packs
PUT    /api/admin/packs/:id
DELETE /api/admin/packs/:id
POST   /api/admin/packs/:id/channels
```

### Admin Metrics & Sessions
```
GET /api/admin/metrics        → Métricas dashboard
GET /api/admin/sessions/live   → Sesiones activas
DELETE /api/admin/sessions/:id → Cerrar sesión
```

### Notificaciones
```
GET  /api/notifications              → Notificaciones del usuario
PATCH /api/notifications/:id/read    → Marcar leída
POST /api/admin/notifications/send   → Enviar notificación
GET /api/admin/notifications/history → Historial
```

---

## ⚙️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| DB | PostgreSQL |
| Auth | JWT (access + refresh) |
| Frontend Admin | React + Vite + TypeScript + Tailwind |
| Frontend TV | HTML + Vanilla JS |
| Video Player | HLS.js |
| Admin UI | Lucide Icons + react-hot-toast |
| WebSockets | Socket.io |

---

## 📺 Compatibilidad Smart TV

El frontend TV usa HTML/JS vanilla para máxima compatibilidad:
- Samsung Tizen 5+
- LG webOS 4+
- Navegadores modernos

---

## 🔒 Seguridad

1. **Streams protegidos:** Las URLs reales nunca se exponen al cliente. Solo se acceden via `/api/channels/:id/stream` con token válido.

2. **Canales +18:** Se ocultan del grid a menos que el usuario tenga el pack adultos.

3. **Control de sesiones:** Límite de dispositivos configurables por usuario.

4. **Rate limiting:** 5 intentos de login cada 15 minutos por IP.

5. **Tokens:** Access token 15min, Refresh token 30 días.
