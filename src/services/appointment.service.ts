import { supabase } from '../lib/supabase';

export interface PickupAppointment {
  id: string;
  appointment_number: string;
  user_id: string;
  asset_id: string;
  location_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  qr_code_data: string;
  verification_pin: string;
  notes?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  asset?: any;
  location?: any;
}

export interface CreateAppointmentData {
  userId: string;
  assetId: string;
  locationId: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

export const appointmentService = {
  async createAppointment(data: CreateAppointmentData): Promise<PickupAppointment> {
    const appointmentNumber = await this.generateAppointmentNumber();
    const verificationPin = await this.generateVerificationPin();

    const qrCodeData = JSON.stringify({
      appointment_number: appointmentNumber,
      asset_id: data.assetId,
      user_id: data.userId,
      location_id: data.locationId,
      date: data.appointmentDate,
      time: data.appointmentTime,
      pin: verificationPin,
      timestamp: new Date().toISOString()
    });

    const { data: appointment, error } = await supabase
      .from('pickup_appointments')
      .insert({
        appointment_number: appointmentNumber,
        user_id: data.userId,
        asset_id: data.assetId,
        location_id: data.locationId,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        qr_code_data: qrCodeData,
        verification_pin: verificationPin,
        notes: data.notes,
        status: 'pending'
      })
      .select(`
        *,
        asset:owned_assets!pickup_appointments_asset_id_fkey(
          *,
          product:products(*)
        ),
        location:cash_deposit_locations(*)
      `)
      .single();

    if (error) throw error;
    return appointment;
  },

  async getAppointments(userId: string): Promise<PickupAppointment[]> {
    const { data, error } = await supabase
      .from('pickup_appointments')
      .select(`
        *,
        asset:owned_assets!pickup_appointments_asset_id_fkey(
          *,
          product:products(*)
        ),
        location:cash_deposit_locations(*)
      `)
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAppointmentById(id: string): Promise<PickupAppointment | null> {
    const { data, error } = await supabase
      .from('pickup_appointments')
      .select(`
        *,
        asset:owned_assets!pickup_appointments_asset_id_fkey(
          *,
          product:products(*)
        ),
        location:cash_deposit_locations(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAppointmentByAssetId(assetId: string): Promise<PickupAppointment | null> {
    const { data, error } = await supabase
      .from('pickup_appointments')
      .select(`
        *,
        asset:owned_assets!pickup_appointments_asset_id_fkey(
          *,
          product:products(*)
        ),
        location:cash_deposit_locations(*)
      `)
      .eq('asset_id', assetId)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateAppointmentStatus(
    id: string,
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
    reason?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'confirmed') {
      updates.confirmed_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = reason;
    }

    const { error } = await supabase
      .from('pickup_appointments')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async cancelAppointment(id: string, reason: string): Promise<void> {
    await this.updateAppointmentStatus(id, 'cancelled', reason);
  },

  async generateAppointmentNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_appointment_number');
    if (error) {
      const fallback = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      return fallback;
    }
    return data || `APT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  },

  async generateVerificationPin(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_verification_pin');
    if (error) {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
    return data || Math.floor(100000 + Math.random() * 900000).toString();
  },
};
