DO $$ BEGIN
  CREATE TYPE "event_status" AS ENUM ('planned', 'in_progress', 'done', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "status" "event_status" NOT NULL DEFAULT 'planned';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "color" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminder_minutes" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "repeat_rule" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "event_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_event_id_events_id_fk"
    FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_event_id_idx" ON "tasks" USING btree ("event_id");--> statement-breakpoint

ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "event_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "activities" ADD CONSTRAINT "activities_event_id_events_id_fk"
    FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_event_id_idx" ON "activities" USING btree ("event_id");
