# 🔄 UPDATE 1 — Prompts para OpenCode
# TV Experience + Monitor de Canales
# Ejecutar en orden. Cada prompt asume que el anterior fue completado.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 1.1 — Schema: Código de emparejamiento
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
En backend/prisma/schema.prisma agregar este modelo nuevo:

model PairingCode {
  id        String   @id @default(uuid())
  code      String   @unique  // ej: "264-716"
  userId    String?           // null hasta que admin apruebe
  user      User?    @relation(fields: [userId], references: [id])
  status    PairingStatus @default(PENDING)
  ipAddress String?
  expiresAt DateTime
  approvedAt DateTime?
  createdAt DateTime @default(now())
}

enum PairingStatus {
  PENDING   // esperando que admin apruebe
  APPROVED  // admin aprobó, TV puede hacer login
  EXPIRED   // pasaron 10 minutos
  USED      // ya se usó para hacer login
}

También agregar en modelo User:
  pairingCodes PairingCode[]

Ejecutar: npx prisma migrate dev --name add_pairing_code
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 1.2 — Backend: Endpoints de emparejamiento
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Crear src/modules/auth/pairing.controller.ts y pairing.routes.ts con estos endpoints:

1. POST /api/auth/pairing/generate
   - NO requiere autenticación (es la primera pantalla del TV)
   - Genera código aleatorio formato "XXX-XXX" (3 números guión 3 números)
   - Verificar que el código no exista ya en DB
   - Crear registro PairingCode con:
     status: PENDING
     expiresAt: now + 10 minutos
     ipAddress: req.ip
   - Retornar: { code: "264-716", expiresAt, expiresInSeconds: 600 }

2. GET /api/auth/pairing/status/:code
   - NO requiere autenticación (el TV hace polling)
   - Buscar el código en DB
   - Si no existe → 404
   - Si EXPIRED o expiresAt < now → { status: "EXPIRED" }
   - Si PENDING → { status: "PENDING" }
   - Si APPROVED → 
     * Marcar como USED
     * Generar accessToken y refreshToken para el usuario asignado
     * Crear sesión en tabla sessions (deviceType: TV)
     * Retornar { status: "APPROVED", accessToken, refreshToken, user: { username, fullName } }

3. POST /api/admin/pairing/approve (requiere authenticateAdmin)
   - Body: { code: "264-716", userId: "uuid-del-usuario" }
   - Buscar código en DB
   - Si no existe → 404 "Código no encontrado"
   - Si EXPIRED → 400 "El código expiró. El cliente debe generar uno nuevo."
   - Si no está PENDING → 400 "Código ya usado o inválido"
   - Actualizar: status APPROVED, userId, approvedAt: now
   - Retornar: { success: true, message: "TV autorizado. El cliente ya puede ver." }

4. GET /api/admin/pairing/pending (requiere authenticateAdmin)
   - Retornar todos los códigos con status PENDING y no expirados
   - Incluir: code, ipAddress, createdAt, expiresAt, tiempoRestante en segundos

Agregar cron job en utils/cronJobs.ts:
   - Cada 5 minutos → marcar como EXPIRED todos los PairingCode 
     donde status = PENDING y expiresAt < now

Registrar rutas en app.ts
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 1.3 — Frontend TV: Pantalla de emparejamiento
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Modificar frontend-tv/index.html y js/auth.js para agregar el sistema de emparejamiento:

En index.html, el login ahora tiene 3 tabs:
  [Usuario y clave]  [Código de acceso]  [Emparejar TV]

Tab "Emparejar TV":
- Al seleccionar este tab → llamar automáticamente a POST /api/auth/pairing/generate
- Mostrar el código en pantalla de forma muy visible:
  * Código en Outfit 72px bold, centrado, color blanco
  * Formato con guión: "264-716"
  * Subtexto: "Pasale este código al administrador"
  * Debajo: contador regresivo "Expira en 9:43" (cuenta regresiva en MM:SS)
  * Cuando llega a 0:00 → mostrar botón "Generar nuevo código" y texto "Código expirado"

Polling en auth.js:
  - Cada 3 segundos hacer GET /api/auth/pairing/status/:code
  - Si status === "PENDING" → seguir esperando (no hacer nada)
  - Si status === "EXPIRED" → mostrar mensaje + botón regenerar
  - Si status === "APPROVED" →
    * Guardar accessToken, refreshToken, user en localStorage
    * Mostrar brevemente "✓ Autorizado" en verde
    * Redirigir a canales.html después de 1 segundo
  - Detener polling cuando el tab cambie o la página se cierre

Estilos del tab Emparejar TV:
- Fondo del card igual que los otros tabs
- El código en un rectángulo oscuro con borde sutil: 
  background: rgba(0,0,0,0.3), border: 1px solid rgba(255,255,255,0.1)
  border-radius: 16px, padding: 24px 40px
- Puntos animados "Esperando aprobación..." debajo del contador
- El contador cambia a rojo cuando quedan menos de 2 minutos

Compatibilidad TV:
- El tab se puede seleccionar con flechas del control remoto
- El código es solo para mostrar, no hay input que el usuario deba tocar
- Navegación: Tab seleccionado con Enter, flechas izquierda/derecha entre tabs
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 1.4 — Panel Admin: Aprobar emparejamiento
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
En el panel admin (frontend-admin), agregar la funcionalidad de aprobar códigos de emparejamiento:

1. En src/pages/Users/index.tsx o en un modal accesible desde el Dashboard:
   Agregar botón "Emparejar TV" (ícono lucide <Tv> + "Emparejar TV") 
   en el header junto a "Nuevo Usuario"

2. Modal "Emparejar TV":
   - Input: "Código del cliente" — input grande, placeholder "264-716"
     * Formato automático: solo números y guión
     * Convertir a mayúsculas
   - Select: "Asignar a usuario" — buscador de usuarios (search con debounce)
     * Mostrar: avatar + username + fullName + estado
     * Solo mostrar usuarios con estado ACTIVE o TRIAL
   - Botón "Autorizar TV" → llama POST /api/admin/pairing/approve
   - Si éxito → mostrar "✓ TV autorizado. El cliente ya puede ver." en verde
   - Si error → mostrar mensaje del backend (expirado, inválido, etc.)

3. Widget en Dashboard "Códigos pendientes":
   - Card pequeña que muestra si hay códigos pendientes de aprobar
   - Fetch a GET /api/admin/pairing/pending cada 30 segundos
   - Si hay pendientes: badge amarillo con cantidad + botón "Ver y aprobar"
   - Si no hay: texto "Sin solicitudes pendientes"
   - Al hacer click → abre el modal de emparejamiento

4. En la tabla de usuarios, columna "Sesiones":
   - Agregar indicador si el usuario tiene un código de emparejamiento PENDING activo
   - Ícono de TV parpadeando en amarillo
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 1.5 — Schema: Monitor de canales
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
En backend/prisma/schema.prisma agregar estos modelos:

model ChannelCheck {
  id          String   @id @default(uuid())
  channelId   String
  channel     Channel  @relation(fields: [channelId], references: [id])
  status      CheckStatus
  responseCode Int?       // HTTP status code
  responseTimeMs Int?     // tiempo de respuesta en ms
  errorMessage String?
  checkedAt   DateTime @default(now())
}

model ChannelIncident {
  id          String    @id @default(uuid())
  channelId   String
  channel     Channel   @relation(fields: [channelId], references: [id])
  startedAt   DateTime  @default(now())
  resolvedAt  DateTime?
  duration    Int?      // minutos caído (calculado al resolver)
  failCount   Int       @default(0)
  notified    Boolean   @default(false)
}

model MonitorConfig {
  id              String  @id @default(uuid())
  intervalMinutes Int     @default(5)
  failThreshold   Int     @default(3)
  emailAlerts     String[] // array de emails
  telegramToken   String?
  telegramChatId  String?
  updatedAt       DateTime @updatedAt
}

enum CheckStatus {
  UP
  DOWN
  TIMEOUT
}

Agregar en modelo Channel:
  checks     ChannelCheck[]
  incidents  ChannelIncident[]
  failCount  Int     @default(0)  // contador de fallos consecutivos actuales
  lastCheck  DateTime?
  isDown     Boolean @default(false)

Ejecutar: npx prisma migrate dev --name add_channel_monitor
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 1.6 — Backend: Servicio de monitoreo
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Crear src/modules/monitor/monitor.service.ts con la lógica completa de monitoreo:

Instalar: npm install nodemailer @types/nodemailer node-fetch

1. Función checkChannel(channel):
   - Hacer fetch a channel.streamUrl con timeout de 10 segundos
   - Si es .m3u8: verificar que responda 200 y el body contenga "#EXTM3U"
   - Si es otro: verificar que responda 200
   - Registrar resultado en ChannelCheck
   - Retornar { isUp: boolean, responseCode, responseTimeMs, error? }

2. Función runMonitorCycle():
   - Obtener MonitorConfig de DB (o defaults si no existe)
   - Obtener TODOS los canales activos
   - Verificar UNO POR UNO (no en paralelo, con delay de 500ms entre cada uno)
   - Para cada canal:
     * Llamar checkChannel()
     * Si DOWN:
       - Incrementar channel.failCount
       - Si failCount >= config.failThreshold (default 3):
         · Si channel.isDown === false (primera vez que cae):
           - Marcar channel.isDown = true
           - Marcar channel.isActive = false (ocultar del frontend TV)
           - Crear ChannelIncident
           - Llamar notifyChannelDown(channel)
     * Si UP:
       - Si channel.isDown === true (se estaba cayendo):
         · Marcar channel.isDown = false
         · Marcar channel.isActive = true (vuelve a aparecer en TV)
         · Resolver ChannelIncident (resolvedAt, duration)
         · Llamar notifyChannelUp(channel)
       - Resetear channel.failCount = 0
     * Actualizar channel.lastCheck = now()

3. Función notifyChannelDown(channel):
   - Email via Gmail SMTP a todos los emails de MonitorConfig.emailAlerts:
     Asunto: "⚠️ Canal caído: [nombre del canal]"
     Cuerpo HTML:
     - Nombre del canal
     - Hora de la caída
     - Cantidad de intentos fallidos
     - URL del stream que falló
     - Link al panel: http://[IP_SERVIDOR]/admin/monitor
   - Telegram si está configurado:
     Mensaje: "🔴 Canal caído: [nombre]\n⏰ [hora]\n🔗 [URL]"

4. Función notifyChannelUp(channel):
   - Email: "✅ Canal recuperado: [nombre del canal]"
     - Tiempo que estuvo caído
   - Telegram: "🟢 Canal recuperado: [nombre]\n⏱️ Caído por: [duración]"

5. Configurar Gmail SMTP en .env:
   GMAIL_USER="tu@gmail.com"
   GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"   ← contraseña de app de Google
   
   Crear la conexión nodemailer:
   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
   })

6. En utils/cronJobs.ts agregar:
   - Leer intervalMinutes de MonitorConfig (o 5 por defecto)
   - Ejecutar runMonitorCycle() según ese intervalo
   - Al arrancar el servidor: ejecutar un primer ciclo después de 30 segundos

Crear src/modules/monitor/monitor.routes.ts:
   GET  /api/admin/monitor/status     → estado actual de todos los canales
   GET  /api/admin/monitor/incidents  → historial de incidentes (paginado)
   GET  /api/admin/monitor/config     → configuración actual
   PUT  /api/admin/monitor/config     → actualizar configuración
   POST /api/admin/monitor/check-now  → forzar verificación inmediata

Registrar rutas en app.ts
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 1.7 — Panel Admin: Página Monitor
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Crear src/pages/Monitor/index.tsx en el panel admin:

HEADER de la página:
- Título "Monitor de Canales" con ícono lucide <Activity>
- Subtítulo: "Último chequeo: hace X minutos"
- Botón "Verificar ahora" (ícono lucide <RefreshCw>) → POST /api/admin/monitor/check-now
  Mientras verifica: botón deshabilitado + spinner + texto "Verificando 200 canales..."
- Badge con total caídos en rojo si hay alguno

FILA 1 — 4 metric cards:
1. ✅ Canales activos (verde) — cantidad
2. 🔴 Canales caídos (rojo) — cantidad, si > 0 parpadea suavemente
3. ⚡ Tiempo promedio respuesta (cyan) — en ms
4. 📊 Uptime general (azul) — porcentaje últimas 24hs

FILA 2 — Tabla de canales con estado:
Columnas: # | Canal | Estado | Última respuesta | Tiempo respuesta | Fallos | Última verificación | Acción

- Estado: badge verde "En línea" / rojo "Caído" / amarillo "Inestable" (1-2 fallos)
- Si caído: mostrar hace cuánto cayó "Caído hace 23 min"
- Acción: botón "Verificar" individual (ícono <RefreshCw> pequeño)
- Filtros arriba: Todos / En línea / Caídos / Inestables
- Buscador por nombre de canal
- Ordenar por: estado (caídos primero por defecto) / nombre / tiempo respuesta

FILA 3 — Historial de incidentes:
- Tabla: Canal | Inicio | Fin | Duración | Estado
- Estado: "Resuelto" (verde) / "En curso" (rojo pulsante)
- Paginación: 20 por página
- Filtro por fecha

PANEL LATERAL — Configuración:
Card colapsable a la derecha:
- Intervalo de chequeo: select (5 min / 10 min / 15 min / 30 min)
- Umbral de fallos: input número (default 3)
- Emails de alerta: hasta 3 inputs de email con botón + para agregar
- Token Telegram: input password
- Chat ID Telegram: input
- Botón "Guardar configuración"
- Botón "Probar email" → envía email de prueba
- Botón "Probar Telegram" → envía mensaje de prueba

En el Sidebar de navegación:
- Agregar "Monitor" en sección MONITOREO con ícono lucide <Activity>
- Si hay canales caídos: badge rojo con cantidad
- Actualizar badge cada 60 segundos via polling

En el Dashboard principal:
- Widget "Estado de canales" con botón "Ver monitor completo →"
- Muestra: X canales activos, Y caídos
- Barra visual de porcentaje de uptime
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 1.8 — Layout inteligente + Control remoto universal
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Reescribir frontend-tv/js/remote.js y actualizar frontend-tv/css/styles.css 
para el layout inteligente y control remoto universal:

━━━━ DETECCIÓN DE DISPOSITIVO ━━━━

Al cargar, detectar el contexto automáticamente:

const DeviceType = {
  detect() {
    const ua = navigator.userAgent
    const w = window.innerWidth
    if (/SmartTV|Tizen|webOS|SMART-TV|HbbTV/i.test(ua)) return 'SMART_TV'
    if (/Android.*TV|TV Box|AFT/i.test(ua)) return 'TV_BOX'
    if (w >= 1280 && !('ontouchstart' in window)) return 'PC_TV'
    if (/iPhone|iPad/i.test(ua)) return 'IOS'
    if (/Android/i.test(ua) && w < 900) return 'ANDROID_MOBILE'
    return 'PC'
  }
}
const DEVICE = DeviceType.detect()
document.body.dataset.device = DEVICE  // para CSS

━━━━ MODO CINE (sin fullscreen API) ━━━━

Agregar en styles.css:
.cinema-mode .sidebar {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}
.cinema-mode .main-content {
  width: 100vw;
}
.cinema-mode-overlay .sidebar {
  transform: translateX(0);
  position: fixed; left: 0; top: 0;
  height: 100vh; z-index: 100;
  box-shadow: 4px 0 20px rgba(0,0,0,0.8);
}
.cinema-overlay-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
  display: none;
}
.cinema-mode .cinema-overlay-bg { display: none; }
.cinema-mode-overlay .cinema-overlay-bg { display: block; }

Funciones JS:
function enterCinemaMode() {
  document.body.classList.add('cinema-mode')
  document.body.classList.remove('cinema-mode-overlay')
  window.scrollTo(0, 1)  // oculta URL bar en móvil/TV
}
function exitCinemaMode() {
  document.body.classList.remove('cinema-mode', 'cinema-mode-overlay')
}
function showSidebarOverlay() {
  if (!document.body.classList.contains('cinema-mode')) return
  document.body.classList.add('cinema-mode-overlay')
  // Auto-ocultar después de 5s sin actividad
  clearTimeout(sidebarOverlayTimeout)
  sidebarOverlayTimeout = setTimeout(hideSidebarOverlay, 5000)
}
function hideSidebarOverlay() {
  document.body.classList.remove('cinema-mode-overlay')
}

━━━━ MAPEO DE TECLAS — TODOS LOS FABRICANTES ━━━━

const KEY_MAP = {
  // Enter / OK — universal
  13: 'enter',
  // Flechas — universal  
  37: 'left', 38: 'up', 39: 'right', 40: 'down',
  // Volver / Back
  8: 'back',    // Backspace — Chrome, TV Box
  27: 'back',   // Escape — PC, Hisense
  10009: 'back', // Samsung Tizen
  461: 'back',   // LG webOS, Philips
  196: 'back',   // Android TV nativo
  4: 'back',     // Android genérico
  // Play / Pause
  179: 'playpause', // Media key estándar
  80: 'playpause',  // P — PC
  32: 'playpause',  // Espacio — PC
  415: 'play',
  19: 'pause',
  413: 'stop',
  10252: 'playpause', // Samsung extra
  // Números teclado normal
  48:'0',49:'1',50:'2',51:'3',52:'4',
  53:'5',54:'6',55:'7',56:'8',57:'9',
  // Números numpad TV
  96:'0',97:'1',98:'2',99:'3',100:'4',
  101:'5',102:'6',103:'7',104:'8',105:'9',
  // Colores (para features futuras)
  403: 'red', 404: 'green', 405: 'yellow', 406: 'blue',
  // Info / EPG
  457: 'info',   // LG
  10232: 'info', // Samsung
}

━━━━ HANDLER PRINCIPAL ━━━━

Usar capture phase para nunca perder el foco:
document.addEventListener('keydown', handleKeyDown, true)

// Evitar que el video tome el foco
const video = document.getElementById('videoPlayer')
video.addEventListener('focus', () => document.body.focus(), true)

// Restaurar foco en cualquier cambio de estado
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) document.body.focus()
})

function handleKeyDown(e) {
  const action = KEY_MAP[e.keyCode] || KEY_MAP[e.which]
  if (!action) return
  e.preventDefault()
  e.stopPropagation()

  const inCinema = document.body.classList.contains('cinema-mode')
  const overlayVisible = document.body.classList.contains('cinema-mode-overlay')

  switch(action) {
    case 'up':
      if (inCinema && !overlayVisible) {
        showSidebarOverlay()  // mostrar sidebar en modo cine
      } else {
        navigateChannels(-1)  // ir al canal anterior
      }
      if (overlayVisible) resetOverlayTimeout()
      break

    case 'down':
      if (overlayVisible) {
        navigateChannels(1)
        resetOverlayTimeout()
      } else {
        navigateChannels(1)
      }
      break

    case 'left':
      if (overlayVisible) hideSidebarOverlay()
      break

    case 'right':
      // futuro: abrir info del canal
      break

    case 'enter':
      if (filteredChannels[selectedIndex]) {
        playChannel(filteredChannels[selectedIndex].id)
        if (overlayVisible) hideSidebarOverlay()
      }
      break

    case 'back':
      if (overlayVisible) {
        hideSidebarOverlay()
      } else if (inCinema) {
        exitCinemaMode()
      }
      break

    case 'playpause':
      togglePlayPause()
      break

    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
      handleNumberInput(action)
      break

    case 'yellow':
      toggleFavorite()  // futuro update 2
      break
  }
}

━━━━ LAYOUT MÓVIL iOS ━━━━

En styles.css, para DEVICE === 'IOS' o DEVICE === 'ANDROID_MOBILE':
body[data-device="IOS"],
body[data-device="ANDROID_MOBILE"] {
  .app-container {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: 100vh;
    position: fixed;
    z-index: 10;
    transform: translateY(0);
    transition: transform 0.3s ease;
  }
  .sidebar.hidden-mobile {
    transform: translateY(100%);
  }
  .main-content {
    width: 100%;
    height: 100vh;
    margin-left: 0;
  }
}

En JS, para móvil:
- Al tocar un canal → enterCinemaMode() + reproducir
- Swipe down en el player → exitCinemaMode() (mostrar lista)
- Detectar swipe: touchstart + touchend, si deltaY > 80px = swipe down

━━━━ BOTÓN MODO CINE ━━━━

Agregar botón en los controles del player:
- Ícono: lucide Maximize2 cuando sidebar visible / Minimize2 cuando en modo cine
- Al hacer click: toggle entre enterCinemaMode() y exitCinemaMode()
- Tooltip: "Modo cine — usá ↑ para cambiar canal"
- En TV/Smart TV: activar modo cine automáticamente al reproducir primer canal
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 1.9 — Verificación final Update 1
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Verificar que todo funciona correctamente en Update 1:

1. Testear código de emparejamiento:
   - Abrir frontend TV → tab "Emparejar TV" → aparece código
   - Desde admin → aprobar código con un usuario
   - TV debe entrar automáticamente sin tocar nada más
   - Verificar que el código expira en 10 minutos

2. Testear monitor de canales:
   - GET /api/admin/monitor/status → debe retornar todos los canales con estado
   - POST /api/admin/monitor/check-now → debe verificar todos los canales
   - Verificar que un canal con URL inválida se marca como DOWN después de 3 intentos
   - Verificar que se oculta del frontend TV automáticamente

3. Testear control remoto:
   - Flechas funcionan fuera de modo cine
   - ↑ en modo cine → aparece sidebar overlay
   - Enter en canal → reproduce y cierra overlay
   - Back → cierra overlay o sale del modo cine
   - Números → navegan al canal correcto
   - Verificar que el foco NUNCA se pierde (el video no captura las teclas)

4. Si hay errores, mostrar los logs completos y corregir.
```
