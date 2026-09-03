CREATE TABLE IF NOT EXISTS "task_workflow_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL,
  "actor_id" uuid,
  "type" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "task_workflow_history_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade,
  CONSTRAINT "task_workflow_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_workflow_history_task_created_idx" ON "task_workflow_history" USING btree ("task_id", "created_at");