CREATE SCHEMA "agape_app_development_demo";
--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."catalogs_item_type" AS ENUM('good', 'service');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."user_type_enum" AS ENUM('person', 'company');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."purchasing_purchase_order_status" AS ENUM('pending', 'approved', 'received', 'cancelled');--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."access_employee" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "access_employee_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."agape" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(50) NOT NULL,
	"is_enabled" boolean NOT NULL
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
	"images" jsonb NOT NULL
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
CREATE TABLE "agape_app_development_demo"."company" (
	"id" serial PRIMARY KEY NOT NULL,
	"legal_name" varchar(150) NOT NULL,
	"trade_name" varchar(150)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."document_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_enabled" boolean NOT NULL,
	"applies_to_person" boolean NOT NULL,
	"applies_to_company" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_person" (
	"id" serial PRIMARY KEY NOT NULL,
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
	"email" varchar(255),
	"phone" varchar(20),
	"address" varchar(255),
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
	"id" serial PRIMARY KEY NOT NULL,
	"type_id" integer,
	"photo_url" varchar(500),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
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
	"client_id" integer NOT NULL,
	"order_type_id" integer NOT NULL,
	"order_date" date DEFAULT now() NOT NULL,
	"status" varchar(20) NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL
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
CREATE TABLE "agape_app_development_demo"."finance_purchase_invoice" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"issue_date" date DEFAULT now() NOT NULL,
	"due_date" date,
	"total_amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_sales_invoice" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"issue_date" date DEFAULT now() NOT NULL,
	"due_date" date,
	"total_amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_item" (
	"item_id" integer PRIMARY KEY NOT NULL,
	"uom_id" integer NOT NULL,
	"min_stock" numeric(10, 2),
	"max_stock" numeric(10, 2),
	"reorder_point" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_location" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"is_enabled" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_movement_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"location_id" integer,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2)
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
	"user_id" integer NOT NULL,
	"source_document_type" varchar(30),
	"source_document_id" integer,
	"document_series_id" integer NOT NULL,
	"document_number" integer NOT NULL,
	"document_number_full" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"location_id" integer,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."numeration_document_sequence" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"assigned_number" bigint NOT NULL,
	"external_document_id" varchar(100) NOT NULL,
	"external_document_type" varchar(50) NOT NULL,
	"assigned_date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."numeration_document_series" (
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
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."numeration_document_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"module" varchar(30),
	"is_enabled" boolean DEFAULT true NOT NULL
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
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_type_id" integer NOT NULL,
	"registration_date" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."staff_employee" (
	"id" serial PRIMARY KEY NOT NULL,
	"hire_date" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"avatar_url" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."staff_employee_roles" (
	"employee_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "staff_employee_roles_employee_id_role_id_pk" PRIMARY KEY("employee_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."staff_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."access_employee" ADD CONSTRAINT "access_employee_employee_id_staff_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "agape_app_development_demo"."staff_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD CONSTRAINT "catalogs_item_category_id_inventory_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "agape_app_development_demo"."inventory_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD CONSTRAINT "catalogs_item_subcategory_id_catalogs_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "agape_app_development_demo"."catalogs_subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_service" ADD CONSTRAINT "catalogs_service_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_subcategories" ADD CONSTRAINT "catalogs_subcategories_category_id_inventory_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "agape_app_development_demo"."inventory_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."company" ADD CONSTRAINT "company_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_person" ADD CONSTRAINT "core_person_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."user" ADD CONSTRAINT "user_document_type_id_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "agape_app_development_demo"."document_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_type_id_crm_client_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "agape_app_development_demo"."crm_client_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_client_id_crm_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "agape_app_development_demo"."crm_client"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_order_type_id_crm_order_type_id_fk" FOREIGN KEY ("order_type_id") REFERENCES "agape_app_development_demo"."crm_order_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_accounts_payable" ADD CONSTRAINT "finance_accounts_payable_purchase_invoice_id_finance_purchase_invoice_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "agape_app_development_demo"."finance_purchase_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_accounts_receivable" ADD CONSTRAINT "finance_accounts_receivable_sales_invoice_id_finance_sales_invoice_id_fk" FOREIGN KEY ("sales_invoice_id") REFERENCES "agape_app_development_demo"."finance_sales_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_supplier_id_purchasing_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "agape_app_development_demo"."purchasing_supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_order_id_crm_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "agape_app_development_demo"."crm_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item" ADD CONSTRAINT "inventory_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_movement_id_inventory_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "agape_app_development_demo"."inventory_movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_type" ADD CONSTRAINT "inventory_movement_type_document_type_id_numeration_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "agape_app_development_demo"."numeration_document_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_movement_type_id_inventory_movement_type_id_fk" FOREIGN KEY ("movement_type_id") REFERENCES "agape_app_development_demo"."inventory_movement_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_user_id_staff_employee_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_development_demo"."staff_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_document_series_id_numeration_document_series_id_fk" FOREIGN KEY ("document_series_id") REFERENCES "agape_app_development_demo"."numeration_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD CONSTRAINT "inventory_stock_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD CONSTRAINT "inventory_stock_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."numeration_document_sequence" ADD CONSTRAINT "numeration_document_sequence_series_id_numeration_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numeration_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."numeration_document_series" ADD CONSTRAINT "numeration_document_series_document_type_id_numeration_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "agape_app_development_demo"."numeration_document_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_order_item" ADD CONSTRAINT "purchasing_order_item_purchase_order_id_purchasing_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "agape_app_development_demo"."purchasing_purchase_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_order_item" ADD CONSTRAINT "purchasing_order_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_purchase_order" ADD CONSTRAINT "purchasing_purchase_order_supplier_id_purchasing_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "agape_app_development_demo"."purchasing_supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" ADD CONSTRAINT "purchasing_supplier_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" ADD CONSTRAINT "purchasing_supplier_supplier_type_id_purchasing_supplier_type_id_fk" FOREIGN KEY ("supplier_type_id") REFERENCES "agape_app_development_demo"."purchasing_supplier_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee" ADD CONSTRAINT "staff_employee_id_core_person_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."core_person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee_roles" ADD CONSTRAINT "staff_employee_roles_employee_id_staff_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "agape_app_development_demo"."staff_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee_roles" ADD CONSTRAINT "staff_employee_roles_role_id_staff_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "agape_app_development_demo"."staff_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_item_code" ON "agape_app_development_demo"."catalogs_item" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_document_type_code" ON "agape_app_development_demo"."document_type" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_party_document" ON "agape_app_development_demo"."user" USING btree ("document_type_id","document_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_movement_series_number" ON "agape_app_development_demo"."inventory_movement" USING btree ("document_series_id","document_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_document_sequence_series_number" ON "agape_app_development_demo"."numeration_document_sequence" USING btree ("series_id","assigned_number");--> statement-breakpoint
CREATE INDEX "ix_document_sequence_external" ON "agape_app_development_demo"."numeration_document_sequence" USING btree ("external_document_type","external_document_id");--> statement-breakpoint
CREATE INDEX "ix_document_sequence_series" ON "agape_app_development_demo"."numeration_document_sequence" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_document_series_type_series_code" ON "agape_app_development_demo"."numeration_document_series" USING btree ("document_type_id","series_code");--> statement-breakpoint
CREATE INDEX "ix_document_series_type" ON "agape_app_development_demo"."numeration_document_series" USING btree ("document_type_id");--> statement-breakpoint
CREATE INDEX "ix_document_series_active" ON "agape_app_development_demo"."numeration_document_series" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_business_document_type_code" ON "agape_app_development_demo"."numeration_document_type" USING btree ("code");