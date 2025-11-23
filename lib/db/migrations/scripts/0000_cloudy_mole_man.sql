CREATE SCHEMA "agape_app_development_demo";
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."agape" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
