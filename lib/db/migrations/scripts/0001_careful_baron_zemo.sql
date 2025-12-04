CREATE TABLE "agape_app_development_demo"."numeration_document_sequence" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"assigned_number" bigint NOT NULL,
	"external_document_id" varchar(100) NOT NULL,
	"external_document_type" varchar(50) NOT NULL,
	"assigned_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."numeration_document_series" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type_id" integer NOT NULL,
	"series_code" varchar(50) NOT NULL,
	"prefix" varchar(20),
	"suffix" varchar(20),
	"start_number" bigint NOT NULL,
	"end_number" bigint NOT NULL,
	"current_number" bigint NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agape_app_development_demo"."numeration_document_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"module" varchar(30),
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."numeration_document_sequence" ADD CONSTRAINT "numeration_document_sequence_series_id_numeration_document_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "agape_app_development_demo"."numeration_document_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agape_app_development_demo"."numeration_document_series" ADD CONSTRAINT "numeration_document_series_document_type_id_numeration_document_type_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "agape_app_development_demo"."numeration_document_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_document_sequence_series_number" ON "agape_app_development_demo"."numeration_document_sequence" USING btree ("series_id","assigned_number");--> statement-breakpoint
CREATE INDEX "ix_document_sequence_external" ON "agape_app_development_demo"."numeration_document_sequence" USING btree ("external_document_type","external_document_id");--> statement-breakpoint
CREATE INDEX "ix_document_sequence_series" ON "agape_app_development_demo"."numeration_document_sequence" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_document_series_type_series_code" ON "agape_app_development_demo"."numeration_document_series" USING btree ("document_type_id","series_code");--> statement-breakpoint
CREATE INDEX "ix_document_series_type" ON "agape_app_development_demo"."numeration_document_series" USING btree ("document_type_id");--> statement-breakpoint
CREATE INDEX "ix_document_series_active" ON "agape_app_development_demo"."numeration_document_series" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_business_document_type_code" ON "agape_app_development_demo"."numeration_document_type" USING btree ("code");