import { supabase } from '../lib/supabase';
import { Product, Store, Inventory, LivePrice } from '../types';

export const marketService = {
  async getProducts(isActive = true): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', isActive)
      .order('type')
      .order('weight_grams');

    if (error) throw error;
    return data || [];
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getStores(isActive = true): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', isActive)
      .order('city');

    if (error) throw error;
    return data || [];
  },

  async getStoreById(id: string): Promise<Store | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getInventory(storeId?: string, productId?: string): Promise<Inventory[]> {
    let query = supabase.from('inventory').select('*');

    if (storeId) query = query.eq('store_id', storeId);
    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getProductAvailability(productId: string): Promise<Map<string, number>> {
    const inventory = await this.getInventory(undefined, productId);
    const availability = new Map<string, number>();

    inventory.forEach(item => {
      if (item.quantity > 0) {
        availability.set(item.store_id, item.quantity);
      }
    });

    return availability;
  },

  async getLivePrices(): Promise<LivePrice[]> {
    const { data, error } = await supabase
      .from('live_prices')
      .select('*');

    if (error) throw error;
    return data || [];
  },

  async getLivePrice(metalType: 'gold' | 'silver'): Promise<LivePrice | null> {
    const { data, error } = await supabase
      .from('live_prices')
      .select('*')
      .eq('metal_type', metalType)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
