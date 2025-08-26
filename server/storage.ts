import {
  users,
  customers,
  customerUsers,
  leads,
  quotes,
  type User,
  type UpsertUser,
  type Customer,
  type InsertCustomer,
  type CustomerUser,
  type InsertCustomerUser,
  type Lead,
  type InsertLead,
  type Quote,
  type InsertQuote,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, and, count, sql } from "drizzle-orm";
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
  
  // Authentication helpers for CRM portal
  verifyCustomerPassword(email: string, password: string): Promise<Customer | null>;
  verifyUserPassword(email: string, password: string): Promise<CustomerUser | null>;
  
  // Lead operations
  getLeads(customerId: string, assignedUserId?: string): Promise<Lead[]>;
  getLeadById(id: string, customerId: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, customerId: string, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string, customerId: string): Promise<void>;
  assignLead(leadId: string, customerId: string, userId: string): Promise<Lead>;
  fetchLeadsFromAPI(customerId: string, apiEndpoint: string, apiKey?: string): Promise<Lead[]>;
  
  // Quote operations
  getQuotes(customerId: string): Promise<Quote[]>;
  getQuoteById(id: string, customerId: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, customerId: string, quote: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: string, customerId: string): Promise<void>;
  convertLeadToQuote(leadId: string, customerId: string, quoteData: Partial<InsertQuote>): Promise<Quote>;
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

  async createCustomerUser(userData: InsertCustomerUser): Promise<CustomerUser> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [created] = await db
      .insert(customerUsers)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return created;
  }

  async updateCustomerUser(id: string, userData: Partial<InsertCustomerUser>): Promise<CustomerUser> {
    const updateData: any = { ...userData, updatedAt: new Date() };
    
    // Hash password if it's being updated
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const [updated] = await db
      .update(customerUsers)
      .set(updateData)
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
  
  // Authentication helpers for CRM portal
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
  
  async verifyUserPassword(email: string, password: string): Promise<CustomerUser | null> {
    const [user] = await db
      .select()
      .from(customerUsers)
      .where(eq(customerUsers.email, email));
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    
    return user;
  }

  // Lead operations
  async getLeads(customerId: string, assignedUserId?: string): Promise<Lead[]> {
    const conditions = [eq(leads.customerId, customerId)];
    if (assignedUserId) {
      conditions.push(eq(leads.assignedUserId, assignedUserId));
    }
    
    return await db
      .select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(desc(leads.createdAt));
  }

  async getLeadById(id: string, customerId: string): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.customerId, customerId)));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    // Generate unique lead number
    const leadNumber = await this.generateUniqueLeadNumber();
    
    const [newLead] = await db
      .insert(leads)
      .values({ ...lead, leadNumber })
      .returning();
    return newLead;
  }

  private async generateUniqueLeadNumber(): Promise<string> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Find the highest sequence number for current year-month
    const existingLeads = await db
      .select({ leadNumber: leads.leadNumber })
      .from(leads)
      .where(sql`${leads.leadNumber} LIKE ${`L-${year}${month}-%`}`)
      .orderBy(sql`${leads.leadNumber} DESC`)
      .limit(1);
    
    let sequence = 1;
    if (existingLeads.length > 0) {
      const lastNumber = existingLeads[0].leadNumber;
      const match = lastNumber.match(/L-\d{6}-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }
    
    return `L-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  async updateLead(id: string, customerId: string, lead: Partial<InsertLead>): Promise<Lead> {
    const [updatedLead] = await db
      .update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.customerId, customerId)))
      .returning();
    return updatedLead;
  }

  async deleteLead(id: string, customerId: string): Promise<void> {
    await db
      .delete(leads)
      .where(and(eq(leads.id, id), eq(leads.customerId, customerId)));
  }

  async assignLead(leadId: string, customerId: string, userId: string): Promise<Lead> {
    return await this.updateLead(leadId, customerId, { 
      assignedUserId: userId,
      status: "assigned" 
    });
  }

  async fetchLeadsFromAPI(customerId: string, apiEndpoint: string, apiKey?: string): Promise<Lead[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedLeads: Lead[] = [];

      // Process API response - this is a generic structure, can be customized per API
      const leadsData = Array.isArray(data) ? data : data.leads || data.data || [];
      
      for (const leadData of leadsData) {
        // Skip if lead already exists based on external ID
        if (leadData.id || leadData.external_id) {
          const existing = await db
            .select()
            .from(leads)
            .where(and(
              eq(leads.customerId, customerId),
              eq(leads.externalId, leadData.id || leadData.external_id)
            ));
          
          if (existing.length > 0) {
            continue;
          }
        }

        // Map API data to our lead structure
        const newLead: InsertLead = {
          customerId,
          contactName: leadData.contact_name || leadData.customer_name || 'Unknown',
          contactEmail: leadData.contact_email || leadData.email || 'unknown@example.com',
          contactPhone: leadData.contact_phone || leadData.phone || '0000000000',
          origin: leadData.origin || leadData.pickup_location || '',
          destination: leadData.destination || leadData.delivery_location || '',
          pickupDate: new Date(leadData.pickup_date || leadData.pickup_time || Date.now()),
          deliveryDate: leadData.delivery_date ? new Date(leadData.delivery_date) : undefined,
          customerRate: leadData.rate || leadData.price || leadData.customer_rate,
          weight: leadData.weight,
          vehicleType: leadData.vehicle_type || leadData.car_type || leadData.commodity,
          transportType: leadData.transport_type || leadData.equipment || 'open',
          status: "lead",
          priority: leadData.priority || "normal",
          notes: leadData.notes || leadData.description,
          source: apiEndpoint,
          externalId: leadData.id || leadData.external_id,
        };

        const createdLead = await this.createLead(newLead);
        fetchedLeads.push(createdLead);
      }

      return fetchedLeads;
    } catch (error) {
      console.error("Error fetching leads from API:", error);
      throw error;
    }
  }

  // Quote operations
  async getQuotes(customerId: string): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.customerId, customerId))
      .orderBy(desc(quotes.createdAt));
  }

  async getQuoteById(id: string, customerId: string): Promise<Quote | undefined> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.customerId, customerId)));
    return quote;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db
      .insert(quotes)
      .values(quote)
      .returning();
    return newQuote;
  }

  async updateQuote(id: string, customerId: string, quote: Partial<InsertQuote>): Promise<Quote> {
    const [updatedQuote] = await db
      .update(quotes)
      .set({ ...quote, updatedAt: new Date() })
      .where(and(eq(quotes.id, id), eq(quotes.customerId, customerId)))
      .returning();
    return updatedQuote;
  }

  async deleteQuote(id: string, customerId: string): Promise<void> {
    await db
      .delete(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.customerId, customerId)));
  }

  async convertLeadToQuote(leadId: string, customerId: string, quoteData: Partial<InsertQuote>): Promise<Quote> {
    // Get the lead first
    const lead = await this.getLeadById(leadId, customerId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Create quote from lead data
    const newQuote = await this.createQuote({
      leadId,
      customerId,
      createdByUserId: lead.assignedUserId || '',
      carrierFees: quoteData.carrierFees || '0',
      brokerFees: quoteData.brokerFees || '0', 
      totalTariff: quoteData.totalTariff || '0',
      pickupPersonName: quoteData.pickupPersonName || lead.contactName,
      pickupPersonPhone: quoteData.pickupPersonPhone || lead.contactPhone,
      pickupAddress: quoteData.pickupAddress || lead.origin,
      dropoffPersonName: quoteData.dropoffPersonName || lead.contactName,
      dropoffPersonPhone: quoteData.dropoffPersonPhone || lead.contactPhone,
      dropoffAddress: quoteData.dropoffAddress || lead.destination,
      ...quoteData,
    });

    // Update lead status to converted
    await this.updateLead(leadId, customerId, { status: 'converted' });

    return newQuote;
  }
}

export const storage = new DatabaseStorage();
