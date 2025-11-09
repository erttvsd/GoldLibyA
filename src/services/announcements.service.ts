import { supabase } from '../lib/supabase';

export interface Announcement {
  id: string;
  store_id: string;
  title: string;
  body: string;
  visible_from?: string;
  visible_to?: string;
  is_active: boolean;
  created_at: string;
}

export const announcementsService = {
  createAnnouncement: async (
    storeId: string,
    data: {
      title: string;
      body: string;
      visible_from?: string;
      visible_to?: string;
    }
  ) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return { data: null, error: new Error('Not authenticated') };

    return supabase.from('store_announcements').insert({
      store_id: storeId,
      created_by: user.data.user.id,
      is_active: true,
      ...data,
    });
  },

  getAnnouncements: async (storeId: string, activeOnly: boolean = false) => {
    let query = supabase
      .from('store_announcements')
      .select('*, profiles:created_by(first_name, last_name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .or(`visible_from.is.null,visible_from.lte.${now}`)
        .or(`visible_to.is.null,visible_to.gte.${now}`);
    }

    return query;
  },

  updateAnnouncement: async (announcementId: string, data: Partial<Announcement>) => {
    return supabase
      .from('store_announcements')
      .update(data)
      .eq('id', announcementId);
  },

  toggleActive: async (announcementId: string, isActive: boolean) => {
    return supabase
      .from('store_announcements')
      .update({ is_active: isActive })
      .eq('id', announcementId);
  },

  deleteAnnouncement: async (announcementId: string) => {
    return supabase
      .from('store_announcements')
      .delete()
      .eq('id', announcementId);
  },

  getActiveAnnouncements: async (storeId: string) => {
    const now = new Date().toISOString();
    return supabase
      .from('store_announcements')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .or(`visible_from.is.null,visible_from.lte.${now}`)
      .or(`visible_to.is.null,visible_to.gte.${now}`)
      .order('created_at', { ascending: false });
  },
};
