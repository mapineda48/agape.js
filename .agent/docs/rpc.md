# Sistema RPC de Agape.js

## Introducción

El sistema RPC (Remote Procedure Call) de agape.js permite llamar funciones del backend desde el frontend como si fueran llamadas locales. Esta arquitectura elimina la necesidad de definir manualmente rutas REST, ya que las funciones exportadas en `services/` se exponen automáticamente como endpoints.

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐  │
│  │ Componente React │───▶│ #services/users  │───▶│ web/utils/rpc.ts  │  │
│  │                  │    │ (Virtual Module) │    │ (makeClientRpc)   │  │
│  └─────────────────┘    └──────────────────┘    └─────────┬─────────┘  │
└─────────────────────────────────────────────────────────────┼───────────┘
                                                              │
                                    POST /users/getById       │
                                    Content-Type: multipart   │
                                    Accept: msgpack           │
                                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────────┐  │
│  │  Express Server  │───▶│  RPC Middleware  │───▶│ services/users.ts │  │
│  │                  │    │ lib/rpc/         │    │   getById(id)     │  │
│  └──────────────────┘    └──────────────────┘    └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Flujo de una Llamada RPC

1. **Frontend importa** la función desde un módulo virtual (`#services/users`)
2. **Vite resuelve** el módulo virtual y genera código que usa `makeClientRpc`
3. **Se serializan** los argumentos con MessagePack
4. **Se envía** una petición POST con `multipart/form-data`
5. **El middleware RPC** decodifica los argumentos y ejecuta la función
6. **El resultado** se serializa con MessagePack y se devuelve al frontend

---

## Creación de Servicios RPC

### Estructura Básica

Crear un archivo en el directorio `services/`:

```typescript
// services/products.ts
import { db } from "#lib/db";
import { products } from "#models/products";
import { eq } from "drizzle-orm";

/**
 * Lista todos los productos.
 * Sin tag de permisos = requiere autenticación básica.
 */
export async function list() {
  return db.query.products.findMany();
}

/**
 * Obtiene un producto por ID.
 * @permission products.read
 */
export async function getById(id: number) {
  return db.query.products.findFirst({ 
    where: eq(products.id, id) 
  });
}

/**
 * Crea un nuevo producto.
 * @permission products.write
 */
export async function create(data: { name: string; price: number }) {
  const [product] = await db.insert(products).values(data).returning();
  return product;
}

/**
 * Catálogo público - no requiere autenticación.
 * @public
 */
export function getCatalog() {
  return db.query.products.findMany({
    where: eq(products.isPublic, true),
  });
}
```

### Mapeo de Rutas

| Archivo | Export | Endpoint HTTP |
|---------|--------|---------------|
| `services/users.ts` | `default` | `POST /users` |
| `services/users.ts` | `getById` | `POST /users/getById` |
| `services/admin/roles.ts` | `create` | `POST /admin/roles/create` |
| `services/public.ts` | `sayHello` | `POST /public/sayHello` |

**Regla**: El export `default` se mapea a la raíz del módulo. Los demás exports usan su nombre.

---

## Control de Acceso con JSDoc

El sistema usa etiquetas JSDoc para definir permisos:

### `@public` - Sin Autenticación

```typescript
/**
 * Cualquier usuario puede acceder, incluso sin autenticación.
 * @public
 */
export function getPublicInfo() {
  return { version: "1.0.0" };
}
```

### Sin Etiqueta - Requiere Autenticación

```typescript
/**
 * Requiere que el usuario esté autenticado.
 * Cualquier usuario autenticado puede acceder.
 */
export function getProfile() {
  return db.query.users.findFirst({ where: eq(users.id, ctx.id) });
}
```

### `@permission` - Permiso Específico

```typescript
/**
 * Solo usuarios con el permiso "admin.users.delete" pueden acceder.
 * @permission admin.users.delete
 */
export async function deleteUser(userId: number) {
  await db.delete(users).where(eq(users.id, userId));
}
```

### Sistema de Wildcards

Los permisos soportan wildcards para jerarquías:

| Permiso del Usuario | Permite Acceso a |
|---------------------|------------------|
| `*` | Todo (super admin) |
| `sales.*` | `sales.create`, `sales.read`, `sales.flow.approve`, etc. |
| `admin.users.*` | `admin.users.create`, `admin.users.delete`, etc. |

---

## Uso en el Frontend

### Importar y Usar Servicios

```typescript
// En cualquier componente React
import { list, getById, create, getCatalog } from "#services/products";

function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    list().then(setProducts);
  }, []);

  const handleCreate = async () => {
    const newProduct = await create({ name: "Widget", price: 9.99 });
    setProducts((prev) => [...prev, newProduct]);
  };

  return (/* ... */);
}
```

### Subir Archivos

Los archivos `File` se extraen automáticamente y se envían como multipart:

```typescript
import { uploadDocument } from "#services/documents";

async function handleUpload(file: File) {
  // El archivo se envía automáticamente como parte del multipart
  const result = await uploadDocument(file, { description: "Mi archivo" });
}
```

En el backend:

```typescript
// services/documents.ts
import type { File } from "#shared/data/File";

export async function uploadDocument(file: File, metadata: { description: string }) {
  // 'file' es un objeto File con: name, type, size, filepath
  console.log(file.name);     // nombre original
  console.log(file.filepath); // ruta temporal en el servidor
  // Procesar archivo...
}
```

---

## Contexto de Petición

Cada petición RPC tiene acceso a un contexto con información del usuario:

```typescript
// services/orders.ts
import ctx from "#lib/context";

export async function getMyOrders() {
  const userId = ctx.id;                 // ID del usuario autenticado
  const permissions = ctx.permissions;   // Array de permisos
  const tenant = ctx.tenant;             // Tenant actual
  const session = ctx.session;           // Map para datos de sesión

  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
  });
}
```

---

## Manejo de Errores

### Errores Personalizados

El sistema provee clases de error predefinidas en `lib/error.ts`:

```typescript
import { 
  NotFoundError, 
  ValidationError, 
  ForbiddenError,
  BusinessRuleError 
} from "#lib/error";

export async function cancelOrder(orderId: number) {
  const order = await db.query.orders.findFirst({ 
    where: eq(orders.id, orderId) 
  });

  if (!order) {
    throw new NotFoundError("Orden no encontrada");
  }

  if (order.status === "shipped") {
    throw new BusinessRuleError("No se puede cancelar una orden enviada");
  }

  if (order.userId !== ctx.id) {
    throw new ForbiddenError("No tienes permiso para cancelar esta orden");
  }

  // Cancelar...
}
```

### Errores de Base de Datos

Los errores de PostgreSQL se normalizan automáticamente:

| Error PostgreSQL | Mensaje para Usuario |
|------------------|---------------------|
| `unique_violation` | "El valor para 'X' ya existe..." |
| `foreign_key_violation` | "No se puede eliminar porque tiene registros relacionados" |
| `not_null_violation` | "El campo 'X' es requerido" |

### Capturar Errores en Frontend

```typescript
import { create } from "#services/products";

try {
  await create({ name: "", price: -1 });
} catch (error) {
  // El error viene deserializado desde el backend
  console.error(error.message); // "El campo 'name' es requerido"
}
```

---

## Tipos de Datos Especiales

El sistema usa MessagePack con extensiones personalizadas para tipos especiales:

### DateTime

```typescript
import { DateTime } from "#shared/data/DateTime";

export function createEvent(name: string, date: DateTime) {
  // DateTime se serializa/deserializa automáticamente
  console.log(date.toISO()); // "2024-01-15T10:30:00.000Z"
}
```

### Decimal

```typescript
import Decimal from "decimal.js";

export function calculateTotal(items: { price: Decimal; quantity: number }[]) {
  // Decimal mantiene precisión en la serialización
  return items.reduce(
    (sum, item) => sum.plus(item.price.times(item.quantity)),
    new Decimal(0)
  );
}
```

### File

```typescript
import type { File } from "#shared/data/File";

export async function processImage(image: File) {
  // Propiedades disponibles:
  // - image.name: nombre original
  // - image.type: MIME type
  // - image.size: tamaño en bytes
  // - image.filepath: ruta temporal en servidor
}
```

---

## Socket.IO con RPC

Para funcionalidad en tiempo real, el sistema soporta namespaces de Socket.IO:

### Crear un Namespace

```typescript
// services/chat.ts
import { registerNamespace } from "#lib/socket/namespace";
import type { ConnectedSocket } from "#lib/socket/namespace";

// Definir eventos tipados
type ChatEvents = {
  "message:send": { text: string; sender: string };
  "message:received": { id: string; text: string; sender: string; timestamp: number };
  "user:typing": { userId: string };
};

const socket = registerNamespace<ChatEvents>();

// Registrar handlers
socket.on("message:send", (payload) => {
  socket.emit("message:received", {
    id: crypto.randomUUID(),
    ...payload,
    timestamp: Date.now(),
  });
});

// Exportar como default para que sea reconocido como socket
export default socket as ConnectedSocket<ChatEvents>;
```

### Usar en Frontend

```typescript
import socket from "#services/chat";

const chat = socket.connect();

// Escuchar eventos
chat.on("message:received", (message) => {
  console.log(`${message.sender}: ${message.text}`);
});

// Emitir eventos
chat.emit("message:send", { text: "Hola!", sender: "Usuario" });

// Desconectar
chat.disconnect();
```

---

## Archivos Clave

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| **Middleware RPC** | `lib/rpc/middleware.ts` | Procesa peticiones y ejecuta funciones |
| **Decodificación Args** | `lib/rpc/args.ts` | Parsea multipart y MessagePack |
| **Mapeo de Rutas** | `lib/rpc/path.ts` | Genera rutas desde archivos |
| **Manejo de Errores** | `lib/rpc/error.ts` | Normaliza errores de BD |
| **Autorización** | `lib/rpc/rbac/authorization.ts` | Valida permisos |
| **Contexto** | `lib/context.ts` | AsyncLocalStorage para contexto de petición |
| **Errores Custom** | `lib/error.ts` | Clases de error predefinidas |
| **MessagePack** | `shared/msgpackr.ts` | Configuración de serialización |
| **Cliente RPC** | `web/utils/rpc.ts` | Función `makeClientRpc` para frontend |
| **Plugin Vite** | `lib/vite/vite-plugin.ts` | Resuelve módulos virtuales |
| **Generador Virtual** | `lib/vite/virtual-module.ts` | Genera código para `#services/*` |
| **Socket Manager** | `lib/socket/namespace.ts` | Gestión de namespaces Socket.IO |

---

## Resumen Rápido

1. **Crear servicio**: Agregar archivo en `services/` con funciones exportadas
2. **Definir permisos**: Usar `@public`, sin etiqueta, o `@permission nombre`
3. **Usar en frontend**: Importar desde `#services/nombreModulo`
4. **Archivos**: Los `File` se envían automáticamente como multipart
5. **Errores**: Lanzar errores de `lib/error.ts` - se serializan al frontend
6. **Contexto**: Usar `ctx` de `#lib/context` para acceder al usuario actual
7. **Tiempo real**: Usar `registerNamespace()` y exportar como `default`
