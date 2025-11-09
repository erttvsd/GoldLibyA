import { supabase } from '../lib/supabase';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  max_discount_amount?: number;
  min_purchase_amount: number;
  currency: string;
  usage_limit?: number;
  usage_count: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  allowed_payment_methods?: string[];
}

export interface CouponValidation {
  valid: boolean;
  error?: string;
  discount_amount?: number;
  final_amount?: number;
}

export const couponService = {
  async validateCoupon(code: string, amount: number, currency: string = 'LYD'): Promise<CouponValidation> {
    const { data: coupon, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    if (coupon.currency !== currency) {
      return { valid: false, error: `Coupon only valid for ${coupon.currency}` };
    }

    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (now < validFrom) {
      return { valid: false, error: 'Coupon not yet active' };
    }

    if (validUntil && now > validUntil) {
      return { valid: false, error: 'Coupon has expired' };
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    if (amount < coupon.min_purchase_amount) {
      return {
        valid: false,
        error: `Minimum purchase amount is ${coupon.min_purchase_amount} ${currency}`
      };
    }

    let discount_amount = 0;
    if (coupon.discount_type === 'fixed') {
      discount_amount = coupon.discount_value;
    } else {
      discount_amount = (amount * coupon.discount_value) / 100;
      if (coupon.max_discount_amount) {
        discount_amount = Math.min(discount_amount, coupon.max_discount_amount);
      }
    }

    const final_amount = Math.max(0, amount - discount_amount);

    return {
      valid: true,
      discount_amount,
      final_amount,
    };
  },

  async applyCoupon(userId: string, code: string, transactionId: string, originalAmount: number, discountAmount: number, finalAmount: number, currency: string = 'LYD'): Promise<void> {
    const { data: coupon } = await supabase
      .from('coupon_codes')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (!coupon) throw new Error('Coupon not found');

    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert({
        coupon_code_id: coupon.id,
        user_id: userId,
        transaction_id: transactionId,
        discount_amount: discountAmount,
        original_amount: originalAmount,
        final_amount: finalAmount,
        currency,
      });

    if (usageError) throw usageError;

    await supabase
      .from('coupon_codes')
      .update({ usage_count: supabase.sql`usage_count + 1` })
      .eq('id', coupon.id);
  },

  async getAvailableCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .order('discount_value', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserCouponUsage(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('coupon_usage')
      .select(`
        *,
        coupon:coupon_codes(code, description)
      `)
      .eq('user_id', userId)
      .order('used_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
