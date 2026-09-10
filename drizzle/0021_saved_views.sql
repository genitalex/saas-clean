CREATE TABLE IF NOT EXISTS "saved_views" (
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
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "saved_views_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "saved_views_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_views_org_user_idx"
  ON "saved_views" USING btree ("organization_id", "user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_views_entity_idx"
  ON "saved_views" USING btree ("entity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_views_favorite_idx"
  ON "saved_views" USING btree ("organization_id", "favorite");
