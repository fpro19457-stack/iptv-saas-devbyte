# 🎨 Prompt — Redesign TOTAL Panel Admin IPTV
# Referencia visual: Stock SaaS Admin (azul oscuro, cards limpias, navbar top o sidebar limpio)

> Pegar este prompt completo en OpenCode. Es un reemplazo TOTAL del CSS y estructura visual.

---

```
Hacé un REDESIGN COMPLETO del panel admin. No parches, reescribí todos los estilos desde cero.
El diseño de referencia es un panel SaaS oscuro con fondo azul oscuro degradado, cards con glassmorphism sutil, tipografía limpia y espaciado generoso. Así:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PALETA DE COLORES — aplicar en index.css como variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

:root {
  /* Fondos */
  --bg-base:       #0a0f1e;   /* fondo raíz */
  --bg-surface:    #111827;   /* sidebar y header */
  --bg-card:       #1a2744;   /* cards */
  --bg-card-hover: #1e2f52;
  --bg-input:      #0d1628;

  /* Acentos */
  --accent:        #3b82f6;   /* azul primario */
  --accent-hover:  #2563eb;
  --accent-glow:   rgba(59,130,246,0.15);

  /* Semánticos */
  --success:       #10b981;
  --warning:       #f59e0b;
  --danger:        #ef4444;
  --purple:        #8b5cf6;
  --cyan:          #06b6d4;

  /* Texto */
  --text-primary:   #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted:     #475569;

  /* Bordes */
  --border:        rgba(59,130,246,0.12);
  --border-strong: rgba(59,130,246,0.25);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUENTES — agregar en el <head> de index.html
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">

Outfit → logo, títulos de página, números grandes de métricas
DM Sans → todo lo demás

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT GENERAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

display: flex
- Sidebar: 240px fijo a la izquierda
- Main: flex:1, overflow-y: auto

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIDEBAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.sidebar {
  width: 240px;
  min-height: 100vh;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0;
  z-index: 40;
}

/* Logo */
.sidebar-logo {
  padding: 24px 20px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-icon-box {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(59,130,246,0.35);
  flex-shrink: 0;
}
.logo-title {
  font-family: 'Outfit', sans-serif;
  font-size: 16px; font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}
.logo-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

/* Secciones de nav */
.nav-section-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 16px 20px 6px;
}

/* Nav items */
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2px 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
  position: relative;
}
.nav-item:hover {
  background: var(--accent-glow);
  color: var(--text-primary);
}
.nav-item.active {
  background: rgba(59,130,246,0.18);
  color: #60a5fa;
  border: 1px solid rgba(59,130,246,0.22);
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 60%;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}
.nav-item svg { flex-shrink: 0; }

/* Badge en nav */
.nav-badge {
  margin-left: auto;
  font-size: 11px; font-weight: 600;
  padding: 1px 7px;
  border-radius: 20px;
  line-height: 1.6;
}
.nav-badge-red   { background: rgba(239,68,68,0.15);  color: #f87171; }
.nav-badge-green { background: rgba(16,185,129,0.15); color: #34d399; }
.nav-badge-blue  { background: rgba(59,130,246,0.15); color: #60a5fa; }

/* Footer sidebar */
.sidebar-footer {
  margin-top: auto;
  padding: 12px 10px;
  border-top: 1px solid var(--border);
}
.admin-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
}
.admin-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.admin-name  { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.admin-role  { font-size: 11px; color: var(--text-muted); }
.logout-icon { margin-left: auto; color: var(--text-muted); cursor: pointer; }
.logout-icon:hover { color: var(--danger); }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEADER / TOPBAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.topbar {
  height: 60px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 28px;
  gap: 12px;
  position: sticky;
  top: 0; z-index: 30;
}
.topbar-breadcrumb {
  display: flex; align-items: center; gap: 8px;
}
.breadcrumb-parent {
  font-size: 13px; color: var(--text-muted);
}
.breadcrumb-sep { color: var(--text-muted); font-size: 13px; }
.breadcrumb-current {
  font-family: 'Outfit', sans-serif;
  font-size: 15px; font-weight: 600;
  color: var(--text-primary);
}
.topbar-right {
  margin-left: auto;
  display: flex; align-items: center; gap: 14px;
}
.online-pill {
  display: flex; align-items: center; gap: 7px;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 12px; font-weight: 500;
  color: var(--success);
}
.online-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,100% { opacity:1; }
  50% { opacity:0.5; }
}
.topbar-clock {
  font-family: 'Outfit', sans-serif;
  font-size: 13px; color: var(--text-secondary);
  letter-spacing: 0.5px;
}
.topbar-icon-btn {
  width: 36px; height: 36px;
  border-radius: 9px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  color: var(--text-secondary);
  transition: all 0.15s;
}
.topbar-icon-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}
.notif-red-dot {
  position: absolute; top: 7px; right: 7px;
  width: 6px; height: 6px;
  border-radius: 50%; background: var(--danger);
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENIDO PRINCIPAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.main-content {
  margin-left: 240px;   /* igual al ancho del sidebar */
  min-height: 100vh;
  display: flex; flex-direction: column;
}
.page-content {
  padding: 28px 32px;
  flex: 1;
}

/* Page header */
.page-header {
  display: flex; align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}
.page-title {
  font-family: 'Outfit', sans-serif;
  font-size: 24px; font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}
.page-subtitle {
  font-size: 13px; color: var(--text-muted);
  margin-top: 3px;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 22px;
  transition: border-color 0.15s;
}
.card:hover { border-color: var(--border-strong); }

.card-header {
  display: flex; align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.card-title {
  font-family: 'Outfit', sans-serif;
  font-size: 14px; font-weight: 600;
  color: var(--text-primary);
  display: flex; align-items: center; gap: 8px;
}
.card-action {
  font-size: 12px; color: var(--accent);
  cursor: pointer; text-decoration: none;
}
.card-action:hover { color: #60a5fa; }

/* Metric card especial */
.metric-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 22px;
  position: relative;
  overflow: hidden;
}
.metric-card::after {
  content: '';
  position: absolute;
  top: -20px; right: -20px;
  width: 80px; height: 80px;
  border-radius: 50%;
  background: var(--card-accent-color, rgba(59,130,246,0.06));
}
.metric-icon-box {
  width: 38px; height: 38px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
.metric-label {
  font-size: 12px; font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
.metric-value {
  font-family: 'Outfit', sans-serif;
  font-size: 32px; font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -1.5px;
  line-height: 1;
}
.metric-footer {
  font-size: 12px; color: var(--text-muted);
  margin-top: 8px; display: flex; align-items: center; gap: 5px;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOTONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.btn {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 500;
  padding: 9px 16px;
  border-radius: 9px;
  border: none; cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.btn-primary {
  background: var(--accent); color: #fff;
  box-shadow: 0 4px 12px rgba(59,130,246,0.25);
}
.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 6px 16px rgba(59,130,246,0.35);
  transform: translateY(-1px);
}
.btn-secondary {
  background: var(--bg-card); color: var(--text-secondary);
  border: 1px solid var(--border-strong);
}
.btn-secondary:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}
.btn-danger {
  background: rgba(239,68,68,0.1); color: var(--danger);
  border: 1px solid rgba(239,68,68,0.2);
}
.btn-danger:hover { background: rgba(239,68,68,0.2); }
.btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 7px; }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BADGES DE ESTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600;
  padding: 3px 9px; border-radius: 20px;
  line-height: 1.5;
}
/* Con punto antes */
.badge::before {
  content: ''; width: 5px; height: 5px;
  border-radius: 50%; background: currentColor;
  flex-shrink: 0;
}
.badge-active   { background: rgba(16,185,129,0.12); color: #34d399; }
.badge-trial    { background: rgba(245,158,11,0.12);  color: #fbbf24; }
.badge-suspended{ background: rgba(239,68,68,0.12);   color: #f87171; }
.badge-expired  { background: rgba(71,85,105,0.25);   color: #94a3b8; }
.badge-info     { background: rgba(59,130,246,0.12);  color: #60a5fa; }
.badge-sd  { background: rgba(71,85,105,0.25);   color: #94a3b8; }
.badge-hd  { background: rgba(59,130,246,0.12);  color: #60a5fa; }
.badge-fhd { background: rgba(16,185,129,0.12);  color: #34d399; }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.data-table {
  width: 100%; border-collapse: collapse;
}
.data-table thead tr {
  border-bottom: 1px solid var(--border);
}
.data-table th {
  font-size: 11px; font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.07em;
  padding: 10px 14px; text-align: left;
}
.data-table td {
  padding: 13px 14px;
  font-size: 13px; color: var(--text-primary);
  border-bottom: 1px solid rgba(59,130,246,0.07);
  vertical-align: middle;
}
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: rgba(59,130,246,0.04); }

/* Avatar en tabla */
.table-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
  flex-shrink: 0;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUTS Y FILTROS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.input-field {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text-primary);
  font-size: 13px; font-family: 'DM Sans', sans-serif;
  padding: 9px 14px;
  height: 38px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}
.input-field::placeholder { color: var(--text-muted); }
.input-field:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}
.input-with-icon { position: relative; }
.input-with-icon svg {
  position: absolute; left: 11px; top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted); pointer-events: none;
}
.input-with-icon .input-field { padding-left: 34px; }

.select-field {
  /* mismos estilos que input-field */
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text-primary);
  font-size: 13px; font-family: 'DM Sans', sans-serif;
  padding: 9px 14px;
  height: 38px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}
.select-field:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.15s ease;
}
.modal-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: 16px;
  padding: 26px 28px;
  width: 100%; max-width: 500px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
  animation: slideUp 0.2s ease;
}
.modal-header {
  display: flex; align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}
.modal-title {
  font-family: 'Outfit', sans-serif;
  font-size: 17px; font-weight: 600;
  color: var(--text-primary);
}
.modal-close {
  width: 30px; height: 30px;
  border-radius: 7px;
  background: transparent; border: none;
  color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.modal-close:hover { background: var(--bg-card); color: var(--text-primary); }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding-top: 18px; margin-top: 20px;
  border-top: 1px solid var(--border);
}
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes slideUp { from { transform:translateY(12px); opacity:0 } to { transform:translateY(0); opacity:1 } }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LABEL DE FORMULARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.form-label {
  font-size: 12px; font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px; display: block;
}
.form-group { margin-bottom: 16px; }
.form-error { font-size: 11px; color: var(--danger); margin-top: 4px; }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GRIDS COMUNES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/* 4 columnas para métricas */
.metrics-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }

/* 2 columnas iguales */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }

/* 3:2 asimétrico */
.grid-3-2 { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCCIONES DE APLICACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Reemplazar COMPLETAMENTE el contenido de src/index.css con todo lo de arriba.

2. En CADA componente existente (Sidebar, Header/Topbar, Dashboard, Users, Channels, Packs, Sessions, Notifications):
   - Eliminar todas las clases de Tailwind inline
   - Reemplazar con las clases CSS definidas arriba
   - Mantener TODA la lógica, hooks, y llamadas a la API sin tocar

3. En tailwind.config.js: deshabilitar el preflight si Tailwind está interfiriendo:
   corePlugins: { preflight: false }

4. En cada página, el layout debe ser:
   <div class="main-content">
     <div class="topbar">...</div>
     <div class="page-content">
       <div class="page-header">...</div>
       <!-- contenido -->
     </div>
   </div>

5. Íconos: usar lucide-react en TODOS los íconos. Tamaños:
   - Sidebar nav: 16x16
   - Cards header: 16x16
   - Topbar: 15x15
   - Botones: 14x14
   - Tablas (acciones): 13x13

6. El sidebar debe ser FIJO (position: fixed) y el main-content debe tener margin-left: 240px

7. Verificar que en la página de Usuarios la tabla tenga:
   - Columnas: Avatar+Usuario | Estado (badge) | Packs | Sesiones activas | Vencimiento | Acciones
   - Acciones con íconos lucide: Edit2 (editar), Eye (ver detalle), MoreVertical (menú)
   - Botón "Nuevo Usuario" arriba a la derecha con ícono UserPlus

8. IMPORTANTE: No romper ninguna funcionalidad existente. Solo cambios visuales.
```
