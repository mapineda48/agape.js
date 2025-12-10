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
	"notes" varchar(500)
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
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "salesperson_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "payment_terms_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "price_list_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "shipping_address_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "billing_address_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "delivery_method" varchar(50);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "promised_delivery_date" date;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "actual_delivery_date" date;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "subtotal" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "global_discount_percent" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "global_discount_amount" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "tax_amount" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "total" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "notes" varchar(1000);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order_item" ADD CONSTRAINT "crm_order_item_order_id_crm_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "agape_app_development_demo"."crm_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order_item" ADD CONSTRAINT "crm_order_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_crm_order_item_order" ON "agape_app_development_demo"."crm_order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ix_crm_order_item_item" ON "agape_app_development_demo"."crm_order_item" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_crm_order_item_line" ON "agape_app_development_demo"."crm_order_item" USING btree ("order_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_payment_terms_code" ON "agape_app_development_demo"."finance_payment_terms" USING btree ("code");--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_salesperson_id_hr_employee_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_payment_terms_id_finance_payment_terms_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "agape_app_development_demo"."finance_payment_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_price_list_id_catalogs_price_list_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "agape_app_development_demo"."catalogs_price_list"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_shipping_address_id_core_user_address_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "agape_app_development_demo"."core_user_address"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_billing_address_id_core_user_address_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "agape_app_development_demo"."core_user_address"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_crm_order_client" ON "agape_app_development_demo"."crm_order" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "ix_crm_order_salesperson" ON "agape_app_development_demo"."crm_order" USING btree ("salesperson_id");--> statement-breakpoint
CREATE INDEX "ix_crm_order_date" ON "agape_app_development_demo"."crm_order" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "ix_crm_order_status" ON "agape_app_development_demo"."crm_order" USING btree ("status");