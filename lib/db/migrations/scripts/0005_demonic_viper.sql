CREATE TYPE "agape_app_development_demo"."purchasing_goods_receipt_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
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
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "purchase_order_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "goods_receipt_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "payment_terms_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_purchase_invoice_id_finance_purchase_invoice_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "agape_app_development_demo"."finance_purchase_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_order_item_id_purchasing_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "agape_app_development_demo"."purchasing_order_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_goods_receipt_item_id_purchasing_goods_receipt_item_id_fk" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "agape_app_development_demo"."purchasing_goods_receipt_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice_item" ADD CONSTRAINT "finance_purchase_invoice_item_tax_id_finance_tax_id_fk" FOREIGN KEY ("tax_id") REFERENCES "agape_app_development_demo"."finance_tax"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt_item" ADD CONSTRAINT "purchasing_goods_receipt_item_goods_receipt_id_purchasing_goods_receipt_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "agape_app_development_demo"."purchasing_goods_receipt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt_item" ADD CONSTRAINT "purchasing_goods_receipt_item_order_item_id_purchasing_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "agape_app_development_demo"."purchasing_order_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt_item" ADD CONSTRAINT "purchasing_goods_receipt_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt_item" ADD CONSTRAINT "purchasing_goods_receipt_item_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt" ADD CONSTRAINT "purchasing_goods_receipt_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt" ADD CONSTRAINT "purchasing_goods_receipt_purchase_order_id_purchasing_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "agape_app_development_demo"."purchasing_purchase_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt" ADD CONSTRAINT "purchasing_goods_receipt_supplier_id_purchasing_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "agape_app_development_demo"."purchasing_supplier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_goods_receipt" ADD CONSTRAINT "purchasing_goods_receipt_received_by_user_id_hr_employee_id_fk" FOREIGN KEY ("received_by_user_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_finance_pi_item_invoice" ON "agape_app_development_demo"."finance_purchase_invoice_item" USING btree ("purchase_invoice_id");--> statement-breakpoint
CREATE INDEX "ix_finance_pi_item_order_item" ON "agape_app_development_demo"."finance_purchase_invoice_item" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "ix_finance_pi_item_grn_item" ON "agape_app_development_demo"."finance_purchase_invoice_item" USING btree ("goods_receipt_item_id");--> statement-breakpoint
CREATE INDEX "ix_finance_pi_item_item" ON "agape_app_development_demo"."finance_purchase_invoice_item" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "ix_purchasing_grn_item_receipt" ON "agape_app_development_demo"."purchasing_goods_receipt_item" USING btree ("goods_receipt_id");--> statement-breakpoint
CREATE INDEX "ix_purchasing_grn_item_order_item" ON "agape_app_development_demo"."purchasing_goods_receipt_item" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "ix_purchasing_grn_item_item" ON "agape_app_development_demo"."purchasing_goods_receipt_item" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_purchasing_goods_receipt_series_number" ON "agape_app_development_demo"."purchasing_goods_receipt" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_purchasing_goods_receipt_series" ON "agape_app_development_demo"."purchasing_goods_receipt" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "ix_purchasing_goods_receipt_po" ON "agape_app_development_demo"."purchasing_goods_receipt" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "ix_purchasing_goods_receipt_supplier" ON "agape_app_development_demo"."purchasing_goods_receipt" USING btree ("supplier_id");--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_purchase_order_id_purchasing_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "agape_app_development_demo"."purchasing_purchase_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_goods_receipt_id_purchasing_goods_receipt_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "agape_app_development_demo"."purchasing_goods_receipt"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_payment_terms_id_finance_payment_terms_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "agape_app_development_demo"."finance_payment_terms"("id") ON DELETE restrict ON UPDATE no action;