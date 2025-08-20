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
  role: varchar("role").notNull().default("user"), // admin, user, viewer
  status: varchar("status").notNull().default("active"), // active, inactive, pending
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  users: many(customerUsers),
}));

export const customerUsersRelations = relations(customerUsers, ({ one }) => ({
  customer: one(customers, {
    fields: [customerUsers.customerId],
    references: [customers.id],
  }),
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
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type CustomerUser = typeof customerUsers.$inferSelect;
export type InsertCustomerUser = z.infer<typeof insertCustomerUserSchema>;
