# HR (Human Resources)

## 1. Module Overview

The **HR** module currently serves as the **Organizational Master Data** registry. It does not yet handle payroll or attendance, but rather defines **who** makes up the organization (`Employee`) and **how** they are structured (`Department`, `JobPosition`).

Its primary responsibility is **Identity Management within the Enterprise context**, bridging the gap between a generic "System User" and a "Staff Member" with specific duties, reporting lines, and dates of service.

---

## 2. Core Business Policies

### Explicit Policies

**Unified Identity (Class Table Inheritance)**
An Employee is not a standalone record; it is a **specialization of a Person**. This means every Employee shares the same globally unique ID as Clients and Suppliers.
*   *Business Intent*: Single Identity. A person who is a former employee and now a supplier has one "Person" record with two role definitions (`hr_employee` and `purchase_supplier`).
*   *Configurability*: Hard Policy (Schema Level).

**Separation of "Title" vs. "Permission"**
The system explicitly decouples **Job Positions** (HR concept) from **Security Roles** (IT concept).
*   *Policy Rule*: Assigning someone the `JobPosition` of "Sales Manager" does **not** automatically grant them the `sales.manager` system permission. These must be managed separately (though automation could bridge them).
*   *Why*: A "Junior Developer" might need "Admin" access in a dev environment. A "CEO" might need "Read Only" access to prevent accidental deletions. Job titles describe *status*; Security roles describe *capability*.
*   *Configurability*: Hard Policy (Design Pattern).

**Multi-Role Employment**
The system enables an employee to hold **multiple job positions** simultaneously (e.g., "Head of Sales" AND "Interim Marketing Director").
*   *Implementation*: Many-to-Many relationship via `hr_employee_job_position`.
*   *Control*: One position is marked as `isPrimary` for reporting purposes.

### Implicit Policies

**Hierarchical Departments**
Departments are modeled as an adjacency list (Self-referencing `parent_id`), implying a policy that **the organization is a tree structure**.
*   *Constraint*: Circular references are not explicitly prevented in the schema but would break UI renderings.

**Cost Center Accounting**
The `Department` entity includes `cost_center_code`, implying a policy that **Operational Structure mirrors Financial Structure**. Every employee belongs to a department, and every department maps to a cost bucket.

---

## 3. Primary Documents & Lifecycles

### Employee (`hr_employee` + `core_person`)
*   **Lifecycle**:
    1.  **Hired**: Created with a `hireDate`.
    2.  **Active**: `isActive = true`.
    3.  **Terminated**: `isActive = false` AND `terminationDate` is set.
*   **Governance Action**: Onboarding / Offboarding.

### Department (`hr_department`)
*   **Purpose**: Defines the reporting structure and cost aggregation.
*   **Lifecycle**: Static / Slow Changing.

### Job Position (`hr_job_position`)
*   **Purpose**: Standardized catalog of roles (e.g., "L1 Support", "Senior Accountant").
*   **Lifecycle**: Master Data (Create/Disable).

---

## 4. Roles & Governance

*   **HR Manager (`hr.employee.manage`)**
    *   Can create/edit employee records, salary info (future), and assign positions.
    *   *Critical Control*: Only HR should authorize a new user to become an "Employee".

*   **Department Head (Implied via `department.manager_id`)**
    *   Currently an informational link. In a full ERP, this person would receive approval tasks for leave requests or expenses for their department.

---

## 5. Domain Operations (RPCs)

### `upsertEmployee`
*   **Intent**: Onboarding / Updates.
*   **Complexity**:
    *   Manages the "Is-A" Person relationship.
    *   Updates Contacts (Email/Phone).
    *   Updates Job Position assignments (wiping and re-inserting the M-N relations).
    *   Handles Avatar upload.
*   **Validation**: Ensures the underlying User/Person exists or is created consistent with the system's identity rules.

### `listEmployees`
*   **Intent**: Directory Listing.
*   **Features**: Supports search by Name, Active Status.
*   **Restriction**: Does not expose sensitive fields (like salary, home address) by default, though the current DTO output is quite broad.

---

## 6. Data & Structural Decisions

*   **Department Hierarchy**: Using `parent_id` allows for infinite nesting depth. This is flexible but requires recursive queries (CTEs) for efficient reporting on "All sales staff under Global Sales".
*   **Link to Security**: There is **no automatic link** between `hr_employee` and `security_user_role`. This safety gap means an employee could be "Terminated" in HR but still have valid login credentials if the administrator forgets to disable the user in `auth`.
    *   *Mitigation*: `upsertEmployee` allows setting `isActive`, which likely flows down to the User login capability (needs verification in `user.ts`).

---

## 7. Design Observations

### ERP-Grade Features
*   **Strict CTI**: As with CRM, avoiding duplicated "Name/Email" fields for employees is excellent data normalization.
*   **Cost Center Integration**: baking `cost_center_code` into the Department model prepares the system for Financial integrations from day one.
*   **Position Management**: Formalizing `JobPosition` separate from the person implies a mature "Seat vs Holder" architecture (e.g., The "CTO" position exists even if vacant).

### Intentional Simplifications
*   **No Position History**: `employeeJobPosition` has `start_date` and `end_date`, allowing history tracking, BUT the `upsert` logic currently performs a `delete-insert` strategy for updates, which **destroys position history** on every edit.
    *   *Critique*: Real ERPs preserve the history of role changes (Promotions) for seniority calculations.
*   **Missing "Reports To"**: Reporting lines seem to be inferred via Department Managers rather than a direct Manager-Subordinate link on the Employee record. This is a valid design choice but rigid for matrix organizations.

### Scaling Considerations
*   **Org Chart Performance**: Recursive department queries can be slow without materialized paths or closure tables if the org structure gets very deep (unlikely for < 10k employees).
