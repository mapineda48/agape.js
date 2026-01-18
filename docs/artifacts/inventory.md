# Inventory Management

## 1. Module Overview

The **Inventory** module acts as the "General Ledger for Physical Goods." Its primary responsibility is to maintain an accurate, auditable count of **what** exists (`InventoryItem`), **where** it is (`Location`), **how much** it is worth (`CostLayer`), and **how** it got there (`Movement`).

Unlike simple stock-counters, this module implements **Industrial-Grade Logic**: it strictly separates *transactional intent* (Draft Movements) from *fiscal reality* (Posted Movements + Cost Layers), supporting heavy-duty requirements like Lot Tracing and Multi-UOM (Unit of Measure) conversion.

---

## 2. Core Business Policies

### Explicit Policies

**Normalized Base UOM Storage**
All logical stock calculations and persistence happen in the Item's **Base Unit of Measure**.
*   *Rule*: An item can be *bought* in "Boxes" and *sold* in "Units", but the system stores "Units". The conversion happens at the transaction boundary (`validateAndProcessDetails`).
*   *Business Intent*: Mathematical consistency. "1 Box = 12 Units" is a rule that might change over time; storing "12 Units" is a permanent physical fact.

**Strict Lot & Expiry Control**
If an item is flagged for traceability, the system **rejects** any movement (Receipt or Issue) that does not specify a Lot ID.
*   *Enforcement*: `LotService.validateLotRequirement` prevents "orphan" stock for regulated items (e.g., Pharma/Food).
*   *Configurability*: Item-level configuration (Hard enforcement if enabled).

**Layer-Based Costing (FIFO/LIFO)**
Quantity and Cost are tracked in separate "Layers" (`inventory_cost_layer`), not just as a weighted average.
*   *Policy*: Every receipt creates a new layer with its own `unitCost`. Every issue consumes layers based on the configured method (FIFO default).
*   *Business Intent*: Accurate profit margin calculation per specific batch sold, rather than generic averaging.

**Availability Check (ATP)**
The system enforces `Available to Promise` logic. You cannot issue what you do not have.
*   *Constraint*: `validateStockAvailability` runs before any decrement, preventing "Negative Stock" anomalies common in simpler systems.

### Implicit Policies

**Location Hierarchy**
The `inventory_location` table uses a self-referencing `parent_id`, implying a loose adjacency list structure (Warehouse -> Aisle -> Bin).
*   *Implication*: The system treats all hierarchy levels equally for storage. You can technically store stock in a "Warehouse" root node, though operationally it should be in a "Bin".

**Irreversible Posting**
Once a movement is `POSTED`, it cannot be edited. It can only be `CANCELLED` via a **Reversal Movement**.
*   *Business Intent*: Audit trail integrity. "Un-deleting" a record is bad practice; "Reversing" it acts like a strikethrough in a paper ledger.

---

## 3. Primary Documents & Lifecycles

### Inventory Movement (`inventory_movement`)
The heart of the module. Represents any change in stock (Receipt, Issue, Transfer, Adjusment).

*   **Lifecycle State Machine**:
    1.  `DRAFT`: Planning phase. No stock effect. Editable.
    2.  `POSTED`: Execution phase.
        *   *Effect*: Updates `inventory_stock` and `inventory_cost_layer`.
        *   *Lock*: Record becomes immutable.
    3.  `CANCELLED`: Void state.
        *   *If Draft*: Soft delete.
        *   *If Posted*: Triggers a **Reversal Movement** (Auto-generated counterpart).

### Inventory Lot (`inventory_lot`)
*   **Lifecycle**:
    *   `Active`: Available for picking.
    *   `Quarantine`: Received but pending quality check (Soft blocked).
    *   `Blocked`: Unsafe/Recall (Hard blocked).
    *   `Exhausted`: Quantity = 0.

### Item Master (`inventory_item`)
*   **Extension Pattern**: This entity "decorates" the generic `catalogs/item`, adding inventory-specific fields like `uomId`, `costMethod`, and `isLotTracked`.

---

## 4. Roles & Governance

*   **Warehouse Operator (`inventory.movement.create`)**
    *   Can create Draft movements (Receipts, Picks).
    *   *Constraint*: Often cannot `POST` without approval (Supervisory check).
*   **Inventory Manager (`inventory.movement.manage`)**
    *   Can `POST` movements (affecting G/L) and manage Master Data (Locations, UOMs).
*   **System (`Automation`)**
    *   Can create movements automatically from Sales Orders (Shipment) or Purchase Orders (Reception).

---

## 5. Domain Operations (RPCs)

### `createInventoryMovement`
*   **Intent**: Record physical change.
*   **Validation**:
    *   Checks `item.type == 'good'`. Service items cannot be stocked.
    *   Validates UOM conversions.
    *   Enforces Lot logic.
    *   Checks generic "Period Closing" (future dates not allowed).

### `postInventoryMovement`
*   **Intent**: Commit to Ledger.
*   **Critical Operation**: This is where the heavy lifting happens:
    *   Atomic Transaction.
    *   Locks `inventory_stock` rows.
    *   Calculates Value delta.
    *   Updates Cost Layers.

### `cancelInventoryMovement`
*   **Intent**: Correction of Error.
*   **Logic**: If the movement was posted, it creates a *new* movement with the opposite effect (+1 becomes -1) to net out the error while preserving the history of both the mistake and the fix.

---

## 6. Data & Structural Decisions

*   **Separation of Quantity (`stock`) and Value (`cost_layer`)**
    *   This split is crucial. `stock` gives fast answers for "Do we have it?" (WMS view). `cost_layer` gives accurate answers for "How much is it worth?" (Finance view).
*   **Decimal Precision**
    *   Everything uses `Decimal` types. Floating point math is strictly banned in the service layer (`#utils/data/Decimal`) to avoid rounding errors in UOM conversions (e.g., 1/3 Meter).
*   **Document Series Integration**
    *   Movements consume the centralized `document_series`. This implies that Inventory Movements are considered "Legal Documents" (like Remissions/Waybills) for tax purposes in many jurisdictions.

---

## 7. Design Observations

### ERP-Grade Features
*   **True Layered Costing**: Implementing FIFO/LIFO layers manually is complex but puts this system in a tier above simple "Average Cost" systems.
*   **Reversal Logic**: The `cancelInventoryMovement` with auto-reversal is a high-maturity Audit feature.
*   **UOM Agnostic Input**: The ability to input in "Boxes" and store in "Units" seamlessly is excellent for usability vs. precision.

### Intentional Simplifications
*   **No "Reserved" Hard Allocation**: While `inventory_stock` has a `reservedQuantity` column, the `movement` logic doesn't seemingly "consume" reservation buckets explicitly during posting (it just checks absolute availability). Reservations likely live in a separate "Order Management" layer.
*   **Single-Step Bin Transfers**: Movements seem to be "Instant". Real WMS often have "In Transit" states for moving goods from Dock to Rack (Move Request -> Worker Accept -> Worker Deposit).

### Scaling Considerations
*   **Lock Contention**: `postInventoryMovement` locks rows in `inventory_stock`. High-volume warehouses might see contention if multiple users try to ship the *same item* from the *same location* simultaneously.
