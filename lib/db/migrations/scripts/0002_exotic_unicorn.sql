CREATE TABLE "agape_app_development_demo"."crm_client_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."crm_client" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"type_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "crm_client_person_id_unique" UNIQUE("person_id")
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
	"pending_amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_accounts_receivable" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_invoice_id" integer NOT NULL,
	"pending_amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_purchase_invoice" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"issue_date" date DEFAULT now() NOT NULL,
	"due_date" date,
	"total_amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_sales_invoice" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"issue_date" date DEFAULT now() NOT NULL,
	"due_date" date,
	"total_amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(50) NOT NULL,
	"isEnabled" boolean NOT NULL
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
	"unit_price" numeric(12, 2) NOT NULL
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
	"person_id" integer NOT NULL,
	"supplier_type_id" integer NOT NULL,
	"registration_date" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "agape_app_development_demo"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_type_id_crm_client_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "agape_app_development_demo"."crm_client_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_client_id_crm_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "agape_app_development_demo"."crm_client"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_order_type_id_crm_order_type_id_fk" FOREIGN KEY ("order_type_id") REFERENCES "agape_app_development_demo"."crm_order_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_accounts_payable" ADD CONSTRAINT "finance_accounts_payable_purchase_invoice_id_finance_purchase_invoice_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "agape_app_development_demo"."finance_purchase_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_accounts_receivable" ADD CONSTRAINT "finance_accounts_receivable_sales_invoice_id_finance_sales_invoice_id_fk" FOREIGN KEY ("sales_invoice_id") REFERENCES "agape_app_development_demo"."finance_sales_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_supplier_id_purchasing_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "agape_app_development_demo"."purchasing_supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_order_id_crm_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "agape_app_development_demo"."crm_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_product" ADD CONSTRAINT "inventory_product_category_id_inventory_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "agape_app_development_demo"."inventory_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_product" ADD CONSTRAINT "inventory_product_subcategory_id_inventory_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "agape_app_development_demo"."inventory_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_subcategories" ADD CONSTRAINT "inventory_subcategories_categoryId_inventory_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "agape_app_development_demo"."inventory_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_order_item" ADD CONSTRAINT "purchasing_order_item_purchase_order_id_purchasing_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "agape_app_development_demo"."purchasing_purchase_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_order_item" ADD CONSTRAINT "purchasing_order_item_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "agape_app_development_demo"."inventory_product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_purchase_order" ADD CONSTRAINT "purchasing_purchase_order_supplier_id_purchasing_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "agape_app_development_demo"."purchasing_supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" ADD CONSTRAINT "purchasing_supplier_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "agape_app_development_demo"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" ADD CONSTRAINT "purchasing_supplier_supplier_type_id_purchasing_supplier_type_id_fk" FOREIGN KEY ("supplier_type_id") REFERENCES "agape_app_development_demo"."purchasing_supplier_type"("id") ON DELETE no action ON UPDATE no action;