ALTER TABLE "sessions" ADD COLUMN "active_organization_id" text;
CREATE TYPE "public"."customer_kind" AS ENUM('person', 'company');
CREATE TABLE "organizations" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
CREATE TABLE "organization_members" (
  "organization_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" text DEFAULT 'member' NOT NULL,
  "created_at" timestamp NOT NULL,
  CONSTRAINT "organization_members_org_user_unique" UNIQUE("organization_id", "user_id")
);
CREATE TABLE "customers" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "owner_id" text,
  "kind" "customer_kind" NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "address" text,
  "next_action" text,
  "next_action_at" timestamp,
  "archived" boolean DEFAULT false NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null;
CREATE INDEX "organization_members_user_id_idx" ON "organization_members" USING btree ("user_id");
CREATE INDEX "customers_organization_idx" ON "customers" USING btree ("organization_id");
CREATE INDEX "customers_organization_archived_idx" ON "customers" USING btree ("organization_id", "archived");
