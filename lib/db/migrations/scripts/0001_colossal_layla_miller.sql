ALTER TABLE "agape_app_development_demo"."inventory_movement" RENAME COLUMN "user_id" TO "employee_id";--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" DROP CONSTRAINT "inventory_movement_user_id_hr_employee_id_fk";
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."numbering_document_series" ADD COLUMN "last_assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_employee_id_hr_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_numbering_series_last_assigned" ON "agape_app_development_demo"."numbering_document_series" USING btree ("last_assigned_at");