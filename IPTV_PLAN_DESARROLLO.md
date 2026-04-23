# 📺 IPTV SaaS — Plan de Desarrollo Completo

> Sistema IPTV web para ISP local. Clientes acceden desde Smart TV / navegador.
> Panel admin para gestión de usuarios, canales, packs y facturación.

---

## 🏗️ Arquitectura General

```
iptv-saas/
├── backend/                  # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/           # DB, env, cors
│   │   ├── middlewares/      # auth, roles, rateLimit
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── channels/
│   │   │   ├── packs/
│   │   │   ├── sessions/
│   │   │   └── notifications/
│   │   ├── utils/
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── frontend-admin/           # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Users/
│   │   │   ├── Channels/
│   │   │   ├── Packs/
│   │   │   └── Sessions/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── main.tsx
│   └── package.json
│
├── frontend-tv/              # HTML + Vanilla JS (máxima compatibilidad TV)
│   ├── index.html            # Login
│   ├── app.html              # Lista de canales + player
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── auth.js
│       ├── channels.js
│       ├── player.js
│       └── remote.js         # Mapeo de teclas del control remoto
│
└── docker-compose.yml        # PostgreSQL + backend + frontends
```

---

## 🗄️ Base de Datos — PostgreSQL (Prisma ORM)

### Tablas principales

```sql
-- Usuarios clientes
users (
  id, username, email, password_hash,
  status ENUM(active, suspended, trial, expired),
  expires_at, max_devices, created_at
)

-- Sesiones activas (control multi-dispositivo)
sessions (
  id, user_id, device_name, device_type,
  ip_address, token, last_seen, created_at
)

-- Canales
channels (
  id, name, logo_url, stream_url, stream_url_backup,
  category, is_adult, quality ENUM(SD,HD,FHD),
  is_active, sort_order, created_at
)

-- Packs de canales
packs (
  id, name, description, color, icon,
  is_active, created_at
)

-- Relación pack <-> canales
pack_channels (pack_id, channel_id)

-- Packs asignados a usuarios
user_packs (user_id, pack_id, assigned_at)

-- Notificaciones
notifications (
  id, user_id, title, message,
  type ENUM(info, warning, danger),
  read, created_at
)

-- Log de actividad
activity_logs (
  id, user_id, channel_id,
  action, ip_address, created_at
)

-- Admin users
admin_users (
  id, username, password_hash, role, created_at
)
```

---

## 📦 Stack Tecnológico

| Capa              | Tecnología                        |
|-------------------|-----------------------------------|
| Backend           | Node.js + Express + TypeScript    |
| ORM               | Prisma                            |
| Base de datos     | PostgreSQL                        |
| Autenticación     | JWT (access + refresh tokens)     |
| Sesiones          | HttpOnly cookies + DB sessions    |
| Frontend Admin    | React + Vite + TypeScript         |
| UI Admin          | Tailwind CSS + Lucide Icons       |
| Frontend TV       | HTML/CSS/JS vanilla               |
| Video Player      | HLS.js + Video.js                 |
| Notificaciones    | WebSockets (socket.io)            |
| Variables de env  | dotenv                            |
| Testing API       | Thunder Client / Postman          |
| Deploy local      | PM2 + Nginx                       |

---

## 🔐 Sistema de Autenticación

### Flujo TV/Web cliente:
1. Usuario entra a `http://tudominio.com`
2. Si no tiene sesión → redirige a `/login`
3. Ingresa `usuario` y `contraseña`
4. Backend valida credenciales y estado del usuario
5. Si suspendido/vencido → muestra mensaje bloqueante
6. Si OK → genera JWT + crea registro en `sessions`
7. Token guardado en `localStorage` (TV) o cookie HttpOnly
8. Redirige a `/app` — lista de canales
9. Si borra cookies → vuelve al login

### Control de sesiones simultáneas:
- Cada login registra: IP, user-agent, device_name, timestamp
- Al superar `max_devices` → se rechaza con mensaje
- Admin puede ver y cerrar sesiones desde el panel

---

## 📺 Frontend TV — Experiencia de Usuario

### Login (`/`)
- Fondo oscuro con logo del ISP
- Campos usuario y contraseña
- Navegación con Tab + Enter desde control
- Mensaje de error visible (suspendido, vencido, mal password)

### App de canales (`/app`)
- Grid de canales con logo + nombre + badge calidad
- Filtros por categoría (botones navegables)
- Canales +18 ocultos por defecto (requieren PIN o pack activado)
- Última posición guardada en localStorage
- **Teclas del control remoto:**
  - ↑ ↓ ← → para navegar entre canales
  - **Enter/OK** para reproducir
  - **Números 0-9** para ir directo al canal por número
  - **Backspace** para volver al grid desde el player
  - **MediaPlayPause** para pausar

### Player
- Fullscreen automático al reproducir
- Overlay con nombre del canal (desaparece en 3s)
- Indicador de carga
- Fallback automático a URL backup si falla el stream principal
- Soporte HLS (.m3u8) y streams directos MP4/RTMP via proxy

---

## 🛠️ Panel Admin — Páginas

### 1. Dashboard / Métricas
- Total usuarios activos / suspendidos / trial / vencidos
- Usuarios conectados AHORA (WebSocket)
- Qué canal está viendo cada uno (en vivo)
- Nuevos usuarios este mes
- Distribución por estado (barra visual)
- Packs más usados

### 2. Gestión de Usuarios
- Tabla paginada con: nombre, estado, dispositivos activos, vencimiento, packs
- Crear usuario (username, password, max_devices, fecha vencimiento)
- Editar usuario
- Suspender / Activar / Eliminar
- Ver sesiones activas del usuario (IP, dispositivo, última vez)
- Cerrar sesión específica o todas
- Asignar/quitar packs
- Enviar notificación manual

### 3. Gestión de Canales
- Tabla con: logo, nombre, categoría, calidad, estado
- Crear canal (nombre, logo, URL stream, URL backup, categoría, es adulto, calidad)
- Reordenar con drag & drop
- Activar / Desactivar canal
- Test de stream desde el panel

### 4. Gestión de Packs
- Crear pack (nombre, descripción, color, ícono Lucide)
- Asignar canales al pack (multi-select)
- Ver cuántos usuarios tienen cada pack
- Activar / Desactivar pack

### 5. Sesiones Activas
- Tabla en tiempo real: usuario, canal que mira, IP, dispositivo, duración
- Botón para cerrar sesión forzada
- Filtro por usuario

### 6. Notificaciones
- Enviar alerta a usuario específico o a todos
- Tipos: info (azul), warning (amarillo), danger (rojo)
- Programar alerta de vencimiento X días antes automáticamente
- Historial de notificaciones enviadas

---

## 🔄 Fases de Desarrollo

### Fase 1 — Base y autenticación (Semana 1)
- [ ] Setup proyecto (backend + DB + migraciones Prisma)
- [ ] Endpoints: register, login, logout, refresh token
- [ ] Middleware de autenticación y roles
- [ ] Control de sesiones simultáneas
- [ ] Frontend TV: Login funcional conectado al backend

### Fase 2 — Canales y Player TV (Semana 1-2)
- [ ] CRUD canales en backend
- [ ] Endpoint lista canales por usuario (según packs asignados)
- [ ] Frontend TV: Grid de canales + navegación con control remoto
- [ ] Frontend TV: Player HLS fullscreen con fallback
- [ ] Manejo de canales adultos (ocultamiento)

### Fase 3 — Panel Admin base (Semana 2)
- [ ] Setup React Admin + Tailwind + Lucide
- [ ] Autenticación admin (login separado)
- [ ] Dashboard con métricas estáticas
- [ ] CRUD usuarios completo
- [ ] CRUD canales con test de stream
- [ ] CRUD packs + asignación de canales

### Fase 4 — Control y tiempo real (Semana 3)
- [ ] WebSockets: sesiones activas en tiempo real
- [ ] Ver qué canal mira cada usuario
- [ ] Cerrar sesión forzada desde admin
- [ ] Sistema de notificaciones (envío + recepción en TV)
- [ ] Alertas automáticas de vencimiento (cron job)

### Fase 5 — Pulido y deploy (Semana 3-4)
- [ ] EPG básico (descripción de canales)
- [ ] Favoritos por usuario
- [ ] Log de actividad completo
- [ ] Deploy en servidor con Nginx + PM2
- [ ] HTTPS con Let's Encrypt
- [ ] Documentación de uso

---

## 🌐 API REST — Endpoints

### Auth
```
POST   /api/auth/login          → login cliente TV
POST   /api/auth/logout         → logout + elimina sesión
POST   /api/auth/refresh        → refresh token
POST   /api/admin/login         → login admin
```

### Usuarios (admin)
```
GET    /api/admin/users         → listar usuarios (paginado)
POST   /api/admin/users         → crear usuario
PUT    /api/admin/users/:id     → editar usuario
PATCH  /api/admin/users/:id/status  → suspender/activar
DELETE /api/admin/users/:id     → eliminar usuario
GET    /api/admin/users/:id/sessions → sesiones del usuario
DELETE /api/admin/users/:id/sessions/:sid → cerrar sesión
```

### Canales
```
GET    /api/channels            → canales del usuario autenticado
GET    /api/admin/channels      → todos los canales (admin)
POST   /api/admin/channels      → crear canal
PUT    /api/admin/channels/:id  → editar canal
DELETE /api/admin/channels/:id  → eliminar canal
PATCH  /api/admin/channels/reorder → reordenar
```

### Packs
```
GET    /api/admin/packs         → listar packs
POST   /api/admin/packs         → crear pack
PUT    /api/admin/packs/:id     → editar pack
POST   /api/admin/users/:id/packs → asignar pack
DELETE /api/admin/users/:id/packs/:packId → quitar pack
```

### Sesiones y métricas
```
GET    /api/admin/sessions/live → sesiones activas ahora
DELETE /api/admin/sessions/:id  → cerrar sesión forzada
GET    /api/admin/metrics       → métricas del dashboard
```

### Notificaciones
```
POST   /api/admin/notifications → enviar notificación
GET    /api/notifications       → ver notificaciones del usuario
PATCH  /api/notifications/:id/read → marcar como leída
```

---

## 🎨 Diseño UI/UX

### Paleta de colores (Admin)
```css
--bg-primary:     #0a0e1a;   /* fondo principal */
--bg-secondary:   #111827;   /* cards */
--bg-card:        #1a2235;   /* glassmorphism */
--accent-blue:    #3b82f6;   /* primario */
--accent-cyan:    #06b6d4;   /* secundario */
--accent-green:   #10b981;   /* éxito */
--accent-yellow:  #f59e0b;   /* advertencia */
--accent-red:     #ef4444;   /* peligro / suspendido */
--text-primary:   #f1f5f9;
--text-secondary: #94a3b8;
--border:         #1e3a5f33;
```

### Paleta TV (cliente)
```css
/* Más oscuro aún, optimizado para pantallas grandes */
--tv-bg:         #060912;
--tv-card:       #0f1623;
--tv-selected:   #3b82f6;   /* canal seleccionado */
--tv-text:       #e2e8f0;
```

### Tipografía Admin
- Display: `Outfit` (Google Fonts) — headings y números grandes
- Body: `DM Sans` — textos y UI

### Componentes clave
- Cards con `backdrop-filter: blur` + borde sutil
- Badges de estado con colores semánticos
- Animaciones suaves en hover (transform + shadow)
- Tablas con hover highlight
- Modales con overlay animado

---

## ⚙️ Configuración Local (Desarrollo)

### Requisitos
- Node.js 20+
- PostgreSQL 15+
- npm o pnpm

### Variables de entorno backend (`.env`)
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/iptv_db"
JWT_SECRET="tu_secret_muy_largo_aqui"
JWT_REFRESH_SECRET="otro_secret_para_refresh"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3001
ADMIN_INITIAL_PASSWORD="admin123"
MAX_SESSIONS_DEFAULT=2
```

### Levantar en local
```bash
# 1. Base de datos
createdb iptv_db

# 2. Backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev   # puerto 3001

# 3. Admin
cd frontend-admin
npm install
npm run dev   # puerto 3002

# 4. TV frontend (solo abrir en navegador o servir con live-server)
cd frontend-tv
npx live-server --port=3000
```

---

## 🚀 Deploy en Servidor

```bash
# Nginx config
server {
    listen 80;
    server_name tudominio.com;

    # Frontend TV (lo que ven los clientes)
    location / {
        root /var/www/iptv-tv;
        try_files $uri $uri/ /index.html;
    }

    # Panel admin
    location /admin {
        root /var/www/iptv-admin;
        try_files $uri $uri/ /admin/index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## 📋 Notas Importantes

1. **Seguridad de streams**: nunca exponer la URL real del stream al cliente. Usar un endpoint proxy `/api/stream/:channelId` que valide el token y redirija al servidor real.

2. **Canales +18**: el campo `is_adult` oculta el canal en el grid a menos que el usuario tenga el pack adultos asignado. El backend también lo filtra.

3. **Compatibilidad Smart TV**: el frontend TV usa HTML/JS vanilla sin frameworks para máxima compatibilidad. Evitar flexbox complicado en TVs viejos — usar grid simple.

4. **Tokens en TV**: como las cookies HttpOnly son complicadas en algunos navegadores de TV, usar `localStorage` para el JWT en el frontend TV es aceptable. El refresh token sí va en cookie.

5. **Futuro APK Android**: el frontend TV puede empaquetarse como WebView en Android con mínimas modificaciones. El backend es el mismo.
