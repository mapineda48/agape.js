# Estándares de Arquitectura: Capa de Servicios

**Ubicación del código:** Todos los servicios deben residir en el directorio `<root>/services`.

## Objetivo

Transicionar el enfoque de los servicios de un modelo "CRUD Simple" a una arquitectura de **"Lógica de Negocio"**. El servicio es el coordinador del proceso, no un simple pasamanos de datos.

---

## 1. Filosofía: Integridad vs. Reglas de Negocio

### La Base de Datos es la primera línea de defensa

No duplicamos validaciones que el motor de base de datos ya garantiza. `agape.js` intercepta las excepciones de Drizzle/Postgres y las traduce a mensajes amigables.

**Anti-patrones a evitar:**

- Validar campos obligatorios (`if (!payload.name)...`) → _Responsabilidad de `NOT NULL`._
- Verificar duplicados antes de insertar → _Responsabilidad de `UNIQUE INDEX`._
- Capturar errores de SQL manualmente (`try/catch` genéricos) → _Responsabilidad de `agape.js`._

### Enfoque: Flujo y Estado

Nos concentramos en **reglas de proceso** que la BD no puede validar por sí sola.

**Ejemplos de validaciones correctas en un servicio:**

- _¿El ítem se puede deshabilitar si tiene órdenes abiertas?_
- _¿La lista de precios está vigente para la fecha de la orden?_
- _¿El usuario tiene permisos sobre esta sucursal específica?_

---

## 2. Política de Transacciones (`db.transaction`)

El uso de transacciones **es obligatorio cuando el caso de uso requiere atomicidad**.

### ¿Cuándo usar una Transacción?

Se debe encapsular la lógica en `db.transaction` cuando la operación cumple la premisa: **"O se hace todo, o no se hace nada"**.

1. **Operaciones Compuestas:** Insertar cabecera y detalles (ej. Orden + Ítems).
2. **Dependencia de Estado:** Cuando lees un dato, calculas algo y luego escribes, y necesitas que ese dato no cambie en medio del proceso.
3. **Múltiples Entidades:** Crear Usuario + Perfil + Configuración inicial.

> **Nota:** Si el servicio es una lectura simple o una escritura unitaria (un solo `insert` sin dependencias complejas), **no** es necesario envolverlo en una transacción para evitar sobrecarga innecesaria.

---

## 3. Estructura Canónica de un Servicio

Al crear o refactorizar un servicio, sigue este flujo:

1. **Entrada (DTO):**
   - Recibir un objeto tipado específicamente para el caso de uso.

2. **Inicio de Transacción (Si aplica):**
   - Si el caso de uso es complejo, abrimos la `tx` aquí.

3. **Lectura de Estado (Hydration):**
   - Cargar datos necesarios para tomar decisiones.

4. **Validación de Reglas de Negocio:**
   - Si el estado no es válido, lanzar un error de dominio (`BusinessRuleError`).
   - No validar nulos ni tipos aquí.

5. **Escritura (Persistencia):**
   - Ejecutar los `insert`, `update` o `delete` en el orden lógico requerido.

6. **Cálculo de Derivadas (Opcional):**
   - Calcular totales, impuestos o actualizar contadores.

7. **Retorno:**
   - Devolver un DTO limpio de salida.

---

## 4. Tipos de Datos Obligatorios

### REGLA: Siempre usar `DateTime` y `Decimal`

Los servicios **DEBEN** usar exclusivamente:

- **`DateTime`** (`#shared/data/DateTime`) para todas las fechas y horas
- **`Decimal`** (`#shared/data/Decimal`) para todos los montos y valores de precisión

### ¿Por qué?

El sistema RPC usa `msgpackr` con extensiones personalizadas para serializar/deserializar estos tipos automáticamente:

```
┌──────────┐     msgpackr      ┌──────────┐     msgpackr      ┌──────────┐
│ Frontend │ ────────────────▶ │   RPC    │ ────────────────▶ │ Backend  │
│          │   (serialize)     │          │  (deserialize)    │          │
├──────────┤                   ├──────────┤                   ├──────────┤
│ DateTime │ ────────────────▶ │  binary  │ ────────────────▶ │ DateTime │
│ Decimal  │   (ext: 40,41)    │  buffer  │   (ext: 40,41)    │ Decimal  │
└──────────┘                   └──────────┘                   └──────────┘
```

### DateTime

`DateTime` extiende `Date` con métodos de `date-fns`:

```typescript
import DateTime from "#shared/data/DateTime";

// Crear instancias
const now = new DateTime();                      // Ahora
const specific = new DateTime("2024-01-15");     // Fecha específica
const fromTimestamp = new DateTime(1705276800000); // Desde epoch

// Métodos útiles
const dueDate = now.addDays(30);                 // +30 días
const reminder = now.addHours(-2);               // -2 horas
if (expiration.isBefore(now)) { ... }            // Comparación
const hours = start.diffInHours(end);            // Diferencia
```

### Decimal

`Decimal` extiende `decimal.js` para manejo preciso de montos:

```typescript
import Decimal from "#shared/data/Decimal";

// Crear instancias
const price = new Decimal("100.00");
const quantity = new Decimal(5);

// Operaciones precisas
const subtotal = price.mul(quantity);            // 500.00
const withTax = subtotal.mul(1.19);              // 595.00
const discount = subtotal.mul(0.1);              // 50.00
const total = withTax.sub(discount);             // 545.00

// Comparaciones
if (total.lte(0)) throw new Error("Invalid");   // Less Than or Equal
if (total.gt(budget)) { ... }                    // Greater Than
```

### Uso Correcto

```typescript
export async function createInvoice(payload: CreateInvoiceInput) {
  // El RPC ya deserializó DateTime - usar directamente
  const issueDate = payload.issueDate ?? new DateTime();

  // Operaciones con DateTime
  const dueDate = issueDate.addDays(terms.dueDays);

  // Decimal viene listo para usar
  if (payload.amount.lte(0)) {
    throw new Error("El monto debe ser mayor a cero");
  }

  await db.insert(invoice).values({
    issueDate: issueDate,     // DateTime serializa automáticamente
    amount: payload.amount,   // Decimal serializa automáticamente
  });
}
```

### Anti-patrones

```typescript
// NO crear helpers de conversión - el RPC ya lo hace
function toDateString(value: Date | string | undefined) { ... }

// NO usar Date nativo
const today = new Date();      // Incorrecto
const today = new DateTime();  // Correcto

// NO usar number para montos
const total = subtotal * 1.19;    // Error de precisión
const total = subtotal.mul(1.19); // Precisión garantizada
```

---

## 5. Resumen del Contrato

| Concepto         | Antes (Evitar)                   | Ahora (Estándar)                          |
| :--------------- | :------------------------------- | :---------------------------------------- |
| **Enfoque**      | CRUD (Insertar datos en tabla X) | Use Case (Registrar evento de negocio X)  |
| **Validación**   | `if (!field) throw`              | Reglas de estado y vigencia               |
| **Integridad**   | Manual en código                 | Constraints de BD (FK, Unique, Not Null)  |
| **Errores**      | Try/Catch manual                 | Middleware de traducción (`agape.js`)     |
| **Consistencia** | Incierta                         | Transacciones para operaciones compuestas |
| **Fechas**       | `Date`, `string`, conversores    | `DateTime` exclusivamente                 |
| **Montos**       | `number`, `float`                | `Decimal` para precisión                  |

---

## 6. Control de Acceso (RBAC)

Tanto los endpoints RPC como los namespaces de WebSocket utilizan el mismo sistema de control de acceso basado en roles (RBAC). El acceso se define mediante **tags JSDoc** en las funciones o namespaces exportados.

### Niveles de Acceso

| Tag JSDoc               | Comportamiento                                    |
| ----------------------- | ------------------------------------------------- |
| `@public`               | Sin autenticación requerida                       |
| _(sin tag)_             | Requiere usuario autenticado (cualquier permiso)  |
| `@permission <nombre>`  | Requiere permiso específico                       |

### Ejemplo: RPC

```typescript
// services/users.ts

/** @public */
export async function login(credentials: LoginInput) {
  // Endpoint público - cualquiera puede acceder
}

export async function getProfile() {
  // Requiere autenticación - cualquier usuario logueado
}

/** @permission admin.users.delete */
export async function deleteUser(id: number) {
  // Requiere permiso específico "admin.users.delete"
}
```

### Ejemplo: WebSocket

```typescript
// services/chat.ts
import { registerNamespace } from "#lib/socket/namespace";

type ChatEvents = {
  "message:send": { text: string };
  "message:received": { id: string; text: string };
};

/**
 * Namespace público - cualquiera puede conectarse
 * @public
 */
const socket = registerNamespace<ChatEvents>();

export default socket;
```

```typescript
// services/admin/dashboard.ts
import { registerNamespace } from "#lib/socket/namespace";

type DashboardEvents = {
  "stats:update": { users: number; sales: number };
};

/**
 * Requiere permiso de administrador para conectarse
 * @permission admin.dashboard
 */
const socket = registerNamespace<DashboardEvents>();

export default socket;
```

### Sistema de Permisos con Wildcards

El sistema soporta coincidencia jerárquica de permisos:

| Permiso del Usuario | Permiso Requerido      | Acceso |
| ------------------- | ---------------------- | ------ |
| `*`                 | _(cualquiera)_         | ✅     |
| `admin.*`           | `admin.users.delete`   | ✅     |
| `admin.users.*`     | `admin.users.delete`   | ✅     |
| `admin.users.read`  | `admin.users.delete`   | ❌     |
| `sales.*`           | `admin.users.delete`   | ❌     |

### Acceso al Contexto del Usuario

#### En RPC

```typescript
import ctx from "#lib/context";

export async function getCurrentUser() {
  const userId = ctx.id;               // ID del usuario autenticado
  const tenant = ctx.tenant;           // Tenant del usuario
  const permissions = ctx.permissions; // Array de permisos
  
  if (ctx.id === 0) {
    // Usuario no autenticado (solo posible en endpoints @public)
  }
}
```

#### En WebSocket

```typescript
import socketCtx from "#lib/socket/context";

socket.on("message:send", async (payload, handlerCtx) => {
  // Opción 1: Usar el contexto del handler
  const userId = handlerCtx.context?.id;
  const socket = handlerCtx.socket;
  
  // Opción 2: Usar el proxy de contexto (dentro de runSocketContext)
  const userId = socketCtx.id;
  const permissions = socketCtx.permissions;
});
```

---

## 7. WebSockets en Tiempo Real

`agape.js` proporciona una API de WebSockets tipo-segura basada en Socket.IO para comunicación bidireccional en tiempo real.

### Autenticación y Autorización

Los namespaces de WebSocket utilizan el mismo sistema RBAC que RPC. La autorización se valida **al momento de la conexión**, no en cada mensaje.

| Configuración                   | Comportamiento                                       |
| ------------------------------- | ---------------------------------------------------- |
| `@public`                       | Cualquiera puede conectarse                          |
| _(sin tag)_                     | Solo usuarios autenticados                           |
| `@permission admin.dashboard`   | Solo usuarios con el permiso específico              |

> **Importante**: Los clientes que intenten conectarse a un namespace sin los permisos adecuados recibirán un error y la conexión será rechazada inmediatamente.

### Definir un Namespace en el Servidor

Crea un archivo en `services/` y exporta un namespace:

```typescript
// services/notifications.ts - Namespace autenticado (requiere login)
import { registerNamespace } from "#lib/socket/namespace";

type NotificationEvents = {
  "notification:new": { id: string; message: string; timestamp: DateTime };
  "notification:read": { id: string };
};

// Sin tag = requiere autenticación
const socket = registerNamespace<NotificationEvents>();

export default socket;
```

```typescript
// services/chat.ts - Namespace público
import { registerNamespace } from "#lib/socket/namespace";

type ChatEvents = {
  "message:send": { text: string; sender: string };
  "message:received": { id: string; text: string; sender: string };
};

/**
 * Chat público - no requiere login
 * @public
 */
const socket = registerNamespace<ChatEvents>();

socket.on("message:send", (payload) => {
  socket.emit("message:received", {
    id: crypto.randomUUID(),
    text: payload.text,
    sender: payload.sender,
  });
});

export default socket;
```

```typescript
// services/admin/realtime.ts - Namespace con permiso específico
import { registerNamespace } from "#lib/socket/namespace";

type AdminEvents = {
  "stats:update": { activeUsers: number };
};

/**
 * Solo administradores pueden conectarse
 * @permission admin.realtime
 */
const socket = registerNamespace<AdminEvents>();

export default socket;
```

El namespace se registra automáticamente en la ruta basada en la ubicación del archivo:
- `services/notifications.ts` → `/notifications`
- `services/chat.ts` → `/chat`
- `services/admin/realtime.ts` → `/admin/realtime`

### Emitir Eventos desde el Servidor

Usa el namespace exportado para emitir eventos a todos los clientes conectados:

```typescript
// services/notifications.ts
import socket from "./notifications";

export async function createNotification(payload: CreateNotificationInput) {
  const notification = await db
    .insert(notifications)
    .values(payload)
    .returning();

  // Emitir a todos los clientes conectados
  socket.emit("notification:new", {
    id: notification.id,
    message: notification.message,
    timestamp: new DateTime(),
  });

  return notification;
}
```

### Escuchar Eventos del Cliente

```typescript
// services/notifications.ts
import { registerNamespace } from "#lib/socket/namespace";
import socketCtx from "#lib/socket/context";

type Events = { 
  "notification:read": { id: string };
};

const socket = registerNamespace<Events>();

// El handler recibe el payload y el contexto
socket.on("notification:read", async (payload, handlerCtx) => {
  // Acceder al usuario que envió el evento
  const userId = handlerCtx.context?.id;
  
  await db
    .update(notifications)
    .set({ readAt: new DateTime() })
    .where(
      and(
        eq(notifications.id, payload.id),
        eq(notifications.userId, userId)
      )
    );
});

export default socket;
```

### Conectarse desde el Cliente (Browser)

El sistema genera automáticamente módulos virtuales para cada namespace:

```typescript
// En un componente React
import socket from "#services/notifications";

function NotificationProvider({ children }) {
  useEffect(() => {
    // 1. Establecer conexión
    const connection = socket.connect();

    // 2. Suscribirse a eventos (tipado automático)
    const unsubscribe = connection.on("notification:new", (payload) => {
      // TypeScript conoce: payload.id, payload.message, payload.timestamp
      showToast(payload.message);
    });

    // 3. Emitir eventos al servidor
    connection.emit("notification:read", { id: "123" });

    // 4. Cleanup al desmontar
    return () => {
      unsubscribe();
      connection.disconnect();
    };
  }, []);

  return children;
}
```

### API del Cliente

| Método                 | Descripción                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `connect()`            | Establece la conexión WebSocket. Retorna una instancia conectada. |
| `on(event, handler)`   | Suscribe a un evento. Retorna función `unsubscribe`.              |
| `off(event, handler?)` | Desuscribe de un evento. Si no se pasa handler, remueve todos.    |
| `emit(event, payload)` | Envía un evento al servidor.                                      |
| `disconnect()`         | Cierra la conexión y limpia recursos.                             |

### Buenas Prácticas

```typescript
// Siempre hacer cleanup
useEffect(() => {
  const connection = socket.connect();
  const unsub = connection.on("event", handler);
  return () => {
    unsub();
    connection.disconnect();
  };
}, []);

// Definir tipos explícitos para eventos
type ChatEvents = {
  "message:new": { userId: string; text: string };
  "message:deleted": { messageId: string };
};

// Evitar eventos sin tipado
socket.emit("unknown-event" as any, data); // No hacer esto
```

### Diagrama de Flujo

```
┌─────────────────┐                          ┌─────────────────┐
│    Cliente      │                          │    Servidor     │
│    (Browser)    │                          │   (services/)   │
├─────────────────┤                          ├─────────────────┤
│                 │   socket.connect()       │                 │
│  import socket  │ ─────────────────────▶   │  RBAC Check     │
│                 │                          │  (JWT + Perms)  │
│                 │   ✓ Conexión OK          │                 │
│                 │ ◀─────────────────────   │  registerNs()   │
│                 │                          │                 │
│   .on(event)    │ ◀───── emit(event) ───── │  socket.emit()  │
│   .emit(event)  │ ─────── emit(event) ───▶ │  socket.on()    │
│                 │                          │                 │
│  .disconnect()  │ ─────────────────────▶   │  (cleanup)      │
└─────────────────┘                          └─────────────────┘
```

### Arquitectura del Sistema de Permisos

```
lib/socket/
├── index.ts           # Servidor Socket.IO + registro de namespaces
├── namespace.ts       # NamespaceManager con soporte de contexto
├── context.ts         # Contexto de usuario para sockets (AsyncLocalStorage)
└── rbac/
    ├── index.ts       # Re-exports del módulo
    ├── permissions.ts # Resolver de permisos (JSDoc → permiso)
    ├── authorization.ts # Validación de acceso a namespaces
    └── permissions.generated.ts # Mapa auto-generado (producción)
```

El sistema de permisos para sockets funciona de manera similar al de RPC:

1. **Desarrollo**: Parsea los tags JSDoc (`@public`, `@permission`) en tiempo real
2. **Producción**: Usa un mapa pre-generado para mejor rendimiento
3. **Validación**: Se ejecuta una única vez al conectar (no en cada mensaje)
