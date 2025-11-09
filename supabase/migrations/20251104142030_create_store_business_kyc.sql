/*
  # Store/Business KYC System
  
  ## Purpose
  Comprehensive KYC for business/store accounts with all required documentation
  
  ## Tables
  1. store_kyc_details - Main business information
  2. store_kyc_documents - Document uploads
  3. store_kyc_beneficial_owners - Ultimate beneficial owners (UBOs)
  4. store_kyc_authorized_persons - Authorized signatories
  
  ## Security
  All tables have RLS enabled
  Only the store owner/manager can view/edit
*/

-- 1. Store KYC Details
CREATE TABLE IF NOT EXISTS store_kyc_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business Information
  business_legal_name text NOT NULL,
  business_trade_name text,
  business_type text NOT NULL CHECK (business_type IN ('sole_proprietorship', 'partnership', 'limited_liability', 'corporation', 'cooperative', 'non_profit')),
  registration_number text NOT NULL,
  tax_id text NOT NULL,
  registration_date date NOT NULL,
  registration_country text NOT NULL DEFAULT 'Libya',
  
  -- Business Address
  business_address text NOT NULL,
  business_city text NOT NULL,
  business_state text,
  business_postal_code text,
  business_country text NOT NULL DEFAULT 'Libya',
  
  -- Contact Information
  business_phone text NOT NULL,
  business_email text NOT NULL,
  business_website text,
  
  -- Business Details
  industry_sector text NOT NULL,
  number_of_employees int,
  annual_revenue_range text CHECK (annual_revenue_range IN ('0-100k', '100k-500k', '500k-1m', '1m-5m', '5m+')),
  business_description text NOT NULL,
  
  -- Banking Information
  bank_name text,
  bank_account_number text,
  bank_branch text,
  swift_code text,
  iban text,
  
  -- Regulatory
  is_pep_related boolean DEFAULT false,
  pep_details text,
  is_high_risk_industry boolean DEFAULT false,
  risk_mitigation_measures text,
  
  -- Source of Funds
  source_of_funds text NOT NULL CHECK (source_of_funds IN ('business_operations', 'investments', 'loans', 'grants', 'other')),
  source_of_funds_details text,
  expected_monthly_volume_lyd numeric(12, 3),
  expected_transaction_types text[],
  
  -- Compliance
  aml_policy_in_place boolean DEFAULT false,
  compliance_officer_name text,
  compliance_officer_email text,
  compliance_officer_phone text,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'requires_update')),
  rejection_reason text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_store_kyc_user ON store_kyc_details(user_id);
CREATE INDEX IF NOT EXISTS idx_store_kyc_status ON store_kyc_details(status);

-- 2. Store KYC Documents
CREATE TABLE IF NOT EXISTS store_kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_kyc_id uuid NOT NULL REFERENCES store_kyc_details(id) ON DELETE CASCADE,
  
  document_type text NOT NULL CHECK (document_type IN (
    'business_registration',
    'tax_certificate',
    'trade_license',
    'articles_of_incorporation',
    'memorandum_of_association',
    'board_resolution',
    'proof_of_address',
    'bank_statement',
    'audited_financials',
    'shareholder_register',
    'organizational_chart',
    'aml_policy',
    'owner_id_front',
    'owner_id_back',
    'owner_passport',
    'authorized_signatory_id',
    'power_of_attorney',
    'other'
  )),
  
  document_url text NOT NULL,
  document_name text NOT NULL,
  document_number text,
  issue_date date,
  expiry_date date,
  issuing_authority text,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_kyc_docs_kyc ON store_kyc_documents(store_kyc_id);

-- 3. Beneficial Owners (UBOs)
CREATE TABLE IF NOT EXISTS store_kyc_beneficial_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_kyc_id uuid NOT NULL REFERENCES store_kyc_details(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  nationality text NOT NULL,
  national_id text NOT NULL,
  passport_number text,
  
  -- Address
  residential_address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  
  -- Contact
  phone text,
  email text,
  
  -- Ownership Details
  ownership_percentage numeric(5, 2) NOT NULL CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
  position_title text,
  is_controlling_person boolean DEFAULT false,
  
  -- PEP Status
  is_pep boolean DEFAULT false,
  pep_position text,
  pep_country text,
  
  -- Documents
  id_document_url text,
  proof_of_address_url text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_kyc_ubo_kyc ON store_kyc_beneficial_owners(store_kyc_id);

-- 4. Authorized Persons / Signatories
CREATE TABLE IF NOT EXISTS store_kyc_authorized_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_kyc_id uuid NOT NULL REFERENCES store_kyc_details(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name text NOT NULL,
  position_title text NOT NULL,
  national_id text NOT NULL,
  date_of_birth date NOT NULL,
  nationality text NOT NULL,
  
  -- Contact
  phone text NOT NULL,
  email text NOT NULL,
  
  -- Authorization
  authorization_level text NOT NULL CHECK (authorization_level IN ('full', 'limited', 'view_only')),
  can_sign_contracts boolean DEFAULT false,
  can_approve_transactions boolean DEFAULT false,
  transaction_limit_lyd numeric(12, 3),
  
  -- Documents
  id_document_url text,
  authorization_letter_url text,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_kyc_auth_kyc ON store_kyc_authorized_persons(store_kyc_id);

-- 5. KYC Verification Log
CREATE TABLE IF NOT EXISTS store_kyc_verification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_kyc_id uuid NOT NULL REFERENCES store_kyc_details(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('submitted', 'document_added', 'under_review', 'approved', 'rejected', 'update_requested')),
  performed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- =====================================
-- RLS POLICIES
-- =====================================

-- Store KYC Details
ALTER TABLE store_kyc_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own store KYC"
  ON store_kyc_details FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own store KYC"
  ON store_kyc_details FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own store KYC"
  ON store_kyc_details FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Store KYC Documents
ALTER TABLE store_kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own store KYC documents"
  ON store_kyc_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_kyc_details
      WHERE id = store_kyc_documents.store_kyc_id
      AND user_id = auth.uid()
    )
  );

-- Beneficial Owners
ALTER TABLE store_kyc_beneficial_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own UBOs"
  ON store_kyc_beneficial_owners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_kyc_details
      WHERE id = store_kyc_beneficial_owners.store_kyc_id
      AND user_id = auth.uid()
    )
  );

-- Authorized Persons
ALTER TABLE store_kyc_authorized_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own authorized persons"
  ON store_kyc_authorized_persons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_kyc_details
      WHERE id = store_kyc_authorized_persons.store_kyc_id
      AND user_id = auth.uid()
    )
  );

-- Verification Log
ALTER TABLE store_kyc_verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification log"
  ON store_kyc_verification_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM store_kyc_details
      WHERE id = store_kyc_verification_log.store_kyc_id
      AND user_id = auth.uid()
    )
  );

-- =====================================
-- HELPER FUNCTIONS
-- =====================================

-- Function to check if store KYC is complete
CREATE OR REPLACE FUNCTION is_store_kyc_complete(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM store_kyc_details
    WHERE user_id = p_user_id
    AND status = 'approved'
    AND EXISTS (
      SELECT 1 FROM store_kyc_documents
      WHERE store_kyc_id = store_kyc_details.id
      AND document_type = 'business_registration'
      AND status = 'verified'
    )
  );
$$;

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_store_kyc_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER store_kyc_details_updated
  BEFORE UPDATE ON store_kyc_details
  FOR EACH ROW
  EXECUTE FUNCTION update_store_kyc_timestamp();
