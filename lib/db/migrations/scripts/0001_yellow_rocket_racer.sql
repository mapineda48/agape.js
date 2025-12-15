ALTER TABLE "agape_app_development_demo"."crm_client" ADD COLUMN "price_list_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD COLUMN "payment_terms_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD COLUMN "credit_limit" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD COLUMN "credit_days" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD COLUMN "salesperson_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD COLUMN "client_code" varchar(20);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_price_list_id_catalogs_price_list_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "agape_app_development_demo"."catalogs_price_list"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_payment_terms_id_finance_payment_terms_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "agape_app_development_demo"."finance_payment_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_salesperson_id_hr_employee_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "agape_app_development_demo"."hr_employee"("id") ON DELETE set null ON UPDATE no action;