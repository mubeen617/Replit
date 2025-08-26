import { supabase } from './supabase';

// Supabase service layer for frontend operations
export class SupabaseService {
  
  // Generic query method
  async query(tableName: string, options: {
    select?: string;
    filter?: { column: string; operator: string; value: any };
    order?: { column: string; ascending?: boolean };
    limit?: number;
  } = {}) {
    let query = supabase.from(tableName);
    
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select('*');
    }
    
    if (options.filter) {
      query = query.filter(options.filter.column, options.filter.operator, options.filter.value);
    }
    
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
    }
    
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
    const options: any = {
      filter: { column: 'customer_id', operator: 'eq', value: customerId },
      order: { column: 'created_at', ascending: false }
    };

    if (assignedUserId) {
      // For assigned user filtering, we need a more complex query
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

    return this.query('leads', options);
  }

  async createLead(leadData: any) {
    return this.insert('leads', leadData);
  }

  // Customers operations
  async getCustomers(search?: string) {
    const options: any = {
      order: { column: 'created_at', ascending: false }
    };

    if (search) {
      // For complex search, use RPC or multiple queries
      let query = supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${search}%,domain.ilike.%${search}%,admin_name.ilike.%${search}%`)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return data;
    }

    return this.query('customers', options);
  }

  // Quotes operations
  async getQuotes(customerId: string) {
    return this.query('quotes', {
      filter: { column: 'customer_id', operator: 'eq', value: customerId },
      order: { column: 'created_at', ascending: false }
    });
  }

  async createQuote(quoteData: any) {
    return this.insert('quotes', quoteData);
  }
}

export const supabaseService = new SupabaseService();