import { supabase } from './supabase';

// Supabase service layer for frontend operations
export class SupabaseService {
  
  // Generic query method using proper Supabase query builder pattern
  async query(tableName: string, options: {
    select?: string;
    filter?: { column: string; operator: string; value: any };
    order?: { column: string; ascending?: boolean };
    limit?: number;
  } = {}) {
    // Start with select
    let query = supabase.from(tableName).select(options.select || '*');
    
    // Apply filter if provided
    if (options.filter) {
      query = query.filter(options.filter.column, options.filter.operator, options.filter.value);
    }
    
    // Apply ordering if provided
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
    }
    
    // Apply limit if provided
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    return data;
  }

  // Insert operation
  async insert(tableName: string, data: any) {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    return result;
  }

  // Update operation
  async update(tableName: string, data: any, filter: { column: string; operator: string; value: any }) {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .filter(filter.column, filter.operator, filter.value)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    return result;
  }

  // Delete operation
  async delete(tableName: string, filter: { column: string; operator: string; value: any }) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .filter(filter.column, filter.operator, filter.value);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return true;
  }

  // Leads operations
  async getLeads(customerId: string, assignedUserId?: string) {
    if (assignedUserId) {
      // For assigned user filtering
      let query = supabase
        .from('leads')
        .select('*')
        .eq('customer_id', customerId)
        .eq('assigned_user_id', assignedUserId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return data;
    }

    return this.query('leads', {
      filter: { column: 'customer_id', operator: 'eq', value: customerId },
      order: { column: 'created_at', ascending: false }
    });
  }

  async createLead(leadData: any) {
    return this.insert('leads', leadData);
  }

  // Customers operations
  async getCustomers(search?: string) {
    if (search) {
      // For complex search, use ilike operator for pattern matching
      let query = supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${search}%,domain.ilike.%${search}%,admin_email.ilike.%${search}%`)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return data;
    }

    return this.query('customers', {
      order: { column: 'created_at', ascending: false }
    });
  }

  async createCustomer(customerData: any) {
    return this.insert('customers', customerData);
  }

  // Quotes operations
  async getQuotes(customerId: string, assignedUserId?: string) {
    if (assignedUserId) {
      // For quotes, we'll join with leads to get assigned user
      let query = supabase
        .from('quotes')
        .select(`
          *,
          lead:leads!inner(assigned_user_id)
        `)
        .eq('customer_id', customerId)
        .eq('lead.assigned_user_id', assignedUserId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return data;
    }

    return this.query('quotes', {
      filter: { column: 'customer_id', operator: 'eq', value: customerId },
      order: { column: 'created_at', ascending: false }
    });
  }

  async createQuote(quoteData: any) {
    return this.insert('quotes', quoteData);
  }

  async convertLeadToQuote(leadId: string, quoteData: any) {
    // First create the quote
    const quote = await this.createQuote({ ...quoteData, lead_id: leadId });
    
    // Then update the lead status
    await this.update('leads', 
      { status: 'converted' }, 
      { column: 'id', operator: 'eq', value: leadId }
    );
    
    return quote;
  }

  // Utility method for lead number generation
  async generateLeadNumber() {
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', ''); // YYYYMM format
    
    // Get the latest lead number for this month
    const { data, error } = await supabase
      .from('leads')
      .select('lead_number')
      .like('lead_number', `L-${yearMonth}%`)
      .order('lead_number', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Error generating lead number: ${error.message}`);
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].lead_number;
      const match = lastNumber.match(/L-\d{6}-(\d{4})/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `L-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Utility method for quote number generation
  async generateQuoteNumber() {
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', ''); // YYYYMM format
    
    // Get the latest quote number for this month
    const { data, error } = await supabase
      .from('quotes')
      .select('quote_number')
      .like('quote_number', `Q-${yearMonth}%`)
      .order('quote_number', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Error generating quote number: ${error.message}`);
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].quote_number;
      const match = lastNumber.match(/Q-\d{6}-(\d{4})/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `Q-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Real-time subscriptions
  subscribeToLeads(customerId: string, callback: (payload: any) => void) {
    return supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `customer_id=eq.${customerId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToQuotes(customerId: string, callback: (payload: any) => void) {
    return supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `customer_id=eq.${customerId}`
        },
        callback
      )
      .subscribe();
  }
}

// Create and export a singleton instance
export const supabaseService = new SupabaseService();