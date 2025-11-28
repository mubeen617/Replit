CREATE TABLE "customer_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"password" varchar NOT NULL,
	"role" varchar DEFAULT 'user' NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"domain" varchar NOT NULL,
	"admin_name" varchar NOT NULL,
	"admin_email" varchar NOT NULL,
	"admin_password" varchar NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "dispatch" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"lead_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"dispatch_number" varchar NOT NULL,
	"carrier_name" varchar,
	"carrier_phone" varchar,
	"carrier_email" varchar,
	"driver_name" varchar,
	"driver_phone" varchar,
	"truck_info" varchar,
	"status" varchar DEFAULT 'assigned' NOT NULL,
	"pickup_date" timestamp,
	"delivery_date" timestamp,
	"actual_pickup_date" timestamp,
	"actual_delivery_date" timestamp,
	"final_carrier_fees" varchar,
	"final_broker_fees" varchar,
	"final_total_tariff" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dispatch_dispatch_number_unique" UNIQUE("dispatch_number")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"assigned_user_id" varchar,
	"lead_number" varchar NOT NULL,
	"contact_name" varchar NOT NULL,
	"contact_email" varchar NOT NULL,
	"contact_phone" varchar NOT NULL,
	"carrier_fees" varchar DEFAULT '0' NOT NULL,
	"broker_fees" varchar DEFAULT '0' NOT NULL,
	"total_tariff" varchar DEFAULT '0' NOT NULL,
	"vehicle_year" varchar,
	"vehicle_make" varchar,
	"vehicle_model" varchar,
	"vehicle_type" varchar,
	"trailer_type" varchar DEFAULT 'open' NOT NULL,
	"origin" varchar NOT NULL,
	"origin_zipcode" varchar,
	"destination" varchar NOT NULL,
	"destination_zipcode" varchar,
	"pickup_date" timestamp NOT NULL,
	"delivery_date" timestamp,
	"customer_rate" varchar,
	"carrier_rate" varchar,
	"weight" varchar,
	"transport_type" varchar,
	"status" varchar DEFAULT 'lead' NOT NULL,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"notes" text,
	"source" varchar,
	"external_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "leads_lead_number_unique" UNIQUE("lead_number")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" varchar NOT NULL,
	"lead_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"order_number" varchar NOT NULL,
	"contract_type" varchar DEFAULT 'standard' NOT NULL,
	"contract_sent" boolean DEFAULT false,
	"contract_sent_at" timestamp,
	"contract_signed" boolean DEFAULT false,
	"contract_signed_at" timestamp,
	"signature_data" text,
	"change_orders" jsonb,
	"status" varchar DEFAULT 'pending_signature' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"created_by_user_id" varchar NOT NULL,
	"carrier_fees" varchar NOT NULL,
	"broker_fees" varchar NOT NULL,
	"total_tariff" varchar NOT NULL,
	"pickup_person_name" varchar NOT NULL,
	"pickup_person_phone" varchar NOT NULL,
	"pickup_address" text NOT NULL,
	"dropoff_person_name" varchar NOT NULL,
	"dropoff_person_phone" varchar NOT NULL,
	"dropoff_address" text NOT NULL,
	"card_details" text,
	"special_terms" text,
	"standard_terms" text,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "customer_users" ADD CONSTRAINT "customer_users_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_user_id_customer_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."customer_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_user_id_customer_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."customer_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");