import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  nationalId?: string;
  address?: string;
  employmentStatus?: string;
  incomeSource?: string;
  accountPurpose?: string;
  monthlyTransactionVolume?: string;
  accountType?: 'individual' | 'store';
  businessName?: string;
  businessRegistration?: string;
  taxId?: string;
  storeId?: string;
  locationId?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp(data: SignUpData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.dateOfBirth,
        national_id: data.nationalId,
        address: data.address,
        account_type: data.accountType || 'individual',
      });

    if (profileError) throw profileError;

    if (data.accountType === 'store' && data.businessName) {
      await supabase
        .from('store_profiles')
        .insert({
          user_id: authData.user.id,
          store_id: data.storeId || null,
          location_id: data.locationId || null,
          business_name: data.businessName,
          business_registration_number: data.businessRegistration,
          tax_id: data.taxId,
          manager_name: `${data.firstName} ${data.lastName}`,
          manager_phone: data.phone || '',
          manager_email: data.email,
          is_verified: false,
          is_active: true,
        });
    }

    await supabase
      .from('wallets')
      .insert([
        { user_id: authData.user.id, currency: 'LYD', balance: 0 },
        { user_id: authData.user.id, currency: 'USD', balance: 0 },
      ]);

    await supabase
      .from('digital_balances')
      .insert([
        { user_id: authData.user.id, metal_type: 'gold', grams: 0 },
        { user_id: authData.user.id, metal_type: 'silver', grams: 0 },
      ]);

    if (data.employmentStatus || data.incomeSource || data.accountPurpose || data.monthlyTransactionVolume) {
      await supabase
        .from('kyc_details')
        .insert({
          user_id: authData.user.id,
          employment_status: data.employmentStatus,
          income_source: data.incomeSource,
          account_purpose: data.accountPurpose,
          expected_monthly_volume: data.monthlyTransactionVolume,
          verification_status: 'pending',
        });
    }

    return authData;
  },

  async signIn(data: SignInData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;
    return authData;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        callback(event, session);
      })();
    });
  },

  async findUserByEmailOrPhone(emailOrPhone: string): Promise<Profile | null> {
    const trimmed = emailOrPhone.trim();

    const { data, error } = await supabase.rpc('search_profiles_exact', {
      q: trimmed
    });

    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data[0];
  },
};
