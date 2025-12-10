CREATE TYPE "agape_app_development_demo"."address_type_enum" AS ENUM('billing', 'shipping', 'main', 'branch', 'other');--> statement-breakpoint
CREATE TYPE "agape_app_development_demo"."contact_method_type_enum" AS ENUM('email', 'phone', 'mobile', 'whatsapp', 'telegram', 'fax', 'other');--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_address" (
	"id" serial PRIMARY KEY NOT NULL,
	"street" varchar(255) NOT NULL,
	"street_line_2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"zip_code" varchar(20),
	"country_code" varchar(2) NOT NULL,
	"reference" varchar(255),
	"notes" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_user_address" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"address_id" integer NOT NULL,
	"address_type" "agape_app_development_demo"."address_type_enum" NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"label" varchar(100),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_company_contact" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"role" varchar(100),
	"department" varchar(100),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_contact_method" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_type" "agape_app_development_demo"."contact_method_type_enum" NOT NULL,
	"value" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"label" varchar(100),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."user" ADD COLUMN "country_code" varchar(2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."user" ADD COLUMN "language_code" varchar(2);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."user" ADD COLUMN "currency_code" varchar(3);--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_user_address" ADD CONSTRAINT "core_user_address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_user_address" ADD CONSTRAINT "core_user_address_address_id_core_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "agape_app_development_demo"."core_address"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_company_contact" ADD CONSTRAINT "core_company_contact_company_id_core_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "agape_app_development_demo"."core_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_company_contact" ADD CONSTRAINT "core_company_contact_person_id_core_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "agape_app_development_demo"."core_person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_contact_method" ADD CONSTRAINT "core_contact_method_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_address_type" ON "agape_app_development_demo"."core_user_address" USING btree ("user_id","address_id","address_type");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_company_contact_unique" ON "agape_app_development_demo"."core_company_contact" USING btree ("company_id","person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_contact_method_unique" ON "agape_app_development_demo"."core_contact_method" USING btree ("user_id","contact_type","value");