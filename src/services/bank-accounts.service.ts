import { supabase } from '../lib/supabase';

export interface BankAccount {
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
}

export const bankAccountsService = {
  createAccount: async (storeId: string, data: Omit<BankAccount, 'id' | 'store_id' | 'is_active' | 'is_verified'>) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { data: null, error: new Error('Not authenticated') };

    return supabase.from('store_bank_accounts').insert({
      store_id: storeId,
      created_by: user.data.user.id,
      is_active: true,
      is_verified: false,
      ...data,
    });
  },

  getAccounts: async (storeId: string) => {
    return supabase
      .from('store_bank_accounts')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
  },

  updateAccount: async (accountId: string, data: Partial<BankAccount>) => {
    return supabase
      .from('store_bank_accounts')
      .update(data)
      .eq('id', accountId);
  },

  toggleActive: async (accountId: string, isActive: boolean) => {
    return supabase
      .from('store_bank_accounts')
      .update({ is_active: isActive })
      .eq('id', accountId);
  },

  verifyAccount: async (accountId: string) => {
    return supabase
      .from('store_bank_accounts')
      .update({ is_verified: true })
      .eq('id', accountId);
  },

  deleteAccount: async (accountId: string) => {
    return supabase
      .from('store_bank_accounts')
      .delete()
      .eq('id', accountId);
  },

  recordBankTransaction: async (
    storeId: string,
    accountId: string,
    type: 'bank_deposit' | 'bank_withdrawal',
    amount: number,
    description?: string
  ) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { data: null, error: new Error('Not authenticated') };

    const { data: account } = await supabase
      .from('store_financial_accounts')
      .select('*')
      .eq('store_id', storeId)
      .eq('currency', 'LYD')
      .single();

    if (!account) return { data: null, error: new Error('Financial account not found') };

    const balanceBefore = account.balance;
    const balanceAfter = type === 'bank_deposit' ? balanceBefore + amount : balanceBefore - amount;

    return supabase.from('store_financial_transactions').insert({
      store_id: storeId,
      account_id: account.id,
      transaction_type: type,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: 'bank_account',
      reference_id: accountId,
      description,
      processed_by: user.data.user.id,
    });
  },
};
