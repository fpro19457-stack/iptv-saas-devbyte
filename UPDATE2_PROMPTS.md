# 🔄 UPDATE 2 — Prompts para OpenCode
# Performance + Experiencia Cliente
# Ejecutar en orden. Requiere Update 1 completada.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 2.1 — Caché de canales en backend
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Implementar caché en memoria para la lista de canales en el backend.
No instalar Redis, usar Map() nativo de Node.js:

Crear src/utils/cache.ts:

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    })
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  invalidatePattern(pattern: string): void {
    // invalida todas las keys que contengan el pattern
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) this.store.delete(key)
    }
  }
}

export const cache = new MemoryCache()

Aplicar caché en src/modules/channels/channels.controller.ts:
- En GET /api/channels (lista para el cliente):
  * Key de caché: "channels:user:{userId}:{packs}" donde packs es un hash de los packs del usuario
  * TTL: 5 minutos (300 segundos)
  * Si hay caché válida → retornarla directamente sin tocar DB
  * Si no hay → consultar DB, guardar en caché, retornar

- En GET /api/admin/channels (lista admin) NO cachear (el admin necesita datos frescos)

Invalidar caché automáticamente en src/modules/admin/channels/adminChannels.controller.ts:
- Al crear canal → cache.invalidatePattern('channels:')
- Al editar canal → cache.invalidatePattern('channels:')
- Al eliminar canal → cache.invalidatePattern('channels:')
- Al toggle isActive → cache.invalidatePattern('channels:')
- Al reordenar → cache.invalidatePattern('channels:')

También invalidar cuando el monitor marca un canal como caído o lo recupera.

Agregar header de respuesta para debugging:
  X-Cache: HIT  (cuando viene de caché)
  X-Cache: MISS (cuando viene de DB)
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 2.2 — Calidad adaptativa SD/HD/FHD
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Implementar sistema de múltiples calidades por canal:

BACKEND — Schema:
En prisma/schema.prisma, modificar Canal para tener múltiples URLs:

model Channel {
  // ... campos existentes ...
  streamUrl       String   // URL principal (calidad por defecto)
  streamUrlBackup String?  // backup existente
  streamUrlSD     String?  // nueva: URL calidad SD
  streamUrlHD     String?  // nueva: URL calidad HD  
  streamUrlFHD    String?  // nueva: URL calidad FHD
  defaultQuality  Quality  @default(HD)
}

Ejecutar: npx prisma migrate dev --name add_multi_quality

En GET /api/channels/:id/stream, retornar todas las URLs disponibles:
{
  streamUrl: "...",        // principal
  streamUrlBackup: "...",
  qualities: {
    SD:  "url_sd_o_null",
    HD:  "url_hd_o_null", 
    FHD: "url_fhd_o_null"
  },
  defaultQuality: "HD"
}

En panel admin (modal crear/editar canal):
- Agregar campos: URL SD, URL HD, URL FHD (opcionales)
- Label descriptivo: "Dejá vacío si no tenés esa calidad disponible"
- Campo "Calidad por defecto": select SD/HD/FHD

FRONTEND TV — Detección de velocidad y selección:

En channels.js, antes de reproducir un canal:

async function detectBandwidth() {
  const testUrl = API_URL + '/health' // endpoint liviano
  const startTime = Date.now()
  try {
    const response = await fetch(testUrl + '?_=' + Date.now())
    const data = await response.text()
    const duration = Date.now() - startTime
    // Estimación simple basada en tiempo de respuesta
    if (duration < 100) return 'FHD'   // conexión muy rápida
    if (duration < 300) return 'HD'    // conexión normal
    return 'SD'                         // conexión lenta
  } catch {
    return 'HD' // default si falla
  }
}

let preferredQuality = localStorage.getItem('preferredQuality') || 'AUTO'

async function selectStreamUrl(streamData) {
  let quality = preferredQuality
  
  if (quality === 'AUTO') {
    quality = await detectBandwidth()
  }
  
  const qualities = streamData.qualities || {}
  
  // Intentar la calidad seleccionada, bajar si no está disponible
  if (quality === 'FHD' && qualities.FHD) return { url: qualities.FHD, quality: 'FHD' }
  if (quality === 'FHD' && qualities.HD)  return { url: qualities.HD,  quality: 'HD'  }
  if (quality === 'HD'  && qualities.HD)  return { url: qualities.HD,  quality: 'HD'  }
  if (quality === 'HD'  && qualities.SD)  return { url: qualities.SD,  quality: 'SD'  }
  if (quality === 'SD'  && qualities.SD)  return { url: qualities.SD,  quality: 'SD'  }
  
  // Fallback a URL principal
  return { url: streamData.streamUrl, quality: streamData.defaultQuality }
}

Botón de calidad en los controles del player:
- Botón "HD ▾" que abre un menú con las calidades disponibles
- Solo mostrar calidades que tienen URL disponible
- AUTO: detecta automáticamente
- Al cambiar calidad: guardar en localStorage + recargar el stream actual
- El indicador en el overlay del player muestra la calidad activa

En styles.css, menú de calidad:
.quality-menu {
  position: absolute;
  bottom: 60px; right: 16px;
  background: rgba(0,0,0,0.85);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  overflow: hidden;
  min-width: 120px;
}
.quality-option {
  padding: 10px 16px;
  font-size: 13px; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
}
.quality-option.active { color: #3b82f6; font-weight: 600; }
.quality-option:hover { background: rgba(255,255,255,0.1); }
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 2.3 — Sistema de Favoritos
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Implementar favoritos guardados en DB (persisten entre dispositivos):

BACKEND — Schema:
En prisma/schema.prisma:

model UserFavorite {
  userId    String
  channelId String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel   Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@id([userId, channelId])
}

Agregar en User: favorites UserFavorite[]
Agregar en Channel: favoritedBy UserFavorite[]
Ejecutar: npx prisma migrate dev --name add_favorites

Crear src/modules/favorites/favorites.routes.ts:
- GET    /api/favorites           → IDs de canales favoritos del usuario
- POST   /api/favorites/:channelId → agregar favorito
- DELETE /api/favorites/:channelId → quitar favorito
Todos requieren middleware authenticate

FRONTEND TV:

En channels.js:
- Al cargar: fetch GET /api/favorites → guardar array de IDs en memoria
- Variable: let favoriteIds = new Set()

En renderChannels():
- Si channel.id está en favoriteIds → mostrar ★ dorada al lado del nombre
- Si no → mostrar ☆ gris (solo visible en hover)

Función toggleFavorite(channelId):
  if (favoriteIds.has(channelId)) {
    fetch DELETE /api/favorites/:channelId
    favoriteIds.delete(channelId)
    showNotification('Eliminado de favoritos', '', 'info')
  } else {
    fetch POST /api/favorites/:channelId
    favoriteIds.add(channelId)
    showNotification('Agregado a favoritos', '', 'info')
  }
  renderChannels()  // re-renderizar para actualizar icono

Control remoto — botón amarillo (keyCode 405):
  case 'yellow':
    if (filteredChannels[selectedIndex]) {
      toggleFavorite(filteredChannels[selectedIndex].id)
    }
    break

También: click en el ícono ★ de cualquier canal → toggleFavorite

En las categorías (renderCategories()):
- Agregar "⭐ Favoritos" como PRIMERA categoría siempre
- Si el usuario no tiene favoritos: mostrar "Aún no tenés favoritos. Presioná el botón amarillo del control."
- Al seleccionar categoría Favoritos:
  filteredChannels = allChannels.filter(c => favoriteIds.has(c.id))

En styles.css:
.channel-star {
  color: #f59e0b;
  font-size: 14px;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.15s;
}
.channel-item:hover .channel-star,
.channel-item.selected .channel-star { opacity: 1; }
.channel-item.is-favorite .channel-star { opacity: 1; color: #f59e0b; }
.channel-item:not(.is-favorite) .channel-star { color: #475569; }
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 2.4 — Último canal recordado (en DB)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Guardar preferencias del usuario en DB para que persistan entre dispositivos.

BACKEND — Schema:
En prisma/schema.prisma, agregar en modelo User:
  lastChannelId  String?
  lastVolume     Int?    @default(100)  // 0-100
  lastCinemaMode Boolean @default(false)
  lastUpdated    DateTime?

Ejecutar: npx prisma migrate dev --name add_user_preferences

Agregar endpoint en src/modules/auth/auth.routes.ts:
PATCH /api/auth/preferences (requiere authenticate)
Body: { lastChannelId?, lastVolume?, lastCinemaMode? }
- Actualizar los campos enviados en el usuario
- Retornar 200

Modificar GET /api/auth/me para incluir estas preferencias en la respuesta:
{
  ...userData,
  preferences: {
    lastChannelId,
    lastVolume,
    lastCinemaMode
  }
}

FRONTEND TV:

En channels.js, al cargar (init()):
1. Fetch GET /api/auth/me → obtener preferencias del usuario
2. Si preferences.lastCinemaMode → enterCinemaMode()
3. Si preferences.lastVolume → video.volume = preferences.lastVolume / 100
4. Si preferences.lastChannelId → 
   * Encontrar el canal en filteredChannels
   * Si existe → reproducirlo automáticamente después de 1 segundo
   * Scroll al canal en la lista

Guardar preferencias automáticamente:
- Al cambiar de canal → debounce 2s → PATCH /api/auth/preferences { lastChannelId }
- Al cambiar volumen → debounce 2s → PATCH /api/auth/preferences { lastVolume }
- Al entrar/salir de modo cine → PATCH /api/auth/preferences { lastCinemaMode }

Usar debounce para no saturar el servidor:
let savePreferencesTimeout = null
function savePreferences(prefs) {
  clearTimeout(savePreferencesTimeout)
  savePreferencesTimeout = setTimeout(() => {
    fetch(API_URL + '/auth/preferences', {
      method: 'PATCH',
      headers: { 
        'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prefs)
    }).catch(() => {}) // silencioso, no crítico
  }, 2000)
}
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 2.5 — Verificación final Update 2
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Verificar que todo funciona en Update 2:

1. Caché:
   - Abrir dos navegadores distintos con el mismo usuario
   - El segundo debe cargar canales más rápido (desde caché)
   - Verificar header X-Cache: HIT en el segundo request
   - Crear un canal desde admin → verificar que la caché se invalida
     y el nuevo canal aparece en el próximo fetch

2. Calidad adaptativa:
   - Si un canal tiene URL HD y SD configuradas
   - El player debe seleccionar automáticamente según la conexión
   - El botón de calidad debe mostrar las opciones disponibles
   - Cambiar manualmente de HD a SD → debe reconectar el stream

3. Favoritos:
   - Agregar canal como favorito con botón amarillo
   - Verificar que aparece la ★ dorada
   - Ir a categoría "Favoritos" → debe aparecer el canal
   - Cerrar sesión y volver a entrar → favorito debe persistir

4. Último canal:
   - Reproducir un canal
   - Cerrar el navegador y volver a entrar
   - Debe reproducir automáticamente el último canal visto
   - Abrir en otro dispositivo (otro navegador/PC) → mismo canal
```
