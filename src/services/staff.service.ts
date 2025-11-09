import { supabase } from '../lib/supabase';

export interface StaffMember {
  id: string;
  user_id: string;
  store_id: string;
  role: string;
  permissions: any;
  is_active: boolean;
  profiles?: any;
}

export const staffService = {
  getStaffMembers: async (storeId: string) => {
    return supabase
      .from('store_users')
      .select(`
        *,
        profiles:user_id(id, first_name, last_name, email, phone)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
  },

  addStaffMember: async (
    storeId: string,
    userId: string,
    role: string,
    permissions: any
  ) => {
    return supabase.from('store_users').insert({
      store_id: storeId,
      user_id: userId,
      role,
      permissions,
      is_active: true,
    });
  },

  updateStaffRole: async (staffId: string, role: string, permissions: any) => {
    return supabase
      .from('store_users')
      .update({ role, permissions })
      .eq('id', staffId);
  },

  toggleStaffActive: async (staffId: string, isActive: boolean) => {
    return supabase
      .from('store_users')
      .update({ is_active: isActive })
      .eq('id', staffId);
  },

  removeStaffMember: async (staffId: string) => {
    return supabase
      .from('store_users')
      .delete()
      .eq('id', staffId);
  },

  getStaffActivity: async (userId: string, storeId: string, fromDate: string, toDate: string) => {
    return supabase
      .from('pos_sales')
      .select('*, pos_sale_items(*)')
      .eq('store_id', storeId)
      .eq('clerk_id', userId)
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .order('created_at', { ascending: false });
  },

  getStaffPerformance: async (userId: string, storeId: string) => {
    return supabase.rpc('get_staff_performance', {
      p_user_id: userId,
      p_store_id: storeId,
    });
  },
};
