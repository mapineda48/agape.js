CREATE TABLE "agape_app_development_demo"."inventory_location" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"is_enabled" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_movement_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"location_id" integer,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_movement_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"factor" smallint NOT NULL,
	"affects_stock" boolean NOT NULL,
	"is_enabled" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_movement" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_type_id" integer NOT NULL,
	"movement_date" timestamp with time zone NOT NULL,
	"observation" varchar(500),
	"user_id" integer NOT NULL,
	"source_document_type" varchar(30),
	"source_document_id" integer
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."inventory_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"location_id" integer,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_movement_id_inventory_movement_id_fk" FOREIGN KEY ("movement_id") REFERENCES "agape_app_development_demo"."inventory_movement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "agape_app_development_demo"."inventory_product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement_detail" ADD CONSTRAINT "inventory_movement_detail_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_movement_type_id_inventory_movement_type_id_fk" FOREIGN KEY ("movement_type_id") REFERENCES "agape_app_development_demo"."inventory_movement_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_movement" ADD CONSTRAINT "inventory_movement_user_id_staff_employee_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_development_demo"."staff_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD CONSTRAINT "inventory_stock_product_id_inventory_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "agape_app_development_demo"."inventory_product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."inventory_stock" ADD CONSTRAINT "inventory_stock_location_id_inventory_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "agape_app_development_demo"."inventory_location"("id") ON DELETE restrict ON UPDATE no action;