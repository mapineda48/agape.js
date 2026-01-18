# CRM (Customer Relationship Management)

## 1. Module Overview

The **CRM** module manages the commercial relationships of the enterprise. Its primary responsibility is to maintain the **Master Customer Data** (`Client`) and capture **Commercial Intent** (`Order`) before it becomes a fiscal or logistical reality.

It acts as the **bridge between external actors (Customers) and internal operations** (Inventory, Finance), ensuring that who we sell to and what we promised them is clearly defined and legally binding.

---

## 2. Core Business Policies

### Explicit Policies

**Unified Identity (Class Table Inheritance)**
A Client is not a standalone record; it is a **specialization of a System User**. This means every Client shares the same globally unique ID space as Employees and Suppliers.
*   *Business Intent*: Single View of the Customer. A person who is both an employee and a customer has one login, one address book, and one identity.
*   *Configurability*: Hard Policy (Schema Level).

**Document Integrity via Snapshots**
When an Order is placed, the system **snapshots** the shipping and billing addresses into the order document. Future changes to the Client's address book do not retroactively alter historical orders.
*   *Business Intent*: Audit and Legal Compliance. We must ship to the address *agreed upon at the time of sale*.
*   *Configurability*: Hard Policy (Data Structure).

**Strict Document Numbering**
Sales Orders consume the centralized **Document Series** engine. They cannot be created without receiving a guaranteed sequential number (e.g., `ORD-2024-001`).
*   *Business Intent*: Auditability. Missing numbers indicate fraud or system failure.
*   *Enforcement*: Database Transaction in `createSalesOrder`.

**Partial Fulfillment Tracking**
The system explicitly tracks `deliveredQuantity` and `invoicedQuantity` per line item. This implies a policy that **Orders are long-lived contracts**, not instant transactions. A single order can spawn multiple shipments and multiple invoices.
*   *Configurability*: Hard Policy (Schema Level).

### Implicit Policies

**Credit Limit is Informational (Currently)**
While `creditLimit` and `creditDays` exist on the Client profile, the `createSalesOrder` operation **does not strictly block** transactions if these limits are exceeded.
*   *Observation*: In a strict ERP, this would be a blocking control or require a "Credit Hold" status.

**Tax Calculation Responsibility**
The current implementation allows defining `taxPercent` per line but defaults to 0 if not provided. This suggests an implicit policy where **pricing logic is currently offloaded to the frontend** or catalog configuration, rather than a centralized tax engine enforcing rules at the RPC level.

---

## 3. Primary Documents & Lifecycles

### Client (`crm_client` + `core_user`)
*   **Lifecycle**:
    *   `Active`: Can place orders.
    *   `Inactive`: Cannot place *new* orders (validated in `createSalesOrder`), but historical data remains.
*   **Governance Action**: Onboarding / KYC (Know Your Customer).

### Sales Order (`crm_order`)
*   **Lifecycle State Machine**:
    1.  `Pending`: Draft state. Editable.
    2.  `Confirmed`: Committed. Inventory allocation should happen here (implicit).
        *   *Transition Rule*: `Pending` -> `Confirmed`.
    3.  `Shipped`: Goods have left the warehouse.
        *   *Transition Rule*: `Confirmed` -> `Shipped`.
    4.  `Delivered`: Customer received goods. Terminal state for logistics.
    5.  `Cancelled`: Voided. Can only occur from non-terminal states.
*   **Key Data**:
    *   **Commercial**: Price List, Payment Terms, Salesperson.
    *   **Financial**: Subtotal, Taxes, Total, Currency.
    *   **Logistical**: Addresses (Snapshots), Delivery Dates.

---

## 4. Roles & Governance

*   **Sales Manager (`crm.client.manage`, `sales.order.manage`)**
    *   Can create/edit clients and approve/modify orders.
    *   controls critical commercial terms like `Credit Limit` and `Price List` assignment.

*   **Sales Representative (`sales.order.read`, `sales.order.create` - implied)**
    *   Create orders for assigned customers.
    *   *Gap*: Current RBAC seems to group read/manage broadly. A refined ERP would restrict Reps to *only their own* customers/orders (`row-level security`).

---

## 5. Domain Operations (RPCs)

### `upsertClient`
*   **Intent**: Master Data Management.
*   **Complexity**: Handles the "Is-A" relationship (User + Person/Company) and the "Has-A" relationships (Addresses, Contact Methods) in a single transactional unit.
*   **Enforcement**: Ensures a Client cannot exist without a valid User/Identity foundation.

### `createSalesOrder`
*   **Intent**: Contract Creation.
*   **Validation**:
    *   Client must exist and be `Active`.
    *   Must have at least one line item.
    *   Validates strict math for totals (though currently trusts input structure).
*   **Side Effect**: Consumes a Document Series number.

### `updateSalesOrderStatus`
*   **Intent**: Workflow Advancement.
*   **Validation**: Enforces the State Machine (e.g., cannot go from `Pending` directly to `Delivered`).
*   **Gap**: Currently does not appear to trigger external side effects (like creating an Inventory shipment automatically), relying on the user to trigger distinct processes or future integration.

---

## 6. Data & Structural Decisions

*   **Separation of Concerns (Item vs Order Item)**
    *   `OrderItem` copies key data (`unitPrice`, `cost` implied) from the Catalog `Item`. It does not reference the catalog price dynamically. This preserves the **historical financial truth** of the transaction.
*   **Multi-Currency Foundation**
    *   `currencyCode` and `exchangeRate` are baked into the Order header, preparing the system for international operations, even if currently functioning in single-currency mode.

---

## 7. Design Observations

### ERP-Grade Features
*   **CTI Architecture**: The Client model is extremely robust, leveraging the central User identity. This avoids "siloed" contact data common in cheaper CRMs.
*   **Auditability**: The use of snapshots for addresses and strict series numbering is a high-maturity design choice.
*   **Split-Fulfillment Ready**: The schema (`deliveredQuantity`) anticipates the real-world complexity of backorders.

### Intentional Simplifications
*   **Passive Credit Control**: The system stores credit limits but doesn't strictly enforce them during order entry. This places the burden of checking creditworthiness on the human user.
*   **Tax Engine**: Tax logic is seemingly simple (per-line fields) rather than a complex "Tax Authority" rule engine.
*   **Pricing Engine**: It appears `createSalesOrder` trusts the provided `unitPrice`. In a more locked-down ERP, the backend would forcibly fetch the price from the `PriceList` to prevent frontend tempering.

### Scaling Considerations
*   **High Volume Orders**: The transactional nature of `createSalesOrder` (one big transaction) is good for consistency but might contend on the `document_sequence` table under extremely high concurrency (thousands of orders/minute).
