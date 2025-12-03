CREATE TABLE "agape_app_development_demo"."company" (
	"id" serial PRIMARY KEY NOT NULL,
	"legal_name" varchar(150) NOT NULL,
	"trade_name" varchar(150)
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."document_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_enabled" boolean NOT NULL,
	"applies_to_person" boolean NOT NULL,
	"applies_to_company" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."core_person" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"birthdate" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."user" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_type" varchar(20) NOT NULL,
	"document_type_id" integer NOT NULL,
	"document_number" varchar(30) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"address" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."person" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "agape_app_development_demo"."person" CASCADE;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" DROP CONSTRAINT "crm_client_person_id_unique";--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee" DROP CONSTRAINT "staff_employee_person_id_unique";--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" DROP CONSTRAINT "crm_client_person_id_person_id_fk";
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" DROP CONSTRAINT "purchasing_supplier_person_id_person_id_fk";
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee" DROP CONSTRAINT "staff_employee_person_id_person_id_fk";
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."company" ADD CONSTRAINT "company_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."core_person" ADD CONSTRAINT "core_person_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."user" ADD CONSTRAINT "user_document_type_id_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "agape_app_development_demo"."document_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_document_type_code" ON "agape_app_development_demo"."document_type" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_party_document" ON "agape_app_development_demo"."user" USING btree ("document_type_id","document_number");--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" ADD CONSTRAINT "crm_client_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" ADD CONSTRAINT "purchasing_supplier_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee" ADD CONSTRAINT "staff_employee_id_core_person_id_fk" FOREIGN KEY ("id") REFERENCES "agape_app_development_demo"."core_person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."crm_client" DROP COLUMN "person_id";--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."purchasing_supplier" DROP COLUMN "person_id";--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."staff_employee" DROP COLUMN "person_id";