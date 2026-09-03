DO $$ BEGIN
  CREATE TYPE "task_recurrence" AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "waiting_on" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurrence_rule" "task_recurrence";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_recurrence_rule_idx" ON "tasks" USING btree ("recurrence_rule");
