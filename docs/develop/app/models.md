## Introducción

### ¿Cómo mapear la herencia de OOP a una base de datos relacional?

En Programación Orientada a Objetos estamos acostumbrados a modelar el mundo con herencia:

- `class Item`
- `class Service extends Item`
- `class InventoryItem extends Item`
- `class Company extends User`
- `class Person extends User`

Pero las bases de datos relacionales (SQL) no entienden de clases ni herencia; entienden de **tablas, filas y relaciones**. El reto clásico es:

> **¿Cómo mapear la herencia de la Programación Orientada a Objetos (OOP) a una Base de Datos Relacional (SQL)?**

A lo largo de los años se han consolidado tres patrones principales:

1. **Table-per-Hierarchy (TPH)** – una sola tabla con muchos campos opcionales.
2. **Table-per-Concrete-Class (TPC)** – una tabla por tipo concreto, sin padre común en SQL.
3. **Class Table Inheritance (CTI o Table-per-Type)** – una tabla para la clase base y tablas adicionales para cada subtipo.

En el contexto de sistemas ERP grandes (SAP, Odoo, Oracle NetSuite, Dynamics 365, etc.), el patrón que más se acerca al **“estándar de oro”** es precisamente **Class Table Inheritance**:

- Una **tabla maestra** que representa el concepto genérico.
- Tablas de **detalle especializadas**, con la misma PK que la tabla maestra (PK = FK).

Este patrón es el que permite:

- Reutilizar identidad y datos comunes.
- Extender el dominio con nuevos tipos sin duplicar estructuras.
- Mantener integridad referencial y evitar inconsistencias.

---

### Dominios primero, tablas después

Otro principio clave del diseño es que **las nuevas entidades deben vivir bajo un dominio funcional bien definido**:

- `core` → identidad, party (user, person, company).
- `catalogs` → maestro de ítems, categorías.
- `crm` → clientes, órdenes comerciales.
- `purchasing` → proveedores, órdenes de compra.
- `inventory` → movimientos, stock.
- `finance` → facturas, cuentas por cobrar/pagar.
- `hr` → empleados, roles internos.
- `security` → usuarios de acceso, credenciales.
- `numbering` → numeración de documentos.
- `agape` → configuración global.

La **prioridad** siempre debe ser:

> Antes de crear tablas nuevas “sueltas”, buscar si el concepto encaja en un dominio existente o nuevo y si debe extender un maestro mediante CTI.

---

### Item Master + CTI: el estándar de oro en ERPs

En el mundo ERP se habla mucho del **“Maestro de Ítems” (Item Master)**:

- Una entidad central (`item`) que representa “algo vendible/comprable”:

  - Bien físico.
  - Servicio.
  - Otros: cargos, bundles, licencias, etc.

La implementación habitual es:

- Una **tabla principal `item`**, con los datos comunes (código, nombre, precio base, tipo).
- Tablas de **detalle por tipo**, siguiendo CTI:

  - `service` para ítems de tipo servicio.
  - `inventory_item` para bienes físicos inventariables.
  - En el futuro: `bundle_item`, `charge_item`, etc.

Esto es exactamente el patrón **Class Table Inheritance aplicado al catálogo de productos/servicios**, y es el estándar en ERPs escalables, porque:

- Permite que todos los flujos de negocio apunten a un único `item_id`.
- Evita tener 10 tablas de productos distintas repartidas por el sistema.
- Hace que el sistema sea ampliable sin romper lo existente.

---

### ¿Siempre hay que usar CTI? No. También hay excepciones

Aunque CTI y el “Item Master” son la regla general para dominios críticos (identidad, catálogo, inventario, clientes/proveedores), **no todo tiene que ser herencia**.

Hay casos donde es válido **no** aplicar CTI:

- Entidades muy simples y aisladas (por ejemplo, catálogos pequeños, tablas de configuración).
- Optimización extrema de rendimiento en casos específicos.
- Integraciones con sistemas legados que imponen su propio modelo.
- Funcionalidades experimentales que luego se refactorizan.

La idea no es fanatizarse con el patrón, sino usarlo como **regla por defecto**, sabiendo que se puede romper **solo cuando haya una razón fuerte y documentada**.

---

## Cierre

En conjunto, todo este modelo sigue dos ideas fuerza:

1. **Dominios claros** (core, catalogs, inventory, crm, purchasing, finance, hr, security, numbering, agape), donde cada tabla tiene un contexto funcional bien definido.
2. **Patrones de “Maestro + CTI”** para los conceptos centrales:

   - `user` + `person` + `company` + `client` + `supplier` + `employee`.
   - `item` + `service` + `inventory_item`.
   - Documentos de negocio apoyados en `numbering_*` para la numeración.

## Migración

### Tabla de mapeo

Se debe ejecutar el comando `pnpm drizzle-kit generate` para generar la tabla de mapeo.
