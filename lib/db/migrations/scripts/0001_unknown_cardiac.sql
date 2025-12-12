CREATE TABLE "agape_app_development_demo"."finance_currency" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(3) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"symbol" varchar(5) DEFAULT '$' NOT NULL,
	"exchange_rate" numeric(10, 2) DEFAULT 1 NOT NULL,
	"is_base" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_currency_code" ON "agape_app_development_demo"."finance_currency" USING btree ("code");