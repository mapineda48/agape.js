# Core Data [IN PROGRESS]

## 1. Module Overview

The **Core Data** module defines the ERP's canonical identity layer: how people and companies exist, how they are identified, and how their contact coordinates are managed. It is the **shared substrate** for CRM, Sales, Purchasing, HR, and Finance because every counterparty, employee, or supplier is ultimately a `user` entity with identity documents, addresses, and contact methods.

Its purpose is to enforce **stable, reusable identity primitives** (party classification, unique documents, primary contact channels) so that transactional modules can assume identity integrity without duplicating rules.

---

## 2. Core Business Policies

These are identity governance rules, not transactional behaviors.

### Explicit Policies

**Strict Party Typing (Person vs Company)**
A party must be *exactly one* of Person or Company. The system rejects payloads that attempt to set both or neither, and the `user.type` field is inferred from the payload structure.
*Configurability*: Hard Policy (service + schema).
*Affected*: CRM, Sales, Purchasing, HR, Finance.

**Unique Identity Document Per Party Type**
A document type + document number combination must be unique across all users, preventing duplicate identities for legal compliance and tax reporting.
*Configurability*: Hard Policy (DB unique index).
*Affected*: All modules that create parties.

**Identity Document Type Safety**
A document type cannot be disabled or made inapplicable if active users depend on it (person/company checks).
*Configurability*: Role-Governed Policy (service rule, permissioned action).
*Affected*: Core admins, onboarding workflows.

**Single Primary Contact Method Per Type**
Each party can have multiple contact methods, but only one per type can be marked as primary. Setting a primary automatically demotes others of the same type.
*Configurability*: Hard Policy (service transaction logic).
*Affected*: CRM, Sales, Support.

**Single Default Address Per Type**
Each party can have multiple addresses, but only one per address type (billing, shipping, etc.) can be default. Setting a default demotes others of the same type.
*Configurability*: Hard Policy (service transaction logic).
*Affected*: Sales, Purchasing, Logistics.

---

### Implicit Policies (Inferred from Design)

**Identity Is Immutable in Shape**
Because Person and Company are separate CTI tables keyed to `user.id`, the system implies that a party cannot switch its legal nature (person to company) without a destructive migration.

**Contact Channels Are Auditable by Replacement, Not History**
Contact methods can be updated and overwritten, but there is no built-in audit trail; the system assumes operational edits do not require historical tracking.

**Address Deletion Is Operationally Allowed**
Addresses can be deleted (optionally along with the physical record), implying that address history is not considered a legal record by default.

**Primary Is Scoped by Type, Not Global**
The model allows a primary email and a primary phone simultaneously, but no single universal primary contact.

---

## 3. Primary Documents & Lifecycles

**Party (User + Person/Company)**
Lifecycle: Created -> Updated -> Deactivated (soft by `isActive`)
Transition Rules: Creation requires exactly one legal subtype; updates are transactional across CTI tables.
Governance: Identity creation is a system-level action; deactivation is preferred to deletion.
Evidence: Stable document identifiers used by downstream documents.

**Identity Document Type**
Lifecycle: Enabled -> Disabled (if unused)
Transition Rules: Cannot disable or unapply if referenced by active users.
Governance: Catalog administration with data dependency checks.

**Contact Method**
Lifecycle: Created -> Updated -> Deleted
Transition Rules: Single primary enforced per type; duplicates are not allowed by unique index.
Governance: Operational updates, used by CRM and notifications.

**Address + User Address**
Lifecycle: Address created -> Associated -> Defaulted/Changed -> Deactivated/Deleted
Transition Rules: Single default per type; association records can be removed, optionally deleting the address.
Governance: Logistics and billing correctness.

---

## 4. Roles & Governance

**Core Identity Reader (`core.user.read`, `core.address.read`, `core.contact_method.read`, `core.document_type.read`)**
Can view party identity, contact methods, and address data. This is foundational for most modules to function.

**Core Identity Manager (`core.user.manage`, `core.address.manage`, `core.contact_method.manage`, `core.document_type.manage`)**
Responsible for creating and updating party identity, maintaining document type catalogs, and ensuring defaults/primaries are consistent. No approval workflow is present.

---

## 5. Domain Operations (RPC / Commands)

**Party Lookup (`getUserById`, `getUserByDocument`)**
Intended to validate identity by authoritative document numbers, supporting deduplication during onboarding.

**Party Upsert (`upsertUser`)**
Creates or updates parties with CTI integrity. Ensures identity subtype consistency and atomic updates.

**Contact Method CRUD (`listContactMethods`, `upsertContactMethod`, `deleteContactMethod`, `saveUserContactMethods`)**
Manages multi-channel communication with enforced primary per type and unique values.

**Address CRUD (`upsertAddress`, `upsertUserAddress`, `createUserAddressWithAddress`, `deleteUserAddress`)**
Ensures address associations and default rules are maintained transactionally.

**Document Type Catalog (`listDocumentTypes`, `upsertDocumentType`, `toggleDocumentType`)**
Enforces legal identity constraints to protect downstream document validity.

---

## 6. Data & Structural Decisions

* **Class Table Inheritance (CTI)**: `user` as the master identity table with `person` and `company` extensions enforces a clean party model and ensures shared identifiers.
* **Document Uniqueness**: Unique index on `(documentTypeId, documentNumber)` encodes legal identity uniqueness into the database layer.
* **Typed Contact Channels**: `contact_method` uses an enum for channel type and a unique index to prevent duplicate values per type.
* **Address Pivot Model**: `user_address` provides typed, multi-address support with default flags aligned to ERP billing/shipping needs.

---

## 7. Design Observations (Critical Thinking)

**ERP-Grade Characteristics**
* CTI identity model is robust and aligns with traditional ERP party management.
* Referential integrity and transactional updates keep identity consistent across modules.
* Explicit governance rules for document types prevent accidental legal inconsistencies.

**Intentional Simplifications**
* No audit trail for identity changes, contact methods, or address edits.
* Deletions are allowed for contact methods and addresses, which can break compliance in stricter domains.

**Scaling & Multi-Tenant Considerations**
* The unique document constraint assumes a single tenant per database; multi-tenant deployments would require tenant-scoped uniqueness.
* No role-based approval (four-eyes) for identity changes, which can be risky in regulated environments.

---

### Final Assessment

Core Data establishes a disciplined party model and enforces practical identity safeguards (unique documents, strict party typing, primary contact/default address rules). It is ERP-aligned in structure but simplified in governance: lack of auditability and permissive deletions make it less suitable for heavily regulated industries without extension.
