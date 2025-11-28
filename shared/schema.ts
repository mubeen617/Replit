import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  first_name: varchar("first_name"),
  last_name: varchar("last_name"),
  profile_image_url: varchar("profile_image_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Customer organizations table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  domain: varchar("domain").notNull().unique(),
  admin_name: varchar("admin_name").notNull(),
  admin_email: varchar("admin_email").notNull(),
  admin_password: varchar("admin_password").notNull(), // Hashed password for CRM portal login
  status: varchar("status").notNull().default("active"), // active, inactive, suspended, pending
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Customer users table (hierarchical under customers)
export const customerUsers = pgTable("customer_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customer_id: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  first_name: varchar("first_name").notNull(),
  last_name: varchar("last_name").notNull(),
  password: varchar("password").notNull(), // Hashed password for CRM portal login
  role: varchar("role").notNull().default("user"), // admin, user, viewer
  status: varchar("status").notNull().default("active"), // active, inactive, pending
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  users: many(customerUsers),
  leads: many(leads),
}));

export const customerUsersRelations = relations(customerUsers, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerUsers.customer_id],
    references: [customers.id],
  }),
  assignedLeads: many(leads),
}));

// Schemas for validation
export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  domain: true,
  admin_name: true,
  admin_email: true,
  status: true,
}).extend({
  admin_password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertCustomerUserSchema = createInsertSchema(customerUsers).pick({
  customer_id: true,
  email: true,
  first_name: true,
  last_name: true,
  role: true,
  status: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Enhanced Leads table for vehicle shipping opportunities
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customer_id: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  assigned_user_id: varchar("assigned_user_id").references(() => customerUsers.id, { onDelete: "set null" }),
  public_id: varchar("public_id", { length: 255 }).notNull().unique(),

  // Contact Details
  contact_name: varchar("contact_name").notNull(),
  contact_email: varchar("contact_email"),
  contact_phone: varchar("contact_phone").notNull(),

  // Financial Details
  carrier_fees: varchar("carrier_fees").default("0").notNull(),
  broker_fees: varchar("broker_fees").default("0").notNull(),
  total_tariff: varchar("total_tariff").default("0").notNull(), // Sum of carrier and broker fees

  // Vehicle Details
  vehicle_year: varchar("vehicle_year"),
  vehicle_make: varchar("vehicle_make"),
  vehicle_model: varchar("vehicle_model"),
  vehicle_type: varchar("vehicle_type"), // Car, truck, motorcycle, etc.
  trailer_type: varchar("trailer_type").default("open").notNull(), // open, closed
  condition: varchar("condition").default("run").notNull(), // run, inop

  // Location and Timing
  origin: varchar("origin").notNull(),
  origin_zipcode: varchar("origin_zipcode"),
  destination: varchar("destination").notNull(),
  destination_zipcode: varchar("destination_zipcode"),
  pickup_date: timestamp("pickup_date").notNull(), // Maps to "Ship Date"
  delivery_date: timestamp("delivery_date"),

  // Legacy fields (keeping for backward compatibility)
  customer_rate: varchar("customer_rate"),
  carrier_rate: varchar("carrier_rate"),
  weight: varchar("weight"),
  transport_type: varchar("transport_type"), // Open, enclosed transport

  // Workflow Status
  status: varchar("status").default("lead").notNull(), // lead, quote, order, dispatch, completed, cancelled
  priority: varchar("priority").default("normal").notNull(), // low, normal, high, urgent
  notes: text("notes"),
  source: varchar("source"), // API source where lead came from or 'manual'
  external_id: varchar("external_id"), // ID from external system
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Quotes table - leads converted to quotes
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lead_id: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  customer_id: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  public_id: varchar("public_id", { length: 255 }).notNull().unique(),
  created_by_user_id: varchar("created_by_user_id").references(() => customerUsers.id, { onDelete: "set null" }),
  // Tariff Details
  carrier_fees: varchar("carrier_fees").notNull(),
  broker_fees: varchar("broker_fees").notNull(),
  total_tariff: varchar("total_tariff").notNull(),

  // Pickup Details
  pickup_person_name: varchar("pickup_person_name"),
  pickup_person_phone: varchar("pickup_person_phone"),
  pickup_address: text("pickup_address"),
  pickup_zip: varchar("pickup_zip"),
  pickup_contacts: jsonb("pickup_contacts"), // Array of { name, phone }

  // Drop-off Details
  dropoff_person_name: varchar("dropoff_person_name"),
  dropoff_person_phone: varchar("dropoff_person_phone"),
  dropoff_address: text("dropoff_address"),
  dropoff_zip: varchar("dropoff_zip"),
  dropoff_contacts: jsonb("dropoff_contacts"), // Array of { name, phone }

  // Payment Details (optional)
  card_details: text("card_details"), // Encrypted card details

  // Terms and Conditions
  special_terms: text("special_terms"),
  standard_terms: text("standard_terms"),

  status: varchar("status").default("draft").notNull(), // draft, sent, accepted, rejected, expired
  valid_until: timestamp("valid_until"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Orders table - quotes converted to orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quote_id: varchar("quote_id").references(() => quotes.id, { onDelete: "cascade" }).notNull(),
  lead_id: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  customer_id: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),

  public_id: varchar("public_id", { length: 255 }).notNull().unique(),

  // Contract Details
  contract_type: varchar("contract_type").default("standard").notNull(), // standard, with_cc, without_cc
  contract_sent: boolean("contract_sent").default(false),
  contract_sent_at: timestamp("contract_sent_at"),
  contract_signed: boolean("contract_signed").default(false),
  contract_signed_at: timestamp("contract_signed_at"),
  signature_data: text("signature_data"), // Base64 signature or signature details

  // Change Orders
  change_orders: jsonb("change_orders"), // Array of change order history

  status: varchar("status").default("pending_signature").notNull(), // pending_signature, signed, in_progress, change_requested, cancelled
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Dispatch table - orders converted to dispatch
export const dispatch = pgTable("dispatch", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  order_id: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  lead_id: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  customer_id: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),

  public_id: varchar("public_id", { length: 255 }).notNull().unique(),

  // Carrier Details
  carrier_name: varchar("carrier_name"),
  carrier_phone: varchar("carrier_phone"),
  carrierEmail: varchar("carrier_email"),
  driverName: varchar("driver_name"),
  driverPhone: varchar("driver_phone"),
  truckInfo: varchar("truck_info"),

  // Dispatch Status
  status: varchar("status").default("assigned").notNull(), // assigned, in_transit, delivered, completed
  pickupDate: timestamp("pickup_date"),
  deliveryDate: timestamp("delivery_date"),
  actualPickupDate: timestamp("actual_pickup_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),

  // Final Financials
  finalCarrierFees: varchar("final_carrier_fees"),
  finalBrokerFees: varchar("final_broker_fees"),
  finalTotalTariff: varchar("final_total_tariff"),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadsRelations = relations(leads, ({ one, many }) => ({
  customer: one(customers, {
    fields: [leads.customer_id],
    references: [customers.id],
  }),
  assignedUser: one(customerUsers, {
    fields: [leads.assigned_user_id],
    references: [customerUsers.id],
  }),
  quotes: many(quotes),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  lead: one(leads, {
    fields: [quotes.lead_id],
    references: [leads.id],
  }),
  customer: one(customers, {
    fields: [quotes.customer_id],
    references: [customers.id],
  }),
  createdBy: one(customerUsers, {
    fields: [quotes.created_by_user_id],
    references: [customerUsers.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  quote: one(quotes, {
    fields: [orders.quote_id],
    references: [quotes.id],
  }),
  lead: one(leads, {
    fields: [orders.lead_id],
    references: [leads.id],
  }),
  customer: one(customers, {
    fields: [orders.customer_id],
    references: [customers.id],
  }),
}));

export const dispatchRelations = relations(dispatch, ({ one }) => ({
  order: one(orders, {
    fields: [dispatch.order_id],
    references: [orders.id],
  }),
  lead: one(leads, {
    fields: [dispatch.lead_id],
    references: [leads.id],
  }),
  customer: one(customers, {
    fields: [dispatch.customer_id],
    references: [customers.id],
  }),
}));

// Schema validations
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  public_id: true, // Auto-generated
  created_at: true,
  updated_at: true,
}).extend({
  pickup_date: z.string().transform((str) => new Date(str)),
  delivery_date: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertDispatchSchema = createInsertSchema(dispatch).omit({
  id: true,
});

// Types
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertDispatch = z.infer<typeof insertDispatchSchema>;
export type Dispatch = typeof dispatch.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type CustomerUser = typeof customerUsers.$inferSelect;
export type InsertCustomerUser = z.infer<typeof insertCustomerUserSchema>;
