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
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer organizations table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  domain: varchar("domain").notNull().unique(),
  adminName: varchar("admin_name").notNull(),
  adminEmail: varchar("admin_email").notNull(),
  adminPassword: varchar("admin_password").notNull(), // Hashed password for CRM portal login
  status: varchar("status").notNull().default("active"), // active, inactive, suspended, pending
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer users table (hierarchical under customers)
export const customerUsers = pgTable("customer_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  password: varchar("password").notNull(), // Hashed password for CRM portal login
  role: varchar("role").notNull().default("user"), // admin, user, viewer
  status: varchar("status").notNull().default("active"), // active, inactive, pending
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  users: many(customerUsers),
  leads: many(leads),
}));

export const customerUsersRelations = relations(customerUsers, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerUsers.customerId],
    references: [customers.id],
  }),
  assignedLeads: many(leads),
}));

// Schemas for validation
export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  domain: true,
  adminName: true,
  adminEmail: true,
  status: true,
}).extend({
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertCustomerUserSchema = createInsertSchema(customerUsers).pick({
  customerId: true,
  email: true,
  firstName: true,
  lastName: true,
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
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  assignedUserId: varchar("assigned_user_id").references(() => customerUsers.id, { onDelete: "set null" }),
  leadNumber: varchar("lead_number").notNull().unique(),
  
  // Contact Details
  contactName: varchar("contact_name").notNull(),
  contactEmail: varchar("contact_email").notNull(),
  contactPhone: varchar("contact_phone").notNull(),
  
  // Financial Details
  carrierFees: varchar("carrier_fees").default("0").notNull(),
  brokerFees: varchar("broker_fees").default("0").notNull(),
  totalTariff: varchar("total_tariff").default("0").notNull(), // Sum of carrier and broker fees
  
  // Vehicle Details
  vehicleYear: varchar("vehicle_year"),
  vehicleMake: varchar("vehicle_make"),
  vehicleModel: varchar("vehicle_model"),
  vehicleType: varchar("vehicle_type"), // Car, truck, motorcycle, etc.
  trailerType: varchar("trailer_type").default("open").notNull(), // open, closed
  
  // Location and Timing
  origin: varchar("origin").notNull(),
  destination: varchar("destination").notNull(),
  pickupDate: timestamp("pickup_date").notNull(),
  deliveryDate: timestamp("delivery_date"),
  
  // Legacy fields (keeping for backward compatibility)
  customerRate: varchar("customer_rate"),
  carrierRate: varchar("carrier_rate"),
  weight: varchar("weight"),
  transportType: varchar("transport_type"), // Open, enclosed transport
  
  // Workflow Status
  status: varchar("status").default("lead").notNull(), // lead, quote, order, dispatch, completed, cancelled
  priority: varchar("priority").default("normal").notNull(), // low, normal, high, urgent
  notes: text("notes"),
  source: varchar("source"), // API source where lead came from or 'manual'
  externalId: varchar("external_id"), // ID from external system
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotes table - leads converted to quotes
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  createdByUserId: varchar("created_by_user_id").references(() => customerUsers.id, { onDelete: "set null" }).notNull(),
  
  // Tariff Details
  carrierFees: varchar("carrier_fees").notNull(),
  brokerFees: varchar("broker_fees").notNull(),
  totalTariff: varchar("total_tariff").notNull(),
  
  // Pickup Details
  pickupPersonName: varchar("pickup_person_name").notNull(),
  pickupPersonPhone: varchar("pickup_person_phone").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  
  // Drop-off Details
  dropoffPersonName: varchar("dropoff_person_name").notNull(),
  dropoffPersonPhone: varchar("dropoff_person_phone").notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  
  // Payment Details (optional)
  cardDetails: text("card_details"), // Encrypted card details
  
  // Terms and Conditions
  specialTerms: text("special_terms"),
  standardTerms: text("standard_terms"),
  
  status: varchar("status").default("draft").notNull(), // draft, sent, accepted, rejected, expired
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table - quotes converted to orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").references(() => quotes.id, { onDelete: "cascade" }).notNull(),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  
  orderNumber: varchar("order_number").notNull().unique(),
  
  // Contract Details
  contractType: varchar("contract_type").default("standard").notNull(), // standard, with_cc, without_cc
  contractSent: boolean("contract_sent").default(false),
  contractSentAt: timestamp("contract_sent_at"),
  contractSigned: boolean("contract_signed").default(false),
  contractSignedAt: timestamp("contract_signed_at"),
  signatureData: text("signature_data"), // Base64 signature or signature details
  
  // Change Orders
  changeOrders: jsonb("change_orders"), // Array of change order history
  
  status: varchar("status").default("pending_signature").notNull(), // pending_signature, signed, in_progress, change_requested, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dispatch table - orders converted to dispatch
export const dispatch = pgTable("dispatch", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  
  dispatchNumber: varchar("dispatch_number").notNull().unique(),
  
  // Carrier Details
  carrierName: varchar("carrier_name"),
  carrierPhone: varchar("carrier_phone"),
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
    fields: [leads.customerId],
    references: [customers.id],
  }),
  assignedUser: one(customerUsers, {
    fields: [leads.assignedUserId],
    references: [customerUsers.id],
  }),
  quotes: many(quotes),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  lead: one(leads, {
    fields: [quotes.leadId],
    references: [leads.id],
  }),
  customer: one(customers, {
    fields: [quotes.customerId],
    references: [customers.id],
  }),
  createdBy: one(customerUsers, {
    fields: [quotes.createdByUserId],
    references: [customerUsers.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  quote: one(quotes, {
    fields: [orders.quoteId],
    references: [quotes.id],
  }),
  lead: one(leads, {
    fields: [orders.leadId],
    references: [leads.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
}));

export const dispatchRelations = relations(dispatch, ({ one }) => ({
  order: one(orders, {
    fields: [dispatch.orderId],
    references: [orders.id],
  }),
  lead: one(leads, {
    fields: [dispatch.leadId],
    references: [leads.id],
  }),
  customer: one(customers, {
    fields: [dispatch.customerId],
    references: [customers.id],
  }),
}));

// Schema validations
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  leadNumber: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
}).extend({
  pickupDate: z.string().transform((str) => new Date(str)),
  deliveryDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDispatchSchema = createInsertSchema(dispatch).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
