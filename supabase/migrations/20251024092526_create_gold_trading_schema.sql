/*
  # Gold Trading Platform - Complete Database Schema

  ## Overview
  This migration creates the complete database schema for a gold and silver trading platform
  with digital and physical asset management, wallet functionality, KYC verification, and more.

  ## New Tables

  ### 1. profiles
  Extended user profile information linked to auth.users
  - `id` (uuid, FK to auth.users)
  - `first_name`, `last_name`, `phone`, `avatar_url`
  - `date_of_birth`, `national_id`, `address`
  - `created_at`, `updated_at`

  ### 2. kyc_details
  KYC and AML compliance information
  - `user_id` (uuid, FK to profiles)
  - Identity: `place_of_birth`, `nationality`, `marital_status`
  - AML: `employment_status`, `income_source`, `account_purpose`, `expected_monthly_volume`
  - Documents: `id_front_url`, `id_back_url`, `selfie_url`
  - `verification_status` (pending|verified|rejected)
  - `verified_at`, `verified_by`

  ### 3. wallets
  Multi-currency wallet balances
  - `user_id` (uuid, FK to profiles)
  - `currency` (LYD|USD)
  - `balance` (numeric, default 0)
  - `available_balance`, `held_balance`

  ### 4. digital_balances
  Digital gold/silver holdings
  - `user_id` (uuid, FK to profiles)
  - `metal_type` (gold|silver)
  - `grams` (numeric, default 0)

  ### 5. products
  Catalog of physical bullion products
  - `id` (uuid)
  - `name`, `type` (gold|silver), `carat` (int)
  - `weight_grams` (numeric)
  - `base_price_lyd` (numeric)
  - `image_url`, `description`
  - `is_active` (boolean)

  ### 6. stores
  Physical pickup locations
  - `id` (uuid)
  - `name`, `city`, `address`
  - `phone`, `map_url`
  - `is_active` (boolean)

  ### 7. inventory
  Store stock levels
  - `store_id` (uuid, FK to stores)
  - `product_id` (uuid, FK to products)
  - `quantity` (int, default 0)

  ### 8. owned_assets
  User's physical bullion holdings
  - `id` (uuid)
  - `user_id` (uuid, FK to profiles)
  - `product_id` (uuid, FK to products)
  - `serial_number` (unique)
  - `status` (not_received|received|transferred)
  - `pickup_store_id` (uuid, FK to stores)
  - `pickup_deadline` (timestamptz)
  - Physical properties, XRF analysis data
  - `manufacture_date`, `origin`, `packaging`

  ### 9. purchase_invoices
  Purchase transaction records
  - `id` (uuid)
  - `invoice_number` (unique)
  - `user_id` (uuid, FK to profiles)
  - `asset_id` (uuid, FK to owned_assets, nullable for digital)
  - `amount_lyd` (numeric)
  - `commission_lyd` (numeric)
  - `payment_method` (wallet_dinar|wallet_dollar|cash|coupon)
  - `is_digital` (boolean)
  - `digital_metal_type`, `digital_grams`

  ### 10. transactions
  Wallet transaction history
  - `id` (uuid)
  - `user_id` (uuid, FK to profiles)
  - `type` (deposit|withdrawal|purchase|transfer_in|transfer_out)
  - `amount` (numeric)
  - `currency` (LYD|USD)
  - `description`, `reference_id`

  ### 11. asset_transfers
  In-app asset ownership transfers
  - `id` (uuid)
  - `asset_id` (uuid, FK to owned_assets)
  - `from_user_id`, `to_user_id` (FK to profiles)
  - `status` (pending|completed|manual_review|rejected)
  - `risk_score` (numeric)
  - `transaction_hash` (text)

  ### 12. digital_transfers
  Digital gram transfers between users
  - `id` (uuid)
  - `from_user_id`, `to_user_id` (FK to profiles)
  - `metal_type` (gold|silver)
  - `grams` (numeric)
  - `shared_bar_serial` (text)
  - `transaction_id` (text)

  ### 13. appointments
  Pickup appointment bookings
  - `id` (uuid)
  - `user_id` (uuid, FK to profiles)
  - `asset_id` (uuid, FK to owned_assets)
  - `store_id` (uuid, FK to stores)
  - `appointment_date` (timestamptz)
  - `status` (scheduled|completed|cancelled)
  - `booking_id` (text)

  ### 14. live_prices
  Current market prices
  - `metal_type` (gold|silver)
  - `price_lyd_per_gram` (numeric)
  - `change_percent` (numeric)
  - `updated_at` (timestamptz)

  ### 15. news_articles
  Market news and updates
  - `id` (uuid)
  - `title`, `summary`, `content`
  - `category` (market|rates|global)
  - `icon_name` (text)
  - `published_at`

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies enforce user can only access their own data
  - Store and product data is publicly readable
  - Admin operations require service role

  ## Indexes
  - Foreign key indexes for performance
  - Unique constraints on critical fields
  - Composite indexes for common queries
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  avatar_url text,
  date_of_birth date,
  national_id text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- KYC DETAILS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS kyc_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  place_of_birth text,
  nationality text,
  marital_status text,
  employment_status text,
  income_source text,
  account_purpose text,
  expected_monthly_volume text,
  id_front_url text,
  id_back_url text,
  selfie_url text,
  verification_status text DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
  ON kyc_details FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own KYC"
  ON kyc_details FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own KYC"
  ON kyc_details FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- WALLETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  currency text NOT NULL CHECK (currency IN ('LYD', 'USD')),
  balance numeric DEFAULT 0 CHECK (balance >= 0),
  available_balance numeric DEFAULT 0 CHECK (available_balance >= 0),
  held_balance numeric DEFAULT 0 CHECK (held_balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, currency)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- DIGITAL BALANCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS digital_balances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  metal_type text NOT NULL CHECK (metal_type IN ('gold', 'silver')),
  grams numeric DEFAULT 0 CHECK (grams >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, metal_type)
);

ALTER TABLE digital_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digital balances"
  ON digital_balances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own digital balances"
  ON digital_balances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STORES TABLE (PUBLIC READ)
-- =====================================================
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  phone text,
  map_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores are publicly readable"
  ON stores FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- PRODUCTS TABLE (PUBLIC READ)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('gold', 'silver')),
  carat int NOT NULL,
  weight_grams numeric NOT NULL CHECK (weight_grams > 0),
  base_price_lyd numeric NOT NULL CHECK (base_price_lyd > 0),
  image_url text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- INVENTORY TABLE (PUBLIC READ)
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity int DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, product_id)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory is publicly readable"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- OWNED ASSETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS owned_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  serial_number text UNIQUE NOT NULL,
  status text DEFAULT 'not_received' CHECK (status IN ('not_received', 'received', 'transferred')),
  pickup_store_id uuid REFERENCES stores(id),
  pickup_deadline timestamptz,
  manufacture_date date,
  origin text,
  packaging text,
  qr_code_url text,
  xrf_analysis jsonb,
  physical_properties jsonb,
  is_digital boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_owned_assets_user ON owned_assets(user_id);
CREATE INDEX idx_owned_assets_status ON owned_assets(status);

ALTER TABLE owned_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON owned_assets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own assets"
  ON owned_assets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assets"
  ON owned_assets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PURCHASE INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES owned_assets(id),
  store_id uuid REFERENCES stores(id),
  amount_lyd numeric NOT NULL CHECK (amount_lyd >= 0),
  commission_lyd numeric DEFAULT 0 CHECK (commission_lyd >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('wallet_dinar', 'wallet_dollar', 'cash', 'coupon')),
  is_digital boolean DEFAULT false,
  digital_metal_type text CHECK (digital_metal_type IN ('gold', 'silver', NULL)),
  digital_grams numeric CHECK (digital_grams > 0 OR digital_grams IS NULL),
  shared_bar_serial text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_invoices_user ON purchase_invoices(user_id);

ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON purchase_invoices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own invoices"
  ON purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'transfer_in', 'transfer_out')),
  amount numeric NOT NULL,
  currency text NOT NULL CHECK (currency IN ('LYD', 'USD')),
  description text,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- ASSET TRANSFERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id uuid REFERENCES owned_assets(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES profiles(id),
  to_user_id uuid REFERENCES profiles(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'manual_review', 'rejected')),
  risk_score numeric CHECK (risk_score >= 0 AND risk_score <= 1),
  transaction_hash text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_transfers_from ON asset_transfers(from_user_id);
CREATE INDEX idx_transfers_to ON asset_transfers(to_user_id);

ALTER TABLE asset_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transfers they're involved in"
  ON asset_transfers FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create transfers from their assets"
  ON asset_transfers FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

-- =====================================================
-- DIGITAL TRANSFERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS digital_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id uuid REFERENCES profiles(id),
  to_user_id uuid REFERENCES profiles(id),
  metal_type text NOT NULL CHECK (metal_type IN ('gold', 'silver')),
  grams numeric NOT NULL CHECK (grams > 0),
  shared_bar_serial text NOT NULL,
  transaction_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_digital_transfers_from ON digital_transfers(from_user_id);
CREATE INDEX idx_digital_transfers_to ON digital_transfers(to_user_id);

ALTER TABLE digital_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view digital transfers they're involved in"
  ON digital_transfers FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create digital transfers"
  ON digital_transfers FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES owned_assets(id),
  store_id uuid REFERENCES stores(id),
  appointment_date timestamptz NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  booking_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- LIVE PRICES TABLE (PUBLIC READ)
-- =====================================================
CREATE TABLE IF NOT EXISTS live_prices (
  metal_type text PRIMARY KEY CHECK (metal_type IN ('gold', 'silver')),
  price_lyd_per_gram numeric NOT NULL CHECK (price_lyd_per_gram > 0),
  change_percent numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE live_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Live prices are publicly readable"
  ON live_prices FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- NEWS ARTICLES TABLE (PUBLIC READ)
-- =====================================================
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  summary text,
  content text,
  category text NOT NULL CHECK (category IN ('market', 'rates', 'global')),
  icon_name text,
  published_at timestamptz DEFAULT now()
);

CREATE INDEX idx_news_published ON news_articles(published_at DESC);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News articles are publicly readable"
  ON news_articles FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- SEED INITIAL DATA
-- =====================================================

-- Insert live prices
INSERT INTO live_prices (metal_type, price_lyd_per_gram, change_percent) 
VALUES 
  ('gold', 425.50, 1.2),
  ('silver', 8.75, -0.3)
ON CONFLICT (metal_type) DO NOTHING;

-- Insert stores
INSERT INTO stores (id, name, city, address, phone, map_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Gold House Tripoli Central', 'Tripoli', 'Martyrs Square, Building 12', '+218 21 444 5555', 'https://maps.google.com/?q=Tripoli+Libya'),
  ('22222222-2222-2222-2222-222222222222', 'Gold House Benghazi Branch', 'Benghazi', 'Al-Baladeya Street, Floor 3', '+218 61 222 3333', 'https://maps.google.com/?q=Benghazi+Libya'),
  ('33333333-3333-3333-3333-333333333333', 'Gold House Misrata Office', 'Misrata', 'Tripoli Street, Shop 45', '+218 51 626 7777', 'https://maps.google.com/?q=Misrata+Libya')
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO products (id, name, type, carat, weight_grams, base_price_lyd, image_url, description) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '24K Gold Bar 10g', 'gold', 24, 10, 4255, 'https://images.pexels.com/photos/128762/pexels-photo-128762.jpeg?auto=compress&cs=tinysrgb&w=400', 'Pure 24 karat gold bar, 10 grams'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '24K Gold Bar 50g', 'gold', 24, 50, 21275, 'https://images.pexels.com/photos/128762/pexels-photo-128762.jpeg?auto=compress&cs=tinysrgb&w=400', 'Pure 24 karat gold bar, 50 grams'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '999 Silver Bar 100g', 'silver', 999, 100, 875, 'https://images.pexels.com/photos/730564/pexels-photo-730564.jpeg?auto=compress&cs=tinysrgb&w=400', 'Fine silver bar, 100 grams'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22K Gold Coin 8g', 'gold', 22, 8, 3125, 'https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=400', '22 karat gold coin, 8 grams')
ON CONFLICT (id) DO NOTHING;

-- Insert inventory
INSERT INTO inventory (store_id, product_id, quantity) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 45),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 22),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 30),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 28),
  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 15),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 18),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 40)
ON CONFLICT (store_id, product_id) DO NOTHING;

-- Insert sample news
INSERT INTO news_articles (title, summary, category, icon_name) VALUES
  ('Gold Prices Rise Amid Global Uncertainty', 'International gold markets see 1.2% increase as investors seek safe haven assets', 'global', 'TrendingUp'),
  ('Central Bank Adjusts Official Exchange Rate', 'New USD/LYD official rate announced, effective immediately', 'rates', 'DollarSign'),
  ('Silver Demand Increases in Industrial Sector', 'Manufacturing uptick drives silver prices higher', 'market', 'BarChart3')
ON CONFLICT DO NOTHING;