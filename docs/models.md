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

## Visión general del modelo actual (explicado para producto/usuario)

A continuación se describe, en términos funcionales, lo que ya está implementado en la base de datos. La idea es que cualquier persona (PO, dev nuevo, consultor) entienda **qué representa cada módulo** y **cómo se relacionan entre sí**, sin entrar al detalle del código.

---

### 1. `agape`: configuración global

- **Tabla `agape`**: actúa como un “registro clave-valor” global.
- Se usa para **configuraciones del sistema** o datos globales:

  - Parámetros, flags, ajustes de comportamiento.

- Cada registro tiene:

  - Una clave única (`key`).
  - Un valor en formato JSON (`value`).
  - Fechas de creación/actualización.

Piensa en esto como un **“registry” central** para guardar configuraciones sin tener que crear tablas nuevas cada vez que se agrega un setting.

---

### 2. `catalogs`: Maestro de Ítems (Item Master)

Este dominio resuelve “qué vendemos/compramos” y cómo se organiza el catálogo.

#### 2.1 Categorías y subcategorías

- **`catalogs_categories`**: lista de **categorías** de catálogo (p.ej. “Herramientas”, “Servicios de instalación”).
- **`catalogs_subcategories`**: lista de **subcategorías**, cada una asociada a una categoría.
- Ambas tienen flags de habilitado para controlar lo que se muestra en el catálogo.

Esto permite navegar el catálogo de forma jerárquica:
**Categoría → Subcategorías → Ítems**.

#### 2.2 Tipo de ítem (enum)

- Enum **`catalogs_item_type`** con valores:

  - `good` → bien físico inventariable.
  - `service` → servicio.

Este tipo se usa en el maestro de ítems para saber qué detalle aplicar.

#### 2.3 Maestro de ítems (`catalogs_item`)

- Representa **cualquier cosa que se pueda vender o comprar**:

  - Un producto físico.
  - Un servicio.
  - En el futuro, otros tipos (cargos, bundles, etc.).

A nivel funcional, un ítem tiene:

- Código interno / SKU (único en el catálogo).
- Nombre, slogan y descripción.
- Tipo (`good` o `service`).
- Estado habilitado.
- Precio base.
- Categoría y subcategoría opcionales.
- **Grupo de impuestos** (`taxGroupId`): define qué impuestos aplican al ítem.
- **Grupo contable** (`itemAccountingGroupId`): define a qué cuentas se postean las operaciones.
- Imágenes en JSON.

Es la tabla **central** para todo lo que tenga que ver con productos/servicios.

#### 2.4 Detalle de servicio (`catalogs_service`)

- Tabla de **detalle para ítems de tipo servicio** (CTI aplicado al Item Master).
- Comparte el mismo `id` que el ítem (PK = FK a `catalogs_item`).
- Permite guardar:

  - Duración en minutos.
  - Si es un servicio recurrente.

Cuando un ítem es de tipo servicio, su información específica vive aquí.

#### 2.5 Listas de precios (`catalogs_price_list`)

- Representa **diferentes listas de precios** del sistema:

  - Retail, Mayorista, Web, Promoción, etc.

- Cada lista tiene:

  - Código único y nombre.
  - Flag de lista por defecto.
  - Estado habilitado.

Esto permite tener múltiples estrategias de pricing según canal, tipo de cliente o promociones.

#### 2.6 Precios por ítem y lista (`catalogs_price_list_item`)

- Relaciona cada ítem con las diferentes **listas de precios**.
- Incluye:

  - Precio específico para esa lista.
  - Fechas de vigencia (desde/hasta) para manejar promociones o cambios de precio.

Esto separa el **pricing dinámico** del precio base del catálogo.

---

### 3. `core`: identidad (party / identidad jurídica)

Este dominio unifica personas y empresas bajo un mismo modelo de identidad.

#### 3.1 Tipos de documento de identificación (`core_identity_document_type`)

- Catálogo de tipos de documento personales/empresariales:

  - CC, NIT, PAS, CE, etc.

- Indica si aplica a personas, empresas o ambas.
- Se usa para controlar **qué documento es válido para cada tipo de entidad**.

#### 3.2 Tipo de entidad (`user_type_enum`)

- Enum con:

  - `person` → persona física.
  - `company` → persona jurídica.

El sistema sabe qué tabla de detalle mirar en función de este tipo.

#### 3.3 Entidad genérica `user`

- Es el **“party”** del sistema:

  - Representa una entidad identificable por documento.
  - Puede ser persona o empresa.

- Contiene:

  - Tipo (`person` o `company`).
  - Tipo de documento y número (con restricción de unicidad).
  - Datos básicos de contacto: email, teléfono, dirección.
  - Estado activo.
  - Timestamps de creación/actualización.

Es el **núcleo de identidad** sobre el que se apoyan otros dominios (CRM, compras, HR).

#### 3.4 Detalle de persona (`core_person`)

- Aplica CTI: **PK = FK a `user`**.
- Representa datos propios de personas físicas:

  - Nombres, apellidos.
  - Fecha de nacimiento (opcional).

#### 3.5 Detalle de empresa (`core_company`)

- También CTI: **PK = FK a `user`**.
- Representa datos propios de empresas:

  - Razón social.
  - Nombre comercial.

Con esto, el sistema logra que **clientes, proveedores, empleados, etc. compartan el mismo modelo de identidad**, y solo se especialicen donde hace falta.

---

### 4. `crm`: clientes y órdenes comerciales

Este dominio cubre la gestión de relaciones con clientes.

#### 4.1 Tipos de cliente (`crm_client_type`)

- Catálogo de tipos de cliente:

  - Retail, Wholesale, VIP, etc.

- Incluye un flag de habilitado.

#### 4.2 Cliente (`crm_client`)

- Aplica CTI sobre `user`: **un cliente ES un user**.
- Reutiliza la identidad central (`user`) y añade:

  - Tipo de cliente.
  - Foto del cliente.
  - Estado activo.
  - Timestamps.

Esto permite que la misma identidad de `user` pueda ser **cliente, proveedor, empleado**, dependiendo del contexto.

#### 4.3 Tipos de orden (`crm_order_type`)

- Catálogo de tipos de orden comercial:

  - Online, En tienda, Mayorista, etc.

- Controla si están habilitadas.

#### 4.4 Órdenes de cliente (`crm_order`)

- Representa una **orden comercial** realizada por un cliente.
- Guarda:

  - Cliente (`crm_client`).
  - Tipo de orden.
  - Fecha.
  - Estado (enum: pending, confirmed, shipped, delivered, cancelled).
  - Flag de deshabilitada.

A nivel funcional, esto modela el flujo **“el cliente hace un pedido”**, que luego puede derivar en facturas, envíos, etc.

---

### 5. `purchasing`: proveedores y órdenes de compra

Este dominio cubre el ciclo de compras.

#### 5.1 Tipos de proveedor (`purchasing_supplier_type`)

- Catálogo con diferentes tipos de proveedor.

#### 5.2 Proveedor (`purchasing_supplier`)

- CTI sobre `user`: **un proveedor ES un user**.
- Agrega:

  - Tipo de proveedor.
  - Fecha de registro.
  - Estado activo.

De nuevo se reutiliza la identidad del `user`, pero especializada al contexto de compras.

#### 5.3 Orden de compra (`purchasing_purchase_order`)

- Representa una **orden de compra** emitida a un proveedor.
- Contiene:

  - Proveedor.
  - Fecha de orden.
  - Estado (pending, approved, received, cancelled).

#### 5.4 Ítems de orden de compra (`purchasing_order_item`)

- Detalle de la orden:

  - A qué orden de compra pertenece.
  - Qué ítem del catálogo (`catalogs_item`) se está comprando.
  - Cantidad y precio unitario.

En términos de negocio: **“comprar N unidades del ítem X al proveedor Y”**.

---

### 6. `finance`: facturas, cuentas por cobrar y por pagar

Este dominio maneja la consecuencia financiera de las órdenes.

#### 6.1 Factura de compra (`finance_purchase_invoice`)

- Representa una **factura emitida por un proveedor**.
- Se relaciona con:

  - El proveedor (`purchasing_supplier`).
  - Fechas de emisión y vencimiento.
  - Monto total.

#### 6.2 Factura de venta (`finance_sales_invoice`)

- Representa una **factura emitida a partir de una orden de cliente**.
- Se relaciona con:

  - La orden de cliente (`crm_order`).
  - Fechas de emisión y vencimiento.
  - Monto total.

#### 6.3 Cuentas por pagar (`finance_accounts_payable`)

- Cartera pendiente asociada a **facturas de compra**.
- Relación 1:1 con `finance_purchase_invoice`.
- Guarda el **monto pendiente por pagar**.
- Preparado para evolucionar en el futuro hacia movimientos de pago, cuotas, etc.

#### 6.4 Cuentas por cobrar (`finance_accounts_receivable`)

- Cartera pendiente asociada a **facturas de venta**.
- Relación 1:1 con `finance_sales_invoice`.
- Guarda el **monto pendiente por cobrar**.

Este diseño separa claramente el **documento** (factura) del **estado de cobro/pago** (cartera).

#### 6.5 Impuestos (`finance_tax`)

- Representa los **impuestos individuales** del sistema:

  - IVA 19%, IVA 5%, Exento, INC 8%, etc.

- Cada impuesto tiene:

  - Código único y nombre.
  - Tasa porcentual (ej: 19.00 para IVA 19%).
  - Estado habilitado.

#### 6.6 Grupos de impuestos (`finance_tax_group`)

- Agrupa impuestos para facilitar su asignación a ítems:

  - "Productos Gravados" → incluye IVA 19%.
  - "Servicios Profesionales" → IVA 19% + Retención.
  - "Canasta Familiar" → IVA 5%.

- Cada grupo tiene código, nombre y estado habilitado.
- Relación N:M con impuestos mediante `finance_tax_group_tax`.

#### 6.7 Relación grupo-impuestos (`finance_tax_group_tax`)

- Tabla pivote many-to-many entre grupos e impuestos.
- Permite que un grupo contenga múltiples impuestos.

#### 6.8 Grupos contables de ítems (`finance_item_accounting_group`)

- Define los **grupos contables** para la contabilización automática de ítems.
- Similar a "Posting Groups" en SAP o "Account Groups" en Odoo.
- Cada grupo define cuentas contables para:

  - Inventario (existencias).
  - Costo de ventas.
  - Ingresos por ventas.
  - Compras.

- Ejemplos:

  - "Mercancía" → Inventario: 1435, Costo: 6135, Ingreso: 4135.
  - "Servicios" → Sin inventario, Ingreso: 4170.

Los ítems del catálogo se asignan a un grupo contable mediante `itemAccountingGroupId`.

---

### 7. `hr`: empleados y roles

Este dominio cubre la gestión interna de recursos humanos.

#### 7.1 Roles (`hr_role`)

- Catálogo de roles/políticas internas:

  - Puestos, cargos, perfiles dentro de la organización.

- Incluye código, nombre, descripción y estado activo.

#### 7.2 Empleados (`hr_employee`)

- CTI sobre `person`: **un empleado ES una persona**.
- Reutiliza la identidad de persona (`core_person`) y agrega:

  - Fecha de contratación.
  - Estado activo.
  - Metadatos (JSON).
  - URL de avatar.
  - Timestamps.

#### 7.3 Relación empleado–roles (`hr_employee_roles`)

- Tabla pivote many-to-many entre empleados y roles:

  - Un empleado puede tener varios roles.
  - Un rol puede aplicarse a varios empleados.

---

### 8. `security`: usuarios de acceso al sistema

Este dominio controla **quién puede entrar al sistema y cómo**.

#### 8.1 Usuario de seguridad (`security_user`)

- Representa las **credenciales de acceso**:

  - Nombre de usuario.
  - Hash de contraseña.
  - Estado activo/inactivo.
  - Bloqueo de cuenta.
  - Último login.

- Relación 1:1 con `hr_employee`:

  - Cada empleado puede tener a lo sumo un usuario de acceso.
  - Si se necesita multi-login, se puede relajar esa restricción.

En resumen: **“Empleado” es la persona interna; `security_user` es su cuenta de login.**

---

### 9. `inventory`: stock y movimientos

Este dominio maneja existencias y movimientos de inventario.

#### 9.1 Unidades de medida (`inventory_unit_of_measure`)

- Representa las **unidades de medida base** del sistema:

  - Unidad (UN), Kilogramo (KG), Litro (LT), Metro (MT), Caja (CJ), etc.

- Cada UOM tiene:

  - Código único.
  - Nombre completo.
  - Descripción opcional.
  - Estado habilitado.

Esta es la tabla referenciada por `inventory_item.uomId`.

#### 9.2 Conversiones de UOM por ítem (`inventory_item_uom`)

- Define **múltiplos/conversiones** de UOM para cada ítem inventariable:

  - Si la UOM base es "Unidad":
    - Caja = 12 unidades (factor = 12).
    - Pallet = 50 cajas = 600 unidades (factor = 600).

- Esto permite:

  - Vender en cajas y comprar en unidades.
  - Definir UOM preferida para compras vs. ventas.
  - Manejar diferentes presentaciones del mismo producto.

- Incluye flags para `isDefaultPurchase` e `isDefaultSales`.

#### 9.3 Detalle de inventario (`inventory_item`)

- CTI sobre `catalogs_item` para ítems de tipo bien físico.
- Guarda:

  - Unidad de medida base (FK a `inventory_unit_of_measure`).
  - Stock mínimo/máximo recomendado.
  - Punto de reorden.

Solo los ítems que realmente manejan stock necesitan tener registro aquí.

#### 9.4 Ubicaciones (`inventory_location`)

- Representa **bodegas** o ubicaciones de inventario.
- Cada movimiento o stock se puede asociar a una ubicación.

#### 9.5 Stock (`inventory_stock`)

- Tabla de stock por **ítem inventariable y ubicación**.
- PK compuesta: `(item_id, location_id)` para garantizar unicidad.
- Guarda la **cantidad disponible**.

Este es el estándar en ERPs: una fila por combinación ítem–bodega.

#### 9.6 Tipos de movimiento (`inventory_movement_type`)

- Define los distintos tipos de movimiento:

  - Entrada por compra, salida por venta, ajuste, etc.

- Guarda:

  - Factor (+1 entrada, -1 salida).
  - Si afecta o no el stock.
  - Si está habilitado.
  - Tipo de documento de negocio asociado (`numbering_document_type`).

#### 9.7 Movimientos de inventario (`inventory_movement`)

- Representan un **documento de movimiento de inventario**:

  - Tipo de movimiento.
  - Fecha.
  - Observación.
  - Usuario responsable (empleado HR).
  - Documento origen opcional (referencia funcional).
  - Serie de numeración utilizada.
  - Número interno (correlativo de la serie).
  - Número completo formateado (prefijo+num+sufijo).

Incluye una restricción que garantiza que un número no se duplique dentro de la misma serie.

#### 9.8 Detalle de movimiento (`inventory_movement_detail`)

- Ítems afectados por cada movimiento:

  - Qué ítem.
  - Qué ubicación.
  - Cantidad.
  - Costo unitario en ese momento.

En conjunto, `inventory_movement` + `inventory_movement_detail` describen el **documento de inventario y sus líneas**.

---

### 10. `numbering`: motor de numeración de documentos

Este dominio provee un motor **genérico de numeración** desacoplado de las tablas de negocio.

#### 10.1 Tipos de documento de negocio (`numbering_document_type`)

- Catálogo de tipos de documento:

  - Ej.: INV_ENT, INV_SAL, VTA, FAC, NC, REC, etc.

- Se usa para clasificar y agrupar series de numeración por módulo.

> Nota: se diferencia explícitamente de `core_identity_document_type` (documentos de identificación personal/empresarial).

#### 10.2 Series de documentos (`numbering_document_series`)

- Define las **series/numeraciones** para cada tipo de documento:

  - Código de serie (F001, POS1-2025, etc.).
  - Prefijo y sufijo.
  - Rango (número inicial y final).
  - Número actual.
  - Vigencia (desde/hasta).
  - Estado activo.
  - Marca de serie por defecto.

Cada vez que un módulo (inventario, ventas, etc.) necesita un número, se apoya en estas series.

#### 10.3 Secuencia de documentos (`numbering_document_sequence`)

- Registro histórico de **números asignados**:

  - Serie.
  - Número asignado.
  - Identificador del documento externo (ID o UUID como texto).
  - Tipo de documento externo (tabla/dominio).
  - Fecha de asignación.

Permite:

- Auditar qué número se le asignó a qué documento.
- Evitar duplicados de números en una misma serie.

---

## Cierre

En conjunto, todo este modelo sigue dos ideas fuerza:

1. **Dominios claros** (core, catalogs, inventory, crm, purchasing, finance, hr, security, numbering, agape), donde cada tabla tiene un contexto funcional bien definido.
2. **Patrones de “Maestro + CTI”** para los conceptos centrales:

   - `user` + `person` + `company` + `client` + `supplier` + `employee`.
   - `item` + `service` + `inventory_item`.
   - Documentos de negocio apoyados en `numbering_*` para la numeración.
