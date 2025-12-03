CREATE SCHEMA "agape_app_development_demo";
--> statement-breakpoint
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
	"user_type" varchar(20) NOT NULL,
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
CREATE TABLE "agape_app_development_demo"."inventory_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(50) NOT NULL,
	"isEnabled" boolean NOT NULL
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
	"product_id" integer NOT NULL,
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
	"is_enabled" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_movement" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_type_id" integer NOT NULL,
	"movement_date" timestamp with time zone NOT NULL,
	"observation" varchar(500),
	"user_id" integer NOT NULL,
	"source_document_type" varchar(30),
	"source_document_id" integer
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_product" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"slogan" varchar(80) NOT NULL,
	"description" varchar(500),
	"is_active" boolean NOT NULL,
	"rating" smallint NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category_id" integer NOT NULL,
	"subcategory_id" integer NOT NULL,
	"images" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"location_id" integer,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(50) NOT NULL,
	"isEnabled" boolean NOT NULL,
	"categoryId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."purchasing_order_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."purchasing_purchase_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"order_date" date DEFAULT now() NOT NULL,
	"status" varchar(20) NOT NULL
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
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_movement_id_inventory_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "agape_app_development_demo"."inventory_movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "agape_app_development_demo"."inventory_product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_movement_type_id_inventory_movement_type_id_fk" FOREIGN KEY ("movement_type_id") REFERENCES "agape_app_development_demo"."inventory_movement_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_user_id_staff_employee_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_development_demo"."staff_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_product" ADD CONSTRAINT "inventory_product_category_id_inventory_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "agape_app_development_demo"."inventory_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_product" ADD CONSTRAINT "inventory_product_subcategory_id_inventory_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "agape_app_development_demo"."inventory_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD CONSTRAINT "inventory_stock_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "agape_app_development_demo"."inventory_product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD CONSTRAINT "inventory_stock_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_subcategories" ADD CONSTRAINT "inventory_subcategories_categoryId_inventory_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "agape_app_development_demo"."inventory_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_order_item" ADD CONSTRAINT "purchasing_order_item_purchase_order_id_purchasing_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "agape_app_development_demo"."purchasing_purchase_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_order_item" ADD CONSTRAINT "purchasing_order_item_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "agape_app_development_demo"."inventory_product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_purchase_order" ADD CONSTRAINT "purchasing_purchase_order_supplier_id_purchasing_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "agape_app_development_demo"."purchasing_supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" ADD CONSTRAINT "purchasing_supplier_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" ADD CONSTRAINT "purchasing_supplier_supplier_type_id_purchasing_supplier_type_id_fk" FOREIGN KEY ("supplier_type_id") REFERENCES "agape_app_development_demo"."purchasing_supplier_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee" ADD CONSTRAINT "staff_employee_id_core_person_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."core_person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee_roles" ADD CONSTRAINT "staff_employee_roles_employee_id_staff_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "agape_app_development_demo"."staff_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee_roles" ADD CONSTRAINT "staff_employee_roles_role_id_staff_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "agape_app_development_demo"."staff_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_document_type_code" ON "agape_app_development_demo"."document_type" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_party_document" ON "agape_app_development_demo"."user" USING btree ("document_type_id","document_number");