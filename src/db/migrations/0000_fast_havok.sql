CREATE TYPE "public"."agent_role" AS ENUM('admin', 'supervisor', 'field_agent');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('text', 'number', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'file');--> statement-breakpoint
CREATE TYPE "public"."intervention_status" AS ENUM('draft', 'pending', 'completed', 'validated', 'synced');--> statement-breakpoint
CREATE TYPE "public"."photo_type" AS ENUM('before', 'during', 'after', 'detail');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"role" "agent_role" DEFAULT 'field_agent' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"password_hash" text NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "agents_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"address" text,
	"city" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100) DEFAULT 'France',
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"coordinates" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "clients_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "intervention_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intervention_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"value_text" text,
	"value_number" integer,
	"value_boolean" boolean,
	"value_json" jsonb,
	"value_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intervention_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intervention_type_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"field_type" "field_type" NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0,
	"placeholder" varchar(255),
	"help_text" text,
	"default_value" text,
	"validation_rules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intervention_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"color" varchar(20),
	"requires_vehicle" boolean DEFAULT false NOT NULL,
	"requires_photos" boolean DEFAULT true NOT NULL,
	"min_photos" integer DEFAULT 2,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"config" jsonb,
	CONSTRAINT "intervention_types_name_unique" UNIQUE("name"),
	CONSTRAINT "intervention_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intervention_type_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"status" "intervention_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"coordinates" jsonb,
	"location_accuracy" integer,
	"notes" text,
	"internal_notes" text,
	"client_signature" text,
	"agent_signature" text,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"synced_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intervention_id" uuid NOT NULL,
	"type" "photo_type" DEFAULT 'detail' NOT NULL,
	"filename" varchar(255) NOT NULL,
	"filepath" text NOT NULL,
	"url" text,
	"mime_type" varchar(100) DEFAULT 'image/jpeg',
	"file_size" integer,
	"width" integer,
	"height" integer,
	"captured_at" timestamp,
	"coordinates" jsonb,
	"device_info" jsonb,
	"caption" text,
	"sort_order" integer DEFAULT 0,
	"is_uploaded" boolean DEFAULT false NOT NULL,
	"uploaded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "sync_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"operation" varchar(20) NOT NULL,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 5,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"last_error" text,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"scheduled_for" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"device_id" varchar(100),
	"agent_id" uuid,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"license_plate" varchar(20) NOT NULL,
	"make" varchar(100),
	"model" varchar(100),
	"year" integer,
	"vin" varchar(50),
	"fuel_type" varchar(50),
	"tank_capacity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "intervention_data" ADD CONSTRAINT "intervention_data_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention_data" ADD CONSTRAINT "intervention_data_field_id_intervention_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."intervention_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intervention_fields" ADD CONSTRAINT "intervention_fields_intervention_type_id_intervention_types_id_fk" FOREIGN KEY ("intervention_type_id") REFERENCES "public"."intervention_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_intervention_type_id_intervention_types_id_fk" FOREIGN KEY ("intervention_type_id") REFERENCES "public"."intervention_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_intervention_id_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_email_idx" ON "agents" USING btree ("email");--> statement-breakpoint
CREATE INDEX "agents_active_idx" ON "agents" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "clients_name_idx" ON "clients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "clients_code_idx" ON "clients" USING btree ("code");--> statement-breakpoint
CREATE INDEX "clients_active_idx" ON "clients" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "intervention_data_intervention_idx" ON "intervention_data" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "intervention_data_field_idx" ON "intervention_data" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX "intervention_data_unique_idx" ON "intervention_data" USING btree ("intervention_id","field_id");--> statement-breakpoint
CREATE INDEX "intervention_fields_type_idx" ON "intervention_fields" USING btree ("intervention_type_id");--> statement-breakpoint
CREATE INDEX "intervention_fields_type_code_idx" ON "intervention_fields" USING btree ("intervention_type_id","code");--> statement-breakpoint
CREATE INDEX "intervention_types_code_idx" ON "intervention_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "intervention_types_active_idx" ON "intervention_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "interventions_type_idx" ON "interventions" USING btree ("intervention_type_id");--> statement-breakpoint
CREATE INDEX "interventions_agent_idx" ON "interventions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "interventions_client_idx" ON "interventions" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "interventions_vehicle_idx" ON "interventions" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "interventions_status_idx" ON "interventions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "interventions_scheduled_idx" ON "interventions" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "interventions_created_idx" ON "interventions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "photos_intervention_idx" ON "photos" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "photos_type_idx" ON "photos" USING btree ("type");--> statement-breakpoint
CREATE INDEX "photos_uploaded_idx" ON "photos" USING btree ("is_uploaded");--> statement-breakpoint
CREATE INDEX "sync_queue_status_idx" ON "sync_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_queue_entity_idx" ON "sync_queue" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "sync_queue_scheduled_idx" ON "sync_queue" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "sync_queue_priority_idx" ON "sync_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "sync_queue_agent_idx" ON "sync_queue" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "vehicles_client_idx" ON "vehicles" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "vehicles_plate_idx" ON "vehicles" USING btree ("license_plate");--> statement-breakpoint
CREATE INDEX "vehicles_active_idx" ON "vehicles" USING btree ("is_active");