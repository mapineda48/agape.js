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
ALTER TABLE "agape_app_development_demo"."inventory_location" ALTER COLUMN "is_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ALTER COLUMN "quantity" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ALTER COLUMN "quantity" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_location" ADD COLUMN "code" varchar(30) NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_location" ADD COLUMN "type" varchar(20) DEFAULT 'WAREHOUSE' NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_location" ADD COLUMN "parent_location_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_location" ADD COLUMN "description" varchar(200);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD COLUMN "lot_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD COLUMN "total_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD COLUMN "lot_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD COLUMN "reserved_quantity" numeric(10, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_cost_layer" ADD CONSTRAINT "inventory_cost_layer_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_cost_layer" ADD CONSTRAINT "inventory_cost_layer_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_cost_layer" ADD CONSTRAINT "inventory_cost_layer_lot_id_inventory_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "agape_app_development_demo"."inventory_lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_lot" ADD CONSTRAINT "inventory_lot_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_inventory_cost_layer_item_location" ON "agape_app_development_demo"."inventory_cost_layer" USING btree ("item_id","location_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_cost_layer_lot" ON "agape_app_development_demo"."inventory_cost_layer" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_cost_layer_created" ON "agape_app_development_demo"."inventory_cost_layer" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ix_inventory_cost_layer_remaining" ON "agape_app_development_demo"."inventory_cost_layer" USING btree ("remaining_quantity");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_lot_item_lot" ON "agape_app_development_demo"."inventory_lot" USING btree ("item_id","lot_number");--> statement-breakpoint
CREATE INDEX "ix_inventory_lot_number" ON "agape_app_development_demo"."inventory_lot" USING btree ("lot_number");--> statement-breakpoint
CREATE INDEX "ix_inventory_lot_expiration" ON "agape_app_development_demo"."inventory_lot" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "ix_inventory_lot_status" ON "agape_app_development_demo"."inventory_lot" USING btree ("status");--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_lot_id_inventory_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "agape_app_development_demo"."inventory_lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD CONSTRAINT "inventory_stock_lot_id_inventory_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "agape_app_development_demo"."inventory_lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_location_code" ON "agape_app_development_demo"."inventory_location" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_inventory_location_parent" ON "agape_app_development_demo"."inventory_location" USING btree ("parent_location_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_location_type" ON "agape_app_development_demo"."inventory_location" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_detail_item" ON "agape_app_development_demo"."inventory_movement_detail" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_detail_location" ON "agape_app_development_demo"."inventory_movement_detail" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_detail_lot" ON "agape_app_development_demo"."inventory_movement_detail" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "ix_inventory_stock_lot" ON "agape_app_development_demo"."inventory_stock" USING btree ("lot_id");