import { supabase } from '../lib/supabase';
import { OwnedAsset, PurchaseInvoice, PaymentMethod } from '../types';

export interface CreatePurchaseData {
  userId: string;
  productId?: string;
  storeId?: string;
  paymentMethod: PaymentMethod;
  amountLyd: number;
  commissionLyd: number;
  isDigital: boolean;
  digitalMetalType?: 'gold' | 'silver';
  digitalGrams?: number;
}

export const assetService = {
  async getOwnedAssets(userId: string, status?: string): Promise<OwnedAsset[]> {
    let query = supabase
      .from('owned_assets')
      .select(`
        *,
        product:products(*),
        store:stores(
          *,
          pickup_location:cash_deposit_locations!stores_location_id_fkey(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getAssetById(id: string): Promise<OwnedAsset | null> {
    const { data, error } = await supabase
      .from('owned_assets')
      .select(`
        *,
        product:products(*),
        store:stores(
          *,
          pickup_location:cash_deposit_locations!stores_location_id_fkey(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createAsset(asset: Omit<OwnedAsset, 'id' | 'created_at' | 'updated_at'>): Promise<OwnedAsset> {
    const { data, error } = await supabase
      .from('owned_assets')
      .insert(asset)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAsset(id: string, updates: Partial<OwnedAsset>) {
    const { error } = await supabase
      .from('owned_assets')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async transferAssetOwnership(assetId: string, newOwnerId: string): Promise<void> {
    const { data, error } = await supabase.rpc('transfer_asset_ownership', {
      p_asset_id: assetId,
      p_new_owner_id: newOwnerId
    });

    if (error) throw error;
    if (!data?.success) throw new Error('Transfer failed');
  },

  async createPurchase(data: CreatePurchaseData): Promise<{ invoice: PurchaseInvoice; asset?: OwnedAsset }> {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    let assetId: string | undefined;
    let asset: OwnedAsset | undefined;

    if (!data.isDigital && data.productId && data.storeId) {
      const serialNumber = `SN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const pickupDeadline = new Date();
      pickupDeadline.setDate(pickupDeadline.getDate() + 3);

      const newAsset = await this.createAsset({
        user_id: data.userId,
        product_id: data.productId,
        serial_number: serialNumber,
        status: 'not_received',
        pickup_store_id: data.storeId,
        pickup_deadline: pickupDeadline.toISOString(),
        is_digital: false,
        xrf_analysis: {
          gold: '99.9%',
          silver: '0.1%',
        },
        physical_properties: {
          dimensions: 'Standard',
          shape: 'Bar',
        },
      });

      assetId = newAsset.id;
      asset = newAsset;
    }

    const { data: invoice, error } = await supabase
      .from('purchase_invoices')
      .insert({
        invoice_number: invoiceNumber,
        user_id: data.userId,
        asset_id: assetId,
        store_id: data.storeId,
        amount_lyd: data.amountLyd,
        commission_lyd: data.commissionLyd,
        payment_method: data.paymentMethod,
        is_digital: data.isDigital,
        digital_metal_type: data.digitalMetalType,
        digital_grams: data.digitalGrams,
        shared_bar_serial: data.isDigital ? `SB-${Date.now()}` : undefined,
      })
      .select()
      .single();

    if (error) throw error;

    return { invoice, asset };
  },

  async getInvoiceById(id: string): Promise<PurchaseInvoice | null> {
    const { data, error } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        asset:owned_assets(*),
        store:stores(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getUserInvoices(userId: string): Promise<PurchaseInvoice[]> {
    const { data, error } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        asset:owned_assets(*),
        store:stores(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserAssets(userId: string): Promise<OwnedAsset[]> {
    return this.getOwnedAssets(userId);
  },
};
