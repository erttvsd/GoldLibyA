import { supabase } from '../lib/supabase';
import { KYCDetails } from '../types';

export interface CreateKYCData {
  userId: string;
  placeOfBirth?: string;
  nationality?: string;
  maritalStatus?: string;
  employmentStatus?: string;
  incomeSource?: string;
  accountPurpose?: string;
  expectedMonthlyVolume?: string;
}

export const kycService = {
  async getKYCDetails(userId: string): Promise<KYCDetails | null> {
    const { data, error } = await supabase
      .from('kyc_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createKYCDetails(data: CreateKYCData): Promise<KYCDetails> {
    const { data: kyc, error } = await supabase
      .from('kyc_details')
      .insert({
        user_id: data.userId,
        place_of_birth: data.placeOfBirth,
        nationality: data.nationality,
        marital_status: data.maritalStatus,
        employment_status: data.employmentStatus,
        income_source: data.incomeSource,
        account_purpose: data.accountPurpose,
        expected_monthly_volume: data.expectedMonthlyVolume,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return kyc;
  },

  async updateKYCDetails(userId: string, updates: Partial<CreateKYCData>): Promise<void> {
    const { error } = await supabase
      .from('kyc_details')
      .update({
        place_of_birth: updates.placeOfBirth,
        nationality: updates.nationality,
        marital_status: updates.maritalStatus,
        employment_status: updates.employmentStatus,
        income_source: updates.incomeSource,
        account_purpose: updates.accountPurpose,
        expected_monthly_volume: updates.expectedMonthlyVolume,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  },

  async uploadDocument(userId: string, file: File, type: 'id_front' | 'id_back' | 'selfie'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(fileName);

    const updateField = `${type}_url`;
    const { error: updateError } = await supabase
      .from('kyc_details')
      .update({ [updateField]: data.publicUrl })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return data.publicUrl;
  },
};
