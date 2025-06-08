CREATE SCHEMA "agape_app_demo_development";
--> statement-breakpoint
CREATE TABLE "agape_app_demo_development"."access_employee" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "access_employee_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "agape_app_demo_development"."agape" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agape_app_demo_development"."person" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"birthdate" timestamp with time zone NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "person_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "agape_app_demo_development"."staff_employee" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"hire_date" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"avatar_url" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "staff_employee_person_id_unique" UNIQUE("person_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_demo_development"."staff_employee_roles" (
	"employee_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "staff_employee_roles_employee_id_role_id_pk" PRIMARY KEY("employee_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "agape_app_demo_development"."staff_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."access_employee" ADD CONSTRAINT "access_employee_employee_id_staff_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "agape_app_demo_development"."staff_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."staff_employee" ADD CONSTRAINT "staff_employee_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "agape_app_demo_development"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."staff_employee_roles" ADD CONSTRAINT "staff_employee_roles_employee_id_staff_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "agape_app_demo_development"."staff_employee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."staff_employee_roles" ADD CONSTRAINT "staff_employee_roles_role_id_staff_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "agape_app_demo_development"."staff_role"("id") ON DELETE no action ON UPDATE no action;