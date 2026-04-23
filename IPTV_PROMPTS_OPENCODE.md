# 🤖 Prompts para OpenCode — IPTV SaaS

> Usar estos prompts en orden. Cada uno asume que el anterior fue completado.
> Base de datos: PostgreSQL. ORM: Prisma. Backend: Node.js + Express + TypeScript.
> Frontend Admin: React + Vite + TypeScript + Tailwind + Lucide Icons.
> Frontend TV: HTML + Vanilla JS (sin frameworks).

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BLOQUE 1 — SETUP INICIAL DEL PROYECTO
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prompt 1.1 — Estructura de carpetas y backend base

> ⚠️ La carpeta raíz `iptv-saas-devbyte/` ya existe y está abierta en el editor. Trabajar DENTRO de ella, no crear una carpeta nueva.

```
La carpeta raíz del proyecto ya existe y se llama iptv-saas-devbyte/.
Trabajá siempre dentro de ella. No crear ninguna carpeta raíz nueva.

Crear la siguiente estructura de subcarpetas y archivos dentro de iptv-saas-devbyte/:

Subcarpetas a crear:
- backend/         → Node.js + Express + TypeScript
- frontend-admin/  → React + Vite + TypeScript (se inicializa en el Bloque 6)
- frontend-tv/     → HTML + Vanilla JS (se crea en el Bloque 5)

Ahora enfocarse solo en backend/. Inicializar con:

1. package.json con dependencias:
   - Producción: express, prisma, @prisma/client, jsonwebtoken, bcryptjs, cors, dotenv, express-validator, socket.io, node-cron
   - Desarrollo: typescript, ts-node, ts-node-dev, nodemon, @types/express, @types/node, @types/jsonwebtoken, @types/bcryptjs, @types/cors, @types/node-cron

2. tsconfig.json configurado para Node.js:
   - target: ES2020, module: commonjs
   - outDir: ./dist, rootDir: ./src
   - strict: true, esModuleInterop: true

3. .env.example con:
   DATABASE_URL="postgresql://usuario:password@localhost:5432/iptv_devbyte"
   JWT_SECRET="cambia_esto_por_un_secret_largo"
   JWT_REFRESH_SECRET="cambia_esto_por_otro_secret_largo"
   JWT_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="30d"
   PORT=3001
   ADMIN_INITIAL_PASSWORD="admin123"
   MAX_SESSIONS_DEFAULT=2
   NODE_ENV="development"
   ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3002"

4. .env (copia de .env.example con los mismos valores, para desarrollo local)

5. .gitignore que ignore: node_modules/, dist/, .env, *.log

6. nodemon.json:
   { "watch": ["src"], "ext": "ts", "exec": "ts-node-dev src/app.ts" }

7. src/app.ts con Express:
   - Middlewares: cors (con origins del .env), express.json(), express.urlencoded()
   - Ruta de prueba: GET /api/health → { status: "ok", timestamp: new Date(), project: "IPTV DevByte" }
   - Puerto desde process.env.PORT

8. src/config/database.ts:
   - Exportar instancia única de PrismaClient
   - Con log de queries solo en development

9. scripts en package.json:
   - "dev": "nodemon"
   - "build": "tsc"
   - "start": "node dist/app.js"
   - "prisma:generate": "prisma generate"
   - "prisma:migrate": "prisma migrate dev"
   - "prisma:studio": "prisma studio"
   - "seed": "ts-node prisma/seed.ts"

Ejecutar npm install al final. Verificar que npm run dev levanta el servidor y GET /api/health responde correctamente.
```

---

### Prompt 1.2 — Schema Prisma completo

```
En el archivo prisma/schema.prisma del backend, crea el schema completo para el sistema IPTV con las siguientes tablas PostgreSQL:

1. AdminUser: id (uuid), username (unique), email (unique), passwordHash, role (enum: SUPER_ADMIN, ADMIN), createdAt, updatedAt

2. User (clientes): id (uuid), username (unique), email (optional, unique), passwordHash, fullName, status (enum: ACTIVE, SUSPENDED, TRIAL, EXPIRED), expiresAt (DateTime optional), maxDevices (default 2), pin (string optional, para canales adultos), createdAt, updatedAt
   - Relaciones: sessions[], userPacks[], notifications[], activityLogs[]

3. Session: id (uuid), userId (FK), deviceName, deviceType (enum: TV, BROWSER, MOBILE, UNKNOWN), ipAddress, userAgent, token (unique), lastSeen, createdAt
   - Relación con Channel: currentChannelId (FK optional)

4. Channel: id (uuid), number (Int unique), name, logoUrl (optional), streamUrl, streamUrlBackup (optional), category (string), isAdult (default false), quality (enum: SD, HD, FHD), isActive (default true), sortOrder (Int), createdAt, updatedAt
   - Relaciones: packChannels[], activityLogs[], sessions[]

5. Pack: id (uuid), name, description (optional), color (hex string), icon (lucide icon name), isActive (default true), createdAt, updatedAt
   - Relaciones: packChannels[], userPacks[]

6. PackChannel: packId, channelId (@@id compuesto)

7. UserPack: userId, packId, assignedAt (@@id compuesto)

8. Notification: id (uuid), userId (FK optional, null = global), title, message, type (enum: INFO, WARNING, DANGER), isRead (default false), createdAt

9. ActivityLog: id (uuid), userId (FK), channelId (FK optional), action (string), ipAddress, createdAt

Luego genera el comando para la primera migración: npx prisma migrate dev --name init
```

---

### Prompt 1.3 — Seed de datos iniciales

```
Crea el archivo prisma/seed.ts para poblar la base de datos con datos de prueba:

1. Crear 1 admin: username "admin", password "admin123" (hasheada con bcrypt)

2. Crear 10 canales de ejemplo:
   - Canales de noticias: CNN (HD), BBC (HD), Telefe Noticias (SD)
   - Canales de deportes: ESPN (HD), TyC Sports (FHD), ESPN 2 (HD)
   - Canales de entretenimiento: Sony (HD), TCM (SD), HBO (FHD)
   - Canal adulto: Playboy TV (HD, isAdult: true)
   Los canales de prueba usen streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" (stream HLS público de prueba)

3. Crear 3 packs:
   - Pack "Básico": canales de noticias. Color: #3b82f6. Icon: "tv"
   - Pack "Fútbol": canales de deportes. Color: #10b981. Icon: "trophy"
   - Pack "Adultos +18": Playboy TV. Color: #ef4444. Icon: "lock"

4. Crear 3 usuarios de prueba:
   - usuario1: activo, tiene Pack Básico y Fútbol, vence en 30 días, maxDevices: 2
   - usuario2: trial, tiene solo Pack Básico, vence en 7 días
   - usuario3: suspendido, sin packs

Agregar script al package.json: "seed": "ts-node prisma/seed.ts"
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BLOQUE 2 — BACKEND: AUTH Y USUARIOS
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prompt 2.1 — Middlewares y utilidades

```
Crea los siguientes archivos en el backend src/:

1. utils/jwt.ts:
   - generateAccessToken(userId, role): string → JWT con expiración 15m
   - generateRefreshToken(userId): string → JWT con expiración 30d
   - verifyToken(token, secret): payload | null

2. utils/password.ts:
   - hashPassword(plain): Promise<string>
   - comparePassword(plain, hash): Promise<boolean>

3. utils/response.ts:
   - success(res, data, message?, statusCode=200)
   - error(res, message, statusCode=400, details?)

4. middlewares/authenticate.ts:
   - Middleware que lee Bearer token del header Authorization
   - Verifica el JWT
   - Busca la sesión en DB (sessions table) para validar que sigue activa
   - Agrega req.user = { id, username, status } y req.sessionId
   - Si usuario está SUSPENDED o EXPIRED retorna 403 con mensaje específico

5. middlewares/authenticateAdmin.ts:
   - Similar pero para AdminUser
   - Lee token, verifica, agrega req.admin = { id, username, role }

6. middlewares/rateLimiter.ts:
   - Rate limit para login: 5 intentos por IP cada 15 minutos
   - Usar express-rate-limit

7. middlewares/validate.ts:
   - Wrapper para express-validator que retorna errores formateados
```

---

### Prompt 2.2 — Auth clientes (TV)

```
Crea el módulo de autenticación para clientes en src/modules/auth/:

1. auth.routes.ts con endpoints:
   - POST /api/auth/login
   - POST /api/auth/logout
   - POST /api/auth/refresh
   - GET  /api/auth/me (requiere authenticate middleware)

2. auth.controller.ts:

LOGIN (POST /api/auth/login):
- Body: { username, password, deviceName?, deviceType? }
- Validar que username y password no estén vacíos
- Buscar usuario en DB por username
- Si no existe → 401 "Credenciales incorrectas"
- Si status === SUSPENDED → 403 "Tu cuenta está suspendida. Contacta al administrador."
- Si status === EXPIRED → 403 "Tu suscripción venció. Contacta al administrador para renovar."
- Comparar password con hash
- Contar sesiones activas del usuario (sessions donde lastSeen > hace 5 minutos ó createdAt reciente)
- Si sesiones activas >= user.maxDevices → 403 "Límite de dispositivos alcanzado (X/X activos). Cerrá sesión en otro dispositivo."
- Generar accessToken y refreshToken
- Crear registro en sessions: { userId, deviceName, deviceType, ipAddress: req.ip, userAgent: req.headers['user-agent'], token: accessToken, lastSeen: now }
- Retornar: { accessToken, refreshToken, user: { id, username, fullName, status, expiresAt } }

LOGOUT (POST /api/auth/logout):
- Requiere authenticate middleware
- Eliminar la sesión actual (por req.sessionId)
- Retornar 200

REFRESH (POST /api/auth/refresh):
- Body: { refreshToken }
- Verificar refreshToken
- Generar nuevo accessToken
- Retornar { accessToken }

ME (GET /api/auth/me):
- Requiere authenticate middleware
- Retornar datos del usuario + packs asignados + notificaciones no leídas (count)
- Actualizar lastSeen de la sesión actual
```

---

### Prompt 2.3 — Auth admin

```
Crea el módulo de autenticación para admins en src/modules/admin/auth/:

1. adminAuth.routes.ts:
   - POST /api/admin/login
   - POST /api/admin/logout
   - GET  /api/admin/me

2. adminAuth.controller.ts:

LOGIN:
- Body: { username, password }
- Buscar en AdminUser
- Comparar password
- Generar JWT con payload: { adminId, username, role }
- Retornar { accessToken, admin: { id, username, role } }
- El token admin NO crea registro en sessions (tabla separada de clientes)

LOGOUT: simplemente retornar 200 (el frontend elimina el token)

ME: retornar datos del admin autenticado

3. Registrar rutas en app.ts
4. Aplicar rate limiter al login
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BLOQUE 3 — BACKEND: CANALES Y PACKS
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prompt 3.1 — Canales para clientes

```
Crea src/modules/channels/channels.routes.ts y channels.controller.ts para clientes:

GET /api/channels (requiere authenticate):
- Obtener los packs asignados al usuario (userPacks)
- Obtener los canales de esos packs (via PackChannel → Channel)
- Filtrar solo canales isActive: true
- Si el pack "Adultos" NO está asignado → excluir canales donde isAdult: true
- Ordenar por sortOrder
- Retornar array de canales: { id, number, name, logoUrl, category, isAdult, quality, streamUrl (NO incluir, se pide aparte), sortOrder }

GET /api/channels/:id/stream (requiere authenticate):
- Verificar que el canal pertenece a los packs del usuario
- Verificar que si es adulto, el usuario tiene el pack adultos
- Actualizar la sesión actual con currentChannelId
- Crear registro en activityLogs
- Retornar { streamUrl, streamUrlBackup }
- IMPORTANTE: este endpoint protege la URL real del stream

Registrar rutas en app.ts
```

---

### Prompt 3.2 — CRUD canales (admin)

```
Crea src/modules/admin/channels/:

adminChannels.routes.ts con endpoints (todos requieren authenticateAdmin):
- GET    /api/admin/channels          → listar todos con paginación y búsqueda
- POST   /api/admin/channels          → crear canal
- PUT    /api/admin/channels/:id      → editar canal
- DELETE /api/admin/channels/:id      → eliminar canal
- PATCH  /api/admin/channels/:id/toggle → activar/desactivar
- PATCH  /api/admin/channels/reorder  → body: [{ id, sortOrder }]

adminChannels.controller.ts:

GET listar:
- Query params: page, limit, search, category, isAdult
- Retornar: { channels, total, page, totalPages }

POST crear:
- Validar: number (único), name, streamUrl requeridos
- Crear en DB

PUT editar:
- Actualizar campos enviados

DELETE:
- Si tiene activityLogs, soft delete (isActive: false) en vez de eliminar
- Si no tiene historial, eliminar

PATCH toggle:
- Cambiar isActive al valor contrario

PATCH reorder:
- Recibir array [{ id, sortOrder }], actualizar en transacción
```

---

### Prompt 3.3 — CRUD packs (admin)

```
Crea src/modules/admin/packs/:

adminPacks.routes.ts (todos requieren authenticateAdmin):
- GET    /api/admin/packs             → listar packs con canales incluidos y count de usuarios
- POST   /api/admin/packs             → crear pack
- PUT    /api/admin/packs/:id         → editar pack
- DELETE /api/admin/packs/:id         → eliminar si no tiene usuarios asignados
- POST   /api/admin/packs/:id/channels → asignar canales al pack (body: { channelIds: [] })
- DELETE /api/admin/packs/:id/channels/:channelId → quitar canal del pack

adminPacks.controller.ts implementando cada endpoint.

Adicionalmente en el módulo de usuarios admin:
- POST   /api/admin/users/:id/packs              → asignar pack a usuario (body: { packId })
- DELETE /api/admin/users/:id/packs/:packId       → quitar pack a usuario
- GET    /api/admin/users/:id/packs               → packs del usuario
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BLOQUE 4 — BACKEND: USUARIOS ADMIN Y SESIONES
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prompt 4.1 — CRUD usuarios (admin)

```
Crea src/modules/admin/users/:

adminUsers.routes.ts (todos requieren authenticateAdmin):
- GET    /api/admin/users              → listar con filtros y paginación
- GET    /api/admin/users/:id          → detalle de usuario
- POST   /api/admin/users              → crear usuario
- PUT    /api/admin/users/:id          → editar usuario
- PATCH  /api/admin/users/:id/status   → cambiar estado (body: { status: ACTIVE|SUSPENDED|TRIAL|EXPIRED })
- DELETE /api/admin/users/:id          → eliminar usuario
- GET    /api/admin/users/:id/sessions → sesiones activas del usuario
- DELETE /api/admin/users/:id/sessions/:sessionId → cerrar sesión específica
- DELETE /api/admin/users/:id/sessions            → cerrar TODAS las sesiones

adminUsers.controller.ts:

GET listar:
- Filtros: status, search (username/email/fullName), expiresIn (días)
- Incluir: conteo de sesiones activas, packs asignados, última actividad
- Ordenar por createdAt desc

POST crear:
- Hashear password
- Validar username único
- Crear usuario
- Opcionalmente asignar packs iniciales (body: { packIds: [] })

PATCH status:
- Cambiar status
- Si SUSPENDED o EXPIRED → cerrar todas las sesiones activas del usuario

GET sesiones:
- Retornar sesiones ordenadas por lastSeen desc
- Incluir nombre del canal que está mirando si currentChannelId está seteado

DELETE sesión:
- Eliminar registro de sessions
```

---

### Prompt 4.2 — Métricas y sesiones en tiempo real

```
Crea src/modules/admin/metrics/ y configura WebSockets:

1. metrics.routes.ts:
GET /api/admin/metrics → retornar:
{
  totalUsers: { active, suspended, trial, expired },
  newUsersThisMonth: number,
  activeSessions: number (sesiones con lastSeen en últimos 5 min),
  popularChannels: [{ channel, viewCount }] top 5 del día,
  distributionByStatus: { active: %, suspended: %, trial: %, expired: % },
  recentActivity: últimas 10 entradas de activityLogs con usuario y canal
}

2. sessions.routes.ts:
GET /api/admin/sessions/live → sesiones con lastSeen en últimos 5 min, incluyendo:
- usuario (username, fullName)
- canal que mira (si currentChannelId)
- IP, deviceType, deviceName
- duración (desde createdAt)
DELETE /api/admin/sessions/:id → cerrar sesión forzada

3. Configurar socket.io en app.ts:
- Namespace /admin-socket protegido con token admin
- Evento "sessions:update" → emitir cada 30 segundos con sesiones activas actualizadas
- Evento "session:closed" → cuando un admin cierra una sesión forzada
- Namespace /client-socket protegido con token cliente
- Evento "notification:new" → cuando admin envía notificación al usuario
- Evento "account:suspended" → cuando admin suspende la cuenta (TV muestra overlay)
```

---

### Prompt 4.3 — Notificaciones y alertas automáticas

```
Crea src/modules/notifications/:

notifications.routes.ts:
- GET  /api/notifications        → notificaciones del usuario autenticado (no leídas primero)
- PATCH /api/notifications/:id/read → marcar como leída
- PATCH /api/notifications/read-all → marcar todas como leídas

adminNotifications.routes.ts:
- POST /api/admin/notifications/send → enviar notificación
  Body: { userId? (null = todos), title, message, type: INFO|WARNING|DANGER }
  Si userId null → crear para todos los usuarios activos
  Emitir via socket.io al usuario si está conectado

Crea src/utils/cronJobs.ts con node-cron:
1. Cada día a las 10am → buscar usuarios con expiresAt entre hoy y 7 días → crear notificación WARNING "Tu suscripción vence el [fecha]. Contacta al administrador para renovar."
2. Cada día a las 10am → buscar usuarios con expiresAt < hoy y status ACTIVE → cambiar status a EXPIRED + cerrar sesiones + notificación DANGER "Tu suscripción ha vencido."
3. Ejecutar cronJobs en app.ts al iniciar

Instalar: node-cron @types/node-cron
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BLOQUE 5 — FRONTEND TV (HTML/JS)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prompt 5.1 — Login TV

```
Crea frontend-tv/index.html — Pantalla de login para Smart TV y navegadores.

Diseño:
- Fondo muy oscuro (#060912) con sutil efecto de ruido/grain CSS
- Logo centrado arriba (texto "IPTV [NombreISP]" con ícono SVG de TV inline)
- Card de login centrada verticalmente con glassmorphism (backdrop-filter blur, borde semitransparente)
- Campos: Usuario y Contraseña con iconos SVG inline
- Botón "Ingresar" con azul eléctrico (#3b82f6)
- Mensaje de error debajo del botón (oculto por defecto)
- Sin dependencias externas (cero CDN, cero frameworks)

JavaScript en frontend-tv/js/auth.js:
- Al cargar: si hay token en localStorage válido → redirigir a app.html
- Submit del form (también con Enter): fetch POST al backend /api/auth/login
- Guardar en localStorage: accessToken, refreshToken, user (JSON)
- Si error del servidor → mostrar mensaje específico del backend (suspendido, vencido, etc.)
- Navegación TV: Tab entre campos, Enter para submit
- Animación de loading en el botón durante el fetch

Compatibilidad: IE11 no requerida. Sí debe funcionar en Samsung Tizen 5+, LG webOS 4+, navegadores modernos.
```

---

### Prompt 5.2 — App de canales TV

```
Crea frontend-tv/app.html — Pantalla principal con lista de canales y player.

Al cargar:
- Verificar token en localStorage, si no hay → redirigir a index.html
- Fetch GET /api/channels con Bearer token
- Si 401/403 → redirigir a login

Layout (CSS Grid, sin frameworks):
- Panel izquierdo (320px): lista de canales scrolleable
  - Header con logo + username del usuario
  - Barra de filtros por categoría (botones horizontales scrolleables)
  - Lista de canales: cada item tiene número, logo (img con fallback), nombre, badge calidad
  - Scroll automático al canal seleccionado
- Panel derecho: player fullscreen dentro del panel
  - Placeholder cuando no hay canal seleccionado
  - Video con overlay: nombre del canal + calidad (desaparece en 3s)
  - Indicador de carga (spinner CSS)

JavaScript en frontend-tv/js/channels.js:
- Cargar HLS.js desde: https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js
- Al seleccionar canal: fetch GET /api/channels/:id/stream → obtener streamUrl
- Si stream es HLS (.m3u8): usar HLS.js
- Si stream es MP4 u otro: video.src directo
- Si falla stream principal → intentar streamUrlBackup automáticamente
- Mostrar notificaciones recibidas por socket.io como overlay flotante
- Si recibe evento "account:suspended" → mostrar overlay bloqueante y redirigir a login en 5s

JavaScript en frontend-tv/js/remote.js — Control remoto:
- Mantener índice del canal seleccionado actualmente
- ArrowUp / ArrowDown: mover selección en la lista, scroll automático
- ArrowLeft: ir al filtro de categorías
- ArrowRight: ir a la lista de canales
- Enter / OK: reproducir canal seleccionado
- Teclas numéricas 0-9: acumular dígitos por 2 segundos → ir al canal con ese número
- Backspace: si player activo → volver al grid sin detener; si en grid → nada
- MediaPlayPause: toggle play/pause del video

Guardar último canal visto en localStorage, restaurar al cargar.
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BLOQUE 6 — PANEL ADMIN (REACT)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prompt 6.1 — Setup y estructura del admin

```
Inicializa el proyecto frontend-admin con:
- Vite + React + TypeScript: npm create vite@latest frontend-admin -- --template react-ts
- Instalar: tailwindcss, @tailwindcss/vite, lucide-react, react-router-dom, axios, socket.io-client, @tanstack/react-query

Configurar Tailwind con tema personalizado en tailwind.config.js:
- Colores custom: bg-primary (#0a0e1a), bg-secondary (#111827), bg-card (#1a2235), accent-blue (#3b82f6), accent-cyan (#06b6d4), accent-green (#10b981), accent-yellow (#f59e0b), accent-red (#ef4444)
- Fuentes Google: Outfit (headings) + DM Sans (body) — agregar en index.html
- Border radius custom: card (12px)

Estructura de carpetas src/:
- components/ui/ → Button, Input, Badge, Modal, Card, Table, Spinner, Alert
- components/layout/ → Sidebar, Header, Layout
- pages/ → Dashboard, Users, Channels, Packs, Sessions, Notifications, Login
- hooks/ → useAuth, useUsers, useChannels, usePacks, useSessions, useSocket
- lib/ → axios.ts (instancia con interceptors para JWT), queryClient.ts
- context/ → AuthContext
- types/ → index.ts con todos los tipos TypeScript

Configurar React Router con rutas protegidas:
/ → redirige a /dashboard
/login → página de login admin
/dashboard → Dashboard (protegida)
/users → Users (protegida)
/channels → Channels (protegida)
/packs → Packs (protegida)
/sessions → Sessions (protegida)
/notifications → Notifications (protegida)
```

---

### Prompt 6.2 — Componentes UI base y Layout

```
Crea los componentes base del admin en src/components/:

ui/Button.tsx: variantes primary, secondary, danger, ghost. Sizes: sm, md, lg. Con loading spinner. Con icono opcional (Lucide).

ui/Badge.tsx: variantes por estado: active (verde), suspended (rojo), trial (amarillo), expired (gris). Y por tipo info/warning/danger.

ui/Card.tsx: contenedor con bg-card, rounded-card, border sutil, padding. Con opcional header (title + subtitle + action).

ui/Table.tsx: tabla responsive con thead sticky, hover en rows, skeleton loading, empty state.

ui/Modal.tsx: modal con overlay animado, cierre con Escape, tamaños sm/md/lg.

ui/Input.tsx: input estilizado con label, icono prefijo, mensaje de error.

layout/Sidebar.tsx:
- Fijo a la izquierda, 260px
- Logo arriba: ícono TV + "IPTV Admin"
- Navegación con íconos Lucide:
  - LayoutDashboard → Dashboard
  - Users → Usuarios  
  - Tv → Canales
  - Package → Packs
  - Monitor → Sesiones en vivo (con badge contador dinámico)
  - Bell → Notificaciones
- Footer: avatar admin + nombre + botón logout (LogOut icon)
- Indicador activo con accent-blue

layout/Header.tsx:
- Barra superior con título de la página actual
- Hora actual actualizada en tiempo real
- Badge "X online" con usuarios conectados ahora (datos del socket)

layout/Layout.tsx: Sidebar + Header + children con fondo bg-primary
```

---

### Prompt 6.3 — Dashboard

```
Crea src/pages/Dashboard/index.tsx:

Fetch de GET /api/admin/metrics al cargar.

Layout en grid:
- Fila 1: 4 cards de métricas con animación de contador:
  * Usuarios Activos (icono UserCheck, verde)
  * Suspendidos (icono UserX, rojo)  
  * En Trial (icono Gift, amarillo)
  * Sesiones Ahora (icono Monitor, cyan) — actualizado via socket

- Fila 2:
  * Card "Nuevos este mes" (mitad izquierda): número grande + subtítulo "de X totales"
  * Card "Distribución por estado" (mitad derecha): barras visuales de porcentaje con colores semánticos

- Fila 3:
  * Card "Sesiones activas ahora" (tabla): usuario, canal que mira, dispositivo, duración, botón "Cerrar" (icono X)
  * Card "Canales más vistos hoy" (lista): top 5 con logo + nombre + cantidad de vistas

- Fila 4:
  * Card "Actividad reciente" (tabla): usuario, acción, canal, IP, hace X minutos

Actualizar datos de sesiones cada 30 segundos via WebSocket o polling.
Animar los números de las métricas al cargar (count-up de 0 al valor real).
```

---

### Prompt 6.4 — Gestión de Usuarios

```
Crea src/pages/Users/index.tsx (lista) y src/pages/Users/UserDetail.tsx (modal detalle):

LISTA DE USUARIOS:
- Header: título "Usuarios" + botón "Nuevo Usuario" (icono UserPlus)
- Filtros: input búsqueda, select estado (Todos/Activo/Suspendido/Trial/Vencido), select "Vence en" (7/15/30 días)
- Tabla con columnas:
  * Usuario (avatar con inicial + username + fullName)
  * Estado (Badge)
  * Packs (badges de colores de cada pack)
  * Sesiones activas (X/maxDevices con ícono Monitor)
  * Vencimiento (fecha + si vence pronto badge rojo)
  * Acciones (iconos: Edit, Eye, más menú desplegable)
- Paginación

MODAL CREAR/EDITAR USUARIO:
- Campos: Username*, Nombre completo, Email, Password (con toggle mostrar/ocultar), Max dispositivos (select 1-5), Estado, Fecha vencimiento (date picker simple), PIN adultos
- Sección "Packs asignados": checkboxes de packs disponibles

MODAL DETALLE USUARIO (al click en Eye):
- Info completa del usuario
- Tab "Sesiones": tabla de sesiones activas con: dispositivo, IP, canal viendo, última actividad, botón "Cerrar sesión" (icono X)
- Tab "Packs": packs asignados con botón quitar, y botón agregar
- Tab "Actividad": últimas 20 actividades del usuario
- Botones de acción: Suspender/Activar, Enviar notificación

Manejar todos los estados: loading, error, empty. Confirmación en acciones destructivas.
```

---

### Prompt 6.5 — Gestión de Canales

```
Crea src/pages/Channels/index.tsx:

- Header: "Canales" + botón "Nuevo Canal" (icono Plus) + botón "Reordenar" (icono GripVertical)
- Filtros: búsqueda, categoría, calidad, mostrar adultos (toggle)
- Tabla con columnas:
  * # (número de canal)
  * Logo (img 40x40 con fallback a ícono Tv)
  * Nombre
  * Categoría (badge)
  * Calidad (badge SD/HD/FHD con colores)
  * Adulto (icono Lock si isAdult)
  * Estado (toggle switch activo/inactivo)
  * Acciones: Edit, Trash, Play (probar stream)

MODAL CREAR/EDITAR CANAL:
- Número de canal (input numérico)
- Nombre*
- URL Logo (input + preview de imagen)
- Categoría (input o select de categorías existentes)
- URL Stream principal* 
- URL Stream backup
- Calidad (select SD/HD/FHD)
- Es contenido adulto (toggle)
- Estado activo (toggle)

BOTÓN "PROBAR STREAM":
- Abrir modal pequeño con un video player que intente cargar el stream
- Mostrar si funciona o error

MODO REORDENAR:
- Al activar, las filas tienen ícono drag handle
- Drag and drop para reordenar
- Botón "Guardar orden" que hace PATCH /api/admin/channels/reorder
```

---

### Prompt 6.6 — Sesiones en Vivo y Notificaciones

```
Crea src/pages/Sessions/index.tsx — Sesiones en tiempo real:

- Header: "Sesiones en Vivo" + badge con total online + botón refresh
- Conexión WebSocket al namespace /admin-socket
- Tabla actualizada en tiempo real:
  * Usuario (avatar + nombre)
  * Canal que mira (logo + nombre o "En menú")
  * Dispositivo (icono según deviceType: Tv, Monitor, Smartphone)
  * IP
  * Duración (contador en vivo: "1h 23m")
  * Acción: botón "Cerrar" (icono LogOut) con confirmación
- Si no hay sesiones: empty state con icono Monitor y texto "No hay usuarios conectados"
- Actualizar cada 30 segundos (socket event o polling)

---

Crea src/pages/Notifications/index.tsx:

- Header: "Notificaciones" + botón "Enviar Notificación"
- MODAL ENVIAR NOTIFICACIÓN:
  * Destinatario: radio "Todos los usuarios" o "Usuario específico" (con buscador)
  * Tipo: INFO (azul) / WARNING (amarillo) / DANGER (rojo) — con preview del color
  * Título*
  * Mensaje* (textarea)
  * Botón enviar
- HISTORIAL: tabla de notificaciones enviadas con: destinatario, tipo (badge), título, fecha, estado (entregada/pendiente)

Usuarios que están online cuando se envía la notificación la reciben instantáneamente via socket.
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BLOQUE 7 — INTEGRACIÓN FINAL Y DEPLOY
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prompt 7.1 — CORS, variables y proxy Nginx

```
Configura la integración completa del proyecto:

1. Backend src/config/cors.ts:
- En desarrollo: permitir localhost:3000 (TV), localhost:3002 (admin)
- En producción: leer ALLOWED_ORIGINS del .env
- Configurar credentials: true para cookies

2. Crear nginx.conf para producción:
- Puerto 80 → HTTP (con redirect a HTTPS comentado para cuando tengas SSL)
- /         → servir frontend-tv/dist/
- /admin    → servir frontend-admin/dist/
- /api      → proxy_pass a localhost:3001 (backend)
- /socket.io → proxy_pass con upgrade para WebSockets
- Gzip habilitado para JS/CSS
- Cache headers para assets estáticos (logos, etc.)

3. Crear ecosystem.config.js para PM2:
- App "iptv-backend": cd backend && npm start
- watch: false en producción
- env_production con NODE_ENV=production

4. Crear scripts/deploy.sh:
- git pull
- cd backend && npm install && npx prisma migrate deploy && npm run build
- cd frontend-admin && npm install && npm run build → copiar dist/ a /var/www/iptv-admin/
- cd frontend-tv → copiar archivos a /var/www/iptv-tv/
- pm2 restart iptv-backend

5. README.md con instrucciones completas de instalación local y en servidor.
```

---

### Prompt 7.2 — Testing y ajustes finales

```
Realiza los siguientes ajustes de calidad al proyecto completo:

1. En el backend, agregar manejo global de errores en app.ts:
- Middleware de error catch-all que retorne JSON siempre (nunca HTML)
- Log de errores con timestamp
- En producción no exponer stack traces

2. En frontend TV (app.html):
- Si el fetch de canales retorna 401 → redirigir a login limpiando localStorage
- Si el stream falla 3 veces → mostrar mensaje "Stream no disponible. Probando backup..."
- Al iniciar, hacer fetch de notificaciones no leídas y mostrarlas una por una con 5s de delay

3. En frontend admin:
- Interceptor de axios: si respuesta 401 → limpiar token y redirigir a /login
- Interceptor de axios: si respuesta 403 → mostrar toast "Sin permiso"
- Agregar react-hot-toast para notificaciones/toasts del admin

4. Crear src/components/ui/ConfirmDialog.tsx en el admin:
- Dialog reutilizable para confirmar acciones destructivas
- Props: title, message, onConfirm, onCancel, variant (danger/warning)

5. Asegurarse de que todos los formularios tengan validación del lado cliente antes de hacer fetch.

6. En el backend, endpoint GET /api/admin/channels/categories:
- Retornar lista de categorías únicas existentes (para el select del form de canales)
```

---

> ✅ Con estos 7 bloques tenés el sistema completo.
> Empezar siempre por el Bloque 1 y avanzar en orden.
> Cada prompt puede ejecutarse en OpenCode como una tarea completa.
> Ante dudas sobre el diseño visual, referir al archivo IPTV_PLAN_DESARROLLO.md sección "Diseño UI/UX".
