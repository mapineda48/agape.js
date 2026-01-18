
# ERP Domain Inventory & Policy Discovery Plan

This plan coordinates a **multi-agent, design-level exploration** of the ERP domains implemented in `@models/` and `@svc/`.
The objective is **not code documentation**, but **ERP knowledge extraction**: identifying **business policies, configurable rules, control points, and domain responsibilities** as they would be expressed in a production-grade ERP.

Each agent documents **one module at a time**, producing a Markdown artifact in `docs/artifacts/`.
The output should allow a reader to understand **how the ERP behaves**, **what can be configured**, and **where business rules truly live**.

---

## Tasks

- [OK] Catalogs (svc/catalogs, models/catalogs) -> docs/artifacts/catalogs.md
- [OK] Configuration (svc/config, models/company, models/schema, models/enums) -> docs/artifacts/configuration.md
- [OK] Core Data (svc/core, models/address, models/person, models/contactMethod, models/documentType) -> docs/artifacts/core-data.md
- [OK] CRM (svc/crm, models/crm) -> docs/artifacts/crm.md
- [OK] Finance & Accounting (svc/finance, models/finance) -> docs/artifacts/finance.md
- [OK] HR (svc/hr, models/hr) -> docs/artifacts/hr.md
- [OK] Inventory (svc/inventory, models/inventory) -> docs/artifacts/inventory.md
- [ ] Numbering & Document Series (svc/numbering, models/numbering) -> docs/artifacts/numbering.md
- [ ] Purchasing (svc/purchasing, models/purchasing) -> docs/artifacts/purchasing.md
- [ ] Sales (svc/sales, models/crm, models/finance) -> docs/artifacts/sales.md
- [ ] Security & Access Control (svc/security, models/security) -> docs/artifacts/security.md
- [ ] Public/Integrations (svc/public, svc/integration) -> docs/artifacts/integrations.md

---

## Agent Mission (Very Important)

Agents must **not behave as code summarizers**.

They must act as:

* **ERP domain analysts**
* **Design reviewers**
* **Policy extractors**
* **Tutors explaining how a real ERP would justify this design**

A module is **not complete** if it only lists:

* RPCs
* Tables
* Enabled/Disabled flags

---

## Core Principle: Business Rules ≠ Code

In real ERPs, **business rules do not live in `if/else` statements alone**.
They are **distributed across multiple layers**:

* **Configuration** (company / branch / fiscal period / feature flags)
* **Catalogs** (types, classifications, tax groups, document classes)
* **Roles & Permissions** (who may act, override, approve)
* **Policies** (what is allowed, under which conditions, and why)

📌 **Industrial Standard**
Business rules are documented as **Policies**, not as implementation details.

---

## Mandatory Policy Analysis (Non-Negotiable)

For every module, agents MUST explicitly identify and document:

### 1. Explicit Policies

Rules that are clearly enforced by the system.

Examples:

* “Only one price list can be default”
* “A disabled category cannot receive new items”
* “A document cannot move to Approved without required fields”

---

### 2. Implicit Policies (Very Important)

Rules that are *not explicit*, but inferred from design choices.

Examples:

* “Item type is inferred from payload → system forbids hybrid items”
* “Default entities cannot be disabled → system assumes availability”
* “No delete endpoints → logical deletion is a policy, not an accident”

Agents MUST call these out explicitly.

---

### 3. Configurable vs Hard Rules

For each policy, agents must answer:

* Should this rule be **configurable**?
* Is it currently:

  * hard-coded?
  * flag-based?
  * role-based?
* How would a **real ERP vendor** justify this choice?

Use a simple classification:

* **Hard Policy** (never changes)
* **Configurable Policy**
* **Role-Governed Policy**

---

## From Code to Policy (How Agents Should Think)

Agents should NOT ask:

> “What does this function do?”

They SHOULD ask:

> “What business decision is the system enforcing here?”

For each significant rule, agents should include:

* **Policy Name**
* **Business Intent**
* **Enforcement Point** (service, model, DB, permission)
* **Configurability Potential**
* **Audit Implications**

---

## Flows & State Machines (ERP Perspective)

Flows must be described as **business lifecycles**, not method calls.

Agents must document:

* **Primary document or entity**
* **Lifecycle states**
* **Allowed transitions**
* **Who can trigger each transition**
* **What evidence or control is created**

Example:

> “Disabling a category is a governance action, not a CRUD update.”

---

## ERP Controls: What Really Matters

Agents must explicitly evaluate the presence or absence of:

* **RBAC at action level**
* **Auditability**
* **Consecutives / numbering**
* **Traceability across documents**
* **Cross-module coupling** (e.g., Catalogs ↔ Inventory ↔ Sales)

If something is missing, agents should say so.

---

## Required Documentation Template (Revised)

Each module document MUST include the following sections:

### 1. Module Overview

* Purpose in the ERP ecosystem
* Why this module exists

### 2. Core Business Policies

List **policies**, not features.

For each policy:

* Description
* Why it exists
* Whether it is configurable
* Who is affected

---

### 3. Primary Documents & Lifecycles

* Main business documents
* State machine
* Transition rules

---

### 4. Roles & Governance

* Roles involved
* What actions they control
* Where overrides would make sense

---

### 5. Domain Operations (RPC / Commands)

* Exposed business intents
* Why these operations exist
* What they protect or enforce

---

### 6. Data & Structural Decisions

* Key entities
* Why the structure supports the policies above
* Constraints that encode business meaning

---

### 7. Design Observations (Critical Thinking)

Agents MUST include:

* What is ERP-grade here
* What is simplified
* What would break at scale or multi-tenant setups

---

## Completion Rules


* Mark taks on checklist as **[IN PROGRESS]** when starting.
* Mark as **[OK]** only when:

  * Policies are clearly identified
  * Configurable vs hard rules are discussed
  * The artifact explains *why*, not just *what*

A module that only lists RPCs, tables, or states **does not qualify as [OK]**.

## Notes for Agents
- **Only work on the module explicitly assigned by the user.**