# Finance & Accounting

## 1. Module Overview

The **Finance & Accounting** module is the **monetary governance core** of the ERP. It defines how money is measured (currencies), taxed (taxes + tax groups), collected or disbursed (payments), and how legal documents become financial obligations (sales/purchase invoices). It also contains the **skeleton of accounting infrastructure** (GL accounts, journal entries, AR/AP ledgers) even if posting automation is not fully wired yet.

Its purpose is **financial integrity**: ensuring documents are traceable, totals are consistent, payment flows are controlled, and regulatory artifacts (invoices, receipts, tax rates) are stable and auditable.

---

## 2. Core Business Policies

### Explicit Policies

**Single Base Currency**
The system enforces that only one currency is marked as base (`isBase = true`) and it can never be disabled. The base currency always uses an exchange rate of 1. This guarantees that all reporting and consolidation has a stable reference.
*Configurability*: Hard Policy (Validation Logic).
*Affects*: Finance Administrators, Reporting, Multi-currency transactions.

**Currency Lock When Documents Exist**
A currency cannot be disabled if it has active sales invoices, purchase invoices, or pending sales orders tied to it. This prevents a legal or reporting mismatch between open obligations and currency definitions.
*Configurability*: Hard Policy (Service Logic).
*Affects*: Finance, Sales, Purchasing.

**Tax Group Composition Required**
A tax group must always include at least one tax, and all referenced taxes must exist and be enabled. This enforces that every tax group is actionable and prevents empty tax logic from reaching invoices.
*Configurability*: Hard Policy (Service Logic).
*Affects*: Finance, Catalogs.

**Tax/Tax Group Disablement Safeguards**
Taxes cannot be disabled if they are used by non-cancelled invoices or by active tax groups. Tax groups cannot be disabled if active catalog items reference them. This avoids tax schema drift after transactional usage.
*Configurability*: Hard Policy (Service Logic).
*Affects*: Finance, Catalogs, Sales, Purchasing.

**Invoice Draft-to-Issued Gate**
A sales invoice must contain at least one line and can only be posted from `draft` to `issued` once. Posting computes taxes, totals, and locks the document state. This is the moment financial liability is created.
*Configurability*: Hard Policy (Service Logic).
*Affects*: Finance, Sales.

**Payment Amount Positivity**
Payments must be greater than zero; allocation cannot exceed the unallocated amount. This protects the integrity of AR/AP balances and prevents negative cash movements.
*Configurability*: Hard Policy (Service Logic).
*Affects*: Finance, Treasury.

**Purchase Invoice Price and Quantity Guardrails**
Purchase invoices validate that item quantities do not exceed received or ordered quantities and enforce a price variance threshold (5%) when referencing GRN or PO items. This protects procurement controls.
*Configurability*: Hard Policy (Service Logic; threshold currently fixed).
*Affects*: Purchasing, Finance.

---

### Implicit Policies (Inferred from Design)

**Accounting Documents are Immutable Once Issued**
Sales invoices move from `draft` to `issued` and are not reopened in the service. This implies a governance policy: corrections should be done via reversals or cancellations, not edits.

**AR/AP Are 1:1 with Invoices**
Accounts receivable/payable tables enforce a single balance row per invoice. This implies that installment schedules or advanced amortization are not part of the core model yet.

**Taxes are Applied at Line Level**
Tax associations live on invoice lines and tax rates are pulled per line. This implies tax applicability is an attribute of item classification rather than per-document settings.

**Numbering Is Mandatory for Financial Documents**
Invoices and payments are always assigned a document number from the numbering engine. This implies legal sequencing is non-optional and under centralized control.

**Payment Allocation Drives Invoice Status**
Invoice status moves to `partially_paid` or `paid` based on payment allocations. This implies that payment posting is the authoritative source of settlement state, not manual status flips.

---

## 3. Primary Documents & Lifecycles

**Sales Invoice (Accounts Receivable)
**Lifecycle: Draft → Issued → Partially Paid → Paid → Cancelled
Transition Rule: Only Draft can be posted; payment allocations change settlement states. Cancellation rules are implied but not yet explicit.
Governance Action: Posting creates the legal receivable; payment allocations create settlement evidence.

**Purchase Invoice (Accounts Payable)
**Lifecycle: Created → Recorded (no explicit status field yet)
Transition Rule: Validation against PO/GRN; due date computed via payment terms.
Governance Action: Recording creates a payable obligation with due date.

**Payment (Receipt/Disbursement)
**Lifecycle: Draft → Posted → Cancelled
Transition Rule: Draft becomes Posted when allocations are applied; posted payments adjust invoice balances.
Governance Action: Payment allocations serve as proof of settlement.

**Tax Group
**Lifecycle: Enabled ↔ Disabled
Transition Rule: Disablement blocked when referenced by active items.
Governance Action: Tax group enable/disable controls tax availability in catalog.

**GL Journal Entry
**Lifecycle: Draft → Posted → Cancelled
Transition Rule: Only posted entries impact balances; must be balanced by design.
Governance Action: Accounting team approves and posts manual or system-generated entries.

---

## 4. Roles & Governance

**Finance Manager (`finance.*.manage`)**
Can create and post invoices, create payments, and manage currencies/taxes. This role is effectively the owner of financial policy execution.

**Finance Reader (`finance.*.read`)**
Any user needing visibility into invoices, payments, and tax setups. Read access is crucial for cross-module operations (sales, purchasing, reporting).

**Missing Governance Controls**
No explicit approval workflow for invoices, journal entries, or payment posting. In a mature ERP, these would be role-gated or require dual control (four-eyes).

---

## 5. Domain Operations (Business Intent)

**Currency Management (`upsertCurrency`, `toggleCurrency`, `setBaseCurrency`)
**Defines monetary foundation, enforces base currency invariants, and protects active documents.

**Tax & Tax Group Management (`upsertTax`, `toggleTax`, `upsertTaxGroup`, `toggleTaxGroup`)
**Encodes tax legality by ensuring tax composition is valid and not retroactively altered.

**Sales Invoice Lifecycle (`createSalesInvoice`, `postSalesInvoice`, `getSalesInvoiceById`)
**Creates a draft obligation, then validates and posts to form a legal receivable with computed totals.

**Purchase Invoice Registration (`createPurchaseInvoice`)
**Captures supplier liabilities while validating against procurement controls.

**Payment Registration (`createPayment`)
**Registers receipts or disbursements, assigns legal numbering, and applies allocations to settle invoices.

---

## 6. Data & Structural Decisions

- **Document Sequencing as a FK**: Invoices and payments reference document series to enforce legal, ordered numbering.
- **Tax Group N:M Structure**: `finance_tax_group_tax` enables composite tax definitions while keeping tax rates atomic.
- **Snapshot Addresses**: Sales and purchase invoices store address snapshots to preserve legal identity at issuance time.
- **Accounts Receivable/Payable 1:1**: Simple ledger model that expects balance to be a single scalar per invoice.
- **GL Account Hierarchy**: Chart of accounts supports parent-child structure; only leaf accounts allow posting.
- **Journal Line Debit/Credit Constraint**: DB check enforces single-sided line amounts.

---

## 7. Design Observations (ERP Perspective)

**ERP-Grade Characteristics**
- Enforced tax and currency immutability once in use, protecting fiscal integrity.
- Legal document numbering tied to a centralized series engine.
- Basic ledger constructs (GL accounts, journal entries, AR/AP) are in place for full accounting.

**Intentional Simplifications**
- Purchase invoices have no explicit status lifecycle or posting step.
- Payment allocations for purchase invoices are not implemented in detail yet.
- Journal entries and GL posting automation are modeled but not yet wired to operational flows.

**Scaling & Multi-Tenant Considerations**
- Currency and tax catalogs assume single-tenant consistency; multi-tenant would need tenant-scoped catalogs.
- Lack of approval workflows may be risky at scale or in regulated environments.

---

### Final Assessment

The Finance & Accounting module already encodes **core fiscal governance** (currency invariants, tax immutability, document sequencing, AR/AP balance discipline) while leaving room for future maturity in **posting automation and approval workflows**. It behaves like a lightweight ERP finance core that is already protective about regulatory risk, but still missing advanced controls expected in audited environments.
