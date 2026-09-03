CREATE TYPE "public"."attention_item_type" AS ENUM('task_overdue', 'follow_up_overdue', 'task_blocked', 'waiting_ready', 'customer_inactive');--> statement-breakpoint
CREATE TYPE "public"."automation_action" AS ENUM('create_follow_up', 'create_task', 'create_attention', 'mark_attention');--> statement-breakpoint
CREATE TYPE "public"."automation_trigger" AS ENUM('task_completed', 'event_completed', 'waiting_due', 'task_overdue', 'customer_inactive');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('task_assigned', 'task_overdue', 'follow_up_overdue', 'task_blocked', 'waiting_ready', 'automation_executed', 'event_important');--> statement-breakpoint
CREATE TABLE "attention_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "type" "attention_item_type" NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "ref_entity_type" text NOT NULL,
  "ref_entity_id" uuid NOT NULL,
  "customer_id" uuid,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "automations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "trigger" "automation_trigger" NOT NULL,
  "action" "automation_action" NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "type" "notification_type" NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "read" boolean DEFAULT false NOT NULL,
  "ref_entity_type" text,
  "ref_entity_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attention_items_organization_id_idx" ON "attention_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "attention_items_user_id_idx" ON "attention_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attention_items_status_idx" ON "attention_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attention_items_org_user_status_idx" ON "attention_items" USING btree ("organization_id", "user_id", "status");--> statement-breakpoint
CREATE INDEX "attention_items_created_at_idx" ON "attention_items" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attention_items_entity_user_idx" ON "attention_items" USING btree ("ref_entity_type", "ref_entity_id", "user_id");--> statement-breakpoint
CREATE INDEX "automations_organization_id_idx" ON "automations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "automations_enabled_idx" ON "automations" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "notifications_organization_id_idx" ON "notifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notifications_org_user_read_idx" ON "notifications" USING btree ("organization_id", "user_id", "read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");