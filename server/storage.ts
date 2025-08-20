import {
  users,
  customers,
  customerUsers,
  type User,
  type UpsertUser,
  type Customer,
  type InsertCustomer,
  type CustomerUser,
  type InsertCustomerUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, count } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Customer operations
  getCustomers(search?: string, offset?: number, limit?: number): Promise<{ customers: Customer[], total: number }>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // Customer user operations
  getCustomerUsers(customerId: string, search?: string): Promise<CustomerUser[]>;
  getCustomerUserById(id: string): Promise<CustomerUser | undefined>;
  createCustomerUser(user: InsertCustomerUser): Promise<CustomerUser>;
  updateCustomerUser(id: string, user: Partial<InsertCustomerUser>): Promise<CustomerUser>;
  deleteCustomerUser(id: string): Promise<void>;
  
  // Stats
  getStats(): Promise<{
    totalCustomers: number;
    activeUsers: number;
    pendingUsers: number;
    issues: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Customer operations
  async getCustomers(search?: string, offset = 0, limit = 10): Promise<{ customers: Customer[], total: number }> {
    let query = db.select().from(customers);
    let countQuery = db.select({ count: count() }).from(customers);

    if (search) {
      const searchCondition = or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.domain, `%${search}%`),
        ilike(customers.adminName, `%${search}%`),
        ilike(customers.adminEmail, `%${search}%`)
      );
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }

    const [customersResult, totalResult] = await Promise.all([
      query.orderBy(desc(customers.createdAt)).offset(offset).limit(limit),
      countQuery
    ]);

    return {
      customers: customersResult,
      total: totalResult[0].count
    };
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Customer user operations
  async getCustomerUsers(customerId: string, search?: string): Promise<CustomerUser[]> {
    let query = db.select().from(customerUsers).where(eq(customerUsers.customerId, customerId));

    if (search) {
      query = query.where(
        or(
          ilike(customerUsers.email, `%${search}%`),
          ilike(customerUsers.firstName, `%${search}%`),
          ilike(customerUsers.lastName, `%${search}%`)
        )
      );
    }

    return query.orderBy(desc(customerUsers.createdAt));
  }

  async getCustomerUserById(id: string): Promise<CustomerUser | undefined> {
    const [user] = await db.select().from(customerUsers).where(eq(customerUsers.id, id));
    return user;
  }

  async createCustomerUser(user: InsertCustomerUser): Promise<CustomerUser> {
    const [created] = await db
      .insert(customerUsers)
      .values(user)
      .returning();
    return created;
  }

  async updateCustomerUser(id: string, user: Partial<InsertCustomerUser>): Promise<CustomerUser> {
    const [updated] = await db
      .update(customerUsers)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(customerUsers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomerUser(id: string): Promise<void> {
    await db.delete(customerUsers).where(eq(customerUsers.id, id));
  }

  // Stats
  async getStats(): Promise<{
    totalCustomers: number;
    activeUsers: number;
    pendingUsers: number;
    issues: number;
  }> {
    const [totalCustomersResult] = await db.select({ count: count() }).from(customers);
    const [activeUsersResult] = await db.select({ count: count() }).from(customerUsers).where(eq(customerUsers.status, 'active'));
    const [pendingUsersResult] = await db.select({ count: count() }).from(customerUsers).where(eq(customerUsers.status, 'pending'));
    const [issuesResult] = await db.select({ count: count() }).from(customers).where(eq(customers.status, 'suspended'));

    return {
      totalCustomers: totalCustomersResult.count,
      activeUsers: activeUsersResult.count,
      pendingUsers: pendingUsersResult.count,
      issues: issuesResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
