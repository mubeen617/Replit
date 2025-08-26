import {
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
import { supabase } from "./supabase";
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Row not found
      throw new Error(`Error fetching user: ${error.message}`);
    }
    
    return data;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error upserting user: ${error.message}`);
    }
    
    return data;
  }

  // Customer operations
  async getCustomers(search?: string, offset = 0, limit = 10): Promise<{ customers: Customer[], total: number }> {
    let query = supabase.from('customers').select('*', { count: 'exact' });
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%,admin_name.ilike.%${search}%,admin_email.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Error fetching customers: ${error.message}`);
    }
    
    return {
      customers: data || [],
      total: count || 0
    };
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Row not found
      throw new Error(`Error fetching customer: ${error.message}`);
    }
    
    return data;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(customerData.adminPassword, 10);
    
    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customerData,
        admin_password: hashedPassword,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating customer: ${error.message}`);
    }
    
    return data;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const updateData: any = { 
      ...customerData, 
      updated_at: new Date().toISOString() 
    };
    
    // Hash password if it's being updated
    if (customerData.adminPassword) {
      updateData.admin_password = await bcrypt.hash(customerData.adminPassword, 10);
      delete updateData.adminPassword;
    }
    
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating customer: ${error.message}`);
    }
    
    return data;
  }

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting customer: ${error.message}`);
    }
  }

  // Customer user operations
  async getCustomerUsers(customerId: string, search?: string): Promise<CustomerUser[]> {
    let query = supabase
      .from('customer_users')
      .select('*')
      .eq('customer_id', customerId);
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching customer users: ${error.message}`);
    }
    
    return data || [];
  }

  async getCustomerUserById(id: string): Promise<CustomerUser | undefined> {
    const { data, error } = await supabase
      .from('customer_users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Row not found
      throw new Error(`Error fetching customer user: ${error.message}`);
    }
    
    return data;
  }

  async createCustomerUser(userData: InsertCustomerUser): Promise<CustomerUser> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data, error } = await supabase
      .from('customer_users')
      .insert({
        ...userData,
        customer_id: userData.customerId,
        first_name: userData.firstName,
        last_name: userData.lastName,
        password: hashedPassword,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating customer user: ${error.message}`);
    }
    
    return data;
  }

  async updateCustomerUser(id: string, userData: Partial<InsertCustomerUser>): Promise<CustomerUser> {
    const updateData: any = { 
      ...userData, 
      updated_at: new Date().toISOString() 
    };
    
    // Map camelCase to snake_case for database columns
    if (userData.customerId) {
      updateData.customer_id = userData.customerId;
      delete updateData.customerId;
    }
    if (userData.firstName) {
      updateData.first_name = userData.firstName;
      delete updateData.firstName;
    }
    if (userData.lastName) {
      updateData.last_name = userData.lastName;
      delete updateData.lastName;
    }
    
    // Hash password if it's being updated
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const { data, error } = await supabase
      .from('customer_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating customer user: ${error.message}`);
    }
    
    return data;
  }

  async deleteCustomerUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_users')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting customer user: ${error.message}`);
    }
  }

  // Stats
  async getStats(): Promise<{
    totalCustomers: number;
    activeUsers: number;
    pendingUsers: number;
    issues: number;
  }> {
    const [totalCustomersResult, activeUsersResult, pendingUsersResult, issuesResult] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('customer_users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('customer_users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    ]);

    return {
      totalCustomers: totalCustomersResult.count || 0,
      activeUsers: activeUsersResult.count || 0,
      pendingUsers: pendingUsersResult.count || 0,
      issues: issuesResult.count || 0,
    };
  }
  
  // Authentication helpers for CRM portal
  async verifyCustomerPassword(email: string, password: string): Promise<Customer | null> {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('admin_email', email)
      .single();
    
    if (error || !customer) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, customer.admin_password);
    if (!isPasswordValid) {
      return null;
    }
    
    return customer;
  }
  
  async verifyUserPassword(email: string, password: string): Promise<CustomerUser | null> {
    const { data: user, error } = await supabase
      .from('customer_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
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
    let query = supabase
      .from('leads')
      .select('*')
      .eq('customer_id', customerId);
    
    if (assignedUserId) {
      query = query.eq('assigned_user_id', assignedUserId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching leads: ${error.message}`);
    }
    
    return data || [];
  }

  async getLeadById(id: string, customerId: string): Promise<Lead | undefined> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customerId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Row not found
      throw new Error(`Error fetching lead: ${error.message}`);
    }
    
    return data;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    // Generate unique lead number
    const leadNumber = await this.generateUniqueLeadNumber();
    
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...lead,
        customer_id: lead.customerId,
        contact_name: lead.contactName,
        contact_email: lead.contactEmail,
        contact_phone: lead.contactPhone,
        pickup_date: lead.pickupDate?.toISOString(),
        delivery_date: lead.deliveryDate?.toISOString(),
        customer_rate: lead.customerRate,
        vehicle_type: lead.vehicleType,
        transport_type: lead.transportType,
        assigned_user_id: lead.assignedUserId,
        external_id: lead.externalId,
        lead_number: leadNumber,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating lead: ${error.message}`);
    }
    
    return data;
  }

  private async generateUniqueLeadNumber(): Promise<string> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Find the highest sequence number for current year-month
    const { data: existingLeads, error } = await supabase
      .from('leads')
      .select('lead_number')
      .like('lead_number', `L-${year}${month}%`)
      .order('lead_number', { ascending: false })
      .limit(1);
    
    if (error) {
      throw new Error(`Error generating lead number: ${error.message}`);
    }
    
    let sequence = 1;
    if (existingLeads && existingLeads.length > 0) {
      const lastNumber = existingLeads[0].lead_number;
      const match = lastNumber.match(/L-\d{6}-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }
    
    return `L-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  async updateLead(id: string, customerId: string, lead: Partial<InsertLead>): Promise<Lead> {
    const updateData: any = { 
      ...lead, 
      updated_at: new Date().toISOString() 
    };
    
    // Map camelCase to snake_case for database columns
    if (lead.customerId) {
      updateData.customer_id = lead.customerId;
      delete updateData.customerId;
    }
    if (lead.contactName) {
      updateData.contact_name = lead.contactName;
      delete updateData.contactName;
    }
    if (lead.contactEmail) {
      updateData.contact_email = lead.contactEmail;
      delete updateData.contactEmail;
    }
    if (lead.contactPhone) {
      updateData.contact_phone = lead.contactPhone;
      delete updateData.contactPhone;
    }
    if (lead.pickupDate) {
      updateData.pickup_date = lead.pickupDate.toISOString();
      delete updateData.pickupDate;
    }
    if (lead.deliveryDate) {
      updateData.delivery_date = lead.deliveryDate.toISOString();
      delete updateData.deliveryDate;
    }
    if (lead.customerRate) {
      updateData.customer_rate = lead.customerRate;
      delete updateData.customerRate;
    }
    if (lead.vehicleType) {
      updateData.vehicle_type = lead.vehicleType;
      delete updateData.vehicleType;
    }
    if (lead.transportType) {
      updateData.transport_type = lead.transportType;
      delete updateData.transportType;
    }
    if (lead.assignedUserId) {
      updateData.assigned_user_id = lead.assignedUserId;
      delete updateData.assignedUserId;
    }
    if (lead.externalId) {
      updateData.external_id = lead.externalId;
      delete updateData.externalId;
    }
    
    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .eq('customer_id', customerId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating lead: ${error.message}`);
    }
    
    return data;
  }

  async deleteLead(id: string, customerId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('customer_id', customerId);
    
    if (error) {
      throw new Error(`Error deleting lead: ${error.message}`);
    }
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
          const { data: existing, error } = await supabase
            .from('leads')
            .select('id')
            .eq('customer_id', customerId)
            .eq('external_id', leadData.id || leadData.external_id);
          
          if (!error && existing && existing.length > 0) {
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
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching quotes: ${error.message}`);
    }
    
    return data || [];
  }

  async getQuoteById(id: string, customerId: string): Promise<Quote | undefined> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customerId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Row not found
      throw new Error(`Error fetching quote: ${error.message}`);
    }
    
    return data;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        ...quote,
        customer_id: quote.customerId,
        lead_id: quote.leadId,
        created_by_user_id: quote.createdByUserId,
        carrier_fees: quote.carrierFees,
        broker_fees: quote.brokerFees,
        total_tariff: quote.totalTariff,
        pickup_person_name: quote.pickupPersonName,
        pickup_person_phone: quote.pickupPersonPhone,
        pickup_address: quote.pickupAddress,
        dropoff_person_name: quote.dropoffPersonName,
        dropoff_person_phone: quote.dropoffPersonPhone,
        dropoff_address: quote.dropoffAddress,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating quote: ${error.message}`);
    }
    
    return data;
  }

  async updateQuote(id: string, customerId: string, quote: Partial<InsertQuote>): Promise<Quote> {
    const updateData: any = { 
      ...quote, 
      updated_at: new Date().toISOString() 
    };
    
    // Map camelCase to snake_case for database columns
    if (quote.customerId) {
      updateData.customer_id = quote.customerId;
      delete updateData.customerId;
    }
    if (quote.leadId) {
      updateData.lead_id = quote.leadId;
      delete updateData.leadId;
    }
    if (quote.createdByUserId) {
      updateData.created_by_user_id = quote.createdByUserId;
      delete updateData.createdByUserId;
    }
    if (quote.carrierFees) {
      updateData.carrier_fees = quote.carrierFees;
      delete updateData.carrierFees;
    }
    if (quote.brokerFees) {
      updateData.broker_fees = quote.brokerFees;
      delete updateData.brokerFees;
    }
    if (quote.totalTariff) {
      updateData.total_tariff = quote.totalTariff;
      delete updateData.totalTariff;
    }
    if (quote.pickupPersonName) {
      updateData.pickup_person_name = quote.pickupPersonName;
      delete updateData.pickupPersonName;
    }
    if (quote.pickupPersonPhone) {
      updateData.pickup_person_phone = quote.pickupPersonPhone;
      delete updateData.pickupPersonPhone;
    }
    if (quote.pickupAddress) {
      updateData.pickup_address = quote.pickupAddress;
      delete updateData.pickupAddress;
    }
    if (quote.dropoffPersonName) {
      updateData.dropoff_person_name = quote.dropoffPersonName;
      delete updateData.dropoffPersonName;
    }
    if (quote.dropoffPersonPhone) {
      updateData.dropoff_person_phone = quote.dropoffPersonPhone;
      delete updateData.dropoffPersonPhone;
    }
    if (quote.dropoffAddress) {
      updateData.dropoff_address = quote.dropoffAddress;
      delete updateData.dropoffAddress;
    }
    
    const { data, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .eq('customer_id', customerId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating quote: ${error.message}`);
    }
    
    return data;
  }

  async deleteQuote(id: string, customerId: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('customer_id', customerId);
    
    if (error) {
      throw new Error(`Error deleting quote: ${error.message}`);
    }
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
