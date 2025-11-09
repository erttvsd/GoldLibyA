import { supabase } from '../lib/supabase';

export const storeService = {
  // Customer Desk
  searchCustomer: async (storeId: string, query: string) => {
    return supabase.rpc('store_search_customer', {
      p_store_id: storeId,
      p_query: query,
    });
  },

  addCustomerNote: async (
    storeId: string,
    userId: string,
    body: string,
    isInternal: boolean = true
  ) => {
    return supabase.from('store_customer_notes').insert({
      store_id: storeId,
      user_id: userId,
      author_id: (await supabase.auth.getUser()).data.user?.id,
      body,
      is_internal: isInternal,
    });
  },

  getCustomerNotes: async (storeId: string, userId: string) => {
    return supabase
      .from('store_customer_notes')
      .select('*, profiles!store_customer_notes_author_id_fkey(first_name, last_name)')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  getCustomerFlags: async (userId: string) => {
    return supabase
      .from('customer_flags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  // Appointments & Handover
  handoverAsset: async (
    storeId: string,
    appointmentId: string,
    pin: string,
    storageFee: number = 0,
    paymentMethod: string = 'cash',
    notes?: string
  ) => {
    return supabase.rpc('store_handover_asset', {
      p_store_id: storeId,
      p_appointment_id: appointmentId,
      p_pin: pin,
      p_storage_fee_lyd: storageFee,
      p_payment_method: paymentMethod,
      p_notes: notes,
    });
  },

  getStoreAppointments: async (storeId: string, date?: string) => {
    let query = supabase
      .from('pickup_appointments')
      .select(`
        *,
        profiles!pickup_appointments_user_id_fkey(first_name, last_name, phone, email),
        owned_assets(id, serial_number, status, products(name, type, weight_grams)),
        cash_deposit_locations(name, address)
      `)
      .in('status', ['confirmed', 'pending'])
      .order('appointment_date')
      .order('appointment_time');

    if (date) {
      query = query.eq('appointment_date', date);
    }

    const { data: store } = await supabase
      .from('stores')
      .select('location_id')
      .eq('id', storeId)
      .single();

    if (store?.location_id) {
      query = query.eq('location_id', store.location_id);
    }

    return query;
  },

  // POS
  posSale: async (storeId: string, payload: any) => {
    return supabase.rpc('store_pos_sale', {
      p_store_id: storeId,
      p_payload: payload,
    });
  },

  getSales: async (storeId: string, date?: string) => {
    let query = supabase
      .from('pos_sales')
      .select(`
        *,
        pos_sale_items(*, products(name, type, weight_grams)),
        pos_payments(method, amount_lyd)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (date) {
      query = query.gte('created_at', date).lt('created_at', `${date}T23:59:59`);
    }

    return query;
  },

  // Returns
  createReturn: async (storeId: string, data: any) => {
    return supabase.from('return_requests').insert({
      store_id: storeId,
      ...data,
    });
  },

  getReturns: async (storeId: string, status?: string) => {
    let query = supabase
      .from('return_requests')
      .select(`
        *,
        profiles!return_requests_user_id_fkey(first_name, last_name, phone),
        products(name, type, weight_grams)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    return query;
  },

  processReturn: async (
    storeId: string,
    requestId: string,
    action: string,
    refundLYD?: number
  ) => {
    return supabase.rpc('store_process_return', {
      p_store_id: storeId,
      p_request_id: requestId,
      p_action: action,
      p_refund_lyd: refundLYD,
    });
  },

  // Coupons
  createCoupon: async (storeId: string, data: any) => {
    return supabase.from('store_coupons').insert({
      store_id: storeId,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      ...data,
    });
  },

  getCoupons: async (storeId: string) => {
    return supabase
      .from('store_coupons')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
  },

  validateCoupon: async (code: string, storeId: string) => {
    return supabase
      .from('store_coupons')
      .select('*')
      .eq('code', code)
      .eq('store_id', storeId)
      .eq('active', true)
      .maybeSingle();
  },

  // Cash Drawer
  openDrawer: async (storeId: string, openingAmount: number, notes?: string) => {
    return supabase.from('store_cash_movements').insert({
      store_id: storeId,
      clerk_id: (await supabase.auth.getUser()).data.user?.id,
      movement_type: 'open',
      amount_lyd: openingAmount,
      notes,
    });
  },

  closeDrawer: async (storeId: string, closingAmount: number, notes?: string) => {
    return supabase.from('store_cash_movements').insert({
      store_id: storeId,
      clerk_id: (await supabase.auth.getUser()).data.user?.id,
      movement_type: 'close',
      amount_lyd: closingAmount,
      notes,
    });
  },

  getCashMovements: async (storeId: string, date?: string) => {
    let query = supabase
      .from('store_cash_movements')
      .select('*, profiles(first_name, last_name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (date) {
      query = query.gte('created_at', date).lt('created_at', `${date}T23:59:59`);
    }

    return query;
  },

  // Dashboard
  getDashboardStats: async (storeId: string) => {
    return supabase.rpc('store_get_dashboard_stats', {
      p_store_id: storeId,
    });
  },

  // Store Info
  getStoreDetails: async (storeId: string) => {
    return supabase
      .from('stores')
      .select('*, cash_deposit_locations(*)')
      .eq('id', storeId)
      .single();
  },

  // Check user's store membership
  getUserStores: async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { data: null, error: new Error('Not authenticated') };

    return supabase
      .from('store_users')
      .select('*, stores(*, cash_deposit_locations(*))')
      .eq('user_id', user.data.user.id)
      .eq('is_active', true);
  },

  // Inventory
  getInventory: async (storeId: string) => {
    return supabase
      .from('inventory')
      .select('*, products(*)')
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false });
  },

  // Announcements
  createAnnouncement: async (storeId: string, data: any) => {
    return supabase.from('store_announcements').insert({
      store_id: storeId,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      ...data,
    });
  },

  getAnnouncements: async (storeId: string) => {
    return supabase
      .from('store_announcements')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  },
};
