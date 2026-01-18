# Configuration

## 1. Module Overview

The **Configuration** module serves as the **foundational definition layer** of the ERP system. It establishes **system-wide behavioral constants** (currency, timezone, precision) and **core identity structures** (Company vs. Person) that all other modules consume.

Its primary purpose is **structural integrity and identity governance**: ensuring that all transactional modules operate under a unified set of mathematical rules (decimals), temporal rules (timezones), and ontological rules (what is a legal entity). Unlike transactional modules, this module deals with **slow-changing, high-impact state**.

---

## 2. Core Business Policies

This module encodes the **constitutional rules** of the ERP instance. These policies are designed to be rigid to protect mathematical and legal consistency.

### Explicit Policies

**Decimal Precision Safety**
The system enforces a strict validation range [0-6] for decimal places. This prevents floating-point instability and ensures compliance with standard accounting practices, rejecting any configuration attempt that would compromise financial accuracy.
*Configurability*: Hard Policy (Validation Logic).
*Affects*: System Administrators, Finance Module.

**Strict Party Classification (CTI)**
Any actor in the system must be definitively classified as either a *Person* (Natural) or a *Company* (Legal). The system enforces this via Class Table Inheritance (CTI) and strict Enums, preventing ambiguous "hybrid" identities that would complicate tax reporting.
*Configurability*: Hard Policy (Schema Level).
*Affects*: All Modules (CRM, Sales, Purchasing).

**Atomic Configuration Updates**
Updates to system configuration keys are wrapped in database transactions. This ensures that a specialized update (e.g., changing Company Name and NIT simultaneously) never results in a partial inconsistent state.
*Configurability*: Hard Policy (System Design).
*Affects*: System Administrators.

**Single Tenant Identity**
The hosting organization (`system.companyName`) is treated as a configuration singleton, not as a participant in the `Company` registry. This effectively segregates "us" (the tenant) from "them" (customers/vendors).
*Configurability*: Implicit Policy.
*Affects*: Reporting, Invoicing.

---

### Implicit Policies (Inferred from Design)

**Configuration as Key-Value Store**
The decision to use a schemaless `agape` table for settings implies that **extensibility is prioritized over strict typing** for feature flags and UI preferences. New settings can be introduced without database migrations.

**Soft-Typed Feature Flags**
The lack of a rigid schema for configuration values (`jsonb`) implies that the application layer, not the database, is the sole guardian of configuration integrity.

**Tenant Isolation Strategy**
The absence of `tenant_id` columns in the configuration table implies a **Single Tenant per Database** architecture strategy. The system is not designed for shared-schema multi-tenancy.

---

## 3. Primary Documents & Lifecycles

**System Configuration (`agape` table)**
Lifecycle: Default ↔ Overridden
Transition Rule: Defaults are hardcoded; database values act as persistent overrides.
Governance Action: System Initialization / Rebranding.
Evidence: Changes in global formatting outputs (dates, currency).

**Legal Entity (Company)**
Lifecycle: Created ↔ Restricted Deletion
Implicit Rule: A Company cannot be deleted if it is referenced by transactions (enforced via FKs).
Governance Action: Legal Registration.

**System Enums (`UserType`, `AddressType`)**
Lifecycle: Static / Code-Defined
Governance Action: Developer-controlled vocabulary.
Evidence: Dropdown options in all frontend forms.

---

## 4. Roles & Governance

**System Administrator (`config.system.manage`)**
Holds the "keys to the kingdom". Can alter fundamental operating parameters like Currency and Precision.
*Governance Constraint*: Currently lacks "Four-Eyes Principle" (approval) logic, representing a risk for critical settings.

**System Reader (`config.system.read`)**
All authenticated users and frontend clients.
*Rationale*: Formatting rules must be publicly readable to ensure consistent UI presentation.

---

## 5. Domain Operations (Business Intent)

**Global Behavior Resolution (`getSystemConfig`)**
Intended to provide a "Safe Fallback" state. The system guarantees it can run even if the database configuration is empty, ensuring high availability.

**Safe Configuration Mutation (`updateSystemConfig`)**
Intended to be a "high-stakes" operation. It performs validation (decimal limits) but currently lacks referential integrity checks for values like Currency (TODO identified in code), signaling a reliance on administrative competence.

---

## 6. Data & Structural Decisions

*   **Key-Value Store (`agape`)**: Decouples configuration schema from database schema, allowing rapid iteration of feature flags.
*   **Class Table Inheritance**: Enforces the "Is-A" relationship (Company IS A User) physically in the database, guaranteeing shared ID space and foreign key integrity for all actors.
*   **PostgreSQL Enums**: Hardens the domain vocabulary (`billing`, `shipping`) at the database level, preventing data drift from "magic strings".

---

## 7. Design Observations (ERP Perspective)

**ERP-Grade Characteristics**
*   **Class Table Inheritance (CTI)**: A mature design pattern for Party models, superior to single-table inheritance for data integrity.
*   **Transactional Atomicity**: Configuration changes obey ACID principles.
*   **Hardened Enums**: Critical business vocabulary is enforced by the database engine.

**Intentional Simplifications**
*   **Schemaless Config**: The `agape` table trades type safety for flexibility. In a larger ERP, critical settings usually live in typed columns.
*   **Missing Audit Trail**: Changes to `decimalPlaces` or `companyNit` are not automatically logged in a separate audit history, which is a compliance gap.

**Scaling & Multi-Tenant Considerations**
*   **Tenant Lock-in**: The current design strongly couples the database instance to a single tenant. Migrating to a multi-tenant SaaS model would require a specific refactor of the `agape` table key structure.

---

### Final Assessment

The Configuration module provides a **stable, strongly-typed foundation for entity definitions** (via CTI and Enums) while adopting a **flexible, lightweight approach for system parameters** (via KV store). It successfully enforces the critical "Rules of the Road" for other modules but relies heavily on administrative discipline due to the lack of granular audit controls on the configuration store.
