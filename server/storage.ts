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
import { eq, desc, ilike, or, and, count } from "drizzle-orm";
import bcrypt from "bcryptjs";

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
  
  // Authentication helpers for future CRM portal
  verifyCustomerPassword(email: string, password: string): Promise<Customer | null>;
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
    const baseQuery = db.select().from(customers);
    
    if (search) {
      const searchCondition = or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.domain, `%${search}%`),
        ilike(customers.adminName, `%${search}%`),
        ilike(customers.adminEmail, `%${search}%`)
      );
      
      const [customersResult, totalResult] = await Promise.all([
        baseQuery.where(searchCondition).orderBy(desc(customers.createdAt)).offset(offset).limit(limit),
        db.select({ count: count() }).from(customers).where(searchCondition)
      ]);

      return {
        customers: customersResult,
        total: totalResult[0].count
      };
    } else {
      const [customersResult, totalResult] = await Promise.all([
        baseQuery.orderBy(desc(customers.createdAt)).offset(offset).limit(limit),
        db.select({ count: count() }).from(customers)
      ]);

      return {
        customers: customersResult,
        total: totalResult[0].count
      };
    }
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(customerData.adminPassword, 10);
    
    const [created] = await db
      .insert(customers)
      .values({
        ...customerData,
        adminPassword: hashedPassword,
      })
      .returning();
    return created;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const updateData: any = { ...customerData, updatedAt: new Date() };
    
    // Hash password if it's being updated
    if (customerData.adminPassword) {
      updateData.adminPassword = await bcrypt.hash(customerData.adminPassword, 10);
    }
    
    const [updated] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Customer user operations
  async getCustomerUsers(customerId: string, search?: string): Promise<CustomerUser[]> {
    if (search) {
      return db.select()
        .from(customerUsers)
        .where(
          and(
            eq(customerUsers.customerId, customerId),
            or(
              ilike(customerUsers.email, `%${search}%`),
              ilike(customerUsers.firstName, `%${search}%`),
              ilike(customerUsers.lastName, `%${search}%`)
            )
          )
        )
        .orderBy(desc(customerUsers.createdAt));
    }

    return db.select()
      .from(customerUsers)
      .where(eq(customerUsers.customerId, customerId))
      .orderBy(desc(customerUsers.createdAt));
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
  
  // Authentication helper for future CRM portal
  async verifyCustomerPassword(email: string, password: string): Promise<Customer | null> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.adminEmail, email));
    
    if (!customer) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, customer.adminPassword);
    if (!isPasswordValid) {
      return null;
    }
    
    return customer;
  }
}

export const storage = new DatabaseStorage();
