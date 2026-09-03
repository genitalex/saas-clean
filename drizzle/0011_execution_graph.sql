ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "parent_task_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "follow_up_for_task_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk"
    FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_follow_up_for_task_id_tasks_id_fk"
    FOREIGN KEY ("follow_up_for_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_parent_task_id_idx" ON "tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_follow_up_for_task_id_idx" ON "tasks" USING btree ("follow_up_for_task_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_dependencies" (
  "task_id" uuid NOT NULL,
  "blocking_task_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "task_dependencies_task_id_blocking_task_id_pk" PRIMARY KEY("task_id", "blocking_task_id"),
  CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade,
  CONSTRAINT "task_dependencies_blocking_task_id_tasks_id_fk" FOREIGN KEY ("blocking_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_dependencies_blocking_task_id_idx" ON "task_dependencies" USING btree ("blocking_task_id");