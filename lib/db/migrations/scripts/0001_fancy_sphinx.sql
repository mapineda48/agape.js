CREATE TYPE "agape_app_development_demo"."inventory_movement_status" AS ENUM('draft', 'posted', 'cancelled');--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD COLUMN "status" "agape_app_development_demo"."inventory_movement_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD COLUMN "reversed_movement_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD COLUMN "reversing_movement_id" integer;--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_status" ON "agape_app_development_demo"."inventory_movement" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_inventory_movement_reversed" ON "agape_app_development_demo"."inventory_movement" USING btree ("reversed_movement_id");