CREATE TYPE "public"."attention_item_type" AS ENUM('task_overdue', 'follow_up_overdue', 'task_blocked', 'waiting_ready', 'customer_inactive');--> statement-breakpoint
CREATE TYPE "public"."automation_action" AS ENUM('create_follow_up', 'create_task', 'create_attention', 'mark_attention');--> statement-breakpoint
CREATE TYPE "public"."automation_trigger" AS ENUM('task_completed', 'event_completed', 'waiting_due', 'task_overdue', 'customer_inactive');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('planned', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('task_assigned', 'task_overdue', 'follow_up_overdue', 'task_blocked', 'waiting_ready', 'automation_executed', 'event_important');--> statement-breakpoint
CREATE TYPE "public"."task_recurrence" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"trigger" "automation_trigger" NOT NULL,
	"action" "automation_action" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tag" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "saved_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"entity" text DEFAULT 'tasks' NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_by" text,
	"group_by" text,
	"favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_dependencies" (
	"task_id" uuid NOT NULL,
	"blocking_task_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_dependencies_task_id_blocking_task_id_pk" PRIMARY KEY("task_id","blocking_task_id")
);
--> statement-breakpoint
CREATE TABLE "task_workflow_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"actor_id" uuid,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "activities_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "status" "event_status" DEFAULT 'planned' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "reminder_minutes" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "repeat_rule" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "parent_task_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "follow_up_for_task_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "waiting_on" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "recurrence_rule" "task_recurrence";--> statement-breakpoint
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_blocking_task_id_tasks_id_fk" FOREIGN KEY ("blocking_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_workflow_history" ADD CONSTRAINT "task_workflow_history_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_workflow_history" ADD CONSTRAINT "task_workflow_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attention_items_organization_id_idx" ON "attention_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "attention_items_user_id_idx" ON "attention_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attention_items_status_idx" ON "attention_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attention_items_org_user_status_idx" ON "attention_items" USING btree ("organization_id","user_id","status");--> statement-breakpoint
CREATE INDEX "attention_items_created_at_idx" ON "attention_items" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attention_items_entity_user_idx" ON "attention_items" USING btree ("ref_entity_type","ref_entity_id","user_id");--> statement-breakpoint
CREATE INDEX "automations_organization_id_idx" ON "automations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "automations_enabled_idx" ON "automations" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "notes_organization_id_idx" ON "notes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_organization_user_updated_idx" ON "notes" USING btree ("organization_id","user_id","updated_at");--> statement-breakpoint
CREATE INDEX "notifications_organization_id_idx" ON "notifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notifications_org_user_read_idx" ON "notifications" USING btree ("organization_id","user_id","read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "saved_views_org_user_idx" ON "saved_views" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "saved_views_entity_idx" ON "saved_views" USING btree ("entity");--> statement-breakpoint
CREATE INDEX "saved_views_favorite_idx" ON "saved_views" USING btree ("organization_id","favorite");--> statement-breakpoint
CREATE INDEX "task_dependencies_blocking_task_id_idx" ON "task_dependencies" USING btree ("blocking_task_id");--> statement-breakpoint
CREATE INDEX "task_workflow_history_task_created_idx" ON "task_workflow_history" USING btree ("task_id","created_at");--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_follow_up_for_task_id_tasks_id_fk" FOREIGN KEY ("follow_up_for_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_event_id_idx" ON "activities" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_event_id_idx" ON "tasks" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "tasks_parent_task_id_idx" ON "tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE INDEX "tasks_follow_up_for_task_id_idx" ON "tasks" USING btree ("follow_up_for_task_id");--> statement-breakpoint
CREATE INDEX "tasks_recurrence_rule_idx" ON "tasks" USING btree ("recurrence_rule");