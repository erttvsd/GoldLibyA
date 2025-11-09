/*
  # Security and Performance Optimization

  This migration fixes all security and performance issues:
  
  1. **Missing Foreign Key Indexes** (21 indexes)
  2. **RLS Policy Optimization** (32 policies with SELECT wrapper)
  3. **Remove Unused Indexes** (13 indexes)
  4. **Function Security Fix**

  ## Performance Impact
  - Faster JOIN operations
  - Up to 10x faster RLS queries at scale
  - Reduced storage overhead
*/

-- ===== PART 1: ADD MISSING FOREIGN KEY INDEXES =====

CREATE INDEX IF NOT EXISTS idx_appointments_asset_id ON public.appointments(asset_id);
CREATE INDEX IF NOT EXISTS idx_appointments_store_id ON public.appointments(store_id);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset_id ON public.asset_transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_bullion_fingerprints_owned_asset_id ON public.bullion_fingerprints(owned_asset_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_code_id ON public.coupon_usage(code_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_transaction_id ON public.coupon_usage(transaction_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_owned_assets_pickup_store_id ON public.owned_assets(pickup_store_id);
CREATE INDEX IF NOT EXISTS idx_owned_assets_product_id ON public.owned_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_asset_id ON public.purchase_invoices(asset_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_store_id ON public.purchase_invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_created_by ON public.referral_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_scan_history_matched_asset_id ON public.scan_history(matched_asset_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_matched_fingerprint_id ON public.scan_history(matched_fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_matched_product_id ON public.scan_history(matched_product_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_fees_transaction_id ON public.transaction_fees(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_fees_user_id ON public.transaction_fees(user_id);

-- ===== PART 2: OPTIMIZE RLS POLICIES =====

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- KYC
DROP POLICY IF EXISTS "Users can view own KYC" ON public.kyc_details;
CREATE POLICY "Users can view own KYC" ON public.kyc_details FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own KYC" ON public.kyc_details;
CREATE POLICY "Users can insert own KYC" ON public.kyc_details FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own KYC" ON public.kyc_details;
CREATE POLICY "Users can update own KYC" ON public.kyc_details FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Wallets
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own wallets" ON public.wallets;
CREATE POLICY "Users can insert own wallets" ON public.wallets FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Digital balances
DROP POLICY IF EXISTS "Users can view own digital balances" ON public.digital_balances;
CREATE POLICY "Users can view own digital balances" ON public.digital_balances FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own digital balances" ON public.digital_balances;
CREATE POLICY "Users can insert own digital balances" ON public.digital_balances FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Owned assets
DROP POLICY IF EXISTS "Users can view own assets" ON public.owned_assets;
CREATE POLICY "Users can view own assets" ON public.owned_assets FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own assets" ON public.owned_assets;
CREATE POLICY "Users can insert own assets" ON public.owned_assets FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own assets" ON public.owned_assets;
CREATE POLICY "Users can update own assets" ON public.owned_assets FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Purchase invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON public.purchase_invoices;
CREATE POLICY "Users can view own invoices" ON public.purchase_invoices FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON public.purchase_invoices;
CREATE POLICY "Users can insert own invoices" ON public.purchase_invoices FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Asset transfers
DROP POLICY IF EXISTS "Users can view transfers they're involved in" ON public.asset_transfers;
CREATE POLICY "Users can view transfers they're involved in" ON public.asset_transfers FOR SELECT TO authenticated
  USING ((select auth.uid()) = from_user_id OR (select auth.uid()) = to_user_id);

DROP POLICY IF EXISTS "Users can create transfers from their assets" ON public.asset_transfers;
CREATE POLICY "Users can create transfers from their assets" ON public.asset_transfers FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = from_user_id);

-- Digital transfers
DROP POLICY IF EXISTS "Users can view digital transfers they're involved in" ON public.digital_transfers;
CREATE POLICY "Users can view digital transfers they're involved in" ON public.digital_transfers FOR SELECT TO authenticated
  USING ((select auth.uid()) = from_user_id OR (select auth.uid()) = to_user_id);

DROP POLICY IF EXISTS "Users can create digital transfers" ON public.digital_transfers;
CREATE POLICY "Users can create digital transfers" ON public.digital_transfers FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = from_user_id);

-- Appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;
CREATE POLICY "Users can create own appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Scan history
DROP POLICY IF EXISTS "Users view own scans" ON public.scan_history;
CREATE POLICY "Users view own scans" ON public.scan_history FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users create scans" ON public.scan_history;
CREATE POLICY "Users create scans" ON public.scan_history FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- User preferences
DROP POLICY IF EXISTS "Users manage own prefs" ON public.user_preferences;
CREATE POLICY "Users manage own prefs" ON public.user_preferences FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Support tickets
DROP POLICY IF EXISTS "Users view own tickets" ON public.support_tickets;
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users create tickets" ON public.support_tickets;
CREATE POLICY "Users create tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users manage notifications" ON public.notifications;
CREATE POLICY "Users manage notifications" ON public.notifications FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Price alerts
DROP POLICY IF EXISTS "Users manage alerts" ON public.price_alerts;
CREATE POLICY "Users manage alerts" ON public.price_alerts FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Transaction fees
DROP POLICY IF EXISTS "Users view own fees" ON public.transaction_fees;
CREATE POLICY "Users view own fees" ON public.transaction_fees FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Coupon usage
DROP POLICY IF EXISTS "Users view own usage" ON public.coupon_usage;
CREATE POLICY "Users view own usage" ON public.coupon_usage FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Digital assets
DROP POLICY IF EXISTS "Users manage own digital assets" ON public.digital_assets;
CREATE POLICY "Users manage own digital assets" ON public.digital_assets FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- ===== PART 3: REMOVE UNUSED INDEXES =====

DROP INDEX IF EXISTS public.idx_owned_assets_status;
DROP INDEX IF EXISTS public.idx_invoices_user;
DROP INDEX IF EXISTS public.idx_transactions_created;
DROP INDEX IF EXISTS public.idx_transfers_from;
DROP INDEX IF EXISTS public.idx_transfers_to;
DROP INDEX IF EXISTS public.idx_digital_transfers_from;
DROP INDEX IF EXISTS public.idx_digital_transfers_to;
DROP INDEX IF EXISTS public.idx_appointments_user;
DROP INDEX IF EXISTS public.idx_appointments_date;
DROP INDEX IF EXISTS public.idx_bullion_fingerprints_hash;
DROP INDEX IF EXISTS public.idx_scan_history_result;
DROP INDEX IF EXISTS public.idx_notifications_user;
DROP INDEX IF EXISTS public.idx_digital_assets_type;

-- ===== PART 4: FIX FUNCTION SECURITY =====

DROP FUNCTION IF EXISTS public.create_sample_user_data(uuid);

CREATE OR REPLACE FUNCTION public.create_sample_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO wallets (user_id, currency, balance, available_balance)
  VALUES 
    (p_user_id, 'LYD', 199990, 199990),
    (p_user_id, 'USD', 122000, 122000)
  ON CONFLICT (user_id, currency) DO NOTHING;

  INSERT INTO digital_balances (user_id, metal, grams)
  VALUES 
    (p_user_id, 'gold', 125.5),
    (p_user_id, 'silver', 500.0)
  ON CONFLICT (user_id, metal) DO NOTHING;

  INSERT INTO transactions (user_id, type, amount, currency, description)
  VALUES 
    (p_user_id, 'deposit', 50000, 'LYD', 'Initial deposit'),
    (p_user_id, 'deposit', 100000, 'USD', 'USD wallet funding'),
    (p_user_id, 'purchase', 10.5, 'LYD', 'Purchased 10g gold')
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sample_user_data(uuid) TO authenticated;
