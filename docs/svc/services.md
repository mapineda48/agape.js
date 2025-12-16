# 📘 Estándares de Arquitectura: Capa de Servicios

**Ubicación del código:** Todos los servicios deben residir estrictamente en el directorio `<root>/svc`.

## 🎯 Objetivo

Transicionar el enfoque de los servicios de un modelo "CRUD Simple" a una arquitectura de **"Lógica de Negocio"**. El servicio es el coordinador del proceso, no un simple pasamanos de datos.

---

## 1. Filosofía: Integridad vs. Reglas de Negocio

### 🛡️ La Base de Datos es la primera línea de defensa

No duplicamos validaciones que el motor de base de datos ya garantiza. `agape.js` intercepta las excepciones de Drizzle/Postgres y las traduce a mensajes amigables.

**Lo que DEJAMOS de hacer en el código (Anti-patrones):**

- ❌ Validar campos obligatorios (`if (!payload.name)...`). → _Responsabilidad de `NOT NULL`._
- ❌ Verificar duplicados antes de insertar. → _Responsabilidad de `UNIQUE INDEX`._
- ❌ Capturar errores de SQL manualmente (`try/catch` genéricos). → _Responsabilidad de `agape.js`._

### 🧠 El Nuevo Enfoque: Flujo y Estado

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

1.  **Operaciones Compuestas:** Insertar cabecera y detalles (ej. Orden + Ítems).
2.  **Dependencia de Estado:** Cuando lees un dato, calculas algo y luego escribes, y necesitas que ese dato no cambie en medio del proceso.
3.  **Múltiples Entidades:** Crear Usuario + Perfil + Configuración inicial.

> **Nota:** Si el servicio es una lectura simple o una escritura unitaria (un solo `insert` sin dependencias complejas), **no** es necesario envolverlo en una transacción para evitar sobrecarga innecesaria.

---

## 3. Estructura Canónica de un Servicio

Al crear o refactorizar un servicio, sigue este flujo mental y estructural:

1.  **Entrada (DTO):**

    - Recibir un objeto tipado específicamente para el caso de uso (no necesariamente el modelo crudo de la tabla).

2.  **Inicio de Transacción (Si aplica):**

    - Si el caso de uso es complejo, abrimos la `tx` aquí.

3.  **Lectura de Estado (Hydration):**

    - Cargar datos necesarios para tomar decisiones (ej. buscar el cliente, revisar stock, verificar series).

4.  **Validación de Reglas de Negocio:**

    - Si el estado no es válido (ej. "Producto descontinuado"), lanzar un error de dominio (_BusinessRuleError_).
    - _Recordatorio:_ No validar nulos ni tipos aquí.

5.  **Escritura (Persistencia):**

    - Ejecutar los `insert`, `update` o `delete` en el orden lógico requerido.

6.  **Cálculo de Derivadas (Opcional):**

    - Calcular totales, impuestos o actualizar contadores.

7.  **Retorno:**
    - Devolver un DTO limpio de salida.

---

## 4. Resumen del "Contrato Mental"

| Concepto         | Antes (Evitar)                   | Ahora (Estándar)                          |
| :--------------- | :------------------------------- | :---------------------------------------- |
| **Enfoque**      | CRUD (Insertar datos en tabla X) | Use Case (Registrar evento de negocio X)  |
| **Validación**   | `if (!field) throw`              | Reglas de estado y vigencia               |
| **Integridad**   | Manual en código                 | Constraints de BD (FK, Unique, Not Null)  |
| **Errores**      | Try/Catch manual                 | Middleware de traducción (`agape.js`)     |
| **Consistencia** | Incierta                         | Transacciones para operaciones compuestas |
| **Tipos de Fecha** | `Date`, `string`, conversores | `DateTime` exclusivamente                 |
| **Tipos Numéricos** | `number`, `float`            | `Decimal` para montos y precisión         |

---

## 5. Tipos de Datos Obligatorios

### ⚠️ REGLA: Siempre usar `DateTime` y `Decimal`

Los servicios **DEBEN** usar exclusivamente:

- **`DateTime`** (`#utils/data/DateTime`) para todas las fechas y horas
- **`Decimal`** (`#utils/data/Decimal`) para todos los montos y valores de precisión

### ¿Por qué?

El sistema RPC (Remote Procedure Call) usa `msgpackr` con extensiones personalizadas para serializar/deserializar estos tipos automáticamente:

```
┌──────────┐     msgpackr      ┌──────────┐     msgpackr      ┌──────────┐
│ Frontend │ ────────────▶ │   RPC    │ ────────────▶ │ Backend  │
│          │   (serialize)   │          │  (deserialize)  │          │
├──────────┤                  ├──────────┤                  ├──────────┤
│ DateTime │ ────────────▶ │  binary  │ ────────────▶ │ DateTime │
│ Decimal  │   (ext: 40,41)  │  buffer  │   (ext: 40,41)  │ Decimal  │
└──────────┘                  └──────────┘                  └──────────┘
```

### DateTime

`DateTime` extiende `Date` con métodos de `date-fns`:

```typescript
import DateTime from "#utils/data/DateTime";

// Crear instancias
const now = new DateTime();                    // Ahora
const specific = new DateTime("2024-01-15");   // Fecha específica
const fromTimestamp = new DateTime(1705276800000); // Desde epoch

// Métodos útiles
const dueDate = now.addDays(30);               // +30 días
const reminder = now.addHours(-2);             // -2 horas
if (expiration.isBefore(now)) { ... }          // Comparación
const hours = start.diffInHours(end);          // Diferencia

// Para almacenar en BD (string ISO)
const dateStr = now.toISOString().split("T")[0]; // "2024-01-15"
```

### Decimal

`Decimal` extiende `decimal.js` para manejo preciso de montos:

```typescript
import Decimal from "#utils/data/Decimal";

// Crear instancias
const price = new Decimal("100.00");
const quantity = new Decimal(5);

// Operaciones precisas
const subtotal = price.mul(quantity);          // 500.00
const withTax = subtotal.mul(1.19);            // 595.00
const discount = subtotal.mul(0.1);            // 50.00
const total = withTax.sub(discount);           // 545.00

// Comparaciones
if (total.lte(0)) throw new Error("Invalid"); // Less Than or Equal
if (total.gt(budget)) { ... }                  // Greater Than

// Serialización automática a JSON: "545.00"
```

### ✅ Uso Correcto en Servicios

```typescript
export async function createInvoice(payload: CreateInvoiceInput) {
  // ✅ El RPC ya deserializó DateTime - usar directamente
  const issueDate = payload.issueDate ?? new DateTime();
  
  // ✅ Para insertar en BD, convertir a string
  const issueDateStr = issueDate.toISOString().split("T")[0];
  
  // ✅ Operaciones con DateTime
  const dueDate = issueDate.addDays(terms.dueDays);
  
  // ✅ Decimal viene listo para usar
  if (payload.amount.lte(0)) {
    throw new Error("El monto debe ser mayor a cero");
  }
  
  await db.insert(invoice).values({
    issueDate: issueDateStr,
    amount: payload.amount,  // Decimal serializa automáticamente
  });
}
```

### ❌ Anti-patrones a Evitar

```typescript
// ❌ NO crear helpers de conversión - el RPC ya lo hace
function toDateString(value: Date | string | undefined) { ... }

// ❌ NO usar Date nativo
const today = new Date();  // ❌
const today = new DateTime(); // ✅

// ❌ NO convertir DateTime a Date
const date = new Date(payload.issueDate); // ❌
const date = payload.issueDate; // ✅ Ya es DateTime

// ❌ NO usar instanceof checks innecesarios
if (payload.date instanceof DateTime) { ... } // ❌ Siempre será DateTime

// ❌ NO usar number para montos
const total = subtotal * 1.19;  // ❌ Error de precisión
const total = subtotal.mul(1.19); // ✅ Precisión garantizada
```

---

## 6. Resumen del "Contrato Mental"

| Concepto         | Antes (Evitar)                   | Ahora (Estándar)                          |
| :--------------- | :------------------------------- | :---------------------------------------- |
| **Enfoque**      | CRUD (Insertar datos en tabla X) | Use Case (Registrar evento de negocio X)  |
| **Validación**   | `if (!field) throw`              | Reglas de estado y vigencia               |
| **Integridad**   | Manual en código                 | Constraints de BD (FK, Unique, Not Null)  |
| **Errores**      | Try/Catch manual                 | Middleware de traducción (`agape.js`)     |
| **Consistencia** | Incierta                         | Transacciones para operaciones compuestas |
| **Fechas**       | `Date`, `string`, conversores    | `DateTime` exclusivamente                 |
| **Montos**       | `number`, `float`                | `Decimal` para precisión                  |

