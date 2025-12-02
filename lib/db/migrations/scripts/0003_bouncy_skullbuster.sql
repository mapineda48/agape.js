ALTER TABLE "agape_app_development_demo"."finance_accounts_payable" ALTER COLUMN "pending_amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_accounts_receivable" ALTER COLUMN "pending_amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ALTER COLUMN "total_amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ALTER COLUMN "total_amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_order_item" ALTER COLUMN "unit_price" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD COLUMN "photo_url" varchar(500);