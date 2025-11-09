import { supabase } from '../lib/supabase';
import { Wallet, DigitalBalance, Transaction } from '../types';

export const walletService = {
  async getWallets(userId: string): Promise<Wallet[]> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map(wallet => ({
      ...wallet,
      balance: parseFloat(wallet.balance || 0),
      available_balance: parseFloat(wallet.available_balance || 0),
      held_balance: parseFloat(wallet.held_balance || 0)
    }));
  },

  async getWalletByCurrency(userId: string, currency: 'LYD' | 'USD'): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', currency)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      balance: parseFloat(data.balance || 0),
      available_balance: parseFloat(data.available_balance || 0),
      held_balance: parseFloat(data.held_balance || 0)
    };
  },

  async getDigitalBalances(userId: string): Promise<DigitalBalance[]> {
    const { data, error } = await supabase
      .from('digital_assets')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      user_id: d.user_id,
      metal_type: d.asset_type,
      grams: parseFloat(d.balance_grams),
      value_lyd: parseFloat(d.total_value_lyd || 0),
      updated_at: d.updated_at
    }));
  },

  async getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWalletBalance(userId: string, currency: 'LYD' | 'USD', amount: number) {
    const { data, error } = await supabase.rpc('adjust_wallet_balance', {
      p_currency: currency,
      p_delta: amount
    });

    if (error) throw error;
    return data;
  },

  async updateDigitalBalance(userId: string, metalType: 'gold' | 'silver', grams: number) {
    const { data: balance, error: fetchError } = await supabase
      .from('digital_assets')
      .select('*')
      .eq('user_id', userId)
      .eq('asset_type', metalType)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!balance) throw new Error('Digital balance not found');

    const newGrams = parseFloat(balance.balance_grams) + grams;
    if (newGrams < 0) throw new Error('Insufficient digital balance');

    const { error } = await supabase
      .from('digital_assets')
      .update({
        balance_grams: newGrams,
        updated_at: new Date().toISOString()
      })
      .eq('id', balance.id);

    if (error) throw error;
  },

  async transferDigitalBalance(
    senderId: string,
    recipientId: string,
    metalType: 'gold' | 'silver',
    grams: number
  ): Promise<void> {
    const { data, error } = await supabase.rpc('transfer_digital_balance', {
      p_sender_id: senderId,
      p_recipient_id: recipientId,
      p_metal_type: metalType,
      p_grams_amount: grams
    });

    if (error) throw error;
    if (!data?.success) throw new Error('Transfer failed');
  },

  async getOwnedAssets(userId: string) {
    const { data, error} = await supabase
      .from('owned_assets')
      .select(`
        *,
        product:products(*),
        pickup_store:stores(*)
      `)
      .eq('user_id', userId)
      .eq('is_digital', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
