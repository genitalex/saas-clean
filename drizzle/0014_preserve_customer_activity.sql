ALTER TABLE "activities" ALTER COLUMN "customer_id" DROP NOT NULL;
ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_customer_id_customers_id_fk";
ALTER TABLE "activities" ADD CONSTRAINT "activities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE set null;