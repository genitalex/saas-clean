ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'task_status_changed';
--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'team_member_joined';
--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'customer_updated';
--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'event_updated';
--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'opportunity_updated';
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "task_assigned" boolean DEFAULT true NOT NULL,
  "task_overdue" boolean DEFAULT true NOT NULL,
  "follow_up_overdue" boolean DEFAULT true NOT NULL,
  "task_blocked" boolean DEFAULT true NOT NULL,
  "waiting_ready" boolean DEFAULT true NOT NULL,
  "automation_executed" boolean DEFAULT true NOT NULL,
  "event_important" boolean DEFAULT true NOT NULL,
  "task_status_changed" boolean DEFAULT true NOT NULL,
  "team_member_joined" boolean DEFAULT true NOT NULL,
  "customer_updated" boolean DEFAULT true NOT NULL,
  "event_updated" boolean DEFAULT true NOT NULL,
  "opportunity_updated" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "notification_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_org_user_idx" ON "notification_preferences" USING btree ("organization_id", "user_id");
--> statement-breakpoint
CREATE INDEX "notification_preferences_organization_id_idx" ON "notification_preferences" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");
