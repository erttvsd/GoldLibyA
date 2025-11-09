import { supabase } from '../lib/supabase';

export const locationChangeService = {
  createRequest: async (
    assetId: string,
    fromStoreId: string,
    toStoreId: string,
    reason: string
  ) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { data: null, error: new Error('Not authenticated') };

    return supabase.from('location_change_requests').insert({
      asset_id: assetId,
      from_store_id: fromStoreId,
      to_store_id: toStoreId,
      requested_by: user.data.user.id,
      reason,
      status: 'pending',
    });
  },

  getRequests: async (storeId: string, status?: string) => {
    let query = supabase
      .from('location_change_requests')
      .select(`
        *,
        owned_assets(serial_number, products(name, type, weight_grams)),
        from_store:from_store_id(name, city),
        to_store:to_store_id(name, city),
        requester:requested_by(first_name, last_name)
      `)
      .or(`from_store_id.eq.${storeId},to_store_id.eq.${storeId}`)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    return query;
  },

  approveRequest: async (requestId: string, notes?: string) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { data: null, error: new Error('Not authenticated') };

    return supabase
      .from('location_change_requests')
      .update({
        status: 'approved',
        approved_by: user.data.user.id,
        resolution_note: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);
  },

  rejectRequest: async (requestId: string, notes: string) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { data: null, error: new Error('Not authenticated') };

    return supabase
      .from('location_change_requests')
      .update({
        status: 'rejected',
        approved_by: user.data.user.id,
        resolution_note: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);
  },

  completeMove: async (requestId: string) => {
    return supabase
      .from('location_change_requests')
      .update({
        status: 'moved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);
  },
};
