export type Currency = 'LYD' | 'USD';
export type MetalType = 'gold' | 'silver';
export type AssetStatus = 'not_received' | 'received' | 'transferred';
export type TransferStatus = 'pending' | 'completed' | 'manual_review' | 'rejected';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type TransactionType = 'deposit' | 'withdrawal' | 'purchase' | 'transfer_in' | 'transfer_out';
export type PaymentMethod = 'wallet_dinar' | 'wallet_dollar' | 'cash' | 'coupon';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  national_id?: string;
  address?: string;
  account_type?: 'individual' | 'store';
  created_at: string;
  updated_at: string;
}

export interface KYCDetails {
  id: string;
  user_id: string;
  place_of_birth?: string;
  nationality?: string;
  marital_status?: string;
  employment_status?: string;
  income_source?: string;
  account_purpose?: string;
  expected_monthly_volume?: string;
  id_front_url?: string;
  id_back_url?: string;
  selfie_url?: string;
  verification_status: VerificationStatus;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: Currency;
  balance: number;
  available_balance: number;
  held_balance: number;
  created_at: string;
  updated_at: string;
}

export interface DigitalBalance {
  id: string;
  user_id: string;
  metal_type: MetalType;
  grams: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  type: MetalType;
  carat: number;
  weight_grams: number;
  base_price_lyd: number;
  image_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  map_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Inventory {
  id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
}

export interface XRFAnalysis {
  gold?: string;
  silver?: string;
  copper?: string;
  zinc?: string;
  nickel?: string;
  image?: string;
}

export interface PhysicalProperties {
  dimensions: string;
  shape: string;
}

export interface OwnedAsset {
  id: string;
  user_id: string;
  product_id: string;
  serial_number: string;
  status: AssetStatus;
  pickup_store_id?: string;
  pickup_deadline?: string;
  manufacture_date?: string;
  origin?: string;
  packaging?: string;
  qr_code_url?: string;
  xrf_analysis?: XRFAnalysis;
  physical_properties?: PhysicalProperties;
  is_digital: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
  store?: Store;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  user_id: string;
  asset_id?: string;
  store_id?: string;
  amount_lyd: number;
  commission_lyd: number;
  payment_method: PaymentMethod;
  is_digital: boolean;
  digital_metal_type?: MetalType;
  digital_grams?: number;
  shared_bar_serial?: string;
  created_at: string;
  asset?: OwnedAsset;
  store?: Store;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description?: string;
  reference_id?: string;
  created_at: string;
}

export interface AssetTransfer {
  id: string;
  asset_id: string;
  from_user_id: string;
  to_user_id: string;
  status: TransferStatus;
  risk_score?: number;
  transaction_hash?: string;
  created_at: string;
  completed_at?: string;
}

export interface DigitalTransfer {
  id: string;
  from_user_id: string;
  to_user_id: string;
  metal_type: MetalType;
  grams: number;
  shared_bar_serial: string;
  transaction_id: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  asset_id?: string;
  store_id: string;
  appointment_date: string;
  status: AppointmentStatus;
  booking_id: string;
  created_at: string;
  store?: Store;
  asset?: OwnedAsset;
}

export interface LivePrice {
  metal_type: MetalType;
  price_lyd_per_gram: number;
  change_percent: number;
  updated_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  category: 'market' | 'gold' | 'currency' | 'economy' | 'announcement';
  source?: string;
  published_at: string;
}

export interface USDRate {
  id: string;
  rate_type: 'parallel' | 'official';
  rate_lyd: number;
  change_percent: number;
  updated_at: string;
}

export interface LocalGoldPrice {
  id: string;
  karat: number;
  price_lyd_per_gram: number;
  change_percent: number;
  updated_at: string;
}

export interface GlobalGoldPrice {
  id: string;
  market: string;
  price_usd_per_gram: number;
  change_percent: number;
  updated_at: string;
}
