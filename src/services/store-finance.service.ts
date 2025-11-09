import { supabase } from '../lib/supabase';

export interface StoreFinancialAccount {
  id: string;
  store_id: string;
  currency: 'LYD' | 'USD';
  balance: number;
  available_balance: number;
  held_balance: number;
  created_at: string;
  updated_at: string;
}

export interface StoreFinancialTransaction {
  id: string;
  store_id: string;
  account_id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  metadata?: any;
  processed_by: string;
  created_at: string;
}

export interface StoreFundTransferRequest {
  id: string;
  from_store_id: string;
  to_store_id: string;
  currency: 'LYD' | 'USD';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  requested_by: string;
  approved_by?: string;
  approval_notes?: string;
  approved_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StoreBankAccount {
  id: string;
  store_id: string;
  bank_name: string;
  account_number: string;
  iban?: string;
  swift_code?: string;
  account_holder_name: string;
  branch?: string;
  is_active: boolean;
  is_verified: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const storeFinanceService = {
  getFinancialAccounts: async (storeId: string) => {
    return supabase
      .from('store_financial_accounts')
      .select('*')
      .eq('store_id', storeId)
      .order('currency');
  },

  getFinancialTransactions: async (
    storeId: string,
    filters?: {
      accountId?: string;
      transactionType?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ) => {
    let query = supabase
      .from('store_financial_transactions')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId);
    }

    if (filters?.transactionType) {
      query = query.eq('transaction_type', filters.transactionType);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return query;
  },

  depositFunds: async (
    storeId: string,
    currency: 'LYD' | 'USD',
    amount: number,
    description?: string
  ) => {
    return supabase.rpc('store_deposit_funds', {
      p_store_id: storeId,
      p_currency: currency,
      p_amount: amount,
      p_description: description,
    });
  },

  withdrawFunds: async (
    storeId: string,
    currency: 'LYD' | 'USD',
    amount: number,
    description?: string
  ) => {
    return supabase.rpc('store_withdraw_funds', {
      p_store_id: storeId,
      p_currency: currency,
      p_amount: amount,
      p_description: description,
    });
  },

  getBankAccounts: async (storeId: string) => {
    return supabase
      .from('store_bank_accounts')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
  },

  addBankAccount: async (storeId: string, data: {
    bank_name: string;
    account_number: string;
    iban?: string;
    swift_code?: string;
    account_holder_name: string;
    branch?: string;
  }) => {
    const user = await supabase.auth.getUser();
    return supabase.from('store_bank_accounts').insert({
      store_id: storeId,
      created_by: user.data.user?.id,
      ...data,
    });
  },

  updateBankAccount: async (accountId: string, data: Partial<{
    bank_name: string;
    account_number: string;
    iban?: string;
    swift_code?: string;
    account_holder_name: string;
    branch?: string;
    is_active: boolean;
  }>) => {
    return supabase
      .from('store_bank_accounts')
      .update(data)
      .eq('id', accountId);
  },

  getFundTransferRequests: async (storeId: string, status?: string) => {
    let query = supabase
      .from('store_fund_transfer_requests')
      .select(`
        *,
        from_store:stores!store_fund_transfer_requests_from_store_id_fkey(id, name, city),
        to_store:stores!store_fund_transfer_requests_to_store_id_fkey(id, name, city),
        requester:profiles!store_fund_transfer_requests_requested_by_fkey(first_name, last_name)
      `)
      .or(`from_store_id.eq.${storeId},to_store_id.eq.${storeId}`)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    return query;
  },

  requestFundTransfer: async (
    fromStoreId: string,
    toStoreId: string,
    currency: 'LYD' | 'USD',
    amount: number,
    reason: string,
    notes?: string
  ) => {
    return supabase.rpc('store_request_fund_transfer', {
      p_from_store_id: fromStoreId,
      p_to_store_id: toStoreId,
      p_currency: currency,
      p_amount: amount,
      p_reason: reason,
      p_notes: notes,
    });
  },

  approveFundTransfer: async (requestId: string, approvalNotes?: string) => {
    return supabase.rpc('store_approve_fund_transfer', {
      p_request_id: requestId,
      p_approval_notes: approvalNotes,
    });
  },

  rejectFundTransfer: async (requestId: string, rejectionNotes?: string) => {
    return supabase.rpc('store_reject_fund_transfer', {
      p_request_id: requestId,
      p_rejection_notes: rejectionNotes,
    });
  },

  getAllStores: async () => {
    return supabase
      .from('stores')
      .select('id, name, city, address')
      .eq('is_active', true)
      .order('name');
  },
};
