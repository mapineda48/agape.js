# Testing de Servicios (SVC)

Esta guía documenta el patrón estricto para escribir pruebas de integración para los servicios del backend ubicados en `svc/`.

## Índice

- [Filosofía de Testing](#filosofía-de-testing)
- [Configuración del Entorno](#configuración-del-entorno)
- [Estructura de Tests](#estructura-de-tests)
- [Patrón de Imports Dinámicos](#patrón-de-imports-dinámicos)
- [Manejo de Datos de Prueba](#manejo-de-datos-de-prueba)
- [Ejemplo Completo](#ejemplo-completo)
- [Troubleshooting](#troubleshooting)
- [Checklist](#checklist)

---

## Filosofía de Testing

Los tests de servicios en `svc/` son **tests de integración** que:

1. ✅ **Usan una base de datos PostgreSQL real**
2. ✅ **Crean un schema único por ejecución** (evita conflictos de concurrencia)
3. ✅ **No usan mocks** - las consultas reales se ejecutan contra la BD
4. ✅ **Limpian después de ejecutarse** - el schema se elimina al finalizar
5. ✅ **Usan imports dinámicos** - los servicios se importan dentro de cada test

### ⚠️ Diferencia con Tests de Frontend

| Aspecto       | SVC Tests                   | Frontend Tests        |
| ------------- | --------------------------- | --------------------- |
| Tipo          | Integración                 | Unitarios             |
| Base de datos | PostgreSQL real             | Mocks                 |
| Imports       | Dinámicos (dentro de tests) | Estáticos (top-level) |
| Mocking       | No se usa                   | Extensivo             |
| Environment   | Node.js                     | JSDOM                 |

---

## Configuración del Entorno

### Requisitos

1. PostgreSQL corriendo localmente
2. Credenciales en formato: `postgresql://postgres:mypassword@localhost`

### Estructura del Test File

```typescript
import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * IMPORTANTE: No importar servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

beforeAll(async () => {
  // Configuración de la base de datos
});

afterAll(async () => {
  // Limpieza del schema
});

describe("mi servicio", () => {
  // Tests aquí
});
```

---

## Estructura de Tests

### beforeAll: Inicialización de la Base de Datos

```typescript
beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");

  // UUID único para evitar conflictos por concurrencia entre tests paralelos
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_employee_${uuid}`, // Nombre del schema único
    dev: false, // No modo desarrollo
    skipSeeds: true, // Saltar datos semilla
  });
});
```

**Parámetros de `initDatabase`:**

| Parámetro   | Descripción                                                   |
| ----------- | ------------------------------------------------------------- |
| `tenant`    | Nombre del schema. Usa `vitest_<modulo>_<uuid>` para unicidad |
| `dev`       | Si es `true`, habilita logs de desarrollo                     |
| `skipSeeds` | Si es `true`, no ejecuta seeds (recomendado para tests)       |

### afterAll: Limpieza del Schema

```typescript
afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  // Eliminar el schema creado para los tests
  await deleteSchema(config.schemaName, db.$client);

  // Cerrar la conexión a la base de datos
  await db.$client.end();
});
```

**⚠️ Es crítico limpiar el schema** para evitar acumulación de schemas huérfanos en PostgreSQL.

---

## Patrón de Imports Dinámicos

### ❌ Incorrecto: Import Estático

```typescript
// ❌ NO HACER ESTO
import { getEmployeeById, upsertEmployee } from "./employee";
import { upsertDocumentType } from "#svc/core/documentType";

describe("employee service", () => {
  it("should return employee", async () => {
    const result = await getEmployeeById(1);
    // Error: la DB no está inicializada cuando se importa el módulo
  });
});
```

### ✅ Correcto: Import Dinámico

```typescript
describe("employee service", () => {
  it("should return employee", async () => {
    // ✅ Importar DENTRO del test
    const { getEmployeeById, upsertEmployee } = await import("./employee");
    const { upsertDocumentType } = await import("#svc/core/documentType");

    // Ahora la DB ya está inicializada
    const result = await getEmployeeById(1);
  });
});
```

### ¿Por qué imports dinámicos?

Los servicios importan `#lib/db` que contiene la conexión a la base de datos. Si importamos los servicios **antes** de que `beforeAll` inicialice la DB, obtendremos errores como:

- `Cannot read properties of null`
- `Database connection not initialized`
- `Schema does not exist`

---

## Manejo de Datos de Prueba

### Crear Datos Necesarios Primero

La mayoría de servicios tienen dependencias de otros servicios. Siempre crea los datos prerrequisito primero:

```typescript
it("should create a new employee", async () => {
  const { upsertEmployee } = await import("./employee");
  const { upsertDocumentType } = await import("#svc/core/documentType");

  // 1. Primero: crear tipo de documento (dependencia)
  const [docType] = await upsertDocumentType({
    name: "Cédula",
    code: "CC",
    isEnabled: true,
    appliesToPerson: true,
    appliesToCompany: false,
  });

  // 2. Después: crear empleado que requiere documentTypeId
  const result = await upsertEmployee({
    user: {
      documentTypeId: docType.id, // Usar el ID creado
      documentNumber: "123456789",
      email: "test@example.com",
      person: {
        firstName: "Test",
        lastName: "User",
      },
    },
    isActive: true,
  });

  expect(result).toHaveProperty("id");
});
```

### Usar Datos Únicos por Test

Para evitar conflictos entre tests, usa datos únicos:

```typescript
it("test 1", async () => {
  await upsertDocumentType({ code: "CC1", name: "Tipo 1" });
});

it("test 2", async () => {
  await upsertDocumentType({ code: "CC2", name: "Tipo 2" });
});
```

### Compartir Datos Entre Tests (con precaución)

Si múltiples tests necesitan los mismos datos base, puedes crearlos en el primer test y reutilizarlos. Pero ten en cuenta que los tests **deben poder ejecutarse en cualquier orden**:

```typescript
describe("employee service", () => {
  describe("getEmployeeById", () => {
    it("should return an employee by id", async () => {
      // Este test crea el empleado Y lo consulta
      const { getEmployeeById, upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear dependencias
      const [docType] = await upsertDocumentType({ ... });

      // Crear empleado
      const created = await upsertEmployee({ ... });

      // Consultar
      const result = await getEmployeeById(created.id);
      expect(result?.id).toBe(created.id);
    });

    it("should return undefined when not found", async () => {
      // Este test no necesita crear datos
      const { getEmployeeById } = await import("./employee");

      const result = await getEmployeeById(999999);
      expect(result).toBeUndefined();
    });
  });
});
```

---

## Ejemplo Completo

```typescript
import { afterAll, describe, it, expect, beforeAll } from "vitest";

/**
 * IMPORTANTE: No realizar imports de servicios en el top-level.
 * Los servicios dependen de la DB que se inicializa en beforeAll.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_employee_${uuid}`,
    dev: false,
    skipSeeds: true,
  });
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("employee service", () => {
  describe("getEmployeeById", () => {
    it("should return an employee by id", async () => {
      const { getEmployeeById, upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear tipo de documento
      const [docType] = await upsertDocumentType({
        name: "Cédula",
        code: "CC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear empleado
      const created = await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "123456789",
          email: "juan@example.com",
          person: {
            firstName: "Juan",
            lastName: "Pérez",
          },
        },
        isActive: true,
      });

      // Consultar
      const result = await getEmployeeById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.firstName).toBe("Juan");
    });

    it("should return undefined when employee does not exist", async () => {
      const { getEmployeeById } = await import("./employee");

      const result = await getEmployeeById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("listEmployees", () => {
    it("should return paginated employees", async () => {
      const { listEmployees } = await import("./employee");

      const result = await listEmployees({
        pageIndex: 0,
        pageSize: 10,
        includeTotalCount: true,
      });

      expect(result.employees).toBeInstanceOf(Array);
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });

    it("should filter by active status", async () => {
      const { listEmployees, upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      // Crear documento
      const [docType] = await upsertDocumentType({
        name: "DNI",
        code: "DNI",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear empleado inactivo
      await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "DNI999",
          person: { firstName: "Inactive", lastName: "Employee" },
        },
        isActive: false,
      });

      // Consultar solo activos
      const activeResult = await listEmployees({ isActive: true });
      const inactiveResult = await listEmployees({ isActive: false });

      expect(activeResult.employees.every((e) => e.isActive === true)).toBe(
        true
      );
      expect(inactiveResult.employees.some((e) => e.isActive === false)).toBe(
        true
      );
    });
  });

  describe("upsertEmployee", () => {
    it("should create a new employee", async () => {
      const { upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      const [docType] = await upsertDocumentType({
        name: "TI",
        code: "TI",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      const result = await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "TI12345",
          email: "new@example.com",
          person: { firstName: "New", lastName: "Employee" },
        },
        isActive: true,
      });

      expect(result).toHaveProperty("id");
      expect(result.isActive).toBe(true);
    });

    it("should update an existing employee", async () => {
      const { upsertEmployee, getEmployeeById } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      const [docType] = await upsertDocumentType({
        name: "LC",
        code: "LC",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      // Crear
      const created = await upsertEmployee({
        user: {
          documentTypeId: docType.id,
          documentNumber: "LC12345",
          email: "original@example.com",
          person: { firstName: "Original", lastName: "Name" },
        },
        isActive: true,
      });

      // Actualizar
      const updated = await upsertEmployee({
        id: created.id,
        user: {
          id: created.user.id,
          documentTypeId: docType.id,
          documentNumber: "LC12345",
          email: "updated@example.com",
          person: { firstName: "Updated", lastName: "Name" },
        },
        isActive: false,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.isActive).toBe(false);

      // Verificar en BD
      const fromDb = await getEmployeeById(created.id);
      expect(fromDb?.isActive).toBe(false);
    });

    it("should throw error when person data is missing", async () => {
      const { upsertEmployee } = await import("./employee");
      const { upsertDocumentType } = await import("#svc/core/documentType");

      const [docType] = await upsertDocumentType({
        name: "ERR",
        code: "ERR",
        isEnabled: true,
        appliesToPerson: true,
        appliesToCompany: false,
      });

      await expect(
        upsertEmployee({
          user: {
            documentTypeId: docType.id,
            documentNumber: "ERR12345",
            // Sin datos de persona
          },
          isActive: true,
        } as any)
      ).rejects.toThrow("Los empleados deben tener información personal");
    });
  });
});
```

---

## Troubleshooting

### Error: "Database connection not initialized"

**Causa:** Importaste el servicio en el top-level del archivo de test.

**Solución:** Usa import dinámico dentro del test:

```typescript
// ❌ import { myService } from "./myService";

it("test", async () => {
  // ✅
  const { myService } = await import("./myService");
});
```

### Error: "Cannot set properties of null (setting 'select')"

**Causa:** Intentando mockear `db.select` cuando `db` es `null` porque la DB no está inicializada.

**Solución:** Los tests de SVC **no usan mocks**. Usa la DB real con el patrón de `beforeAll`.

### Error: "Schema 'vitest_xxx' does not exist"

**Causa:** El schema fue eliminado antes de que terminaran los tests, o hubo un error en la inicialización.

**Solución:**

1. Verifica que `beforeAll` se ejecute antes que los tests
2. Usa un UUID único en el nombre del schema
3. Revisa los logs de PostgreSQL

### Error: "Duplicate key value violates unique constraint"

**Causa:** Estás usando los mismos datos únicos (como `documentNumber`) en múltiples tests.

**Solución:** Usa datos únicos en cada test:

```typescript
it("test 1", async () => {
  await upsertEmployee({ user: { documentNumber: "DOC001", ... } });
});

it("test 2", async () => {
  await upsertEmployee({ user: { documentNumber: "DOC002", ... } });
});
```

### Error: "No values to set" en onConflictDoUpdate

**Causa:** El objeto `set` de `onConflictDoUpdate` está vacío.

**Solución:** Asegúrate de que siempre haya al menos un campo a actualizar:

```typescript
.onConflictDoUpdate({
  target: table.id,
  set: {
    // Siempre incluir updatedAt
    updatedAt: new DateTime(),
    ...(data.field ? { field: data.field } : {}),
  },
})
```

---

## Checklist

### Antes de crear un test:

- [ ] Archivo ubicado junto al servicio: `svc/module/service.test.ts`
- [ ] Sin imports de servicios en el top-level
- [ ] `beforeAll` con inicialización de DB y UUID único
- [ ] `afterAll` con limpieza del schema y cierre de conexión

### Dentro de cada test:

- [ ] Usar `await import()` para importar servicios
- [ ] Crear dependencias antes de usar el servicio principal
- [ ] Usar datos únicos (evitar colisiones con otros tests)
- [ ] Verificar tanto creación como lectura de datos

### Después de escribir tests:

- [ ] Ejecutar `pnpm test svc/module/service.test.ts --run`
- [ ] Verificar que todos los tests pasen
- [ ] Verificar que no quedan schemas huérfanos en PostgreSQL

---

## Ejecutar Tests

```bash
# Un archivo específico
pnpm test:backend svc/hr/employee.test.ts --run

# Todos los tests de un módulo
pnpm test:backend svc/hr --run

# Todos los tests del backend
pnpm test:backend svc --run
```
