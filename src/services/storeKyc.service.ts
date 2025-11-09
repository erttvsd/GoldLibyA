import { supabase } from '../lib/supabase';

export const storeKycService = {
  // Get KYC details
  getKycDetails: async (userId: string) => {
    return supabase
      .from('store_kyc_details')
      .select(`
        *,
        stores(id, name, phone, email, is_active),
        cash_deposit_locations(name, address, city)
      `)
      .eq('user_id', userId)
      .maybeSingle();
  },

  // Create or update KYC
  upsertKyc: async (userId: string, data: any) => {
    return supabase
      .from('store_kyc_details')
      .upsert({ ...data, user_id: userId })
      .select()
      .single();
  },

  // Submit for review
  submitForReview: async (kycId: string, userId: string) => {
    const { error: updateError } = await supabase
      .from('store_kyc_details')
      .update({ status: 'under_review' })
      .eq('id', kycId);

    if (updateError) throw updateError;

    return supabase.from('store_kyc_verification_log').insert({
      store_kyc_id: kycId,
      action: 'submitted',
      performed_by: userId,
      notes: 'KYC submitted for review',
    });
  },

  // Check if KYC is approved
  isKycApproved: async (userId: string) => {
    const { data } = await supabase
      .from('store_kyc_details')
      .select('status, store_id')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      approved: data?.status === 'approved',
      storeId: data?.store_id,
      status: data?.status,
    };
  },

  // Get user's store info
  getUserStore: async (userId: string) => {
    return supabase.rpc('get_user_store', { p_user_id: userId });
  },

  // Documents
  uploadDocument: async (kycId: string, documentType: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${kycId}/${documentType}_${Date.now()}.${fileExt}`;
    const filePath = `store-kyc-documents/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Save document record
    return supabase.from('store_kyc_documents').insert({
      store_kyc_id: kycId,
      document_type: documentType,
      document_url: urlData.publicUrl,
      document_name: file.name,
    });
  },

  getDocuments: async (kycId: string) => {
    return supabase
      .from('store_kyc_documents')
      .select('*')
      .eq('store_kyc_id', kycId)
      .order('created_at', { ascending: false });
  },

  // Beneficial Owners
  addBeneficialOwner: async (kycId: string, data: any) => {
    return supabase
      .from('store_kyc_beneficial_owners')
      .insert({ store_kyc_id: kycId, ...data });
  },

  getBeneficialOwners: async (kycId: string) => {
    return supabase
      .from('store_kyc_beneficial_owners')
      .select('*')
      .eq('store_kyc_id', kycId);
  },

  updateBeneficialOwner: async (id: string, data: any) => {
    return supabase
      .from('store_kyc_beneficial_owners')
      .update(data)
      .eq('id', id);
  },

  deleteBeneficialOwner: async (id: string) => {
    return supabase
      .from('store_kyc_beneficial_owners')
      .delete()
      .eq('id', id);
  },

  // Authorized Persons
  addAuthorizedPerson: async (kycId: string, data: any) => {
    return supabase
      .from('store_kyc_authorized_persons')
      .insert({ store_kyc_id: kycId, ...data });
  },

  getAuthorizedPersons: async (kycId: string) => {
    return supabase
      .from('store_kyc_authorized_persons')
      .select('*')
      .eq('store_kyc_id', kycId);
  },

  updateAuthorizedPerson: async (id: string, data: any) => {
    return supabase
      .from('store_kyc_authorized_persons')
      .update(data)
      .eq('id', id);
  },

  deleteAuthorizedPerson: async (id: string) => {
    return supabase
      .from('store_kyc_authorized_persons')
      .delete()
      .eq('id', id);
  },

  // Verification Log
  getVerificationLog: async (kycId: string) => {
    return supabase
      .from('store_kyc_verification_log')
      .select('*, profiles(first_name, last_name)')
      .eq('store_kyc_id', kycId)
      .order('created_at', { ascending: false });
  },

  // Admin functions (for compliance team)
  approveKyc: async (kycId: string, reviewerId: string, notes?: string) => {
    const { error: updateError } = await supabase
      .from('store_kyc_details')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', kycId);

    if (updateError) throw updateError;

    return supabase.from('store_kyc_verification_log').insert({
      store_kyc_id: kycId,
      action: 'approved',
      performed_by: reviewerId,
      notes: notes || 'KYC approved',
    });
  },

  rejectKyc: async (kycId: string, reviewerId: string, reason: string) => {
    const { error: updateError } = await supabase
      .from('store_kyc_details')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', kycId);

    if (updateError) throw updateError;

    return supabase.from('store_kyc_verification_log').insert({
      store_kyc_id: kycId,
      action: 'rejected',
      performed_by: reviewerId,
      notes: reason,
    });
  },
};
