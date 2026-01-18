# Catalogs

## 1. Module Overview

The Catalogs module defines the **commercial master data foundation** of the ERP.
It establishes **what the organization can sell, buy, stock, and price**, and acts as a **control plane** for downstream modules such as Inventory, Sales, Purchasing, Taxation, and Accounting.

Its primary purpose is not transactional, but **governance-oriented**: to enforce consistent classification, prevent ambiguous product definitions, and ensure that commercial data remains stable and auditable over time.

---

## 2. Core Business Policies

This module encodes several **foundational ERP policies** that deliberately favor **data integrity and governance over flexibility**.

### Explicit Policies

**Category Governance**
Categories function as organizational control units. A category with active subcategories cannot be disabled unless an explicit cascade is requested. This avoids orphaned classifications and enforces deliberate governance actions.
*Configurability*: Role-Governed Policy (explicit override via cascade).
*Affects*: Catalog Managers, Inventory Users.

**Subcategory Activation Requires Active Parent**
A subcategory cannot be created or enabled if its parent category is disabled. This enforces hierarchical consistency across all classification trees.
*Configurability*: Hard Policy (taxonomy integrity).
*Affects*: Catalog Managers.

**Cross-Taxonomy Assignment Prohibited**
An item’s subcategory must belong to its assigned category; mismatched combinations are rejected. This prevents classification ambiguity in transactional documents.
*Configurability*: Hard Policy.
*Affects*: Catalog Managers, Sales, Purchasing.

**Item Type Exclusivity**
An item must be either a *good* or a *service*, never both. The type is inferred from payload structure rather than user input, preventing hybrid or ambiguous master records.
*Configurability*: Hard Policy.
*Affects*: Catalog Managers, Integrations.

**Default Price List Uniqueness**
Only one price list can be marked as default at any time. Assigning a new default automatically demotes the previous one, guaranteeing deterministic price resolution.
*Configurability*: Hard Policy.
*Affects*: Pricing Administrators, Sales.

**Default Price List Protection**
The active default price list cannot be disabled; a replacement must be defined first. This ensures uninterrupted pricing availability.
*Configurability*: Role-Governed Policy.
*Affects*: Pricing Administrators.

**Identifier Normalization**
Price list codes are normalized to uppercase upon creation or update, enforcing standardized identifiers for integrations and reporting.
*Configurability*: Hard Policy.
*Affects*: Pricing Administrators, Integrations.

**Price Validity Exclusivity**
A price list may contain only one active price per item for a given validity window, eliminating overlapping pricing ambiguity.
*Configurability*: Hard Policy (data integrity).
*Affects*: Pricing Administrators.

**SKU Uniqueness**
Item codes and variant SKUs must be unique, enforcing traceability across inventory, sales, and analytics.
*Configurability*: Hard Policy.
*Affects*: Catalog Managers, Inventory, Sales.

**Bundle Determinism**
A bundle cannot contain the same component item more than once, ensuring deterministic kit composition.
*Configurability*: Hard Policy.
*Affects*: Catalog Managers, Inventory.

---

### Implicit Policies (Inferred from Design)

**Governance over Deletion**
The system favors logical disablement and restrictive deletes over cascading physical deletion, implying that catalog data is expected to persist for historical traceability.

**Catalog as Cross-Module Authority**
References to tax groups and accounting groups indicate that catalog decisions implicitly drive fiscal and accounting behavior, even if enforcement is delegated to other modules.

**Deferred Usage Enforcement**
Price list usage tracking exists but is not enforced, indicating an intentional design phase where governance rules are planned but not yet activated.

---

## 3. Primary Documents & Lifecycles

**Category**
Lifecycle: Enabled ↔ Disabled
Transition Rule: Disable requires no active subcategories unless cascade is explicitly requested.
Governance Action: Structural reclassification.
Evidence: Downstream item availability changes.

**Subcategory**
Lifecycle: Enabled ↔ Disabled
Transition Rule: Parent category must be enabled to activate.
Governance Action: Taxonomy maintenance.

**Item Master (Good / Service)**
Lifecycle: Active ↔ Inactive
Implicit Rule: Item type is immutable post-creation.
Governance Action: Master data stabilization.
Evidence: Availability in transactional modules.

**Price List**
Lifecycle: Enabled ↔ Disabled, with Default designation
Transition Rules:

* Only one default allowed
* Default list cannot be disabled
  Governance Action: Pricing authority definition.

**Price Validity Records**
Lifecycle: Time-based (validFrom → validTo)
Governance Action: Temporal pricing control.

**Variants & Bundles**
Lifecycle: Enabled ↔ Disabled
Governance Action: SKU-level availability and composition control.

---

## 4. Roles & Governance

**Catalog Manager**
Controls taxonomy and item master data. Subject to hierarchy and type policies, with limited override capabilities via explicit governance actions.

**Pricing Administrator**
Manages price lists and default pricing behavior. Restricted from actions that would create pricing gaps.

**Inventory / Sales Users**
Consume catalog data but do not govern it. Strongly dependent on catalog correctness.

**Potential Governance Extensions**

* Approval workflows for catalog changes
* Controlled re-parenting of taxonomy nodes
* Escalated overrides for default pricing actions

---

## 5. Domain Operations (Business Intent)

Domain operations expose **business intent**, not CRUD mechanics:

* Category and Subcategory operations enforce classification governance.
* Item upserts stabilize master data while enforcing exclusivity rules.
* Pricing operations protect deterministic price resolution.
* Usage inspection operations signal future governance enforcement.

---

## 6. Data & Structural Decisions

* Separate Category/Subcategory tables encode hierarchical governance.
* Centralized Item Master acts as a policy anchor for multiple modules.
* Split Good/Service detail tables enforce clean domain separation.
* Price List / Price List Item separation reflects configuration vs application of pricing.
* Variant and Bundle structures support SKU-level and composite logic without ambiguity.

---

## 7. Design Observations (ERP Perspective)

**ERP-Grade Characteristics**

* Strong master data governance
* Deterministic defaults
* Clear separation of configuration and transactional concerns

**Intentional Simplifications**

* No approval workflows for catalog changes
* Usage enforcement is deferred
* Audit trails are implied but not yet materialized

**Scaling & Multi-Tenant Considerations**

* Reclassification without usage protection risks downstream inconsistencies
* Lack of explicit audit entities limits regulatory traceability
* Tenant isolation is not structurally enforced at schema level

---

### Final Assessment

The Catalogs module is designed as a **governance-first master data authority**, aligning with enterprise ERP principles.
Its current structure prioritizes **consistency, determinism, and downstream safety**, while intentionally deferring advanced governance mechanisms such as approvals, audits, and tenant isolation.