# 🎨 Prompt — Redesign Completo Panel Admin IPTV

> Pegar este prompt completo en OpenCode con el proyecto abierto en frontend-admin/

---

```
Necesito un redesign completo y profesional del panel admin. Mantener toda la lógica y rutas existentes, solo reemplazar el diseño visual. Seguir estas especificaciones al pie de la letra:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 1. FUENTES — agregar en index.html
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">

- Headings, números grandes, logo: font-family 'Outfit'
- Todo lo demás (body, tablas, labels): font-family 'DM Sans'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 2. VARIABLES CSS GLOBALES — en index.css
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

:root {
  --bg:        #070c18;
  --bg2:       #0d1526;
  --bg3:       #111e35;
  --card:      #152038;
  --blue:      #3b82f6;
  --cyan:      #06b6d4;
  --green:     #10b981;
  --yellow:    #f59e0b;
  --red:       #ef4444;
  --purple:    #8b5cf6;
  --border:    rgba(59,130,246,0.15);
  --border2:   rgba(59,130,246,0.25);
  --text:      #e2e8f0;
  --muted:     #64748b;
  --text-secondary: #94a3b8;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  margin: 0;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 3. LAYOUT GENERAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

display: flex (sidebar fijo + main scrolleable)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 4. SIDEBAR — components/layout/Sidebar.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estilos:
- width: 220px, min-height: 100vh
- background: var(--bg2)
- border-right: 1px solid var(--border)
- display: flex, flex-direction: column

LOGO (parte superior):
- Padding: 20px 16px 16px
- border-bottom: 1px solid var(--border)
- Ícono: cuadrado 34x34px, border-radius 8px, background: linear-gradient(135deg, #3b82f6, #06b6d4)
  Dentro: lucide <Tv> blanco stroke-width 2.5
- Texto: "IPTV Admin" en Outfit 700 15px color #f1f5f9
- Subtexto: "DevByte Panel" 10px color var(--muted)

NAVEGACIÓN:
- Padding: 12px 8px
- Secciones con label: font-size 10px, color var(--muted), font-weight 600, letter-spacing 0.08em, uppercase
  Sección 1: "Principal" → items: Dashboard, Usuarios, Canales, Packs
  Sección 2 (margin-top 8px): "Monitoreo" → items: Sesiones, Notificaciones

Cada nav-item:
- display: flex, align-items: center, gap: 10px
- padding: 8px 10px, border-radius: 8px
- font-size: 13px, color: var(--muted)
- margin-bottom: 2px
- transition: all 0.15s
- hover → background: rgba(59,130,246,0.08), color: var(--text)
- ACTIVO → background: rgba(59,130,246,0.15), color: var(--blue), border: 1px solid rgba(59,130,246,0.2)

Íconos Lucide por ítem (tamaño 15x15):
- Dashboard → LayoutDashboard
- Usuarios → Users (+ badge verde con conteo activos)
- Canales → Tv
- Packs → Package
- Sesiones → Monitor (+ badge rojo con sesiones activas ahora)
- Notificaciones → Bell (+ badge rojo con no leídas)

Badges en nav-items:
- margin-left: auto
- Rojo: background rgba(239,68,68,0.2), color #ef4444, font-size 10px, font-weight 600, padding 1px 6px, border-radius 10px
- Verde: background rgba(16,185,129,0.2), color #10b981

FOOTER del sidebar:
- padding: 12px 8px, border-top: 1px solid var(--border)
- Pill del admin: display flex, gap 8px, padding 8px 10px, border-radius 8px, background var(--bg3)
  - Avatar: 28x28px, border-radius 50%, background linear-gradient(135deg, #3b82f6, #8b5cf6), inicial en 11px bold blanco
  - Nombre: 12px 500 var(--text)
  - Rol: 10px var(--muted)
  - Botón logout: margin-left auto, ícono lucide <LogOut> 13x13 color var(--muted), cursor pointer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 5. HEADER — components/layout/Header.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- height: 56px
- background: var(--bg2)
- border-bottom: 1px solid var(--border)
- display: flex, align-items: center, padding: 0 24px, gap: 16px

Izquierda:
- Breadcrumb: "Panel / [Página actual]" — "Panel" en 12px var(--muted), "/" en var(--muted), nombre de página en Outfit 16px 600 var(--text)

Derecha (margin-left: auto, display flex, gap 12px):
- Badge online: display flex, gap 6px, background rgba(16,185,129,0.1), border 1px solid rgba(16,185,129,0.2), border-radius 20px, padding 4px 10px, font-size 12px, color #10b981, font-weight 500
  Punto verde animado (pulse): 6px x 6px, border-radius 50%, background #10b981, box-shadow 0 0 6px #10b981
  Texto: "X online" (X = sesiones activas del estado global)
- Reloj: font-size 13px, color var(--muted), font-family Outfit. Actualizar cada segundo con setInterval.
- Botón notificaciones: 32x32px, border-radius 8px, background var(--bg3), border 1px solid var(--border)
  Ícono lucide <Bell> 14x14 color #94a3b8
  Si hay notificaciones no leídas: punto rojo 6px absolute top-right

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 6. CARD BASE — components/ui/Card.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- background: var(--card)
- border: 1px solid var(--border)
- border-radius: 12px
- padding: 16px

Card header (opcional):
- display flex, align-items center, justify-content space-between, margin-bottom 14px
- Título: Outfit 14px 600 #f1f5f9, con ícono Lucide a la izquierda (color según contexto)
- Acción link: 12px, color var(--blue), cursor pointer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 7. DASHBOARD — pages/Dashboard/index.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Padding del contenido: 20px 24px

PAGE HEADER:
- display flex, justify-content space-between, margin-bottom 20px
- Título: Outfit 22px 700 #f1f5f9, letter-spacing -0.5px
- Subtítulo: 13px var(--muted) "Resumen del sistema · Actualizado hace 30s"
- Botón "Nuevo usuario": background var(--blue), color #fff, font-size 13px, font-weight 500, padding 8px 14px, border-radius 8px, ícono lucide <UserPlus> 14px

FILA 1 — 4 Metric Cards (grid 4 columnas, gap 14px, margin-bottom 20px):

Estructura de cada card (background var(--card), border 1px solid var(--border), border-radius 12px, padding 16px):
- Top row: label (11px var(--muted) uppercase letter-spacing 0.05em) + ícono en cuadrado 32x32 border-radius 8px
- Número: Outfit 28px 700 #f1f5f9 letter-spacing -1px
- Footer: 11px var(--muted) con trend

Las 4 cards:
1. Usuarios Activos → ícono lucide <UserCheck> color #3b82f6, bg rgba(59,130,246,0.12), footer "↑ 3 este mes" en verde
2. En Trial → ícono lucide <Gift> color #f59e0b, bg rgba(245,158,11,0.12), footer "Vencen en 7 días" en amarillo
3. Suspendidos → ícono lucide <UserX> color #ef4444, bg rgba(239,68,68,0.12), footer "Sin acceso" en rojo
4. Sesiones ahora → ícono lucide <Monitor> color #10b981, bg rgba(16,185,129,0.12), footer "● En vivo" en verde

FILA 2 — grid 2 columnas (1fr 1fr), gap 14px, margin-bottom 20px:

Card izquierda "Sesiones en vivo":
- Header: ícono lucide <Monitor> #3b82f6 + título + link "Ver todas →"
- Tabla con columnas: Usuario | Canal | Dispositivo | Duración | (acción)
- Usuario: avatar 26x26 border-radius 50% con gradiente + username 12px
  Gradientes avatar por usuario: rotar entre (blue→purple), (green→cyan), (yellow→red)
- Canal: badge pequeño (azul para deportes, verde para noticias, amarillo para entretenimiento)
- Dispositivo: ícono según tipo (lucide <Tv> para Smart TV, <Monitor> para navegador, <Smartphone> para móvil) + texto 11px var(--muted)
- Duración: color #10b981
- Botón cerrar: 22x22px, border-radius 6px, bg rgba(239,68,68,0.1), border 1px solid rgba(239,68,68,0.2), ícono lucide <X> 10px color #ef4444

Card derecha "Canales más vistos hoy":
- Header: ícono lucide <Star> #f59e0b + título
- Lista de canales (4-5 items):
  Cada item: logo 30x30 border-radius 6px bg var(--bg3) + nombre 12px + badge calidad + vistas + barra de progreso
  Barra: 60px wide, 4px height, border-radius 2px, fill según color del canal

FILA 3 — grid (2fr 1fr), gap 14px:

Card izquierda "Actividad reciente":
- Header: ícono lucide <Activity> #8b5cf6 + título + link "Ver log completo →"
- Lista de actividades con punto de color a la izquierda:
  Verde: login exitoso
  Azul: cambio de canal
  Amarillo: advertencia de vencimiento
  Rojo: sesión cerrada / error
  Cada ítem: punto 7x7 border-radius 50% + texto 11px + timestamp 10px var(--muted)

Card derecha "Distribución":
- Header: ícono lucide <PieChart> #06b6d4 + título
- Barras de distribución por estado (Activos/Trial/Suspendidos/Vencidos):
  label 12px + track (flex:1, height 6px, border-radius 3px, bg var(--bg3)) + fill de color + número
- Sección inferior "Packs populares" con badges de colores

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 8. BADGES — components/ui/Badge.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Todos: font-size 10-11px, font-weight 600, padding 2px 7px, border-radius 20px

- active/green:  bg rgba(16,185,129,0.15)  color #10b981
- trial/yellow:  bg rgba(245,158,11,0.15)  color #f59e0b
- suspended/red: bg rgba(239,68,68,0.15)   color #ef4444
- expired/gray:  bg rgba(100,116,139,0.15) color #94a3b8
- info/blue:     bg rgba(59,130,246,0.15)  color #3b82f6
- SD: gray, HD: blue, FHD: green

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 9. TABLA BASE — components/ui/Table.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- width: 100%, border-collapse: collapse
- th: font-size 10px, color var(--muted), font-weight 600, uppercase, letter-spacing 0.06em, padding 6px 8px, border-bottom 1px solid var(--border)
- td: padding 9px 8px, font-size 12-13px, color var(--text), border-bottom 1px solid rgba(30,58,95,0.4)
- última fila: border-bottom none
- hover en tr: background rgba(59,130,246,0.04)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 10. BOTONES — components/ui/Button.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary: bg var(--blue), color #fff, border none, border-radius 8px, font-size 13px, font-weight 500, padding 8px 14px, cursor pointer, transition all 0.15s
  hover: bg #2563eb, transform translateY(-1px)

Secondary: bg transparent, color var(--text-secondary), border 1px solid var(--border2), border-radius 8px
  hover: bg rgba(59,130,246,0.08)

Danger: bg rgba(239,68,68,0.1), color #ef4444, border 1px solid rgba(239,68,68,0.2)
  hover: bg rgba(239,68,68,0.2)

Ghost: bg transparent, color var(--muted), border none
  hover: color var(--text)

Con loading: mostrar lucide <Loader2> animado (spin) en lugar del ícono normal
Con ícono: flex, align-items center, gap 6px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 11. INPUT — components/ui/Input.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- background: var(--bg3)
- border: 1px solid var(--border)
- border-radius: 8px
- color: var(--text)
- font-size: 13px
- padding: 8px 12px (con ícono izquierda: padding-left 36px)
- height: 36px
- outline: none
- focus → border-color var(--blue), box-shadow 0 0 0 3px rgba(59,130,246,0.1)
- placeholder color: var(--muted)
- label: font-size 12px, color var(--text-secondary), font-weight 500, margin-bottom 4px
- error message: font-size 11px, color #ef4444, margin-top 4px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 12. MODAL — components/ui/Modal.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overlay: background rgba(0,0,0,0.7), backdrop-filter blur(4px), position fixed inset 0, z-index 50
  Animación: opacity 0→1 en 0.15s

Panel:
- background var(--bg2)
- border: 1px solid var(--border2)
- border-radius: 16px
- padding: 24px
- max-width: 480px (md), 600px (lg)
- box-shadow: 0 25px 50px rgba(0,0,0,0.5)
- Animación: translateY(10px)→0 + opacity 0→1 en 0.2s

Header del modal:
- Título: Outfit 16px 600 #f1f5f9
- Botón X: 28x28px, border-radius 6px, bg transparent, ícono lucide <X> 14px color var(--muted)
  hover: bg var(--bg3)

Footer: padding-top 16px, border-top 1px solid var(--border), display flex, justify-content flex-end, gap 8px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- NO cambiar rutas, lógica de negocio, ni llamadas a la API existentes
- SOLO reemplazar clases CSS/estilos/Tailwind por los estilos descriptivos arriba
- Si usa Tailwind, agregar los colores custom al tailwind.config.js bajo extend.colors
- Todos los íconos: librería lucide-react, tamaño consistente (15px en nav, 16px en cards, 14px en botones/header)
- El reloj del header debe actualizarse con setInterval cada 1 segundo
- Aplicar los cambios en TODOS los componentes existentes, no solo el Dashboard
```
