# Data Transfer Objects (DTOs)

Este documento describe la arquitectura de DTOs (Data Transfer Objects) utilizada en el proyecto para garantizar un contrato claro entre el backend (`svc`) y el frontend (`web`), facilitando el desarrollo independiente y las pruebas unitarias.

## Índice

- [Principios Fundamentales](#principios-fundamentales)
- [Estructura de Directorios](#estructura-de-directorios)
- [Definición de DTOs](#definición-de-dtos)
- [Uso en Servicios (svc)](#uso-en-servicios-svc)
- [Uso en Frontend (web)](#uso-en-frontend-web)
- [Mocks para Pruebas Unitarias](#mocks-para-pruebas-unitarias)
- [Configuración de Vitest](#configuración-de-vitest)
- [Ejemplo Completo: Catalogs/Item](#ejemplo-completo-catalogsitem)

---

## Principios Fundamentales

### 1. Separación de Responsabilidades

Los DTOs definen el **contrato de comunicación** entre frontend y backend:

- **Backend (svc)**: Implementa la lógica de negocio y persiste datos
- **Frontend (web)**: Consume los servicios a través de los DTOs
- **DTOs (lib/utils)**: Tipos compartidos sin dependencias de ningún entorno

### 2. Reglas de Dependencia

```
┌─────────────────────────────────────────────────────────────┐
│                      lib/utils/dto                          │
│                  (Tipos puros, sin lógica)                  │
│                                                             │
│  ✅ Puede usar: Decimal, DateTime (de lib/utils/data)       │
│  ❌ NO puede usar: #models, #lib/db, drizzle, etc.          │
└─────────────────────────────────────────────────────────────┘
                           ▲
              ┌────────────┴────────────┐
              │                         │
     ┌────────┴────────┐       ┌───────┴───────┐
     │      svc        │       │     web       │
     │   (Backend)     │       │  (Frontend)   │
     │                 │       │               │
     │ Importa DTOs    │       │ Importa DTOs  │
     │ vía #utils      │       │ vía @utils    │
     └─────────────────┘       └───────────────┘
```

### 3. Cuándo Crear un DTO

| Escenario | ¿Crear DTO? | Razón |
|-----------|-------------|-------|
| Parámetro primitivo (`id: number`) | ❌ No | Los primitivos no crean acoplamiento |
| Parámetro objeto simple | ✅ Sí | Objetos requieren interfaces compartidas |
| Respuesta con estructura compleja | ✅ Sí | El frontend necesita tipar la respuesta |
| Filtros de búsqueda/paginación | ✅ Sí | Contratos de API claros |

---

## Estructura de Directorios

```
lib/
└── utils/
    ├── data/                    # Tipos primitivos extendidos
    │   ├── Decimal.ts           # Manejo de decimales
    │   └── DateTime.ts          # Fechas con serialización
    │
    └── dto/                     # DTOs organizados por módulo
        ├── index.ts             # Re-exporta todos los módulos
        │
        └── catalogs/            # DTOs del módulo catalogs
            ├── index.ts         # Re-exporta DTOs del módulo
            └── item.ts          # DTOs para ítems

svc/
└── catalogs/
    ├── item.ts                  # Servicio que usa los DTOs
    └── item.test.ts             # Pruebas unitarias

web/
└── test/
    └── mocks/
        └── catalogs/            # Mocks para pruebas frontend
            ├── index.ts
            └── item.ts          # Mock del servicio de ítems
```

---

## Definición de DTOs

### Ubicación

Todos los DTOs se definen en `lib/utils/dto/[módulo]/[entidad].ts`.

### Ejemplo: `lib/utils/dto/catalogs/item.ts`

```typescript
import type Decimal from "../../data/Decimal";

/**
 * Tipos de ítem disponibles en el catálogo.
 */
export type ItemType = "good" | "service";

/**
 * Valores válidos para validación en runtime.
 */
export const ITEM_TYPE_VALUES: readonly ItemType[] = ["good", "service"];

/**
 * Datos de un bien físico (producto inventariable).
 */
export interface IGood {
  uomId: number;
  minStock?: Decimal | null;
  maxStock?: Decimal | null;
  reorderPoint?: Decimal | null;
}

/**
 * Datos de un servicio.
 */
export interface IService {
  durationMinutes?: number | null;
  isRecurring?: boolean;
}

/**
 * DTO para crear/actualizar un ítem de tipo bien físico.
 */
export interface IItemGood extends IItemBase {
  good: IGood;
  service?: never;  // Exclusión mutua
  images?: (string | File)[];
}

/**
 * DTO para crear/actualizar un ítem de tipo servicio.
 */
export interface IItemService extends IItemBase {
  service: IService;
  good?: never;     // Exclusión mutua
  images?: (string | File)[];
}

/**
 * DTO general de entrada para upsertItem.
 */
export type IItem = IItemGood | IItemService;

/**
 * Parámetros para listItems (filtros y paginación).
 */
export interface ListItemsParams {
  fullName?: string;
  code?: string;
  isEnabled?: boolean;
  type?: ItemType;
  categoryId?: number;
  minPrice?: Decimal;
  maxPrice?: Decimal;
  rating?: number;
  includeTotalCount?: boolean;
  pageIndex?: number;
  pageSize?: number;
}
```

### Buenas Prácticas

1. **Documentar con JSDoc**: Cada interfaz y propiedad debe tener documentación clara
2. **Exclusión mutua con `never`**: Usar `propertyX?: never` para tipos discriminados
3. **Constantes para validación**: Exportar arrays de valores válidos para validación runtime
4. **Tipos opcionales explícitos**: Usar `| null` cuando el campo puede ser nulo en BD

---

## Uso en Servicios (svc)

### Importación

Los servicios importan los DTOs usando el alias `#utils`:

```typescript
// svc/catalogs/item.ts
import { db } from "#lib/db";
import { item, type NewItem, type Item } from "#models/catalogs/item";
import { inventoryItem } from "#models/inventory/item";
// ...otras dependencias del backend

// DTOs compartidos con el frontend
import type {
  IGood,
  IService,
  IItemGood,
  IItemService,
  IItem,
  IItemRecord,
  ListItemsParams,
  ListItemItem,
  ListItemsResult,
} from "#utils/dto/catalogs/item";
```

### Implementación

```typescript
export async function upsertItem(
  payload: IItemGood
): Promise<IItemRecord & { good: IGood; service?: never }>;

export async function upsertItem(
  payload: IItemService
): Promise<IItemRecord & { service: IService; good?: never }>;

export function upsertItem(payload: IItem): Promise<IItemRecord>;

export async function upsertItem(payload: IItem): Promise<IItemRecord> {
  // Implementación usando payload tipado por DTOs
}
```

### Re-exportación

Al final del archivo de servicio, re-exportar los DTOs para mantener compatibilidad:

```typescript
// Re-exportar DTOs compartidos con frontend
export type {
  IGood,
  IService,
  IItemGood,
  IItemService,
  IItem,
  IItemRecord,
  ListItemsParams,
  ListItemItem,
  ListItemsResult,
} from "#utils/dto/catalogs/item";
```

---

## Uso en Frontend (web)

### Importación de Tipos

El frontend importa los DTOs usando el alias `@utils`:

```typescript
// web/app/cms/inventory/products/page.tsx
import type { IItem, IItemGood, ListItemsParams } from "@utils/dto/catalogs/item";
```

### Importación de Servicios

Para llamadas al backend, el frontend importa desde los módulos `@agape/*`:

```typescript
import { upsertItem, listItems } from "@agape/catalogs/item";
```

> **Nota**: En tiempo de ejecución, estos imports se resuelven al servicio real.
> En pruebas unitarias, se resuelven a los mocks (ver sección siguiente).

---

## Mocks para Pruebas Unitarias

### ¿Por qué Mockear?

1. **Aislamiento**: Las pruebas de UI no deben depender del backend real
2. **Velocidad**: Evitar conexiones a BD y servicios externos
3. **Control**: Simular diferentes escenarios (errores, datos vacíos, etc.)
4. **Determinismo**: Resultados predecibles y reproducibles

### Estructura del Mock

Cada servicio debe tener un mock correspondiente en `web/test/mocks/[módulo]/[entidad].ts`:

```typescript
// web/test/mocks/catalogs/item.ts
import { vi } from "vitest";

// Re-exportar DTOs desde utils para uso en tests
export type {
  ItemType,
  IGood,
  IService,
  IItemBase,
  IItemGood,
  IItemService,
  IItem,
  ListItemsParams,
  ListItemItem,
  ListItemsResult,
  IItemRecord,
} from "@utils/dto/catalogs/item";

// Constantes también disponibles
export { ITEM_TYPE_VALUES } from "@utils/dto/catalogs/item";

// Mocks de funciones del servicio
export const getItemById = vi.fn();
export const getItemByCode = vi.fn();
export const listItems = vi.fn();
export const upsertItem = vi.fn();
```

### Uso en Tests

```typescript
// web/app/cms/inventory/products/page.test.tsx
import { render, screen } from "@testing-library/react";
import { upsertItem, listItems } from "@agape/catalogs/item";
import type { IItemGood } from "@agape/catalogs/item";
import Decimal from "@utils/data/Decimal";

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list items on load", async () => {
    // Configurar mock
    (listItems as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          id: 1,
          code: "PROD-001",
          fullName: "Producto Test",
          isEnabled: true,
          type: "good",
          basePrice: new Decimal("100.00"),
          category: "Electrónicos",
          images: [],
          rating: 5,
        },
      ],
      totalCount: 1,
    });

    render(<ProductsPage />);

    // Verificar que listItems fue llamado
    expect(listItems).toHaveBeenCalled();
    
    // Verificar que el ítem se muestra
    expect(await screen.findByText("Producto Test")).toBeInTheDocument();
  });

  it("should create a new item", async () => {
    const newItem: IItemGood = {
      code: "NEW-001",
      fullName: "Nuevo Producto",
      basePrice: new Decimal("50.00"),
      isEnabled: true,
      good: { uomId: 1 },
    };

    (upsertItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2,
      ...newItem,
      type: "good",
    });

    // ... interacción con el formulario

    expect(upsertItem).toHaveBeenCalledWith(
      expect.objectContaining({ code: "NEW-001" })
    );
  });
});
```

---

## Configuración de Vitest

### Alias en `vitest.config.ts`

Para que los tests del frontend resuelvan los imports de servicios a los mocks:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    projects: [
      // Proyecto backend
      {
        test: {
          name: "backend",
          environment: "node",
          include: ["svc/**/*.test.ts", "lib/**/*.test.ts"],
        },
        resolve: {
          alias: {
            "#utils": path.resolve(__dirname, "lib/utils"),
            "#models": path.resolve(__dirname, "models"),
            "#lib": path.resolve(__dirname, "lib"),
            "#svc": path.resolve(__dirname, "svc"),
          },
        },
      },
      // Proyecto frontend
      {
        test: {
          name: "frontend",
          environment: "jsdom",
          globals: true,
          setupFiles: "./web/test/setup.ts",
          include: ["web/**/*.test.ts", "web/**/*.test.tsx"],
        },
        plugins: [react()],
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./web"),
            "@utils": path.resolve(__dirname, "./lib/utils"),
            
            // ⬇️ IMPORTANTE: Mapear servicios a mocks
            "@agape/catalogs/item": path.resolve(
              __dirname,
              "./web/test/mocks/catalogs/item.ts"
            ),
            "@agape/core/user": path.resolve(
              __dirname,
              "./web/test/mocks/user.ts"
            ),
            "@agape/hr/employee": path.resolve(
              __dirname,
              "./web/test/mocks/employee.ts"
            ),
            // ... agregar más servicios según sea necesario
          },
        },
      },
    ],
  },
});
```

### Agregar Nuevo Servicio

Cuando se crea un nuevo servicio, seguir estos pasos:

1. **Crear DTOs** en `lib/utils/dto/[módulo]/[entidad].ts`
2. **Exportar desde índice** en `lib/utils/dto/[módulo]/index.ts`
3. **Implementar servicio** en `svc/[módulo]/[entidad].ts` usando DTOs
4. **Crear mock** en `web/test/mocks/[módulo]/[entidad].ts`
5. **Agregar alias** en `vitest.config.ts` para el proyecto frontend

---

## Ejemplo Completo: Catalogs/Item

### 1. DTO (`lib/utils/dto/catalogs/item.ts`)

Define los tipos compartidos:
- `IItem`, `IItemGood`, `IItemService` - Para crear/actualizar
- `ListItemsParams` - Para filtrar/paginar
- `ListItemsResult`, `ListItemItem` - Para resultados

### 2. Servicio (`svc/catalogs/item.ts`)

```typescript
// Importar DTOs
import type {
  IItem,
  ListItemsParams,
  ListItemsResult,
} from "#utils/dto/catalogs/item";

// Implementar funciones
export async function upsertItem(payload: IItem) { ... }
export async function listItems(params: ListItemsParams): Promise<ListItemsResult> { ... }

// Re-exportar DTOs
export type { IItem, ListItemsParams, ListItemsResult } from "#utils/dto/catalogs/item";
```

### 3. Mock (`web/test/mocks/catalogs/item.ts`)

```typescript
import { vi } from "vitest";

// Re-export types for test files
export type { IItem, ListItemsParams, ListItemsResult } from "@utils/dto/catalogs/item";

// Mock functions
export const upsertItem = vi.fn();
export const listItems = vi.fn();
```

### 4. Vitest Config

```typescript
"@agape/catalogs/item": path.resolve(__dirname, "./web/test/mocks/catalogs/item.ts"),
```

### 5. Test (`web/app/cms/inventory/products/page.test.tsx`)

```typescript
import { listItems } from "@agape/catalogs/item";

beforeEach(() => {
  (listItems as ReturnType<typeof vi.fn>).mockResolvedValue({
    items: [...],
    totalCount: 10,
  });
});
```

---

## Checklist para Nuevos DTOs

- [ ] Crear archivo en `lib/utils/dto/[módulo]/[entidad].ts`
- [ ] Definir interfaces con JSDoc
- [ ] NO importar nada de `#models`, `#lib/db`, `drizzle`
- [ ] Solo usar tipos de `lib/utils/data` (Decimal, DateTime)
- [ ] Exportar desde `lib/utils/dto/[módulo]/index.ts`
- [ ] Actualizar `lib/utils/dto/index.ts` si es nuevo módulo
- [ ] Importar en servicio con `#utils/dto/...`
- [ ] Re-exportar desde el servicio
- [ ] Crear mock en `web/test/mocks/[módulo]/[entidad].ts`
- [ ] Agregar alias en `vitest.config.ts`
- [ ] Escribir pruebas unitarias del servicio en `svc/`
- [ ] Escribir pruebas unitarias del frontend usando mocks
