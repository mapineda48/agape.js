CREATE TYPE "agape_app_development_demo"."finance_gl_account_nature" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_gl_account_type" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_gl_journal_entry_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_gl_journal_entry_type" AS ENUM('manual', 'sales', 'purchase', 'payment', 'inventory', 'adjustment', 'closing', 'opening');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_payment_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_payment_type" AS ENUM('receipt', 'disbursement');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."finance_sales_invoice_status" AS ENUM('draft', 'issued', 'partially_paid', 'paid', 'cancelled');--> statement-breakpoint
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
	"reference_type" varchar(50),
	"reference_id" integer,
	"total_debit" numeric(10, 2) DEFAULT 0 NOT NULL,
	"total_credit" numeric(10, 2) DEFAULT 0 NOT NULL,
	"status" "agape_app_development_demo"."finance_gl_journal_entry_status" DEFAULT 'draft' NOT NULL,
	"notes" varchar(1000),
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
CREATE TABLE "agape_app_development_demo"."finance_payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"document_number" bigint NOT NULL,
	"type" "agape_app_development_demo"."finance_payment_type" NOT NULL,
	"party_id" integer NOT NULL,
	"payment_method_id" integer NOT NULL,
	"payment_date" date DEFAULT now() NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"unallocated_amount" numeric(10, 2) NOT NULL,
	"reference" varchar(100),
	"status" "agape_app_development_demo"."finance_payment_status" DEFAULT 'draft' NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
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
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" DROP CONSTRAINT "finance_sales_invoice_order_id_crm_order_id_fk";
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ALTER COLUMN "order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "client_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "payment_terms_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "subtotal" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "global_discount_percent" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "global_discount_amount" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "tax_amount" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "status" "agape_app_development_demo"."finance_sales_invoice_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "notes" varchar(1000);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD CONSTRAINT "finance_gl_journal_entry_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_line" ADD CONSTRAINT "finance_gl_journal_line_journal_entry_id_finance_gl_journal_entry_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "agape_app_development_demo"."finance_gl_journal_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_line" ADD CONSTRAINT "finance_gl_journal_line_account_id_finance_gl_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "agape_app_development_demo"."finance_gl_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment_allocation" ADD CONSTRAINT "finance_payment_allocation_payment_id_finance_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "agape_app_development_demo"."finance_payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment_allocation" ADD CONSTRAINT "finance_payment_allocation_sales_invoice_id_finance_sales_invoice_id_fk" FOREIGN KEY ("sales_invoice_id") REFERENCES "agape_app_development_demo"."finance_sales_invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment_allocation" ADD CONSTRAINT "finance_payment_allocation_purchase_invoice_id_finance_purchase_invoice_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "agape_app_development_demo"."finance_purchase_invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_party_id_user_id_fk" FOREIGN KEY ("party_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_payment_method_id_finance_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "agape_app_development_demo"."finance_payment_method"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice_item" ADD CONSTRAINT "finance_sales_invoice_item_sales_invoice_id_finance_sales_invoice_id_fk" FOREIGN KEY ("sales_invoice_id") REFERENCES "agape_app_development_demo"."finance_sales_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice_item" ADD CONSTRAINT "finance_sales_invoice_item_order_item_id_crm_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "agape_app_development_demo"."crm_order_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice_item" ADD CONSTRAINT "finance_sales_invoice_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice_item" ADD CONSTRAINT "finance_sales_invoice_item_tax_id_finance_tax_id_fk" FOREIGN KEY ("tax_id") REFERENCES "agape_app_development_demo"."finance_tax"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "ix_finance_payment_allocation_payment" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_allocation_sales_invoice" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("sales_invoice_id");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_allocation_purchase_invoice" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("purchase_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_allocation_sales" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("payment_id","sales_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_allocation_purchase" ON "agape_app_development_demo"."finance_payment_allocation" USING btree ("payment_id","purchase_invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_method_code" ON "agape_app_development_demo"."finance_payment_method" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_series_number" ON "agape_app_development_demo"."finance_payment" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_series" ON "agape_app_development_demo"."finance_payment" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_party" ON "agape_app_development_demo"."finance_payment" USING btree ("party_id");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_type" ON "agape_app_development_demo"."finance_payment" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_date" ON "agape_app_development_demo"."finance_payment" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "ix_finance_payment_status" ON "agape_app_development_demo"."finance_payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_finance_si_item_invoice" ON "agape_app_development_demo"."finance_sales_invoice_item" USING btree ("sales_invoice_id");--> statement-breakpoint
CREATE INDEX "ix_finance_si_item_order_item" ON "agape_app_development_demo"."finance_sales_invoice_item" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "ix_finance_si_item_item" ON "agape_app_development_demo"."finance_sales_invoice_item" USING btree ("item_id");--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_client_id_crm_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "agape_app_development_demo"."crm_client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_payment_terms_id_finance_payment_terms_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "agape_app_development_demo"."finance_payment_terms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_order_id_crm_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "agape_app_development_demo"."crm_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_client" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_order" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_issue_date" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_status" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("status");