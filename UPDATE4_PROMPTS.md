# 🔄 UPDATE 4 — Prompts para OpenCode
# Gestión de Negocio
# Requiere Updates 1, 2 y 3 completadas.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 4.1 — Schema: Negocio
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
En backend/prisma/schema.prisma agregar estos modelos:

model Payment {
  id          String        @id @default(uuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount      Float
  currency    String        @default("ARS")
  method      PaymentMethod
  period      String        // ej: "Abril 2026"
  periodFrom  DateTime
  periodTo    DateTime
  status      PaymentStatus @default(PAID)
  notes       String?
  registeredBy String?      // username del admin que lo registró
  createdAt   DateTime      @default(now())
}

enum PaymentMethod {
  CASH        // Efectivo
  TRANSFER    // Transferencia
  MERCADOPAGO
  OTHER
}

enum PaymentStatus {
  PAID
  PENDING
  CANCELLED
}

model UserNote {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content   String
  author    String   // username del admin
  createdAt DateTime @default(now())
}

model ScheduledMessage {
  id          String            @id @default(uuid())
  title       String
  message     String
  type        NotificationType  @default(INFO)
  targetType  MessageTarget     @default(ALL)
  targetUserId String?          // si targetType = USER
  targetPackId String?          // si targetType = PACK
  scheduledAt DateTime          // cuándo enviar
  sentAt      DateTime?         // null si aún no se envió
  isRecurring Boolean           @default(false)
  recurringDay Int?              // día del mes para recurrente (1-31)
  createdAt   DateTime          @default(now())
}

enum MessageTarget {
  ALL
  USER
  PACK
}

Agregar en modelo User:
  payments         Payment[]
  notes            UserNote[]
  phone            String?      // para WhatsApp
  planPrice        Float?       // precio mensual de este usuario
  
Agregar en modelo Pack:
  price            Float?       // precio base del pack

Ejecutar: npx prisma migrate dev --name add_business_features
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 4.2 — Backend: Dashboard financiero
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Crear src/modules/admin/finance/finance.routes.ts y finance.controller.ts:

GET /api/admin/finance/dashboard (requiere authenticateAdmin):
Retornar:
{
  currentMonth: {
    revenue: number,           // suma de payments PAID del mes actual
    activeUsers: number,       // usuarios con status ACTIVE
    projectedRevenue: number,  // usuarios activos × planPrice promedio
  },
  expiring: {
    thisWeek: User[],          // vencen en 7 días (con nombre, teléfono, packs)
    thisMonth: User[],         // vencen en 30 días
    overdue: User[],           // ya vencieron y siguen ACTIVE (olvidaste suspender)
  },
  renewalRate: number,         // % usuarios que renovaron el mes pasado
  revenueByMonth: [            // últimos 6 meses
    { month: "Oct 2025", revenue: 45000 },
    ...
  ],
  topPacks: [                  // packs más vendidos
    { name: "Fútbol", count: 18, revenue: 54000 },
    ...
  ]
}

GET /api/admin/finance/payments (requiere authenticateAdmin):
- Query params: userId, month (YYYY-MM), status
- Retornar lista paginada de pagos

POST /api/admin/finance/payments (requiere authenticateAdmin):
- Body: { userId, amount, method, period, periodFrom, periodTo, notes }
- Crear pago
- Opcional: al registrar pago, si el usuario está EXPIRED → 
  preguntar si quiere activarlo automáticamente (retornar flag en respuesta)

PUT /api/admin/finance/payments/:id (requiere authenticateAdmin):
- Editar pago existente

DELETE /api/admin/finance/payments/:id (requiere authenticateAdmin):
- Eliminar pago

GET /api/admin/finance/export (requiere authenticateAdmin):
- Query params: month (YYYY-MM)
- Retornar datos para exportar a Excel (array de objetos)
- Incluir: usuario, monto, método, período, fecha de pago

Registrar rutas en app.ts
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 4.3 — Panel Admin: Dashboard financiero
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Crear src/pages/Finance/index.tsx en el panel admin:

Agregar en el sidebar navegación:
- "Finanzas" en sección PRINCIPAL con ícono lucide <DollarSign>

PÁGINA FINANZAS — layout completo:

FILA 1 — 4 metric cards:
1. 💰 Ingresos del mes — monto en ARS con formato $XX.XXX
   Footer: "X pagos registrados"
2. 📈 Proyección mes siguiente — basado en usuarios activos × precio promedio
   Footer: "Basado en X usuarios activos"
3. ⚠️ Vencen esta semana — número en amarillo
   Footer: clickeable "Ver lista →"
4. 🔴 Vencidos sin suspender — número en rojo
   Footer: "Requieren atención"

FILA 2 — Gráfico + Lista vencimientos:

Card izquierda "Ingresos últimos 6 meses":
- Gráfico de barras simple (usar recharts o Chart.js)
- Barras en azul, mes actual en cyan
- Eje Y: montos en ARS
- Eje X: nombres de meses

Card derecha "Próximos vencimientos":
- Lista de usuarios que vencen en 7 días
- Cada ítem: avatar + nombre + fecha vencimiento + botón WhatsApp
- Botón WhatsApp: abre wa.me/549XXXXXXXXXX con mensaje pre-armado:
  "Hola [nombre]! Te escribo de [ISP]. Tu servicio IPTV vence el [fecha]. 
   Para renovar escribinos por acá. Gracias!"
- Si no tiene teléfono: ícono WhatsApp gris con tooltip "Agregá el teléfono en el perfil"

FILA 3 — Tabla de pagos del mes:
- Header: "Pagos — [Mes actual]" + selector de mes + botón "Registrar pago" + botón "Exportar Excel"
- Tabla: Usuario | Monto | Método | Período | Fecha | Estado | Acciones
- Método con ícono: 💵 Efectivo / 🏦 Transferencia / 📱 MercadoPago
- Estado: badge verde Pagado / amarillo Pendiente / rojo Cancelado
- Acciones: Edit (ícono Pencil) / Delete (ícono Trash)

MODAL "Registrar pago":
- Select usuario (buscador)
- Input monto (numérico con prefijo $)
- Select método de pago
- Input período (texto, ej: "Mayo 2026")
- Date picker: desde / hasta
- Textarea notas (opcional)
- Checkbox: "Activar usuario si está vencido/suspendido"

BOTÓN "Exportar Excel":
- Exportar pagos del mes seleccionado a .xlsx
- Usar librería SheetJS (xlsx): npm install xlsx
- Columnas: Usuario, Monto, Método, Período, Fecha, Estado, Notas
- Nombre del archivo: "pagos-[mes]-[año].xlsx"

En src/pages/Users/index.tsx, agregar en acciones de cada usuario:
- Ícono lucide <DollarSign> → abre modal de registro de pago rápido para ese usuario
- Ícono lucide <MessageCircle> (WhatsApp verde) → abre WhatsApp con ese usuario
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 4.4 — Mensajes programados
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Implementar sistema de mensajes programados:

BACKEND — endpoints en src/modules/admin/messages/messages.routes.ts:
GET    /api/admin/messages           → listar mensajes (enviados + pendientes)
POST   /api/admin/messages           → crear mensaje programado
PUT    /api/admin/messages/:id       → editar mensaje pendiente
DELETE /api/admin/messages/:id       → eliminar mensaje pendiente
POST   /api/admin/messages/:id/send-now → enviar inmediatamente

En utils/cronJobs.ts agregar:
- Cada minuto → buscar ScheduledMessage donde scheduledAt <= now y sentAt IS NULL
- Para cada mensaje encontrado:
  * Si targetType === ALL → crear Notification para todos los usuarios activos
  * Si targetType === USER → crear Notification para ese usuario
  * Si targetType === PACK → crear Notification para usuarios que tengan ese pack
  * Actualizar sentAt = now
  * Si isRecurring → crear nuevo ScheduledMessage para el próximo mes (mismo día)
  * Emitir via socket.io a los usuarios conectados

PANEL ADMIN — src/pages/Messages/index.tsx:

Agregar en sidebar: "Mensajes" con ícono lucide <MessageSquare>

HEADER: "Mensajes Programados" + botón "Nuevo Mensaje"

TABLA de mensajes:
Columnas: Título | Destinatario | Tipo | Programado para | Estado | Recurrente | Acciones
- Estado: "Pendiente" (amarillo) / "Enviado" (verde con fecha)
- Destinatario: "Todos" / nombre del usuario / nombre del pack
- Acciones: Edit (si pendiente) / Delete / Send Now

MODAL "Nuevo mensaje":

Sección 1 — Contenido:
- Input título
- Textarea mensaje
- Select tipo: INFO (azul) / WARNING (amarillo) / DANGER (rojo)
  Preview del mensaje con el color seleccionado

Sección 2 — Destinatario:
- Radio: Todos los usuarios / Usuario específico / Pack específico
- Si usuario: buscador de usuarios
- Si pack: select de packs

Sección 3 — Programación:
- Radio: Enviar ahora / Programar fecha y hora / Recurrente mensual
- Si programar: date picker + time picker
- Si recurrente: select día del mes (1-31)
  Preview: "Se enviará el día X de cada mes"

Plantillas rápidas (botones que pre-rellenan el formulario):
1. "Vencimiento próximo" → 
   Título: "Tu servicio vence pronto"
   Mensaje: "Hola! Tu suscripción IPTV vence en los próximos días. Contactanos para renovar y no quedarte sin servicio."
   Tipo: WARNING

2. "Recordatorio de pago" →
   Título: "Recordatorio de pago"
   Mensaje: "Hola! Te recordamos que tenés un pago pendiente. Escribinos para coordinar."
   Tipo: WARNING

3. "Mantenimiento programado" →
   Título: "Mantenimiento del sistema"
   Mensaje: "El servicio estará en mantenimiento el [fecha] de [hora] a [hora]. Disculpá las molestias."
   Tipo: INFO

FRONTEND TV — mostrar mensajes al cliente:
En canales.html, al cargar y cada 5 minutos:
- Fetch GET /api/notifications (notificaciones no leídas)
- Si hay mensajes: mostrar overlay con el mensaje
  * Fondo semitransparente oscuro
  * Card centrada con: ícono según tipo + título + mensaje
  * Botón "Entendido" que marca como leído
  * Si hay varios mensajes: mostrarlos uno por uno
- Emitir via socket.io en tiempo real cuando llega uno nuevo
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 4.5 — Notas por usuario + WhatsApp
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Implementar notas por usuario y WhatsApp directo:

BACKEND — endpoints en src/modules/admin/users/userNotes.routes.ts:
GET    /api/admin/users/:id/notes       → listar notas del usuario (más recientes primero)
POST   /api/admin/users/:id/notes       → crear nota
DELETE /api/admin/users/:id/notes/:noteId → eliminar nota

En GET /api/admin/users/:id (detalle de usuario):
- Incluir las últimas 5 notas en la respuesta

PANEL ADMIN — en el modal de detalle del usuario:

Agregar Tab "Notas" junto a "Sesiones", "Packs", "Actividad":

Tab Notas:
- Lista de notas en orden cronológico inverso
- Cada nota:
  * Texto de la nota
  * Autor (username del admin) + fecha relativa "hace 2 días"
  * Botón eliminar (ícono Trash, solo visible en hover)
- Input al final: textarea + botón "Agregar nota"
  * Placeholder: "Ej: Cliente VIP, paga siempre en efectivo..."
  * Enter en textarea (sin Shift) = guardar nota
  * Shift+Enter = salto de línea

WHATSAPP — en panel admin:

En la tabla de usuarios, columna "Acciones":
- Agregar ícono de WhatsApp (SVG del logo de WhatsApp en verde #25D366)
- Solo visible si el usuario tiene teléfono cargado
- Si no tiene teléfono: ícono gris con tooltip "Agregá el teléfono en el perfil"

Al hacer click en el ícono de WhatsApp:
- Abrir un mini-modal de selección de mensaje:
  
  "Enviar WhatsApp a [nombre]"
  
  [Seleccioná un mensaje:]
  ○ Vencimiento próximo
    "Hola [nombre]! Tu IPTV vence el [fecha]. ¿Renovamos?"
  ○ Pago pendiente  
    "Hola [nombre]! Tenés un pago pendiente de $[monto]. Avisame cuando puedas."
  ○ Servicio suspendido
    "Hola [nombre]! Tu servicio fue suspendido. Contactanos para reactivarlo."
  ○ Mensaje personalizado
    [Textarea para escribir]
  
  [Abrir WhatsApp]

Al hacer click en "Abrir WhatsApp":
- Formatear número: si es Argentina, agregar 549 adelante
- Generar URL: https://wa.me/549XXXXXXXXXX?text=[mensaje codificado]
- Abrir en nueva pestaña

En el modal de crear/editar usuario:
- Agregar campo "Teléfono WhatsApp": input numérico
  Placeholder: "Ej: 3794123456 (sin 0 ni 15)"
  Hint: "Solo números, sin código de país"
- Agregar campo "Precio mensual ($ARS)": input numérico
  Hint: "Se usa para calcular proyección de ingresos"

Buscador de usuarios (tabla principal):
- Que también busque por número de teléfono
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 4.6 — Verificación final Update 4
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Verificar que todo funciona en Update 4:

1. Dashboard financiero:
   - Registrar 2-3 pagos de prueba para usuarios existentes
   - Verificar que aparecen en el gráfico del mes actual
   - Verificar que la proyección calcula correctamente
   - Exportar a Excel → debe descargar el archivo con los datos

2. Mensajes programados:
   - Crear mensaje para "Todos" programado para dentro de 2 minutos
   - Esperar → verificar que el cron lo envía
   - Abrir el frontend TV → debe aparecer el overlay con el mensaje
   - Marcar como leído → no debe volver a aparecer
   - Crear mensaje recurrente día 1 del mes → verificar que se crea el siguiente mes

3. Notas:
   - Abrir detalle de un usuario → tab Notas
   - Agregar 2-3 notas
   - Verificar que aparecen con el autor correcto
   - Eliminar una nota → debe desaparecer inmediatamente

4. WhatsApp:
   - Editar usuario → agregar número de teléfono
   - En la tabla de usuarios → verificar que aparece el ícono verde de WhatsApp
   - Click en ícono → seleccionar mensaje → "Abrir WhatsApp"
   - Debe abrir WhatsApp Web / app con el mensaje pre-cargado
   - Verificar que el número está formateado correctamente (549...)
```
