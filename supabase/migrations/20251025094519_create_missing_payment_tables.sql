/*
  # Create Missing Payment and OTP Tables

  Creates the tables that don't exist yet for OTP verification,
  cash deposit locations, coupons, and payment gateways.
*/

-- 1. OTP Verifications Table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  otp_code text NOT NULL,
  purpose text NOT NULL,
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_otp_user_id ON public.otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verifications(expires_at);

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OTP records"
  ON public.otp_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OTP records"
  ON public.otp_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OTP records"
  ON public.otp_verifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Cash Deposit Locations Table
CREATE TABLE IF NOT EXISTS public.cash_deposit_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  branch_code text UNIQUE NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text,
  working_hours text NOT NULL,
  working_days text NOT NULL,
  latitude numeric,
  longitude numeric,
  services text[] DEFAULT ARRAY['deposit', 'withdrawal', 'pickup']::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_locations_city ON public.cash_deposit_locations(city);
CREATE INDEX IF NOT EXISTS idx_cash_locations_active ON public.cash_deposit_locations(is_active);

ALTER TABLE public.cash_deposit_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cash locations"
  ON public.cash_deposit_locations FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3. Coupon Codes Table
CREATE TABLE IF NOT EXISTS public.coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  max_discount_amount numeric,
  min_purchase_amount numeric DEFAULT 0,
  currency text DEFAULT 'LYD',
  usage_limit integer,
  usage_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  allowed_payment_methods text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_active ON public.coupon_codes(is_active);

ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active coupons"
  ON public.coupon_codes FOR SELECT
  TO authenticated
  USING (is_active = true AND now() BETWEEN valid_from AND COALESCE(valid_until, 'infinity'::timestamptz));

-- 5. Payment Gateways Table
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gateway_type text NOT NULL,
  provider text NOT NULL,
  currencies text[] DEFAULT ARRAY['LYD']::text[],
  supported_cards text[],
  min_amount numeric DEFAULT 10,
  max_amount numeric DEFAULT 1000000,
  commission_type text CHECK (commission_type IN ('fixed', 'percentage')),
  commission_value numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  api_endpoint text,
  webhook_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_gateway_type ON public.payment_gateways(gateway_type);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_active ON public.payment_gateways(is_active);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active payment gateways"
  ON public.payment_gateways FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 6. Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gateway_id uuid REFERENCES public.payment_gateways(id),
  transaction_reference text UNIQUE NOT NULL,
  external_reference text,
  amount numeric NOT NULL,
  currency text DEFAULT 'LYD',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method text NOT NULL,
  wallet_type text,
  metadata jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payment_trans_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_trans_ref ON public.payment_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payment_trans_status ON public.payment_transactions(status);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment transactions"
  ON public.payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert sample cash deposit locations
INSERT INTO public.cash_deposit_locations (name, branch_code, city, address, phone, working_hours, working_days, services)
VALUES
  ('Gold Trading - Tripoli Main Branch', 'GTT-001', 'Tripoli', 'Gargaresh Street, Near Tripoli Medical Center', '+218-21-4445566', '9:00 AM - 5:00 PM', 'Sunday - Thursday', ARRAY['deposit', 'withdrawal', 'pickup']),
  ('Gold Trading - Benghazi Branch', 'GTB-001', 'Benghazi', 'Jamal Abdul Nasser Street, Downtown', '+218-61-2223344', '9:00 AM - 5:00 PM', 'Sunday - Thursday', ARRAY['deposit', 'withdrawal', 'pickup']),
  ('Gold Trading - Misrata Branch', 'GTM-001', 'Misrata', 'Central Market Area, Al-Jarif District', '+218-51-7778899', '9:00 AM - 4:00 PM', 'Sunday - Thursday', ARRAY['deposit', 'pickup']),
  ('Gold Trading - Zawiya Branch', 'GTZ-001', 'Zawiya', 'Main Street, City Center', '+218-23-5556677', '9:00 AM - 4:00 PM', 'Sunday - Thursday', ARRAY['deposit', 'pickup']),
  ('Gold Trading - Sabha Branch', 'GTS-001', 'Sabha', 'Downtown Area, Near Post Office', '+218-71-3334455', '10:00 AM - 3:00 PM', 'Sunday - Wednesday', ARRAY['deposit'])
ON CONFLICT (branch_code) DO NOTHING;

-- Insert sample payment gateways
INSERT INTO public.payment_gateways (name, gateway_type, provider, currencies, supported_cards, commission_type, commission_value)
VALUES
  ('Libyan Card Payment', 'card', 'sadad', ARRAY['LYD'], ARRAY['Visa', 'Mastercard', 'Al Maeda'], 'percentage', 2.5),
  ('Moamalat Card Gateway', 'card', 'moamalat', ARRAY['LYD'], ARRAY['Visa', 'Mastercard'], 'percentage', 2.0),
  ('Libyan Post Payment', 'card', 'libyan_post', ARRAY['LYD'], ARRAY['Tahweel'], 'fixed', 5.0),
  ('Tadawul Mobile Money', 'mobile_money', 'tadawul', ARRAY['LYD'], NULL, 'percentage', 1.5),
  ('Bank Transfer', 'bank_transfer', 'jumhouria_bank', ARRAY['LYD', 'USD'], NULL, 'fixed', 0)
ON CONFLICT DO NOTHING;

-- Insert sample coupon codes
INSERT INTO public.coupon_codes (code, description, discount_type, discount_value, max_discount_amount, min_purchase_amount, usage_limit, valid_until)
VALUES
  ('WELCOME2024', 'Welcome bonus for new users', 'percentage', 10, 100, 100, 1000, now() + interval '6 months'),
  ('GOLD50', '50 LYD off on gold purchases', 'fixed', 50, 50, 500, 500, now() + interval '3 months'),
  ('NEWUSER100', '100 LYD bonus for first deposit', 'fixed', 100, 100, 1000, 100, now() + interval '1 year'),
  ('RAMADAN2024', 'Ramadan special - 15% off', 'percentage', 15, 200, 300, 2000, now() + interval '2 months')
ON CONFLICT (code) DO NOTHING;
