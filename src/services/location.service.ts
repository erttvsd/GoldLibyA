import { supabase } from '../lib/supabase';

export interface CashDepositLocation {
  id: string;
  name: string;
  branch_code: string;
  city: string;
  address: string;
  phone: string;
  email?: string;
  working_hours: string;
  working_days: string;
  latitude?: number;
  longitude?: number;
  services: string[];
  is_active: boolean;
}

export const locationService = {
  async getAllLocations(): Promise<CashDepositLocation[]> {
    const { data, error } = await supabase
      .from('cash_deposit_locations')
      .select('*')
      .eq('is_active', true)
      .order('city');

    if (error) throw error;
    return data || [];
  },

  async getLocationsByCity(city: string): Promise<CashDepositLocation[]> {
    const { data, error } = await supabase
      .from('cash_deposit_locations')
      .select('*')
      .eq('is_active', true)
      .eq('city', city)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getLocationsByService(service: string): Promise<CashDepositLocation[]> {
    const { data, error } = await supabase
      .from('cash_deposit_locations')
      .select('*')
      .eq('is_active', true)
      .contains('services', [service])
      .order('city');

    if (error) throw error;
    return data || [];
  },

  async getCities(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cash_deposit_locations')
      .select('city')
      .eq('is_active', true);

    if (error) throw error;

    const uniqueCities = [...new Set(data?.map(loc => loc.city) || [])];
    return uniqueCities.sort();
  },
};
