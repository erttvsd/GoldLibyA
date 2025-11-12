import { supabase } from '../lib/supabase';

export interface CustomerInteraction {
  id: string;
  store_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  interaction_type: 'appointment_set' | 'picked_up' | 'transferred' | 'pending' | 'cancelled';
  asset_id?: string;
  asset_bar_number?: string;
  asset_weight?: number;
  asset_purity?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  interaction_id: string;
  sender_type: 'store' | 'customer';
  sender_id: string;
  message: string;
  created_at: string;
}

export interface CustomerTransaction {
  id: string;
  interaction_id: string;
  transaction_type: 'purchase' | 'transfer' | 'pickup' | 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  description?: string;
  created_at: string;
}

export interface CustomerFilters {
  searchTerm?: string;
  interactionType?: string;
  barNumber?: string;
}

export const customerService = {
  async getCustomerInteractions(storeId: string, filters?: CustomerFilters) {
    try {
      let query = supabase
        .from('store_customer_interactions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.searchTerm) {
        query = query.or(`customer_name.ilike.%${filters.searchTerm}%,customer_email.ilike.%${filters.searchTerm}%,customer_phone.ilike.%${filters.searchTerm}%`);
      }

      if (filters?.interactionType && filters.interactionType !== 'all') {
        query = query.eq('interaction_type', filters.interactionType);
      }

      if (filters?.barNumber) {
        query = query.ilike('asset_bar_number', `%${filters.barNumber}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data as CustomerInteraction[], error: null };
    } catch (error: any) {
      console.error('Error fetching customer interactions:', error);
      return { data: null, error: error.message };
    }
  },

  async getInteractionById(interactionId: string) {
    try {
      const { data, error } = await supabase
        .from('store_customer_interactions')
        .select('*')
        .eq('id', interactionId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as CustomerInteraction | null, error: null };
    } catch (error: any) {
      console.error('Error fetching interaction:', error);
      return { data: null, error: error.message };
    }
  },

  async getChatHistory(interactionId: string) {
    try {
      const { data, error } = await supabase
        .from('store_customer_chat')
        .select('*')
        .eq('interaction_id', interactionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data as ChatMessage[], error: null };
    } catch (error: any) {
      console.error('Error fetching chat history:', error);
      return { data: null, error: error.message };
    }
  },

  async sendChatMessage(interactionId: string, message: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('store_customer_chat')
        .insert({
          interaction_id: interactionId,
          sender_type: 'store',
          sender_id: user.id,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as ChatMessage, error: null };
    } catch (error: any) {
      console.error('Error sending chat message:', error);
      return { data: null, error: error.message };
    }
  },

  async getTransactions(interactionId: string) {
    try {
      const { data, error } = await supabase
        .from('store_customer_transactions')
        .select('*')
        .eq('interaction_id', interactionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as CustomerTransaction[], error: null };
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      return { data: null, error: error.message };
    }
  },

  async updateInteractionStatus(interactionId: string, status: CustomerInteraction['interaction_type']) {
    try {
      const { data, error } = await supabase
        .from('store_customer_interactions')
        .update({ interaction_type: status })
        .eq('id', interactionId)
        .select()
        .single();

      if (error) throw error;
      return { data: data as CustomerInteraction, error: null };
    } catch (error: any) {
      console.error('Error updating interaction status:', error);
      return { data: null, error: error.message };
    }
  },

  async addTransaction(
    interactionId: string,
    transactionType: CustomerTransaction['transaction_type'],
    amount: number,
    currency: string,
    description?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('store_customer_transactions')
        .insert({
          interaction_id: interactionId,
          transaction_type: transactionType,
          amount,
          currency,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as CustomerTransaction, error: null };
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      return { data: null, error: error.message };
    }
  },
};
