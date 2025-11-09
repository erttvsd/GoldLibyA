/*
  # Complete Gold Trading Application Database Schema
  
  ## New Tables
  - bullion_fingerprints: Unique fingerprint data for verification
  - scan_history: All scan attempts and results
  - user_preferences: User settings
  - support_tickets: Customer support
  - notifications: User notifications
  - price_alerts: Price alert rules
  - transaction_fees: Fee records
  - referral_codes: Coupons and referrals
  - coupon_usage: Coupon redemption tracking
*/

CREATE TABLE IF NOT EXISTS bullion_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  owned_asset_id uuid REFERENCES owned_assets(id) ON DELETE SET NULL,
  
  image_hash text NOT NULL,
  visual_pattern jsonb NOT NULL,
  surface_texture_hash text,
  weight_signature text,
  dimension_signature text,
  
  scan_date timestamptz DEFAULT now(),
  scanner_device text,
  scanner_location text,
  confidence_score decimal(5,2),
  
  reference_image_url text,
  detail_images jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(image_hash)
);

CREATE INDEX IF NOT EXISTS idx_bullion_fingerprints_product ON bullion_fingerprints(product_id);
CREATE INDEX IF NOT EXISTS idx_bullion_fingerprints_hash ON bullion_fingerprints(image_hash);

ALTER TABLE bullion_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read fingerprints" ON bullion_fingerprints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fingerprints" ON bullion_fingerprints FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  scanned_image_url text NOT NULL,
  scanned_image_hash text NOT NULL,
  scan_type text DEFAULT 'verification' CHECK (scan_type IN ('verification', 'registration', 'inspection')),
  
  verification_result text NOT NULL CHECK (verification_result IN ('genuine', 'counterfeit', 'uncertain', 'no_match')),
  matched_fingerprint_id uuid REFERENCES bullion_fingerprints(id),
  matched_product_id uuid REFERENCES products(id),
  matched_asset_id uuid REFERENCES owned_assets(id),
  similarity_score decimal(5,2),
  
  scan_location jsonb,
  device_info jsonb,
  notes text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_user ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_result ON scan_history(verification_result);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scans" ON scan_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create scans" ON scan_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  notifications_enabled boolean DEFAULT true,
  price_alerts_enabled boolean DEFAULT true,
  transaction_alerts_enabled boolean DEFAULT true,
  marketing_emails_enabled boolean DEFAULT false,
  
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'en' CHECK (language IN ('en', 'ar', 'fr')),
  
  two_factor_enabled boolean DEFAULT false,
  biometric_enabled boolean DEFAULT false,
  auto_logout_enabled boolean DEFAULT true,
  auto_logout_minutes integer DEFAULT 15,
  
  default_currency text DEFAULT 'LYD',
  custom_settings jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prefs" ON user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text CHECK (category IN ('account', 'transaction', 'technical', 'kyc', 'general')),
  
  assigned_to uuid REFERENCES profiles(id),
  resolution text,
  resolved_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tickets" ON support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create tickets" ON support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  type text NOT NULL CHECK (type IN ('transaction', 'price_alert', 'system', 'kyc', 'security')),
  title text NOT NULL,
  message text NOT NULL,
  
  read boolean DEFAULT false,
  read_at timestamptz,
  
  action_url text,
  related_id uuid,
  
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage notifications" ON notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  metal_type text NOT NULL CHECK (metal_type IN ('gold', 'silver')),
  alert_type text NOT NULL CHECK (alert_type IN ('above', 'below', 'change_percent')),
  
  target_price decimal(12,2),
  target_percentage decimal(5,2),
  current_price decimal(12,2),
  
  active boolean DEFAULT true,
  triggered boolean DEFAULT false,
  triggered_at timestamptz,
  notification_sent boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage alerts" ON price_alerts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS transaction_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  fee_type text NOT NULL CHECK (fee_type IN ('commission', 'storage', 'location_change', 'fabrication', 'wire_transfer', 'other')),
  fee_amount decimal(12,2) NOT NULL,
  fee_currency text NOT NULL,
  description text,
  
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transaction_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own fees" ON transaction_fees FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code text NOT NULL UNIQUE,
  code_type text NOT NULL CHECK (code_type IN ('referral', 'coupon', 'promotional')),
  
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_grams')),
  discount_value decimal(12,2),
  discount_currency text,
  
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  
  min_purchase_amount decimal(12,2),
  applicable_to text CHECK (applicable_to IN ('all', 'digital', 'physical')),
  
  active boolean DEFAULT true,
  
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View active codes" ON referral_codes FOR SELECT TO authenticated USING (active = true);

CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid REFERENCES referral_codes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  discount_applied decimal(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage" ON coupon_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

INSERT INTO user_preferences (user_id)
SELECT id FROM profiles
WHERE NOT EXISTS (SELECT 1 FROM user_preferences WHERE user_preferences.user_id = profiles.id)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO referral_codes (code, code_type, discount_type, discount_value, discount_currency, max_uses, applicable_to)
VALUES
  ('WELCOME2025', 'promotional', 'percentage', 10, 'LYD', 100, 'all'),
  ('GOLD50', 'coupon', 'fixed_amount', 50, 'LYD', 50, 'all'),
  ('FREEGRAM', 'promotional', 'free_grams', 1, 'gold', 200, 'digital')
ON CONFLICT (code) DO NOTHING;

INSERT INTO bullion_fingerprints (product_id, image_hash, visual_pattern, confidence_score, reference_image_url)
SELECT 
  id,
  md5(id::text || name)::text,
  jsonb_build_object(
    'texture', 'smooth',
    'reflectivity', (random() * 100)::numeric,
    'edge_pattern', CASE WHEN random() < 0.33 THEN 'straight' WHEN random() < 0.66 THEN 'beveled' ELSE 'rounded' END,
    'surface_marks', (random() * 10)::integer
  ),
  (95.0 + random() * 4.9)::numeric,
  'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400'
FROM products
WHERE NOT EXISTS (SELECT 1 FROM bullion_fingerprints WHERE bullion_fingerprints.product_id = products.id)
LIMIT 20
ON CONFLICT (image_hash) DO NOTHING;
