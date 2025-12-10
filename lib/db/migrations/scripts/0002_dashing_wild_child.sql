CREATE TABLE "agape_app_development_demo"."inventory_stock_lot" (
	"item_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"lot_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"reserved_quantity" numeric(10, 2) DEFAULT 0 NOT NULL,
	CONSTRAINT "inventory_stock_lot_item_id_location_id_lot_id_pk" PRIMARY KEY("item_id","location_id","lot_id")
);
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item" DROP CONSTRAINT "inventory_item_item_id_catalogs_item_id_fk";
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" DROP CONSTRAINT "inventory_stock_lot_id_inventory_lot_id_fk";
--> statement-breakpoint
DROP INDEX "agape_app_development_demo"."ix_inventory_stock_lot";--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "currency_code" varchar(3) DEFAULT 'COP' NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "shipping_address_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "billing_address_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD COLUMN "currency_code" varchar(3) DEFAULT 'COP' NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD COLUMN "exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD COLUMN "currency_code" varchar(3) DEFAULT 'COP' NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD COLUMN "exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "currency_code" varchar(3) DEFAULT 'COP' NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "supplier_address_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "currency_code" varchar(3) DEFAULT 'COP' NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "shipping_address_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "billing_address_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock_lot" ADD CONSTRAINT "inventory_stock_lot_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock_lot" ADD CONSTRAINT "inventory_stock_lot_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock_lot" ADD CONSTRAINT "inventory_stock_lot_lot_id_inventory_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "agape_app_development_demo"."inventory_lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_inventory_stock_lot_lot" ON "agape_app_development_demo"."inventory_stock_lot" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_stock_lot_item" ON "agape_app_development_demo"."inventory_stock_lot" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_stock_lot_location" ON "agape_app_development_demo"."inventory_stock_lot" USING btree ("location_id");--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD CONSTRAINT "finance_gl_journal_entry_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_gl_journal_entry" ADD CONSTRAINT "finance_gl_journal_entry_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_payment" ADD CONSTRAINT "finance_payment_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item" ADD CONSTRAINT "inventory_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" DROP COLUMN "lot_id";