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
