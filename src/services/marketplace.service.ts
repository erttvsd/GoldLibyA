import { supabase } from '../lib/supabase';

export interface MarketplaceItem {
  id: string;
  store_id: string;
  item_name: string;
  item_type: 'bar' | 'coin' | 'jewelry' | 'ingot' | 'bullion';
  metal_type: 'gold' | 'silver' | 'platinum';
  weight: number;
  purity: string;
  price_lyd: number;
  price_usd: number;
  quantity_available: number;
  description?: string;
  image_url?: string;
  is_available: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOrder {
  id: string;
  item_id: string;
  buyer_id: string;
  store_id: string;
  quantity: number;
  total_price_lyd: number;
  total_price_usd: number;
  order_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_method: 'wallet' | 'cash' | 'bank_transfer';
  delivery_method: 'pickup' | 'delivery';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const marketplaceService = {
  async getMarketplaceItems(storeId?: string, featured?: boolean) {
    try {
      let query = supabase
        .from('store_marketplace_items')
        .select('*')
        .eq('is_available', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (featured) {
        query = query.eq('featured', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data as MarketplaceItem[], error: null };
    } catch (error: any) {
      console.error('Error fetching marketplace items:', error);
      return { data: null, error: error.message };
    }
  },

  async getItemById(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('store_marketplace_items')
        .select('*')
        .eq('id', itemId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as MarketplaceItem | null, error: null };
    } catch (error: any) {
      console.error('Error fetching item:', error);
      return { data: null, error: error.message };
    }
  },

  async createOrder(
    itemId: string,
    quantity: number,
    paymentMethod: MarketplaceOrder['payment_method'],
    deliveryMethod: MarketplaceOrder['delivery_method'],
    notes?: string
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: item, error: itemError } = await this.getItemById(itemId);
      if (itemError || !item) throw new Error('Item not found');

      if (item.quantity_available < quantity) {
        throw new Error('Insufficient quantity available');
      }

      // Get inventory_id from store_marketplace_items
      const { data: marketItem } = await supabase
        .from('store_marketplace_items')
        .select('inventory_id')
        .eq('id', itemId)
        .maybeSingle();

      if (!marketItem?.inventory_id) {
        throw new Error('Inventory not linked to this item');
      }

      // Get store user (clerk) for the sale
      const { data: storeProfile } = await supabase
        .from('store_profiles')
        .select('user_id')
        .eq('store_id', item.store_id)
        .maybeSingle();

      if (!storeProfile) {
        throw new Error('Store not found');
      }

      // Process sale using the database function
      const { data: saleResult, error: saleError } = await supabase.rpc(
        'process_inventory_sale',
        {
          p_store_id: item.store_id,
          p_clerk_id: storeProfile.user_id,
          p_customer_id: user.id,
          p_items: [
            {
              inventory_id: marketItem.inventory_id,
              quantity: quantity,
            },
          ],
          p_notes: `${deliveryMethod === 'pickup' ? 'Store Pickup' : 'Delivery'} - ${paymentMethod} payment${notes ? ` - ${notes}` : ''}`,
        }
      );

      if (saleError) throw saleError;

      // Create marketplace order record
      const totalPriceLyd = item.price_lyd * quantity;
      const totalPriceUsd = item.price_usd * quantity;

      const { data, error } = await supabase
        .from('store_marketplace_orders')
        .insert({
          item_id: itemId,
          buyer_id: user.id,
          store_id: item.store_id,
          quantity,
          total_price_lyd: totalPriceLyd,
          total_price_usd: totalPriceUsd,
          order_status: 'completed',
          payment_method: paymentMethod,
          delivery_method: deliveryMethod,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Update marketplace item quantity
      await supabase
        .from('store_marketplace_items')
        .update({ quantity_available: item.quantity_available - quantity })
        .eq('id', itemId);

      return { data: data as MarketplaceOrder, error: null };
    } catch (error: any) {
      console.error('Error creating order:', error);
      return { data: null, error: error.message };
    }
  },

  async getUserOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('store_marketplace_orders')
        .select(`
          *,
          store_marketplace_items (*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      return { data: null, error: error.message };
    }
  },

  async getStoreOrders(storeId: string) {
    try {
      const { data, error } = await supabase
        .from('store_marketplace_orders')
        .select(`
          *,
          store_marketplace_items (*),
          profiles (*)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching store orders:', error);
      return { data: null, error: error.message };
    }
  },

  async updateOrderStatus(orderId: string, status: MarketplaceOrder['order_status']) {
    try {
      const { data, error } = await supabase
        .from('store_marketplace_orders')
        .update({ order_status: status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return { data: data as MarketplaceOrder, error: null };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return { data: null, error: error.message };
    }
  },
};
