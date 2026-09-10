ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "industry" text;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "team_size" integer;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "main_use_case" text;
