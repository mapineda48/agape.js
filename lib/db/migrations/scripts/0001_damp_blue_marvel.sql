ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "series_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD COLUMN "document_number" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "series_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD COLUMN "document_number" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "series_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD COLUMN "document_number" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_purchase_order" ADD COLUMN "series_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_purchase_order" ADD COLUMN "document_number" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_order" ADD CONSTRAINT "crm_order_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_purchase_invoice" ADD CONSTRAINT "finance_purchase_invoice_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_sales_invoice" ADD CONSTRAINT "finance_sales_invoice_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_purchase_order" ADD CONSTRAINT "purchasing_purchase_order_series_id_numbering_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numbering_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_crm_order_series_number" ON "agape_app_development_demo"."crm_order" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_crm_order_series" ON "agape_app_development_demo"."crm_order" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_purchase_invoice_series_number" ON "agape_app_development_demo"."finance_purchase_invoice" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_finance_purchase_invoice_series" ON "agape_app_development_demo"."finance_purchase_invoice" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_sales_invoice_series_number" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_finance_sales_invoice_series" ON "agape_app_development_demo"."finance_sales_invoice" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_purchasing_order_series_number" ON "agape_app_development_demo"."purchasing_purchase_order" USING btree ("series_id","document_number");--> statement-breakpoint
CREATE INDEX "ix_purchasing_order_series" ON "agape_app_development_demo"."purchasing_purchase_order" USING btree ("series_id");