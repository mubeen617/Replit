import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabaseAdmin } from "./supabase";
import { insertCustomerSchema, insertCustomerUserSchema, insertLeadSchema, insertQuoteSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Stats endpoint
  app.get('/api/stats', async (req, res) => {
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
  app.get('/api/customers', async (req, res) => {
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

  app.get('/api/customers/:id', async (req, res) => {
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

  app.post('/api/customers', async (req, res) => {
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const supabaseError = (error as any)?.code || (error as any)?.details || "";
      res.status(500).json({ message: "Failed to create customer", error: errorMessage, details: supabaseError });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);

      // If password is being updated, hash it
      if (customerData.admin_password) {
        customerData.admin_password = await bcrypt.hash(customerData.admin_password, 12);
      }

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

  // File upload configuration
  const storage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
      const uploadDir = 'uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: function (req: any, file: any, cb: any) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });

  const upload = multer({ storage: storage });

  app.post('/api/upload', upload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  app.delete('/api/customers/:id', async (req, res) => {
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
  app.get('/api/customers/:customerId/users', async (req, res) => {
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

  app.post('/api/customers/:customerId/users', async (req, res) => {
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

  app.put('/api/customers/:customerId/users/:id', async (req, res) => {
    try {
      const userData = insertCustomerUserSchema.partial().parse(req.body);

      // If password is being updated, hash it
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 12);
      }

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

  app.delete('/api/customers/:customerId/users/:id', async (req, res) => {
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

      // Get user to verify existence and get customer_id
      const { data: user, error: userError } = await supabaseAdmin
        .from('customer_users')
        .select('customer_id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get leads assigned to this user
      const { data: leads, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('customer_id', user.customer_id)
        .eq('assigned_user_id', userId)
        .in('status', ['lead', 'assigned'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(leads || []);
    } catch (error) {
      console.error("Error fetching user loads:", error);
      res.status(500).json({ message: "Failed to fetch user loads" });
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
        customer_id: customerId
      });

      // Generate public_id (YYYYMMNNNN)
      const now = new Date();
      const yearMonth = now.toISOString().slice(0, 7).replace('-', ''); // YYYYMM

      const { data: lastLead } = await supabaseAdmin
        .from('leads')
        .select('public_id')
        .like('public_id', `${yearMonth}%`)
        .order('public_id', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (lastLead && lastLead.length > 0) {
        const lastId = lastLead[0].public_id;
        const lastSequence = parseInt(lastId.slice(6)); // Get NNNN part
        if (!isNaN(lastSequence)) {
          nextNumber = lastSequence + 1;
        }
      }

      const publicId = `${yearMonth}${nextNumber.toString().padStart(4, '0')}`;

      // Create lead in Supabase
      const { data: lead, error } = await supabaseAdmin
        .from('leads')
        .insert({ ...leadData, public_id: publicId })
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

  app.post('/api/crm/leads/:customerId/:leadId/convert-to-quote', async (req, res) => {
    try {
      const { customerId, leadId } = req.params;

      // Fetch the lead to get the public_id
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('public_id')
        .eq('id', leadId)
        .eq('customer_id', customerId)
        .single();

      if (leadError) throw leadError;
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      let { data: users, error: usersError } = await supabaseAdmin
        .from('customer_users')
        .select('id')
        .eq('customer_id', customerId)
        .limit(1);

      if (usersError) throw usersError;

      let userId = users?.[0]?.id;

      // If no users exist, create a default system user
      if (!userId) {
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('customer_users')
          .insert({
            customer_id: customerId,
            email: 'system@example.com',
            first_name: 'System',
            last_name: 'User',
            password: await bcrypt.hash('system123', 12),
            role: 'admin'
          })
          .select('id')
          .single();
        if (createError) throw createError;
        userId = newUser.id;
      }

      const quoteData = insertQuoteSchema.parse({
        ...req.body,
        lead_id: leadId,
        customer_id: customerId,
        public_id: lead.public_id, // Use public_id from lead
        created_by_user_id: userId,
        // Ensure optional fields are handled if not provided
        pickup_person_name: req.body.pickup_person_name || null,
        pickup_person_phone: req.body.pickup_person_phone || null,
        pickup_address: req.body.pickup_address || null,
        dropoff_person_name: req.body.dropoff_person_name || null,
        dropoff_person_phone: req.body.dropoff_person_phone || null,
        dropoff_address: req.body.dropoff_address || null,
      });

      // Create quote in Supabase
      const { data: quote, error: quoteError } = await supabaseAdmin
        .from('quotes')
        .insert(quoteData)
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Update lead status to 'quote'
      const { error: leadUpdateError } = await supabaseAdmin
        .from('leads')
        .update({ status: 'quote' })
        .eq('id', leadId)
        .eq('customer_id', customerId);

      if (leadUpdateError) throw leadUpdateError;

      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote data", errors: error.errors });
      }
      console.error("Error converting lead to quote:", error);
      res.status(500).json({ message: "Failed to convert lead to quote" });
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

      const activeLeads = leads.filter(lead => lead.status === 'lead' || lead.status === 'assigned').length;
      const bookedLeads = leads.filter(lead => lead.status === 'booked' || lead.status === 'completed').length;
      const totalLeads = leads.length;
      const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

      // Calculate revenue based on broker_fees
      const totalRevenue = leads.reduce((sum, lead) => {
        return sum + (parseFloat(lead.broker_fees) || 0);
      }, 0);

      // Calculate per-user performance
      const userPerformance = users.map(user => {
        const userLeads = leads.filter(lead => lead.assigned_user_id === user.id);
        const userBooked = userLeads.filter(lead => lead.status === 'booked' || lead.status === 'completed').length;
        const userRevenue = userLeads.reduce((sum, lead) => sum + (parseFloat(lead.broker_fees) || 0), 0);
        const userConversion = userLeads.length > 0 ? Math.round((userBooked / userLeads.length) * 100) : 0;

        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          leadsAssigned: userLeads.length,
          conversionRate: userConversion,
          revenue: userRevenue
        };
      });

      res.json({
        totalUsers: users.length,
        activeLeads,
        totalRevenue,
        conversionRate,
        userPerformance
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
      const bookedLeads = userLeads.filter(lead => lead.status === 'booked' || lead.status === 'completed').length;
      const totalLeads = userLeads.length;
      const successRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

      // Calculate revenue
      const revenue = userLeads.reduce((sum, lead) => {
        return sum + (parseFloat(lead.broker_fees) || 0);
      }, 0);

      res.json({
        activeLeads: userLeads.filter(lead => lead.status === 'assigned').length,
        booked: bookedLeads,
        revenue,
        successRate
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/crm/quotes/:customerId', async (req, res) => {
    try {
      const { customerId } = req.params;
      console.log(`Fetching quotes for customer: ${customerId}`);
      const { data: quotes, error } = await supabaseAdmin
        .from('quotes')
        .select('*')
        .eq('customer_id', customerId)
        .neq('status', 'accepted') // Hide accepted quotes
        .neq('status', 'rejected') // Hide rejected quotes
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log(`Found ${quotes?.length} quotes for customer ${customerId}`);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.post('/api/crm/quotes/:quoteId/send', async (req, res) => {
    try {
      const { quoteId } = req.params;

      // Update quote status to sent
      const { data: quote, error } = await supabaseAdmin
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      res.json(quote);
    } catch (error) {
      console.error("Error sending quote:", error);
      res.status(500).json({ message: "Failed to send quote" });
    }
  });

  app.post('/api/crm/quotes/:quoteId/convert-to-order', async (req, res) => {
    try {
      const { quoteId } = req.params;

      // Fetch the quote to get the public_id and details
      const { data: quote, error: quoteError } = await supabaseAdmin
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Check if order already exists
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('quote_id', quoteId)
        .single();

      if (existingOrder) {
        // Ensure quote status is accepted
        await supabaseAdmin
          .from('quotes')
          .update({ status: 'accepted' })
          .eq('id', quoteId);

        return res.json(existingOrder);
      }

      // Create order with public_id from quote and copy all relevant details
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          quote_id: quoteId,
          lead_id: quote.lead_id,
          customer_id: quote.customer_id,
          public_id: quote.public_id, // Persist public_id
          status: 'pending_signature',
          // Copy tariff details
          // Note: If orders table doesn't have these fields, we rely on the relation to quotes.
          // However, to "snapshot" the deal, we should ideally have them on the order.
          // Since the schema for orders doesn't have tariff fields, we are assuming the frontend
          // should fetch them from the linked quote.
          // But if the user says "incomplete", maybe they mean pickup/dropoff details?
          // Let's ensure we update the quote with any new details provided during conversion FIRST
          // so the linked quote has the latest info.
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update quote with pickup/dropoff details if provided
      const updateData: any = { status: 'accepted' };

      if (req.body.pickup_details) {
        updateData.pickup_address = req.body.pickup_details.address;
        updateData.pickup_zip = req.body.pickup_details.zip;
        updateData.pickup_contacts = req.body.pickup_details.contacts;
        // Map first contact to legacy fields for backward compatibility
        if (req.body.pickup_details.contacts?.[0]) {
          updateData.pickup_person_name = req.body.pickup_details.contacts[0].name;
          updateData.pickup_person_phone = req.body.pickup_details.contacts[0].phone;
        }
      }

      if (req.body.dropoff_details) {
        updateData.dropoff_address = req.body.dropoff_details.address;
        updateData.dropoff_zip = req.body.dropoff_details.zip;
        updateData.dropoff_contacts = req.body.dropoff_details.contacts;
        // Map first contact to legacy fields for backward compatibility
        if (req.body.dropoff_details.contacts?.[0]) {
          updateData.dropoff_person_name = req.body.dropoff_details.contacts[0].name;
          updateData.dropoff_person_phone = req.body.dropoff_details.contacts[0].phone;
        }
      }

      // Also copy carrier/broker fees if provided in the conversion request (final negotiation)
      if (req.body.carrier_fees) updateData.carrier_fees = req.body.carrier_fees;
      if (req.body.broker_fees) updateData.broker_fees = req.body.broker_fees;
      if (req.body.total_tariff) updateData.total_tariff = req.body.total_tariff;

      await supabaseAdmin
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId);

      // Update lead status to order
      await supabaseAdmin
        .from('leads')
        .update({ status: 'order' })
        .eq('id', quote.lead_id);

      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error converting quote to order:", error);
      res.status(500).json({
        message: "Failed to convert quote to order",
        details: error.message || JSON.stringify(error)
      });
    }
  });

  app.get('/api/crm/orders/:customerId', async (req, res) => {
    try {
      const { customerId } = req.params;
      console.log(`Fetching orders for customer: ${customerId}`);
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('*, quotes(*), leads(*)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log(`Found ${orders?.length} orders for customer ${customerId}`);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
