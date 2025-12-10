CREATE TABLE "agape_app_development_demo"."catalogs_item_attribute_value" (
	"id" serial PRIMARY KEY NOT NULL,
	"attribute_id" integer NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"display_value" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item_attribute" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item_bundle" (
	"id" serial PRIMARY KEY NOT NULL,
	"bundle_item_id" integer NOT NULL,
	"component_item_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item_variant_attribute_value" (
	"variant_id" integer NOT NULL,
	"attribute_value_id" integer NOT NULL,
	CONSTRAINT "catalogs_item_variant_attribute_value_variant_id_attribute_value_id_pk" PRIMARY KEY("variant_id","attribute_value_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_item_variant" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_item_id" integer NOT NULL,
	"code" varchar(50) NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"price_modifier" numeric(10, 2) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_price_list_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"price_list_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."catalogs_price_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_item_accounting_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"account_inventory" varchar(20),
	"account_cost_of_goods_sold" varchar(20),
	"account_sales_revenue" varchar(20),
	"account_purchases" varchar(20),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_tax_group_tax" (
	"tax_group_id" integer NOT NULL,
	"tax_id" integer NOT NULL,
	CONSTRAINT "finance_tax_group_tax_tax_group_id_tax_id_pk" PRIMARY KEY("tax_group_id","tax_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_tax_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."finance_tax" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"description" varchar(200),
	"rate" numeric(10, 2) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_item_uom" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"uom_id" integer NOT NULL,
	"conversion_factor" numeric(10, 2) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_default_purchase" boolean DEFAULT false NOT NULL,
	"is_default_sales" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_unit_of_measure" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"full_name" varchar(50) NOT NULL,
	"description" varchar(200),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD COLUMN "tax_group_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD COLUMN "item_accounting_group_id" integer;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_attribute_value" ADD CONSTRAINT "catalogs_item_attribute_value_attribute_id_catalogs_item_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "agape_app_development_demo"."catalogs_item_attribute"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_bundle" ADD CONSTRAINT "catalogs_item_bundle_bundle_item_id_catalogs_item_id_fk" FOREIGN KEY ("bundle_item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_bundle" ADD CONSTRAINT "catalogs_item_bundle_component_item_id_catalogs_item_id_fk" FOREIGN KEY ("component_item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_variant_attribute_value" ADD CONSTRAINT "catalogs_item_variant_attribute_value_variant_id_catalogs_item_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "agape_app_development_demo"."catalogs_item_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_variant_attribute_value" ADD CONSTRAINT "catalogs_item_variant_attribute_value_attribute_value_id_catalogs_item_attribute_value_id_fk" FOREIGN KEY ("attribute_value_id") REFERENCES "agape_app_development_demo"."catalogs_item_attribute_value"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item_variant" ADD CONSTRAINT "catalogs_item_variant_parent_item_id_catalogs_item_id_fk" FOREIGN KEY ("parent_item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_price_list_item" ADD CONSTRAINT "catalogs_price_list_item_price_list_id_catalogs_price_list_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "agape_app_development_demo"."catalogs_price_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_price_list_item" ADD CONSTRAINT "catalogs_price_list_item_item_id_catalogs_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."catalogs_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_tax_group_tax" ADD CONSTRAINT "finance_tax_group_tax_tax_group_id_finance_tax_group_id_fk" FOREIGN KEY ("tax_group_id") REFERENCES "agape_app_development_demo"."finance_tax_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."finance_tax_group_tax" ADD CONSTRAINT "finance_tax_group_tax_tax_id_finance_tax_id_fk" FOREIGN KEY ("tax_id") REFERENCES "agape_app_development_demo"."finance_tax"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item_uom" ADD CONSTRAINT "inventory_item_uom_item_id_inventory_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "agape_app_development_demo"."inventory_item"("item_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item_uom" ADD CONSTRAINT "inventory_item_uom_uom_id_inventory_unit_of_measure_id_fk" FOREIGN KEY ("uom_id") REFERENCES "agape_app_development_demo"."inventory_unit_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_item_attribute_value_attr_code" ON "agape_app_development_demo"."catalogs_item_attribute_value" USING btree ("attribute_id","code");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_attribute_value_attr" ON "agape_app_development_demo"."catalogs_item_attribute_value" USING btree ("attribute_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_item_attribute_code" ON "agape_app_development_demo"."catalogs_item_attribute" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_item_bundle_bundle_component" ON "agape_app_development_demo"."catalogs_item_bundle" USING btree ("bundle_item_id","component_item_id");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_bundle_bundle" ON "agape_app_development_demo"."catalogs_item_bundle" USING btree ("bundle_item_id");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_bundle_component" ON "agape_app_development_demo"."catalogs_item_bundle" USING btree ("component_item_id");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_variant_attr_value" ON "agape_app_development_demo"."catalogs_item_variant_attribute_value" USING btree ("attribute_value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_item_variant_code" ON "agape_app_development_demo"."catalogs_item_variant" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_catalogs_item_variant_parent" ON "agape_app_development_demo"."catalogs_item_variant" USING btree ("parent_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_price_list_item_unique" ON "agape_app_development_demo"."catalogs_price_list_item" USING btree ("price_list_id","item_id","valid_from","valid_to");--> statement-breakpoint
CREATE INDEX "ix_catalogs_price_list_item_item" ON "agape_app_development_demo"."catalogs_price_list_item" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "ix_catalogs_price_list_item_list" ON "agape_app_development_demo"."catalogs_price_list_item" USING btree ("price_list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_catalogs_price_list_code" ON "agape_app_development_demo"."catalogs_price_list" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_item_accounting_group_code" ON "agape_app_development_demo"."finance_item_accounting_group" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_tax_group_code" ON "agape_app_development_demo"."finance_tax_group" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_finance_tax_code" ON "agape_app_development_demo"."finance_tax" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_item_uom_item_uom" ON "agape_app_development_demo"."inventory_item_uom" USING btree ("item_id","uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_inventory_unit_of_measure_code" ON "agape_app_development_demo"."inventory_unit_of_measure" USING btree ("code");--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD CONSTRAINT "catalogs_item_tax_group_id_finance_tax_group_id_fk" FOREIGN KEY ("tax_group_id") REFERENCES "agape_app_development_demo"."finance_tax_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."catalogs_item" ADD CONSTRAINT "catalogs_item_item_accounting_group_id_finance_item_accounting_group_id_fk" FOREIGN KEY ("item_accounting_group_id") REFERENCES "agape_app_development_demo"."finance_item_accounting_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_item" ADD CONSTRAINT "inventory_item_uom_id_inventory_unit_of_measure_id_fk" FOREIGN KEY ("uom_id") REFERENCES "agape_app_development_demo"."inventory_unit_of_measure"("id") ON DELETE restrict ON UPDATE no action;