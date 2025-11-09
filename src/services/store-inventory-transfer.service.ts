import { supabase } from '../lib/supabase';

export interface StoreInventoryTransferRequest {
  id: string;
  transfer_number: string;
  from_store_id: string;
  to_store_id: string;
  status: 'requested' | 'approved' | 'rejected' | 'in_transit' | 'received' | 'cancelled';
  total_items: number;
  reason: string;
  notes?: string;
  requested_by: string;
  approved_by?: string;
  approval_notes?: string;
  approved_at?: string;
  shipped_at?: string;
  shipped_by?: string;
  shipping_reference?: string;
  received_at?: string;
  received_by?: string;
  receipt_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StoreInventoryTransferItem {
  id: string;
  transfer_request_id: string;
  product_id: string;
  asset_id?: string;
  serial_number: string;
  quantity: number;
  status: 'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled';
  notes?: string;
  created_at: string;
}

export const storeInventoryTransferService = {
  getTransferRequests: async (storeId: string, status?: string) => {
    let query = supabase
      .from('store_inventory_transfer_requests')
      .select(`
        *,
        from_store:stores!store_inventory_transfer_requests_from_store_id_fkey(id, name, city),
        to_store:stores!store_inventory_transfer_requests_to_store_id_fkey(id, name, city),
        requester:profiles!store_inventory_transfer_requests_requested_by_fkey(first_name, last_name)
      `)
      .or(`from_store_id.eq.${storeId},to_store_id.eq.${storeId}`)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    return query;
  },

  getTransferItems: async (transferRequestId: string) => {
    return supabase
      .from('store_inventory_transfer_items')
      .select(`
        *,
        product:products(id, name, type, carat, weight_grams)
      `)
      .eq('transfer_request_id', transferRequestId)
      .order('created_at');
  },

  requestTransfer: async (
    fromStoreId: string,
    toStoreId: string,
    items: Array<{
      product_id: string;
      serial_number: string;
      quantity?: number;
    }>,
    reason: string,
    notes?: string
  ) => {
    return supabase.rpc('store_request_inventory_transfer', {
      p_from_store_id: fromStoreId,
      p_to_store_id: toStoreId,
      p_items: items,
      p_reason: reason,
      p_notes: notes,
    });
  },

  approveTransfer: async (requestId: string, approvalNotes?: string) => {
    return supabase.rpc('store_approve_inventory_transfer', {
      p_request_id: requestId,
      p_approval_notes: approvalNotes,
    });
  },

  rejectTransfer: async (requestId: string, rejectionNotes?: string) => {
    return supabase.rpc('store_reject_inventory_transfer', {
      p_request_id: requestId,
      p_rejection_notes: rejectionNotes,
    });
  },

  shipTransfer: async (
    requestId: string,
    shippingReference?: string,
    notes?: string
  ) => {
    return supabase.rpc('store_ship_inventory_transfer', {
      p_request_id: requestId,
      p_shipping_reference: shippingReference,
      p_notes: notes,
    });
  },

  receiveTransfer: async (requestId: string, receiptNotes?: string) => {
    return supabase.rpc('store_receive_inventory_transfer', {
      p_request_id: requestId,
      p_receipt_notes: receiptNotes,
    });
  },

  cancelTransfer: async (requestId: string, reason?: string) => {
    return supabase.rpc('store_cancel_inventory_transfer', {
      p_request_id: requestId,
      p_reason: reason,
    });
  },

  getStoreInventory: async (storeId: string) => {
    return supabase
      .from('inventory')
      .select(`
        *,
        product:products(id, name, type, carat, weight_grams, base_price_lyd)
      `)
      .eq('store_id', storeId)
      .gt('quantity', 0)
      .order('updated_at', { ascending: false });
  },

  getAllStores: async () => {
    return supabase
      .from('stores')
      .select('id, name, city, address')
      .eq('is_active', true)
      .order('name');
  },
};
