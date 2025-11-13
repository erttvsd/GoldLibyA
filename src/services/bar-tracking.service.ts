import { supabase } from '../lib/supabase';

export interface InventoryBar {
  bar_id: string;
  serial_number: string;
  bar_number: string;
  product_name: string;
  weight_grams: number;
  purity: string;
  xrf_gold_percentage: number;
  xrf_silver_percentage: number;
  xrf_copper_percentage: number;
  xrf_other_metals: Record<string, any>;
  manufacturer: string;
  manufacture_date: string;
  certification_number: string;
  status: 'in_stock' | 'sold' | 'reserved';
  sale_date: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  sale_number: string;
  sale_total: number;
}

export interface CreateBarData {
  store_id: string;
  inventory_id: string;
  product_id: string;
  serial_number: string;
  bar_number: string;
  weight_grams: number;
  purity: string;
  xrf_gold_percentage?: number;
  xrf_silver_percentage?: number;
  xrf_copper_percentage?: number;
  xrf_other_metals?: Record<string, any>;
  manufacturer?: string;
  manufacture_date?: string;
  certification_number?: string;
  notes?: string;
}

export const barTrackingService = {
  async getStoreBars(storeId: string) {
    try {
      const { data, error } = await supabase.rpc('get_bar_details', {
        p_store_id: storeId,
      });

      if (error) throw error;
      return { data: data as InventoryBar[], error: null };
    } catch (error: any) {
      console.error('Error fetching store bars:', error);
      return { data: null, error: error.message };
    }
  },

  async getUserBars() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('inventory_bars')
        .select(`
          *,
          products (
            id,
            name,
            type,
            weight_grams,
            carat
          ),
          stores (
            id,
            name,
            address
          )
        `)
        .eq('buyer_id', user.id)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching user bars:', error);
      return { data: null, error: error.message };
    }
  },

  async getBarBySerialNumber(serialNumber: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_bars')
        .select(`
          *,
          products (
            id,
            name,
            type,
            weight_grams,
            carat,
            description
          ),
          profiles:buyer_id (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          pos_sales:sale_id (
            id,
            sale_number,
            total_lyd,
            created_at
          )
        `)
        .eq('serial_number', serialNumber)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching bar by serial number:', error);
      return { data: null, error: error.message };
    }
  },

  async createBar(barData: CreateBarData) {
    try {
      const { data, error } = await supabase
        .from('inventory_bars')
        .insert(barData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating bar:', error);
      return { data: null, error: error.message };
    }
  },

  async updateBarStatus(barId: string, status: 'in_stock' | 'sold' | 'reserved') {
    try {
      const { data, error } = await supabase
        .from('inventory_bars')
        .update({ status })
        .eq('id', barId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating bar status:', error);
      return { data: null, error: error.message };
    }
  },

  async markBarAsSold(barId: string, saleId: string, buyerId: string) {
    try {
      const { data, error } = await supabase.rpc('mark_bar_as_sold', {
        p_bar_id: barId,
        p_sale_id: saleId,
        p_buyer_id: buyerId,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error marking bar as sold:', error);
      return { data: null, error: error.message };
    }
  },
};
