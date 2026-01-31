CREATE SCHEMA "agape_app_migrations";
--> statement-breakpoint
CREATE TYPE "agape_app_migrations"."address_type_enum" AS ENUM('billing', 'shipping', 'main', 'branch', 'other');--> statement-breakpoint
CREATE TYPE "agape_app_migrations"."contact_method_type_enum" AS ENUM('email', 'phone', 'mobile', 'whatsapp', 'telegram', 'fax', 'other');--> statement-breakpoint
CREATE TYPE "agape_app_migrations"."user_type_enum" AS ENUM('person', 'company');--> statement-breakpoint
CREATE TABLE "agape_app_migrations"."address" (
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_migrations"."user_address" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"address_id" integer NOT NULL,
	"address_type" "agape_app_migrations"."address_type_enum" NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"label" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_migrations"."agape" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_migrations"."company" (
	"id" integer PRIMARY KEY NOT NULL,
	"legal_name" varchar(150) NOT NULL,
	"trade_name" varchar(150)
);
--> statement-breakpoint
CREATE TABLE "agape_app_migrations"."company_contact" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"role" varchar(100),
	"department" varchar(100),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_migrations"."contact_method" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_type" "agape_app_migrations"."contact_method_type_enum" NOT NULL,
	"value" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"label" varchar(100),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_migrations"."identity_document_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"applies_to_person" boolean NOT NULL,
	"applies_to_company" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_migrations"."person" (
	"id" integer PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"birthdate" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agape_app_migrations"."user" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_type" "agape_app_migrations"."user_type_enum" NOT NULL,
	"document_type_id" integer NOT NULL,
	"document_number" varchar(30) NOT NULL,
	"country_code" varchar(2),
	"language_code" varchar(2),
	"currency_code" varchar(3),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agape_app_migrations"."user_address" ADD CONSTRAINT "user_address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_migrations"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_migrations"."user_address" ADD CONSTRAINT "user_address_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "agape_app_migrations"."address"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_migrations"."company" ADD CONSTRAINT "company_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_migrations"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_migrations"."company_contact" ADD CONSTRAINT "company_contact_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "agape_app_migrations"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_migrations"."company_contact" ADD CONSTRAINT "company_contact_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "agape_app_migrations"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_migrations"."contact_method" ADD CONSTRAINT "contact_method_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "agape_app_migrations"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_migrations"."person" ADD CONSTRAINT "person_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_migrations"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_migrations"."user" ADD CONSTRAINT "user_document_type_id_identity_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "agape_app_migrations"."identity_document_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_address_type" ON "agape_app_migrations"."user_address" USING btree ("user_id","address_id","address_type");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_company_contact_unique" ON "agape_app_migrations"."company_contact" USING btree ("company_id","person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_company_contact_primary" ON "agape_app_migrations"."company_contact" USING btree ("company_id") WHERE is_primary = true;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_contact_method_unique" ON "agape_app_migrations"."contact_method" USING btree ("user_id","contact_type","value");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_contact_method_primary" ON "agape_app_migrations"."contact_method" USING btree ("user_id","contact_type") WHERE is_primary = true;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_identity_document_type_code" ON "agape_app_migrations"."identity_document_type" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_document" ON "agape_app_migrations"."user" USING btree ("document_type_id","document_number");