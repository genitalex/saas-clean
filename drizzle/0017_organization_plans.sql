DO $$ BEGIN
  CREATE TYPE "public"."organization_plan" AS ENUM('solo', 'team');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "plan" "organization_plan" DEFAULT 'solo' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "seat_limit" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE "organization_members" SET "role" = 'member' WHERE "role" = 'manager';--> statement-breakpoint
