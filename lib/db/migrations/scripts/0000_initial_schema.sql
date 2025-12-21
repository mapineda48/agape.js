-- Migration: Initial schema setup
-- Creates all base tables for the ERP system
-- Following naming convention: prefix_table_name (core_, hr_)

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_type_enum AS ENUM ('person', 'company');
CREATE TYPE address_type_enum AS ENUM ('billing', 'shipping', 'main', 'branch', 'other');
CREATE TYPE contact_method_type_enum AS ENUM ('email', 'phone', 'mobile', 'whatsapp', 'telegram', 'fax', 'other');

-- ============================================================================
-- AGAPE (Key-Value Configuration)
-- ============================================================================

CREATE TABLE agape (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CORE: Identity Document Type
-- ============================================================================

CREATE TABLE core_identity_document_type (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    applies_to_person BOOLEAN NOT NULL,
    applies_to_company BOOLEAN NOT NULL,
    CONSTRAINT ux_identity_document_type_code UNIQUE (code)
);

-- ============================================================================
-- CORE: User (Generic Entity - Person or Company)
-- ============================================================================

CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    user_type user_type_enum NOT NULL,
    document_type_id INTEGER NOT NULL REFERENCES core_identity_document_type(id) ON DELETE RESTRICT,
    document_number VARCHAR(30) NOT NULL,
    country_code VARCHAR(2),
    language_code VARCHAR(2),
    currency_code VARCHAR(3),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ux_user_document UNIQUE (document_type_id, document_number)
);

-- ============================================================================
-- CORE: Person (extends User via CTI)
-- ============================================================================

CREATE TABLE core_person (
    id INTEGER PRIMARY KEY REFERENCES "user"(id) ON DELETE RESTRICT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birthdate TIMESTAMPTZ
);

-- ============================================================================
-- CORE: Company (extends User via CTI)
-- ============================================================================

CREATE TABLE core_company (
    id INTEGER PRIMARY KEY REFERENCES "user"(id) ON DELETE RESTRICT,
    legal_name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150)
);

-- ============================================================================
-- CORE: Address
-- ============================================================================

CREATE TABLE core_address (
    id SERIAL PRIMARY KEY,
    street VARCHAR(255) NOT NULL,
    street_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country_code VARCHAR(2) NOT NULL,
    reference VARCHAR(255),
    notes VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CORE: User Address (pivot table)
-- ============================================================================

CREATE TABLE core_user_address (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    address_id INTEGER NOT NULL REFERENCES core_address(id) ON DELETE CASCADE,
    address_type address_type_enum NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    label VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ux_user_address_type UNIQUE (user_id, address_id, address_type)
);

-- ============================================================================
-- CORE: Contact Method
-- ============================================================================

CREATE TABLE core_contact_method (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    contact_type contact_method_type_enum NOT NULL,
    value VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    label VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ux_contact_method_unique UNIQUE (user_id, contact_type, value)
);

-- ============================================================================
-- CORE: Company Contact (person contacts for companies)
-- ============================================================================

CREATE TABLE core_company_contact (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
    person_id INTEGER NOT NULL REFERENCES core_person(id) ON DELETE CASCADE,
    role VARCHAR(100),
    department VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ux_company_contact_unique UNIQUE (company_id, person_id)
);

-- ============================================================================
-- HR: Department
-- ============================================================================

CREATE TABLE hr_department (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES hr_department(id),
    cost_center_code VARCHAR(30),
    manager_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HR: Job Position
-- ============================================================================

CREATE TABLE hr_job_position (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level SERIAL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HR: Employee (extends Person via CTI)
-- ============================================================================

CREATE TABLE hr_employee (
    id INTEGER PRIMARY KEY REFERENCES core_person(id) ON DELETE RESTRICT,
    department_id INTEGER REFERENCES hr_department(id) ON DELETE SET NULL,
    hire_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    termination_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    avatar_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK for department manager (after employee table exists)
ALTER TABLE hr_department
    ADD CONSTRAINT fk_department_manager
    FOREIGN KEY (manager_id) REFERENCES hr_employee(id) ON DELETE SET NULL;

-- ============================================================================
-- HR: Employee Job Position (pivot table)
-- ============================================================================

CREATE TABLE hr_employee_job_position (
    employee_id INTEGER NOT NULL REFERENCES hr_employee(id) ON DELETE CASCADE,
    job_position_id INTEGER NOT NULL REFERENCES hr_job_position(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    end_date TIMESTAMPTZ,
    PRIMARY KEY (employee_id, job_position_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_document_type ON "user"(document_type_id);
CREATE INDEX idx_user_address_user ON core_user_address(user_id);
CREATE INDEX idx_contact_method_user ON core_contact_method(user_id);
CREATE INDEX idx_employee_department ON hr_employee(department_id);
