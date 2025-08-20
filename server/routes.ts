import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCustomerSchema, insertCustomerUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Stats endpoint
  app.get('/api/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
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

      const result = await storage.getCustomers(search, offset, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.params.id);
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
      const customer = await storage.createCustomer(customerData);
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
      const customer = await storage.updateCustomer(req.params.id, customerData);
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
      await storage.deleteCustomer(req.params.id);
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
      const users = await storage.getCustomerUsers(req.params.customerId, search);
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
        customerId: req.params.customerId
      });
      const user = await storage.createCustomerUser(userData);
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
      const user = await storage.updateCustomerUser(req.params.id, userData);
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
      await storage.deleteCustomerUser(req.params.id);
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

      const customer = await storage.verifyCustomerPassword(email, password);
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

      const user = await storage.verifyUserPassword(email, password);
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
      const users = await storage.getCustomerUsers(customerId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching CRM users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/crm/user-loads/:userId', async (req, res) => {
    try {
      // For now, return empty array - loads will be implemented later
      res.json([]);
    } catch (error) {
      console.error("Error fetching user loads:", error);
      res.status(500).json({ message: "Failed to fetch loads" });
    }
  });

  app.get('/api/crm/admin-stats/:customerId', async (req, res) => {
    try {
      // For now, return basic stats - can be expanded later
      res.json({
        totalUsers: 0,
        activeLoads: 0,
        revenue: 0,
        performance: 100
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/crm/user-stats/:userId', async (req, res) => {
    try {
      // For now, return basic stats - can be expanded later
      res.json({
        activeLoads: 0,
        completed: 0,
        milesDriven: 0,
        onTimeRate: 100
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
