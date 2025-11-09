import { supabase } from '../lib/supabase';

export interface OTPVerification {
  id: string;
  user_id: string;
  phone_number: string;
  otp_code: string;
  purpose: string;
  verified: boolean;
  expires_at: string;
  attempts: number;
  created_at: string;
  verified_at?: string;
}

export const otpService = {
  async generateOTP(userId: string, phoneNumber: string, purpose: string): Promise<string> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('otp_verifications')
      .insert({
        user_id: userId,
        phone_number: phoneNumber,
        otp_code: otpCode,
        purpose,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`OTP generated for ${phoneNumber}: ${otpCode}`);

    return otpCode;
  },

  async verifyOTP(userId: string, otpCode: string, purpose: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('otp_code', otpCode)
      .eq('purpose', purpose)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    if (!data) return false;

    if (data.attempts >= 3) {
      throw new Error('Maximum verification attempts exceeded');
    }

    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    if (updateError) throw updateError;

    return true;
  },

  async incrementAttempts(userId: string, otpCode: string): Promise<void> {
    const { data } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('otp_code', otpCode)
      .eq('verified', false)
      .maybeSingle();

    if (data) {
      await supabase
        .from('otp_verifications')
        .update({ attempts: data.attempts + 1 })
        .eq('id', data.id);
    }
  },

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    console.log(`SMS to ${phoneNumber}: ${message}`);
  },

  async sendOTPViaSMS(phoneNumber: string, otpCode: string): Promise<void> {
    const message = `Your Gold Trading verification code is: ${otpCode}. Valid for 5 minutes. Do not share this code with anyone.`;
    await this.sendSMS(phoneNumber, message);
  },
};
