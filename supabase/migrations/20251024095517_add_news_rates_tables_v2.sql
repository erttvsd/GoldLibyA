/*
  # Add News and Rate Tables

  1. New Tables
    - `usd_rates`
      - Stores parallel and official USD exchange rates
      - Tracks daily changes
    - `local_gold_prices`
      - Gold prices by karat (24K, 22K, 21K, 18K)
      - Prices in LYD per gram
    - `global_gold_prices`
      - International gold prices
      - Markets: Turkey, UAE, London, etc.
      - Prices in USD per gram

  2. Updates to news_articles
    - Modify category constraint to support new categories
    - Add source column

  3. Security
    - Enable RLS on all tables
    - Public read access (financial data is public)
    - Admin-only write access

  4. Sample Data
    - Populated with realistic values for demonstration
*/

-- USD Exchange Rates Table
CREATE TABLE IF NOT EXISTS usd_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_type text NOT NULL CHECK (rate_type IN ('parallel', 'official')),
  rate_lyd decimal(10,4) NOT NULL,
  change_percent decimal(5,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(rate_type)
);

ALTER TABLE usd_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "USD rates are publicly readable"
  ON usd_rates FOR SELECT
  TO public
  USING (true);

-- Local Gold Prices Table (Libya)
CREATE TABLE IF NOT EXISTS local_gold_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  karat integer NOT NULL CHECK (karat IN (24, 22, 21, 18)),
  price_lyd_per_gram decimal(10,2) NOT NULL,
  change_percent decimal(5,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(karat)
);

ALTER TABLE local_gold_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Local gold prices are publicly readable"
  ON local_gold_prices FOR SELECT
  TO public
  USING (true);

-- Global Gold Prices Table
CREATE TABLE IF NOT EXISTS global_gold_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market text NOT NULL,
  price_usd_per_gram decimal(10,2) NOT NULL,
  change_percent decimal(5,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(market)
);

ALTER TABLE global_gold_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global gold prices are publicly readable"
  ON global_gold_prices FOR SELECT
  TO public
  USING (true);

-- Update news_articles table
-- Drop old constraint
ALTER TABLE news_articles DROP CONSTRAINT IF EXISTS news_articles_category_check;

-- Add new constraint with expanded categories
ALTER TABLE news_articles ADD CONSTRAINT news_articles_category_check 
  CHECK (category IN ('market', 'gold', 'currency', 'economy', 'announcement', 'rates', 'global'));

-- Add source column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_articles' AND column_name = 'source'
  ) THEN
    ALTER TABLE news_articles ADD COLUMN source text;
  END IF;
END $$;

-- Insert sample USD rates
INSERT INTO usd_rates (rate_type, rate_lyd, change_percent, updated_at)
VALUES 
  ('parallel', 6.85, 0.5, now()),
  ('official', 4.80, 0.0, now())
ON CONFLICT (rate_type) DO UPDATE
SET 
  rate_lyd = EXCLUDED.rate_lyd,
  change_percent = EXCLUDED.change_percent,
  updated_at = EXCLUDED.updated_at;

-- Insert sample local gold prices
INSERT INTO local_gold_prices (karat, price_lyd_per_gram, change_percent, updated_at)
VALUES 
  (24, 425.50, 1.2, now()),
  (22, 389.70, 1.1, now()),
  (21, 371.80, 1.0, now()),
  (18, 318.85, 0.9, now())
ON CONFLICT (karat) DO UPDATE
SET 
  price_lyd_per_gram = EXCLUDED.price_lyd_per_gram,
  change_percent = EXCLUDED.change_percent,
  updated_at = EXCLUDED.updated_at;

-- Insert sample global gold prices
INSERT INTO global_gold_prices (market, price_usd_per_gram, change_percent, updated_at)
VALUES 
  ('Turkey', 67.50, 0.8, now()),
  ('UAE', 68.20, 0.9, now()),
  ('London', 69.15, 1.0, now())
ON CONFLICT (market) DO UPDATE
SET 
  price_usd_per_gram = EXCLUDED.price_usd_per_gram,
  change_percent = EXCLUDED.change_percent,
  updated_at = EXCLUDED.updated_at;

-- Insert sample news articles
INSERT INTO news_articles (title, summary, category, source, published_at)
VALUES 
  (
    'Gold Prices Rise Amid Global Uncertainty',
    'International gold prices reached new highs this week as investors seek safe-haven assets.',
    'gold',
    'Market Watch',
    now() - interval '2 hours'
  ),
  (
    'Libyan Dinar Strengthens Against Dollar',
    'The parallel market rate for USD/LYD improved slightly as foreign currency reserves increased.',
    'currency',
    'Economic Times',
    now() - interval '5 hours'
  ),
  (
    'New Gold Trading Regulations Announced',
    'The Central Bank announced new guidelines for precious metals trading to increase transparency.',
    'announcement',
    'Official Gazette',
    now() - interval '1 day'
  ),
  (
    'Turkey Gold Market Shows Strong Growth',
    'Turkish gold exports increased by 15% this quarter driven by regional demand.',
    'market',
    'Reuters',
    now() - interval '2 days'
  ),
  (
    'Silver Prices Expected to Rise',
    'Analysts predict silver prices will continue upward trend due to industrial demand.',
    'market',
    'Bloomberg',
    now() - interval '3 days'
  )
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE usd_rates IS 'USD exchange rates - parallel market vs official rate';
COMMENT ON TABLE local_gold_prices IS 'Local gold prices in Libya by karat (LYD per gram)';
COMMENT ON TABLE global_gold_prices IS 'International gold prices by market (USD per gram)';
