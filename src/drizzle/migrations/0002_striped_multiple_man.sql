ALTER TABLE "membership_plans" ADD COLUMN "creem_price_id_usd_monthly" varchar(255);--> statement-breakpoint
ALTER TABLE "membership_plans" ADD COLUMN "creem_price_id_cny_monthly" varchar(255);--> statement-breakpoint
ALTER TABLE "membership_plans" ADD COLUMN "creem_price_id_usd_yearly" varchar(255);--> statement-breakpoint
ALTER TABLE "membership_plans" ADD COLUMN "creem_price_id_cny_yearly" varchar(255);--> statement-breakpoint
ALTER TABLE "payment_records" ADD COLUMN "provider" varchar(20);--> statement-breakpoint
ALTER TABLE "payment_records" ADD COLUMN "creem_payment_id" varchar(255);