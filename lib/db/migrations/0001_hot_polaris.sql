ALTER TABLE "agape_app_demo_development"."staff_employee" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."staff_employee" ADD COLUMN "avatar_url" varchar(255);--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."staff_employee" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "agape_app_demo_development"."staff_employee" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();