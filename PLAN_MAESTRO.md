# 📺 IPTV DevByte — Plan Maestro de Desarrollo
# Tu machete completo. Marcá cada ítem cuando lo completés.

---

## ✅ BASE — Ya completado
- [x] Login usuario/clave
- [x] Lista 200+ canales con categorías y scroll
- [x] Player HLS con fallback a URL backup
- [x] Control remoto flechas + números
- [x] Panel admin completo (usuarios, canales, packs)
- [x] Sesiones en vivo
- [x] Código de acceso por usuario
- [x] Deploy en servidor Ubuntu
- [x] Nginx + PM2 configurado
- [x] PostgreSQL en producción

---

## 🔄 UPDATE 1 — TV Experience + Monitor de Canales
**Objetivo**: Funcionar perfecto en todos los dispositivos. Admin con control total.
**Tiempo estimado**: 1-2 semanas
**Archivo de prompts**: `UPDATE1_PROMPTS.md`

### 1.1 Código de emparejamiento
- [ ] Backend: tabla `PairingCode` en Prisma
- [ ] Backend: endpoint POST /api/auth/pairing-code (genera código)
- [ ] Backend: endpoint POST /api/admin/pairing/approve (admin aprueba)
- [ ] Backend: endpoint GET /api/auth/pairing-status/:code (polling TV)
- [ ] Frontend TV: pantalla de login muestra código temporal
- [ ] Frontend TV: polling cada 3 segundos esperando aprobación
- [ ] Frontend TV: al aprobarse → guarda token → entra automáticamente
- [ ] Panel Admin: sección en usuarios para aprobar código

### 1.2 Monitor de canales
- [ ] Backend: tabla `ChannelCheck` en Prisma (historial)
- [ ] Backend: tabla `ChannelIncident` en Prisma (incidentes)
- [ ] Backend: cron job de verificación (cada 5-10 min configurable)
- [ ] Backend: lógica de 3 fallos = canal caído
- [ ] Backend: auto-ocultar canal cuando cae
- [ ] Backend: auto-reactivar cuando vuelve
- [ ] Backend: envío de email (Gmail SMTP + nodemailer)
- [ ] Backend: bot Telegram para alertas
- [ ] Backend: endpoint configuración (intervalo + emails + token Telegram)
- [ ] Panel Admin: badge rojo en sidebar con canales caídos
- [ ] Panel Admin: página Monitor completa
- [ ] Panel Admin: historial de incidentes

### 1.3 Layout inteligente + control remoto universal
- [ ] Frontend TV: detección automática PC / TV / móvil
- [ ] Frontend TV: modo cine (sin fullscreen API)
- [ ] Frontend TV: sidebar overlay al presionar ↑ en modo cine
- [ ] Frontend TV: mapeo teclas Samsung Tizen
- [ ] Frontend TV: mapeo teclas LG webOS
- [ ] Frontend TV: mapeo teclas Philips / Hisense
- [ ] Frontend TV: mapeo teclas Android TV / TV Box
- [ ] Frontend TV: foco siempre capturado (capture phase)
- [ ] Frontend TV: flechas + números funcionan en cualquier contexto

### 1.4 Experiencia móvil iPhone
- [ ] Frontend TV: detección iPhone/iOS
- [ ] Frontend TV: lista canales pantalla completa en móvil
- [ ] Frontend TV: tap canal → player fullscreen
- [ ] Frontend TV: swipe down → vuelve a lista
- [ ] Frontend TV: URL bar oculta automáticamente

---

## 🔄 UPDATE 2 — Performance + Experiencia Cliente
**Objetivo**: Experiencia fluida, sin cortes, cliente no tiene que llamar.
**Tiempo estimado**: 3-4 días
**Archivo de prompts**: `UPDATE2_PROMPTS.md`

### 2.1 Caché de canales
- [ ] Backend: caché en memoria de lista de canales (5 min TTL)
- [ ] Backend: invalidar caché al crear/editar/borrar canal
- [ ] Backend: header Cache-Control en respuesta
- [ ] Testear con 50+ usuarios simultáneos

### 2.2 Calidad adaptativa SD/HD/FHD
- [ ] Backend: canales con múltiples URLs por calidad
- [ ] Backend: endpoint devuelve todas las URLs disponibles
- [ ] Frontend TV: medición de velocidad al conectar
- [ ] Frontend TV: selección automática según ancho de banda
- [ ] Frontend TV: botón manual para forzar calidad
- [ ] Frontend TV: indicador de calidad activa en el player
- [ ] Panel Admin: campo múltiples URLs por canal (SD/HD/FHD)

### 2.3 Favoritos
- [ ] Backend: tabla `UserFavorite` en Prisma
- [ ] Backend: endpoints agregar/quitar/listar favoritos
- [ ] Frontend TV: botón amarillo del control = toggle favorito
- [ ] Frontend TV: ícono estrella en cada canal
- [ ] Frontend TV: pestaña "Favoritos" primera en categorías
- [ ] Frontend TV: favoritos persisten entre dispositivos (guardado en DB)

### 2.4 Último canal recordado
- [ ] Backend: campo `lastChannelId` + `lastVolume` + `lastCinemaMode` en Session
- [ ] Backend: actualizar al cambiar canal
- [ ] Frontend TV: al entrar → reproduce último canal automáticamente
- [ ] Frontend TV: restaura volumen y modo cine
- [ ] Frontend TV: persiste entre dispositivos (no solo localStorage)

---

## 🔄 UPDATE 3 — APK Android
**Objetivo**: App nativa para TV Box y celulares Android. Más clientes.
**Tiempo estimado**: 2-3 semanas
**Archivo de prompts**: `UPDATE3_PROMPTS.md`

### 3.1 Setup proyecto Android
- [ ] Crear proyecto Android Studio (API 21 mínimo)
- [ ] Configurar WebView con JavascriptInterface
- [ ] Configurar ExoPlayer dependency
- [ ] Pantalla splash con logo IPTV DevByte
- [ ] Modo fullscreen real desde el inicio

### 3.2 WebView + Frontend TV
- [ ] WebView carga frontend-tv existente
- [ ] JavascriptInterface: Android expone funciones a JS
- [ ] JS llama Android para reproducir video con ExoPlayer
- [ ] Manejo de back button nativo
- [ ] Sin barra de navegador

### 3.3 ExoPlayer para video
- [ ] Integrar ExoPlayer para streams HLS
- [ ] Fullscreen real sin perder foco del control
- [ ] Calidad adaptativa nativa (ExoPlayer lo hace solo)
- [ ] Picture in Picture en Android 8+
- [ ] Manejo de errores y fallback a URL backup

### 3.4 Control remoto nativo
- [ ] Captura de teclas a nivel Android (dispatchKeyEvent)
- [ ] Mapeo completo: flechas, OK, back, números, colores
- [ ] Envío de eventos a WebView via JS
- [ ] Funciona en fullscreen sin perder foco

### 3.5 Features nativas
- [ ] Detección de red (WiFi/ethernet/4G) para calidad adaptativa
- [ ] Notificaciones push para mensajes del admin
- [ ] Auto-actualización: compara versión con servidor al abrir
- [ ] Descarga APK nueva si hay update disponible

### 3.6 Distribución
- [ ] Build APK release firmado
- [ ] Endpoint en backend para verificar versión actual
- [ ] Link de descarga directo desde el panel admin
- [ ] Instrucciones de instalación para el cliente

---

## 🔄 UPDATE 4 — Gestión de Negocio
**Objetivo**: Admin gestiona todo desde el panel sin herramientas externas.
**Tiempo estimado**: 1 semana
**Archivo de prompts**: `UPDATE4_PROMPTS.md`

### 4.1 Dashboard financiero
- [ ] Backend: cálculo ingresos mes actual
- [ ] Backend: proyección mes siguiente
- [ ] Backend: usuarios que vencen esta semana/mes
- [ ] Backend: tasa de renovación
- [ ] Panel Admin: sección financiera en Dashboard
- [ ] Panel Admin: gráfico ingresos últimos 6 meses
- [ ] Panel Admin: lista clickeable de usuarios por vencer
- [ ] Panel Admin: campo precio por plan en Packs

### 4.2 Mensajes programados
- [ ] Backend: tabla `ScheduledMessage` en Prisma
- [ ] Backend: cron job que envía mensajes en fecha programada
- [ ] Backend: destinatario: usuario / pack / todos
- [ ] Panel Admin: crear mensaje con fecha/hora/tipo
- [ ] Panel Admin: plantillas predefinidas (vencimiento, suspensión)
- [ ] Panel Admin: programación recurrente (día X de cada mes)
- [ ] Panel Admin: historial de mensajes enviados
- [ ] Frontend TV: overlay que muestra mensaje al cliente

### 4.3 Notas por usuario
- [ ] Backend: tabla `UserNote` en Prisma
- [ ] Backend: endpoints CRUD notas
- [ ] Panel Admin: sección notas en perfil del usuario
- [ ] Panel Admin: historial con fecha y autor
- [ ] Panel Admin: búsqueda por contenido de nota

### 4.4 WhatsApp link directo
- [ ] Backend: campo teléfono en modelo User
- [ ] Panel Admin: campo teléfono en crear/editar usuario
- [ ] Panel Admin: ícono WhatsApp en tabla de usuarios
- [ ] Panel Admin: click → abre WhatsApp Web con mensaje pre-armado
- [ ] Panel Admin: plantillas de mensaje configurables

### 4.5 Historial de pagos manual
- [ ] Backend: tabla `Payment` en Prisma
- [ ] Backend: endpoints CRUD pagos
- [ ] Panel Admin: registrar pago por usuario
- [ ] Panel Admin: historial completo por usuario
- [ ] Panel Admin: exportar a Excel (mes seleccionado)
- [ ] Panel Admin: estado pagado/pendiente/vencido

---

## 🔄 UPDATE 5 — Seguridad y Analytics
**Objetivo**: Visibilidad total. Detectar amenazas. Datos para decisiones.
**Tiempo estimado**: 3-4 días
**Archivo de prompts**: `UPDATE5_PROMPTS.md`

### 5.1 Estadísticas por usuario
- [ ] Backend: tabla `ViewingStats` en Prisma
- [ ] Backend: registrar cada cambio de canal con duración
- [ ] Backend: endpoint estadísticas por usuario
- [ ] Panel Admin: horas vistas este mes
- [ ] Panel Admin: top 5 canales más vistos
- [ ] Panel Admin: dispositivos usados
- [ ] Panel Admin: gráfico actividad semanal

### 5.2 Log de intentos fallidos
- [ ] Backend: tabla `LoginAttempt` en Prisma
- [ ] Backend: registrar cada intento fallido (IP, usuario, hora, motivo)
- [ ] Backend: bloqueo automático IP tras 5 intentos en 10 min
- [ ] Backend: alerta email/Telegram si detecta ataque
- [ ] Panel Admin: página de seguridad con log
- [ ] Panel Admin: lista de IPs bloqueadas
- [ ] Panel Admin: botón desbloquear IP manualmente

### 5.3 Estadísticas globales
- [ ] Backend: endpoint métricas globales del sistema
- [ ] Panel Admin: top 10 canales más vistos del sistema
- [ ] Panel Admin: horas pico de uso (gráfico por hora)
- [ ] Panel Admin: distribución dispositivos (TV/móvil/PC %)
- [ ] Panel Admin: sesiones simultáneas por hora
- [ ] Panel Admin: usuarios más activos

---

## 📋 Resumen rápido

| Update | Qué hace | Tiempo | Estado |
|--------|----------|--------|--------|
| Base | Todo lo actual | ✅ | Completo |
| 1 | TV + Monitor canales | 1-2 sem | 🔄 En curso |
| 2 | Performance + UX | 3-4 días | ⏳ Pendiente |
| 3 | APK Android | 2-3 sem | ⏳ Pendiente |
| 4 | Negocio + Admin | 1 sem | ⏳ Pendiente |
| 5 | Seguridad + Analytics | 3-4 días | ⏳ Pendiente |

---

## 🔑 Datos importantes del proyecto

```
Proyecto:     iptv-saas-devbyte
Backend:      Node.js + Express + TypeScript + Prisma
DB:           PostgreSQL
Frontend TV:  HTML + Vanilla JS (puerto 3000)
Frontend Admin: React + Vite + TypeScript (puerto 5173)
Backend API:  Puerto 3001 (producción) / 3002 (desarrollo)
Servidor:     Ubuntu/Pop!OS — IP local fija
Deploy:       PM2 + Nginx
```
