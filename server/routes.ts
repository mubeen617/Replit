import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabaseAdmin } from "./supabase";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCustomerSchema, insertCustomerUserSchema, insertLeadSchema, insertQuoteSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Fetch or create user in Supabase
      let { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create one
        const newUser = {
          id: userId,
          email: req.user.claims.email,
          first_name: req.user.claims.given_name || '',
          last_name: req.user.claims.family_name || '',
          profile_image_url: req.user.claims.picture || ''
        };
        
        const { data: createdUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert(newUser)
          .select()
          .single();
          
        if (createError) throw createError;
        user = createdUser;
      } else if (error) {
        throw error;
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Stats endpoint
  app.get('/api/stats', isAuthenticated, async (req, res) => {
    try {
      // Get stats from Supabase
      const { data: customers, error: customersError } = await supabaseAdmin
        .from('customers')
        .select('id', { count: 'exact' });
      
      const { data: users, error: usersError } = await supabaseAdmin
        .from('customer_users')
        .select('id', { count: 'exact' });
        
      if (customersError || usersError) {
        throw new Error('Failed to fetch stats');
      }
      
      const stats = {
        totalCustomers: customers?.length || 0,
        activeUsers: users?.length || 0,
        pendingUsers: 0
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get customers from Supabase
      let query = supabaseAdmin.from('customers').select('*', { count: 'exact' });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%,admin_email.ilike.%${search}%`);
      }
      
      const { data: customers, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      
      const result = { customers: customers || [], total: count || 0 };
      res.json(result);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      // Get customer from Supabase
      const { data: customer, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', req.params.id)
        .single();
        
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({ message: "Customer not found" });
      }
      if (error) throw error;
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      
      // Hash the admin password before storing
      const hashedPassword = await bcrypt.hash(customerData.admin_password, 12);
      const customerWithHashedPassword = {
        ...customerData,
        admin_password: hashedPassword
      };
      
      // Create customer in Supabase
      const { data: customer, error } = await supabaseAdmin
        .from('customers')
        .insert(customerWithHashedPassword)
        .select()
        .single();
        
      if (error) throw error;
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      // Update customer in Supabase
      const { data: customer, error } = await supabaseAdmin
        .from('customers')
        .update(customerData)
        .eq('id', req.params.id)
        .select()
        .single();
        
      if (error) throw error;
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      // Delete customer from Supabase
      const { error } = await supabaseAdmin
        .from('customers')
        .delete()
        .eq('id', req.params.id);
        
      if (error) throw error;
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Customer user routes
  app.get('/api/customers/:customerId/users', isAuthenticated, async (req, res) => {
    try {
      const search = req.query.search as string;
      // Get customer users from Supabase
      let query = supabaseAdmin
        .from('customer_users')
        .select('*')
        .eq('customer_id', req.params.customerId);
        
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      const { data: users, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      res.json(users);
    } catch (error) {
      console.error("Error fetching customer users:", error);
      res.status(500).json({ message: "Failed to fetch customer users" });
    }
  });

  app.post('/api/customers/:customerId/users', isAuthenticated, async (req, res) => {
    try {
      const userData = insertCustomerUserSchema.parse({
        ...req.body,
        customer_id: req.params.customerId
      });
      
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const userWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };
      
      // Create customer user in Supabase
      const { data: user, error } = await supabaseAdmin
        .from('customer_users')
        .insert(userWithHashedPassword)
        .select()
        .single();
        
      if (error) throw error;
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating customer user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/customers/:customerId/users/:id', isAuthenticated, async (req, res) => {
    try {
      const userData = insertCustomerUserSchema.partial().parse(req.body);
      // Update customer user in Supabase
      const { data: user, error } = await supabaseAdmin
        .from('customer_users')
        .update(userData)
        .eq('id', req.params.id)
        .select()
        .single();
        
      if (error) throw error;
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error updating customer user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/customers/:customerId/users/:id', isAuthenticated, async (req, res) => {
    try {
      // Delete customer user from Supabase
      const { error } = await supabaseAdmin
        .from('customer_users')
        .delete()
        .eq('id', req.params.id);
        
      if (error) throw error;
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // CRM Authentication Routes
  app.post('/api/crm/login/customer', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Verify customer login with Supabase
      const { data: customer, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('admin_email', email)
        .single();
        
      if (error || !customer) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, customer.admin_password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!customer) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({ type: "customer", data: customer });
    } catch (error) {
      console.error("Customer login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/crm/login/user', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Verify user login with Supabase
      const { data: user, error } = await supabaseAdmin
        .from('customer_users')
        .select('*, customers!inner(*)')
        .eq('email', email)
        .single();
        
      if (error || !user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({ type: "user", data: user });
    } catch (error) {
      console.error("User login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // CRM Data Routes
  app.get('/api/crm/users/:customerId', async (req, res) => {
    try {
      const { customerId } = req.params;
      // Get customer users from Supabase
      const { data: users, error } = await supabaseAdmin
        .from('customer_users')
        .select('*')
        .eq('customer_id', customerId);
        
      if (error) throw error;
      res.json(users);
    } catch (error) {
      console.error("Error fetching CRM users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/crm/leads/:customerId', async (req, res) => {
    try {
      const { customerId } = req.params;
      const { assignedUserId } = req.query;
      // Get leads from Supabase
      let query = supabaseAdmin
        .from('leads')
        .select('*')
        .eq('customer_id', customerId);
        
      if (assignedUserId) {
        query = query.eq('assigned_user_id', assignedUserId);
      }
      
      const { data: leads, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get('/api/crm/user-loads/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      // Get the user to find their customer
      const { data: user, error: userError } = await supabaseAdmin
        .from('customer_users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError) throw userError;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get leads for this user
      const { data: leads, error: leadsError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('customer_id', user.customer_id)
        .eq('assigned_user_id', userId)
        .order('created_at', { ascending: false });
        
      if (leadsError) throw leadsError;
      res.json(leads);
    } catch (error) {
      console.error("Error fetching user loads:", error);
      res.status(500).json({ message: "Failed to fetch loads" });
    }
  });

  app.post('/api/crm/leads/:customerId/fetch', async (req, res) => {
    try {
      const { customerId } = req.params;
      const { apiEndpoint, apiKey } = req.body;
      
      if (!apiEndpoint) {
        return res.status(400).json({ message: "API endpoint is required" });
      }

      // Placeholder for API integration - implement external API lead fetching
      const fetchedLeads: any[] = [];
      // TODO: Implement external API integration
      res.json({ 
        success: true, 
        message: `Successfully fetched ${fetchedLeads.length} new leads`,
        leads: fetchedLeads 
      });
    } catch (error) {
      console.error("Error fetching leads from API:", error);
      res.status(500).json({ 
        message: "Failed to fetch leads from API", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/crm/leads/:customerId', async (req, res) => {
    try {
      const { customerId } = req.params;
      const leadData = insertLeadSchema.parse({
        ...req.body,
        customerId
      });
      
      // Generate lead number
      const now = new Date();
      const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
      
      const { data: lastLead } = await supabaseAdmin
        .from('leads')
        .select('lead_number')
        .like('lead_number', `L-${yearMonth}%`)
        .order('lead_number', { ascending: false })
        .limit(1);
      
      let nextNumber = 1;
      if (lastLead && lastLead.length > 0) {
        const match = lastLead[0].lead_number.match(/L-\d{6}-(\d{4})/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const leadNumber = `L-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
      
      // Create lead in Supabase
      const { data: lead, error } = await supabaseAdmin
        .from('leads')
        .insert({ ...leadData, lead_number: leadNumber })
        .select()
        .single();
        
      if (error) throw error;
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put('/api/crm/leads/:customerId/:leadId/assign', async (req, res) => {
    try {
      const { customerId, leadId } = req.params;
      const { userId } = req.body;
      
      // Assign lead in Supabase
      const { data: lead, error } = await supabaseAdmin
        .from('leads')
        .update({ assigned_user_id: userId })
        .eq('id', leadId)
        .eq('customer_id', customerId)
        .select()
        .single();
        
      if (error) throw error;
      res.json(lead);
    } catch (error) {
      console.error("Error assigning lead:", error);
      res.status(500).json({ message: "Failed to assign lead" });
    }
  });

  app.get('/api/crm/admin-stats/:customerId', async (req, res) => {
    try {
      const { customerId } = req.params;
      // Get stats from Supabase
      const { data: leads, error: leadsError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('customer_id', customerId);
        
      const { data: users, error: usersError } = await supabaseAdmin
        .from('customer_users')
        .select('*')
        .eq('customer_id', customerId);
        
      if (leadsError || usersError) throw new Error('Failed to fetch stats');
      
      const activeLeads = leads.filter(lead => lead.status === 'available' || lead.status === 'assigned').length;
      const bookedLeads = leads.filter(lead => lead.status === 'booked').length;
      const totalLeads = leads.length;
      const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;
      
      res.json({
        totalUsers: users.length,
        activeLeads,
        totalCommission: 0, // Calculate from leads with rates
        conversionRate
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/crm/user-stats/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      // Get user from Supabase
      const { data: user, error: userError } = await supabaseAdmin
        .from('customer_users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError) throw userError;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user leads from Supabase
      const { data: userLeads, error: leadsError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('customer_id', user.customer_id)
        .eq('assigned_user_id', userId);
        
      if (leadsError) throw leadsError;
      const bookedLeads = userLeads.filter(lead => lead.status === 'booked').length;
      const totalLeads = userLeads.length;
      const successRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;
      
      res.json({
        activeLeads: userLeads.filter(lead => lead.status === 'assigned').length,
        booked: bookedLeads,
        commission: 0, // Calculate from commission rates
        successRate
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Quote routes
  app.get('/api/crm/quotes/:customerId', async (req, res) => {
    try {
      const { customerId } = req.params;
      // Get quotes from Supabase
      const { data: quotes, error } = await supabaseAdmin
        .from('quotes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.post('/api/crm/leads/:leadId/convert-to-quote', async (req, res) => {
    try {
      const { leadId } = req.params;
      const quoteData = req.body;
      
      // Get lead from Supabase
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
        
      if (leadError || !lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Create quote from lead data
      const { data: quote, error: quoteError } = await supabaseAdmin
        .from('quotes')
        .insert({
          customer_id: lead.customer_id,
          lead_id: leadId,
          pickup_location: lead.pickup_location,
          dropoff_location: lead.dropoff_location,
          vehicle_year: lead.vehicle_year,
          vehicle_make: lead.vehicle_make,
          vehicle_model: lead.vehicle_model,
          transport_type: lead.transport_type,
          ...quoteData
        })
        .select()
        .single();
        
      if (quoteError) throw quoteError;
      
      // Update lead status to converted
      await supabaseAdmin
        .from('leads')
        .update({ status: 'converted' })
        .eq('id', leadId);
      res.json(quote);
    } catch (error) {
      console.error("Error converting lead to quote:", error);
      res.status(500).json({ message: "Failed to convert lead to quote" });
    }
  });

  app.post('/api/crm/quotes/:quoteId/convert-to-order', async (req, res) => {
    try {
      const { quoteId } = req.params;
      // TODO: Implement order conversion
      res.json({ message: "Quote converted to order", quoteId });
    } catch (error) {
      console.error("Error converting quote to order:", error);
      res.status(500).json({ message: "Failed to convert quote to order" });
    }
  });

  app.post('/api/crm/quotes/:quoteId/send', async (req, res) => {
    try {
      const { quoteId } = req.params;
      // TODO: Implement quote sending logic
      res.json({ message: "Quote sent", quoteId });
    } catch (error) {
      console.error("Error sending quote:", error);
      res.status(500).json({ message: "Failed to send quote" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
