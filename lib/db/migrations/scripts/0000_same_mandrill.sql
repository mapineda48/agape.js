CREATE SCHEMA "agape_app_development_demo";
--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."catalogs_item_type" AS ENUM('good', 'service');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."address_type_enum" AS ENUM('billing', 'shipping', 'main', 'branch', 'other');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."contact_method_type_enum" AS ENUM('email', 'phone', 'mobile', 'whatsapp', 'telegram', 'fax', 'other');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."user_type_enum" AS ENUM('person', 'company');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."crm_order_status" AS ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_gl_account_nature" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_gl_account_type" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_gl_journal_entry_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_gl_journal_entry_type" AS ENUM('manual', 'sales', 'purchase', 'payment', 'inventory', 'adjustment', 'closing', 'opening');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_payment_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_payment_type" AS ENUM('receipt', 'disbursement');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_sales_invoice_status" AS ENUM('draft', 'issued', 'partially_paid', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."inventory_movement_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."purchasing_goods_receipt_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."purchasing_purchase_order_status" AS ENUM('pending', 'approved', 'received', 'cancelled');--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."agape" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(50) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item_attribute_value" (
	"id" serial PRIMARY KEY NOT NULL,
	"attribute_id" integer NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"display_value" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item_attribute" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item_bundle" (
	"id" serial PRIMARY KEY NOT NULL,
	"bundle_item_id" integer NOT NULL,
	"component_item_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item_variant_attribute_value" (
	"variant_id" integer NOT NULL,
	"attribute_value_id" integer NOT NULL,
	CONSTRAINT "catalogs_item_variant_attribute_value_variant_id_attribute_value_id_pk" PRIMARY KEY("variant_id","attribute_value_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item_variant" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_item_id" integer NOT NULL,
	"code" varchar(50) NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"price_modifier" numeric(10, 2) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"slogan" varchar(80),
	"description" varchar(500),
	"type" "agape_app_development_demo"."catalogs_item_type" NOT NULL,
	"is_enabled" boolean NOT NULL,
	"rating" smallint DEFAULT 0 NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"category_id" integer,
	"subcategory_id" integer,
	"tax_group_id" integer,
	"item_accounting_group_id" integer,
	"images" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_price_list_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"price_list_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_price_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_service" (
	"item_id" integer PRIMARY KEY NOT NULL,
	"duration_minutes" smallint,
	"is_recurring" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(50) NOT NULL,
	"is_enabled" boolean NOT NULL,
	"category_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_address" (
	"id" serial PRIMARY KEY NOT NULL,
	"street" varchar(255) NOT NULL,
	"street_line_2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"zip_code" varchar(20),
	"country_code" varchar(2) NOT NULL,
	"reference" varchar(255),
	"notes" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_user_address" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"address_id" integer NOT NULL,
	"address_type" "agape_app_development_demo"."address_type_enum" NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"label" varchar(100),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_company" (
	"id" integer PRIMARY KEY NOT NULL,
	"legal_name" varchar(150) NOT NULL,
	"trade_name" varchar(150)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_company_contact" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"role" varchar(100),
	"department" varchar(100),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_contact_method" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_type" "agape_app_development_demo"."contact_method_type_enum" NOT NULL,
	"value" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"label" varchar(100),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_identity_document_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"applies_to_person" boolean NOT NULL,
	"applies_to_company" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_person" (
	"id" integer PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"birthdate" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."user" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_type" "agape_app_development_demo"."user_type_enum" NOT NULL,
	"document_type_id" integer NOT NULL,
	"document_number" varchar(30) NOT NULL,
	"country_code" varchar(2),
	"language_code" varchar(2),
	"currency_code" varchar(3),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."crm_client_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."crm_client" (
	"id" integer PRIMARY KEY NOT NULL,
	"type_id" integer,
	"photo_url" varchar(500),
	"active" boolean DEFAULT true NOT NULL,
	"price_list_id" integer,
	"payment_terms_id" integer,
	"credit_limit" numeric(10, 2),
	"credit_days" integer,
	"salesperson_id" integer,
	"client_code" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."crm_order_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount_percent" numeric(10, 2) DEFAULT 0 NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"tax_percent" numeric(10, 2) DEFAULT 0 NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"delivered_quantity" numeric(10, 2) DEFAULT 0 NOT NULL,
	"invoiced_quantity" numeric(10, 2) DEFAULT 0 NOT NULL,
	"notes" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."crm_order_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."crm_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"document_number" bigint NOT NULL,
	"order_type_id" integer NOT NULL,
	"order_date" date DEFAULT now() NOT NULL,
	"status" "agape_app_development_demo"."crm_order_status" DEFAULT 'pending' NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"client_id" integer NOT NULL,
	"salesperson_id" integer,
	"payment_terms_id" integer,
	"price_list_id" integer,
	"shipping_address_id" integer,
	"billing_address_id" integer,
	"currency_code" varchar(3) DEFAULT 'COP' NOT NULL,
	"exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL,
	"shipping_address_snapshot" jsonb,
	"billing_address_snapshot" jsonb,
	"delivery_method" varchar(50),
	"promised_delivery_date" date,
	"actual_delivery_date" date,
	"subtotal" numeric(10, 2) DEFAULT 0 NOT NULL,
	"global_discount_percent" numeric(10, 2) DEFAULT 0 NOT NULL,
	"global_discount_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"total" numeric(10, 2) DEFAULT 0 NOT NULL,
	"notes" varchar(1000),
	"created_by_id" integer,
	"updated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_accounts_payable" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_invoice_id" integer NOT NULL,
	"pending_amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_accounts_receivable" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_invoice_id" integer NOT NULL,
	"pending_amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_currency" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(3) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"symbol" varchar(5) DEFAULT '$' NOT NULL,
	"exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL,
	"is_base" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_gl_account" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" varchar(500),
	"type" "agape_app_development_demo"."finance_gl_account_type" NOT NULL,
	"nature" "agape_app_development_demo"."finance_gl_account_nature" NOT NULL,
	"parent_id" integer,
	"level" integer DEFAULT 1 NOT NULL,
	"allow_posting" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_gl_journal_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"document_number" bigint NOT NULL,
	"type" "agape_app_development_demo"."finance_gl_journal_entry_type" NOT NULL,
	"entry_date" date DEFAULT now() NOT NULL,
	"description" varchar(500) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'COP' NOT NULL,
	"exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL,
	"reference_type" varchar(50),
	"reference_id" integer,
	"total_debit" numeric(10, 2) DEFAULT 0 NOT NULL,
	"total_credit" numeric(10, 2) DEFAULT 0 NOT NULL,
	"status" "agape_app_development_demo"."finance_gl_journal_entry_status" DEFAULT 'draft' NOT NULL,
	"notes" varchar(1000),
	"created_by_id" integer,
	"updated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_gl_journal_line" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"description" varchar(255),
	"debit_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"credit_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"reference" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ck_finance_gl_journal_line_amount" CHECK ((debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0))
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_item_accounting_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"account_inventory" varchar(20),
	"account_cost_of_goods_sold" varchar(20),
	"account_sales_revenue" varchar(20),
	"account_purchases" varchar(20),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_payment_allocation" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"sales_invoice_id" integer,
	"purchase_invoice_id" integer,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_payment_method" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(255),
	"requires_reference" boolean DEFAULT false NOT NULL,
	"requires_bank_account" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_payment_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(255),
	"due_days" smallint DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"document_number" bigint NOT NULL,
	"type" "agape_app_development_demo"."finance_payment_type" NOT NULL,
	"user_id" integer NOT NULL,
	"payment_method_id" integer NOT NULL,
	"payment_date" date DEFAULT now() NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'COP' NOT NULL,
	"exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL,
	"unallocated_amount" numeric(10, 2) NOT NULL,
	"reference" varchar(100),
	"status" "agape_app_development_demo"."finance_payment_status" DEFAULT 'draft' NOT NULL,
	"notes" varchar(500),
	"created_by_id" integer,
	"updated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_purchase_invoice_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_invoice_id" integer NOT NULL,
	"order_item_id" integer,
	"goods_receipt_item_id" integer,
	"item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT 0,
	"tax_id" integer,
	"tax_amount" numeric(10, 2) DEFAULT 0,
	"subtotal" numeric(10, 2) NOT NULL,
	"description" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_purchase_invoice" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"document_number" bigint NOT NULL,
	"supplier_id" integer NOT NULL,
	"purchase_order_id" integer,
	"goods_receipt_id" integer,
	"payment_terms_id" integer,
	"currency_code" varchar(3) DEFAULT 'COP' NOT NULL,
	"exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL,
	"supplier_address_snapshot" jsonb,
	"issue_date" date DEFAULT now() NOT NULL,
	"due_date" date,
	"total_amount" numeric(10, 2) NOT NULL,
	"created_by_id" integer,
	"updated_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_sales_invoice_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_invoice_id" integer NOT NULL,
	"order_item_id" integer,
	"item_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount_percent" numeric(10, 2) DEFAULT 0,
	"discount_amount" numeric(10, 2) DEFAULT 0,
	"tax_id" integer,
	"tax_amount" numeric(10, 2) DEFAULT 0,
	"subtotal" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"description" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_sales_invoice" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"document_number" bigint NOT NULL,
	"client_id" integer NOT NULL,
	"order_id" integer,
	"payment_terms_id" integer,
	"currency_code" varchar(3) DEFAULT 'COP' NOT NULL,
	"exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL,
	"shipping_address_snapshot" jsonb,
	"billing_address_snapshot" jsonb,
	"issue_date" date DEFAULT now() NOT NULL,
	"due_date" date,
	"subtotal" numeric(10, 2) DEFAULT 0 NOT NULL,
	"global_discount_percent" numeric(10, 2) DEFAULT 0 NOT NULL,
	"global_discount_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "agape_app_development_demo"."finance_sales_invoice_status" DEFAULT 'draft' NOT NULL,
	"notes" varchar(1000),
	"created_by_id" integer,
	"updated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_tax_group_tax" (
	"tax_group_id" integer NOT NULL,
	"tax_id" integer NOT NULL,
	CONSTRAINT "finance_tax_group_tax_tax_group_id_tax_id_pk" PRIMARY KEY("tax_group_id","tax_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_tax_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_tax" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"rate" numeric(10, 2) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."hr_department" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"parent_id" integer,
	"cost_center_code" varchar(30),
	"manager_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "hr_department_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."hr_employee" (
	"id" integer PRIMARY KEY NOT NULL,
	"department_id" integer,
	"hire_date" timestamp with time zone DEFAULT now() NOT NULL,
	"termination_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"avatar_url" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."hr_employee_job_position" (
	"employee_id" integer NOT NULL,
	"job_position_id" integer NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	CONSTRAINT "hr_employee_job_position_employee_id_job_position_id_pk" PRIMARY KEY("employee_id","job_position_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."hr_job_position" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"level" serial NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "hr_job_position_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_cost_layer" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"lot_id" integer,
	"original_quantity" numeric(10, 2) NOT NULL,
	"remaining_quantity" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"source_movement_id" integer
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_item_uom" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"uom_id" integer NOT NULL,
	"conversion_factor" numeric(10, 2) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_default_purchase" boolean DEFAULT false NOT NULL,
	"is_default_sales" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_item" (
	"item_id" integer PRIMARY KEY NOT NULL,
	"uom_id" integer NOT NULL,
	"min_stock" numeric(10, 2),
	"max_stock" numeric(10, 2),
	"reorder_point" numeric(10, 2),
	"requires_lot" boolean DEFAULT false NOT NULL,
	"requires_serial" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_location" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"code" varchar(30) NOT NULL,
	"type" varchar(20) DEFAULT 'WAREHOUSE' NOT NULL,
	"parent_location_id" integer,
	"description" varchar(200),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_lot" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"lot_number" varchar(50) NOT NULL,
	"serial_number" varchar(50),
	"manufacturing_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"received_date" timestamp with time zone NOT NULL,
	"source_document_type" varchar(30),
	"source_document_id" integer,
	"notes" varchar(500),
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_movement_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"location_id" integer,
	"lot_id" integer,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_movement_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"factor" smallint NOT NULL,
	"affects_stock" boolean NOT NULL,
	"is_enabled" boolean NOT NULL,
	"document_type_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_movement" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_type_id" integer NOT NULL,
	"movement_date" timestamp with time zone NOT NULL,
	"observation" varchar(500),
	"employee_id" integer NOT NULL,
	"status" "agape_app_development_demo"."inventory_movement_status" DEFAULT 'draft' NOT NULL,
	"reversed_movement_id" integer,
	"reversing_movement_id" integer,
	"source_document_type" varchar(30),
	"source_document_id" integer,
	"document_series_id" integer NOT NULL,
	"document_number" integer NOT NULL,
	"document_number_full" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_stock_lot" (
	"item_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"lot_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"reserved_quantity" numeric(10, 2) DEFAULT 0 NOT NULL,
	CONSTRAINT "inventory_stock_lot_item_id_location_id_lot_id_pk" PRIMARY KEY("item_id","location_id","lot_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_stock" (
	"item_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"reserved_quantity" numeric(10, 2) DEFAULT 0 NOT NULL,
	CONSTRAINT "inventory_stock_item_id_location_id_pk" PRIMARY KEY("item_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_unit_of_measure" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"full_name" varchar(50) NOT NULL,
	"description" varchar(200),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."numbering_document_sequence" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"assigned_number" bigint NOT NULL,
	"external_document_id" varchar(100) NOT NULL,
	"external_document_type" varchar(50) NOT NULL,
	"assigned_date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."numbering_document_series" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type_id" integer NOT NULL,
	"series_code" varchar(50) NOT NULL,
	"prefix" varchar(20),
	"suffix" varchar(20),
	"start_number" bigint NOT NULL,
	"end_number" bigint NOT NULL,
	"current_number" bigint NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"last_assigned_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."numbering_document_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"module" varchar(30),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."purchasing_goods_receipt_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"goods_receipt_id" integer NOT NULL,
	"order_item_id" integer,
	"item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"location_id" integer,
	"unit_cost" numeric(10, 2) NOT NULL,
	"lot_number" varchar(50),
	"observation" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."purchasing_goods_receipt" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"document_number" bigint NOT NULL,
	"purchase_order_id" integer,
	"supplier_id" integer NOT NULL,
	"receipt_date" timestamp with time zone NOT NULL,
	"status" "agape_app_development_demo"."purchasing_goods_receipt_status" DEFAULT 'draft' NOT NULL,
	"observation" varchar(500),
	"received_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."purchasing_order_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."purchasing_purchase_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"document_number" bigint NOT NULL,
	"supplier_id" integer NOT NULL,
	"order_date" timestamp with time zone NOT NULL,
	"status" "agape_app_development_demo"."purchasing_purchase_order_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."purchasing_supplier_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."purchasing_supplier" (
	"id" integer PRIMARY KEY NOT NULL,
	"supplier_type_id" integer NOT NULL,
	"registration_date" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."security_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"permissions" json DEFAULT '[]'::json NOT NULL,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "security_role_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."security_user_role" (
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "security_user_role_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."security_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"lock_reason" varchar(255),
	"locked_until" timestamp with time zone,
	"failed_login_attempts" smallint DEFAULT 0 NOT NULL,
	"last_failed_login" timestamp with time zone,
	"password_changed_at" timestamp with time zone DEFAULT now(),
	"must_change_password" boolean DEFAULT false NOT NULL,
	"password_reset_token" varchar(255),
	"password_reset_expires" timestamp with time zone,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" varchar(255),
	"two_factor_backup_codes" text,
	"last_login" timestamp with time zone,
	"last_login_ip" varchar(45),
	"login_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "security_user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_attribute_value" ADD CONSTRAINT "catalogs_item_attribute_value_attribute_id_catalogs_item_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "agape_app_development_demo"."catalogs_item_attribute"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_bundle" ADD CONSTRAINT "catalogs_item_bundle_bundle_item_id_catalogs_item_id_fk" FOREIGN KEY ("bundle_item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_bundle" ADD CONSTRAINT "catalogs_item_bundle_component_item_id_catalogs_item_id_fk" FOREIGN KEY ("component_item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_variant_attribute_value" ADD CONSTRAINT "catalogs_item_variant_attribute_value_variant_id_catalogs_item_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "agape_app_development_demo"."catalogs_item_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_variant_attribute_value" ADD CONSTRAINT "catalogs_item_variant_attribute_value_attribute_value_id_catalogs_item_attribute_value_id_fk" FOREIGN KEY ("attribute_value_id") REFERENCES "agape_app_development_demo"."catalogs_item_attribute_value"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_variant" ADD CONSTRAINT "catalogs_item_variant_parent_item_id_catalogs_item_id_fk" FOREIGN KEY ("parent_item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD CONSTRAINT "catalogs_item_category_id_catalogs_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "agape_app_development_demo"."catalogs_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD CONSTRAINT "catalogs_item_subcategory_id_catalogs_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "agape_app_development_demo"."catalogs_subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD CONSTRAINT "catalogs_item_tax_group_id_finance_tax_group_id_fk" FOREIGN KEY ("tax_group_id") REFERENCES "agape_app_development_demo"."finance_tax_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD CONSTRAINT "catalogs_item_item_accounting_group_id_finance_item_accounting_group_id_fk" FOREIGN KEY ("item_accounting_group_id") REFERENCES "agape_app_development_demo"."finance_item_accounting_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_price_list_item" ADD CONSTRAINT "catalogs_price_list_item_price_list_id_catalogs_price_list_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "agape_app_development_demo"."catalogs_price_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_price_list_item" ADD CONSTRAINT "catalogs_price_list_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_service" ADD CONSTRAINT "catalogs_service_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_subcategories" ADD CONSTRAINT "catalogs_subcategories_category_id_catalogs_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "agape_app_development_demo"."catalogs_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_user_address" ADD CONSTRAINT "core_user_address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_user_address" ADD CONSTRAINT "core_user_address_address_id_core_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "agape_app_development_demo"."core_address"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_company" ADD CONSTRAINT "core_company_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_company_contact" ADD CONSTRAINT "core_company_contact_company_id_core_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "agape_app_development_demo"."core_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_company_contact" ADD CONSTRAINT "core_company_contact_person_id_core_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "agape_app_development_demo"."core_person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_contact_method" ADD CONSTRAINT "core_contact_method_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_person" ADD CONSTRAINT "core_person_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."user" ADD CONSTRAINT "user_document_type_id_core_identity_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "agape_app_development_demo"."core_identity_document_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_type_id_crm_client_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "agape_app_development_demo"."crm_client_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_price_list_id_catalogs_price_list_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "agape_app_development_demo"."catalogs_price_list"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_payment_terms_id_finance_payment_terms_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "agape_app_development_demo"."finance_payment_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_salesperson_id_hr_employee_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order_item" ADD CONSTRAINT "crm_order_item_order_id_crm_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "agape_app_development_demo"."crm_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order_item" ADD CONSTRAINT "crm_order_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_order_type_id_crm_order_type_id_fk" FOREIGN KEY ("order_type_id") REFERENCES "agape_app_development_demo"."crm_order_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_client_id_crm_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "agape_app_development_demo"."crm_client"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_salesperson_id_hr_employee_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_payment_terms_id_finance_payment_terms_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "agape_app_development_demo"."finance_payment_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_price_list_id_catalogs_price_list_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "agape_app_development_demo"."catalogs_price_list"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_shipping_address_id_core_user_address_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "agape_app_development_demo"."core_user_address"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_billing_address_id_core_user_address_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "agape_app_development_demo"."core_user_address"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_accounts_payable" ADD CONSTRAINT "finance_accounts_payable_purchase_invoice_id_finance_purchase_invoice_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "agape_app_development_demo"."finance_purchase_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_accounts_receivable" ADD CONSTRAINT "finance_accounts_receivable_sales_invoice_id_finance_sales_invoice_id_fk" FOREIGN KEY ("sales_invoice_id") REFERENCES "agape_app_development_demo"."finance_sales_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD CONSTRAINT "finance_gl_journal_entry_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD CONSTRAINT "finance_gl_journal_entry_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD CONSTRAINT "finance_gl_journal_entry_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_line" ADD CONSTRAINT "finance_gl_journal_line_journal_entry_id_finance_gl_journal_entry_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "agape_app_development_demo"."finance_gl_journal_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_line" ADD CONSTRAINT "finance_gl_journal_line_account_id_finance_gl_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "agape_app_development_demo"."finance_gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment_allocation" ADD CONSTRAINT "finance_payment_allocation_payment_id_finance_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "agape_app_development_demo"."finance_payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment_allocation" ADD CONSTRAINT "finance_payment_allocation_sales_invoice_id_finance_sales_invoice_id_fk" FOREIGN KEY ("sales_invoice_id") REFERENCES "agape_app_development_demo"."finance_sales_invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment_allocation" ADD CONSTRAINT "finance_payment_allocation_purchase_invoice_id_finance_purchase_invoice_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "agape_app_development_demo"."finance_purchase_invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_payment_method_id_finance_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "agape_app_development_demo"."finance_payment_method"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_purchase_invoice_id_finance_purchase_invoice_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "agape_app_development_demo"."finance_purchase_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_order_item_id_purchasing_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "agape_app_development_demo"."purchasing_order_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_goods_receipt_item_id_purchasing_goods_receipt_item_id_fk" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "agape_app_development_demo"."purchasing_goods_receipt_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_tax_id_finance_tax_id_fk" FOREIGN KEY ("tax_id") REFERENCES "agape_app_development_demo"."finance_tax"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_supplier_id_purchasing_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "agape_app_development_demo"."purchasing_supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_purchase_order_id_purchasing_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "agape_app_development_demo"."purchasing_purchase_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_goods_receipt_id_purchasing_goods_receipt_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "agape_app_development_demo"."purchasing_goods_receipt"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_payment_terms_id_finance_payment_terms_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "agape_app_development_demo"."finance_payment_terms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice_item" ADD CONSTRAINT "finance_sales_invoice_item_sales_invoice_id_finance_sales_invoice_id_fk" FOREIGN KEY ("sales_invoice_id") REFERENCES "agape_app_development_demo"."finance_sales_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice_item" ADD CONSTRAINT "finance_sales_invoice_item_order_item_id_crm_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "agape_app_development_demo"."crm_order_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice_item" ADD CONSTRAINT "finance_sales_invoice_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice_item" ADD CONSTRAINT "finance_sales_invoice_item_tax_id_finance_tax_id_fk" FOREIGN KEY ("tax_id") REFERENCES "agape_app_development_demo"."finance_tax"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_client_id_crm_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "agape_app_development_demo"."crm_client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_order_id_crm_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "agape_app_development_demo"."crm_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_payment_terms_id_finance_payment_terms_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "agape_app_development_demo"."finance_payment_terms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_tax_group_tax" ADD CONSTRAINT "finance_tax_group_tax_tax_group_id_finance_tax_group_id_fk" FOREIGN KEY ("tax_group_id") REFERENCES "agape_app_development_demo"."finance_tax_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_tax_group_tax" ADD CONSTRAINT "finance_tax_group_tax_tax_id_finance_tax_id_fk" FOREIGN KEY ("tax_id") REFERENCES "agape_app_development_demo"."finance_tax"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."hr_employee" ADD CONSTRAINT "hr_employee_id_core_person_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."core_person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."hr_employee" ADD CONSTRAINT "hr_employee_department_id_hr_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "agape_app_development_demo"."hr_department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."hr_employee_job_position" ADD CONSTRAINT "hr_employee_job_position_employee_id_hr_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."hr_employee_job_position" ADD CONSTRAINT "hr_employee_job_position_job_position_id_hr_job_position_id_fk" FOREIGN KEY ("job_position_id") REFERENCES "agape_app_development_demo"."hr_job_position"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_cost_layer" ADD CONSTRAINT "inventory_cost_layer_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_cost_layer" ADD CONSTRAINT "inventory_cost_layer_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_cost_layer" ADD CONSTRAINT "inventory_cost_layer_lot_id_inventory_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "agape_app_development_demo"."inventory_lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item_uom" ADD CONSTRAINT "inventory_item_uom_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item_uom" ADD CONSTRAINT "inventory_item_uom_uom_id_inventory_unit_of_measure_id_fk" FOREIGN KEY ("uom_id") REFERENCES "agape_app_development_demo"."inventory_unit_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item" ADD CONSTRAINT "inventory_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item" ADD CONSTRAINT "inventory_item_uom_id_inventory_unit_of_measure_id_fk" FOREIGN KEY ("uom_id") REFERENCES "agape_app_development_demo"."inventory_unit_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_lot" ADD CONSTRAINT "inventory_lot_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_movement_id_inventory_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "agape_app_development_demo"."inventory_movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_lot_id_inventory_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "agape_app_development_demo"."inventory_lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_type" ADD CONSTRAINT "inventory_movement_type_document_type_id_numbering_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "agape_app_development_demo"."numbering_document_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_movement_type_id_inventory_movement_type_id_fk" FOREIGN KEY ("movement_type_id") REFERENCES "agape_app_development_demo"."inventory_movement_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_employee_id_hr_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_document_series_id_numbering_document_series_id_fk" FOREIGN KEY ("document_series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock_lot" ADD CONSTRAINT "inventory_stock_lot_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock_lot" ADD CONSTRAINT "inventory_stock_lot_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock_lot" ADD CONSTRAINT "inventory_stock_lot_lot_id_inventory_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "agape_app_development_demo"."inventory_lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD CONSTRAINT "inventory_stock_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD CONSTRAINT "inventory_stock_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."numbering_document_sequence" ADD CONSTRAINT "numbering_document_sequence_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."numbering_document_series" ADD CONSTRAINT "numbering_document_series_document_type_id_numbering_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "agape_app_development_demo"."numbering_document_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt_item" ADD CONSTRAINT "purchasing_goods_receipt_item_goods_receipt_id_purchasing_goods_receipt_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "agape_app_development_demo"."purchasing_goods_receipt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt_item" ADD CONSTRAINT "purchasing_goods_receipt_item_order_item_id_purchasing_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "agape_app_development_demo"."purchasing_order_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt_item" ADD CONSTRAINT "purchasing_goods_receipt_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt_item" ADD CONSTRAINT "purchasing_goods_receipt_item_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt" ADD CONSTRAINT "purchasing_goods_receipt_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt" ADD CONSTRAINT "purchasing_goods_receipt_purchase_order_id_purchasing_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "agape_app_development_demo"."purchasing_purchase_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt" ADD CONSTRAINT "purchasing_goods_receipt_supplier_id_purchasing_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "agape_app_development_demo"."purchasing_supplier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt" ADD CONSTRAINT "purchasing_goods_receipt_received_by_user_id_hr_employee_id_fk" FOREIGN KEY ("received_by_user_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_order_item" ADD CONSTRAINT "purchasing_order_item_purchase_order_id_purchasing_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "agape_app_development_demo"."purchasing_purchase_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_order_item" ADD CONSTRAINT "purchasing_order_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_purchase_order" ADD CONSTRAINT "purchasing_purchase_order_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_purchase_order" ADD CONSTRAINT "purchasing_purchase_order_supplier_id_purchasing_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "agape_app_development_demo"."purchasing_supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" ADD CONSTRAINT "purchasing_supplier_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" ADD CONSTRAINT "purchasing_supplier_supplier_type_id_purchasing_supplier_type_id_fk" FOREIGN KEY ("supplier_type_id") REFERENCES "agape_app_development_demo"."purchasing_supplier_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."security_user_role" ADD CONSTRAINT "security_user_role_user_id_security_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_development_demo"."security_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."security_user_role" ADD CONSTRAINT "security_user_role_role_id_security_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "agape_app_development_demo"."security_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."security_user" ADD CONSTRAINT "security_user_employee_id_hr_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_item_attribute_value_attr_code" ON "agape_app_development_demo"."catalogs_item_attribute_value" USING btree ("attribute_id","code");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_attribute_value_attr" ON "agape_app_development_demo"."catalogs_item_attribute_value" USING btree ("attribute_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_item_attribute_code" ON "agape_app_development_demo"."catalogs_item_attribute" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_item_bundle_bundle_component" ON "agape_app_development_demo"."catalogs_item_bundle" USING btree ("bundle_item_id","component_item_id");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_bundle_bundle" ON "agape_app_development_demo"."catalogs_item_bundle" USING btree ("bundle_item_id");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_bundle_component" ON "agape_app_development_demo"."catalogs_item_bundle" USING btree ("component_item_id");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_variant_attr_value" ON "agape_app_development_demo"."catalogs_item_variant_attribute_value" USING btree ("attribute_value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_item_variant_code" ON "agape_app_development_demo"."catalogs_item_variant" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_variant_parent" ON "agape_app_development_demo"."catalogs_item_variant" USING btree ("parent_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_item_code" ON "agape_app_development_demo"."catalogs_item" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_price_list_item_unique" ON "agape_app_development_demo"."catalogs_price_list_item" USING btree ("price_list_id","item_id","valid_from","valid_to");--> statement-breakpoint
CREATE INDEX "ix_catalogs_price_list_item_item" ON "agape_app_development_demo"."catalogs_price_list_item" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "ix_catalogs_price_list_item_list" ON "agape_app_development_demo"."catalogs_price_list_item" USING btree ("price_list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_price_list_code" ON "agape_app_development_demo"."catalogs_price_list" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_address_type" ON "agape_app_development_demo"."core_user_address" USING btree ("user_id","address_id","address_type");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_company_contact_unique" ON "agape_app_development_demo"."core_company_contact" USING btree ("company_id","person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_contact_method_unique" ON "agape_app_development_demo"."core_contact_method" USING btree ("user_id","contact_type","value");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_identity_document_type_code" ON "agape_app_development_demo"."core_identity_document_type" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_document" ON "agape_app_development_demo"."user" USING btree ("document_type_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_crm_order_item_order" ON "agape_app_development_demo"."crm_order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ix_crm_order_item_item" ON "agape_app_development_demo"."crm_order_item" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_crm_order_item_line" ON "agape_app_development_demo"."crm_order_item" USING btree ("order_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_crm_order_series_number" ON "agape_app_development_demo"."crm_order" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_crm_order_series" ON "agape_app_development_demo"."crm_order" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "ix_crm_order_client" ON "agape_app_development_demo"."crm_order" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "ix_crm_order_salesperson" ON "agape_app_development_demo"."crm_order" USING btree ("salesperson_id");--> statement-breakpoint
CREATE INDEX "ix_crm_order_date" ON "agape_app_development_demo"."crm_order" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "ix_crm_order_status" ON "agape_app_development_demo"."crm_order" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_accounts_payable_invoice" ON "agape_app_development_demo"."finance_accounts_payable" USING btree ("purchase_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_accounts_receivable_invoice" ON "agape_app_development_demo"."finance_accounts_receivable" USING btree ("sales_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_currency_code" ON "agape_app_development_demo"."finance_currency" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_gl_account_code" ON "agape_app_development_demo"."finance_gl_account" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_account_type" ON "agape_app_development_demo"."finance_gl_account" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_account_parent" ON "agape_app_development_demo"."finance_gl_account" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_account_posting" ON "agape_app_development_demo"."finance_gl_account" USING btree ("allow_posting");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_gl_journal_entry_series_number" ON "agape_app_development_demo"."finance_gl_journal_entry" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_journal_entry_series" ON "agape_app_development_demo"."finance_gl_journal_entry" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_journal_entry_type" ON "agape_app_development_demo"."finance_gl_journal_entry" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_journal_entry_date" ON "agape_app_development_demo"."finance_gl_journal_entry" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_journal_entry_status" ON "agape_app_development_demo"."finance_gl_journal_entry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_journal_entry_reference" ON "agape_app_development_demo"."finance_gl_journal_entry" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_journal_line_entry" ON "agape_app_development_demo"."finance_gl_journal_line" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "ix_finance_gl_journal_line_account" ON "agape_app_development_demo"."finance_gl_journal_line" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_item_accounting_group_code" ON "agape_app_development_demo"."finance_item_accounting_group" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_allocation_payment" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_allocation_sales_invoice" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("sales_invoice_id");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_allocation_purchase_invoice" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("purchase_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_allocation_sales" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("payment_id","sales_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_allocation_purchase" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("payment_id","purchase_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_method_code" ON "agape_app_development_demo"."finance_payment_method" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_terms_code" ON "agape_app_development_demo"."finance_payment_terms" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_series_number" ON "agape_app_development_demo"."finance_payment" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_series" ON "agape_app_development_demo"."finance_payment" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_user" ON "agape_app_development_demo"."finance_payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_type" ON "agape_app_development_demo"."finance_payment" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_date" ON "agape_app_development_demo"."finance_payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_status" ON "agape_app_development_demo"."finance_payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_finance_pi_item_invoice" ON "agape_app_development_demo"."finance_purchase_invoice_item" USING btree ("purchase_invoice_id");--> statement-breakpoint
CREATE INDEX "ix_finance_pi_item_order_item" ON "agape_app_development_demo"."finance_purchase_invoice_item" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "ix_finance_pi_item_grn_item" ON "agape_app_development_demo"."finance_purchase_invoice_item" USING btree ("goods_receipt_item_id");--> statement-breakpoint
CREATE INDEX "ix_finance_pi_item_item" ON "agape_app_development_demo"."finance_purchase_invoice_item" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_purchase_invoice_series_number" ON "agape_app_development_demo"."finance_purchase_invoice" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_finance_purchase_invoice_series" ON "agape_app_development_demo"."finance_purchase_invoice" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "ix_finance_si_item_invoice" ON "agape_app_development_demo"."finance_sales_invoice_item" USING btree ("sales_invoice_id");--> statement-breakpoint
CREATE INDEX "ix_finance_si_item_order_item" ON "agape_app_development_demo"."finance_sales_invoice_item" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "ix_finance_si_item_item" ON "agape_app_development_demo"."finance_sales_invoice_item" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_sales_invoice_series_number" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_series" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_client" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_order" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_issue_date" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_status" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_tax_group_code" ON "agape_app_development_demo"."finance_tax_group" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_tax_code" ON "agape_app_development_demo"."finance_tax" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_inventory_cost_layer_item_location" ON "agape_app_development_demo"."inventory_cost_layer" USING btree ("item_id","location_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_cost_layer_lot" ON "agape_app_development_demo"."inventory_cost_layer" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_cost_layer_created" ON "agape_app_development_demo"."inventory_cost_layer" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ix_inventory_cost_layer_remaining" ON "agape_app_development_demo"."inventory_cost_layer" USING btree ("remaining_quantity");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_item_uom_item_uom" ON "agape_app_development_demo"."inventory_item_uom" USING btree ("item_id","uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_location_code" ON "agape_app_development_demo"."inventory_location" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_inventory_location_parent" ON "agape_app_development_demo"."inventory_location" USING btree ("parent_location_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_location_type" ON "agape_app_development_demo"."inventory_location" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_lot_item_lot" ON "agape_app_development_demo"."inventory_lot" USING btree ("item_id","lot_number");--> statement-breakpoint
CREATE INDEX "ix_inventory_lot_number" ON "agape_app_development_demo"."inventory_lot" USING btree ("lot_number");--> statement-breakpoint
CREATE INDEX "ix_inventory_lot_expiration" ON "agape_app_development_demo"."inventory_lot" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "ix_inventory_lot_status" ON "agape_app_development_demo"."inventory_lot" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_detail_item" ON "agape_app_development_demo"."inventory_movement_detail" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_detail_location" ON "agape_app_development_demo"."inventory_movement_detail" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_detail_lot" ON "agape_app_development_demo"."inventory_movement_detail" USING btree ("lot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_movement_series_number" ON "agape_app_development_demo"."inventory_movement" USING btree ("document_series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_status" ON "agape_app_development_demo"."inventory_movement" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_reversed" ON "agape_app_development_demo"."inventory_movement" USING btree ("reversed_movement_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_stock_lot_lot" ON "agape_app_development_demo"."inventory_stock_lot" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_stock_lot_item" ON "agape_app_development_demo"."inventory_stock_lot" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_stock_lot_location" ON "agape_app_development_demo"."inventory_stock_lot" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_unit_of_measure_code" ON "agape_app_development_demo"."inventory_unit_of_measure" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_numbering_sequence_series_number" ON "agape_app_development_demo"."numbering_document_sequence" USING btree ("series_id","assigned_number");--> statement-breakpoint
CREATE INDEX "ix_numbering_sequence_external" ON "agape_app_development_demo"."numbering_document_sequence" USING btree ("external_document_type","external_document_id");--> statement-breakpoint
CREATE INDEX "ix_numbering_sequence_series" ON "agape_app_development_demo"."numbering_document_sequence" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_numbering_series_type_code" ON "agape_app_development_demo"."numbering_document_series" USING btree ("document_type_id","series_code");--> statement-breakpoint
CREATE INDEX "ix_numbering_series_type" ON "agape_app_development_demo"."numbering_document_series" USING btree ("document_type_id");--> statement-breakpoint
CREATE INDEX "ix_numbering_series_active" ON "agape_app_development_demo"."numbering_document_series" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ix_numbering_series_last_assigned" ON "agape_app_development_demo"."numbering_document_series" USING btree ("last_assigned_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_numbering_document_type_code" ON "agape_app_development_demo"."numbering_document_type" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_purchasing_grn_item_receipt" ON "agape_app_development_demo"."purchasing_goods_receipt_item" USING btree ("goods_receipt_id");--> statement-breakpoint
CREATE INDEX "ix_purchasing_grn_item_order_item" ON "agape_app_development_demo"."purchasing_goods_receipt_item" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "ix_purchasing_grn_item_item" ON "agape_app_development_demo"."purchasing_goods_receipt_item" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_purchasing_goods_receipt_series_number" ON "agape_app_development_demo"."purchasing_goods_receipt" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_purchasing_goods_receipt_series" ON "agape_app_development_demo"."purchasing_goods_receipt" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "ix_purchasing_goods_receipt_po" ON "agape_app_development_demo"."purchasing_goods_receipt" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "ix_purchasing_goods_receipt_supplier" ON "agape_app_development_demo"."purchasing_goods_receipt" USING btree ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_purchasing_order_series_number" ON "agape_app_development_demo"."purchasing_purchase_order" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_purchasing_order_series" ON "agape_app_development_demo"."purchasing_purchase_order" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_security_user_employee_id" ON "agape_app_development_demo"."security_user" USING btree ("employee_id");