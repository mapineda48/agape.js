CREATE TABLE "agape_app_demo_development"."inventory_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(50) NOT NULL,
	"isEnabled" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_demo_development"."inventory_product" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"slogan" varchar(80) NOT NULL,
	"description" varchar(500),
	"is_enabled" boolean NOT NULL,
	"rating" smallint NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category_id" integer NOT NULL,
	"subcategory_id" integer NOT NULL,
	"images" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_demo_development"."inventory_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(50) NOT NULL,
	"isEnabled" boolean NOT NULL,
	"categoryId" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."inventory_product" ADD CONSTRAINT "inventory_product_category_id_inventory_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "agape_app_demo_development"."inventory_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."inventory_product" ADD CONSTRAINT "inventory_product_subcategory_id_inventory_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "agape_app_demo_development"."inventory_subcategories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."inventory_subcategories" ADD CONSTRAINT "inventory_subcategories_categoryId_inventory_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "agape_app_demo_development"."inventory_categories"("id") ON DELETE restrict ON UPDATE no action;