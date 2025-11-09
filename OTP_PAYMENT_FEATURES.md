# OTP, Payment Gateway, and Coupon Features

## Overview
Comprehensive implementation of SMS/OTP verification, payment gateway integration, coupon system, and cash deposit locations for the Gold Trading Platform.

## Database Schema

### 1. OTP Verifications (`otp_verifications`)
Stores SMS verification codes for secure transactions.

**Columns:**
- `id` (uuid) - Primary key
- `user_id` (uuid) - Foreign key to auth.users
- `phone_number` (text) - Recipient phone number
- `otp_code` (text) - 6-digit verification code
- `purpose` (text) - Purpose: 'wallet_funding', 'transfer', 'withdrawal'
- `verified` (boolean) - Verification status
- `expires_at` (timestamptz) - Expiration time (5 minutes)
- `attempts` (integer) - Failed attempt counter (max 3)
- `created_at` (timestamptz) - Creation timestamp
- `verified_at` (timestamptz) - Verification timestamp

**Security:**
- RLS enabled
- Users can only view/manage own OTP records
- Auto-expires after 5 minutes
- Maximum 3 verification attempts

### 2. Cash Deposit Locations (`cash_deposit_locations`)
Physical branches for cash deposits, withdrawals, and pickup.

**Columns:**
- `id` (uuid) - Primary key
- `name` (text) - Branch name
- `branch_code` (text unique) - Branch identifier
- `city` (text) - City name
- `address` (text) - Full address
- `phone` (text) - Contact phone
- `email` (text) - Contact email
- `working_hours` (text) - Operating hours
- `working_days` (text) - Operating days
- `latitude` (numeric) - GPS coordinate
- `longitude` (numeric) - GPS coordinate
- `services` (text[]) - Available services array
- `is_active` (boolean) - Active status

**Sample Locations:**
- Tripoli Main Branch (GTT-001)
- Benghazi Branch (GTB-001)
- Misrata Branch (GTM-001)
- Zawiya Branch (GTZ-001)
- Sabha Branch (GTS-001)

**Security:**
- RLS enabled
- Authenticated users can view active locations
- Public read for active branches

### 3. Coupon Codes (`coupon_codes`)
Promotional discount system.

**Columns:**
- `id` (uuid) - Primary key
- `code` (text unique) - Coupon code (e.g., "WELCOME2024")
- `description` (text) - Description
- `discount_type` (text) - 'fixed' or 'percentage'
- `discount_value` (numeric) - Discount amount/percentage
- `max_discount_amount` (numeric) - Maximum discount cap
- `min_purchase_amount` (numeric) - Minimum purchase requirement
- `currency` (text) - Currency (default: LYD)
- `usage_limit` (integer) - Total usage limit
- `usage_count` (integer) - Current usage count
- `valid_from` (timestamptz) - Start date
- `valid_until` (timestamptz) - End date
- `is_active` (boolean) - Active status
- `allowed_payment_methods` (text[]) - Allowed payment types

**Sample Coupons:**
- WELCOME2024 - 10% off (max 100 LYD)
- GOLD50 - 50 LYD off
- NEWUSER100 - 100 LYD bonus
- RAMADAN2024 - 15% off (max 200 LYD)

**Security:**
- RLS enabled
- Users can view active, valid coupons only
- Usage tracking prevents multiple redemptions

### 4. Coupon Usage (`coupon_usage`)
Tracks coupon redemptions.

**Columns:**
- `id` (uuid) - Primary key
- `coupon_code_id` (uuid) - Foreign key to coupon_codes
- `user_id` (uuid) - Foreign key to auth.users
- `transaction_id` (text) - Transaction reference
- `discount_amount` (numeric) - Applied discount
- `original_amount` (numeric) - Original amount
- `final_amount` (numeric) - Final amount after discount
- `currency` (text) - Currency
- `used_at` (timestamptz) - Usage timestamp

**Security:**
- RLS enabled
- Users can only view own usage history
- Unique constraint prevents duplicate usage

### 5. Payment Gateways (`payment_gateways`)
Payment provider configurations.

**Columns:**
- `id` (uuid) - Primary key
- `name` (text) - Gateway name
- `gateway_type` (text) - Type: 'card', 'mobile_money', 'bank_transfer'
- `provider` (text) - Provider name
- `currencies` (text[]) - Supported currencies
- `supported_cards` (text[]) - Supported card types
- `min_amount` (numeric) - Minimum transaction
- `max_amount` (numeric) - Maximum transaction
- `commission_type` (text) - 'fixed' or 'percentage'
- `commission_value` (numeric) - Commission amount
- `is_active` (boolean) - Active status
- `api_endpoint` (text) - API URL
- `webhook_url` (text) - Webhook URL

**Sample Gateways:**
- Libyan Card Payment (Sadad) - 2.5% commission
- Moamalat Card Gateway - 2% commission
- Libyan Post Payment (Tahweel) - 5 LYD fixed
- Tadawul Mobile Money - 1.5% commission
- Bank Transfer (Jumhouria) - Free

### 6. Payment Transactions (`payment_transactions`)
Transaction tracking for payments.

**Columns:**
- `id` (uuid) - Primary key
- `user_id` (uuid) - Foreign key to auth.users
- `gateway_id` (uuid) - Foreign key to payment_gateways
- `transaction_reference` (text unique) - Internal reference
- `external_reference` (text) - Gateway reference
- `amount` (numeric) - Transaction amount
- `currency` (text) - Currency
- `status` (text) - Status: pending, processing, completed, failed, cancelled, refunded
- `payment_method` (text) - Payment method used
- `wallet_type` (text) - Target wallet
- `metadata` (jsonb) - Additional data
- `error_message` (text) - Error details
- `created_at` (timestamptz) - Creation time
- `updated_at` (timestamptz) - Update time
- `completed_at` (timestamptz) - Completion time

## Service Layer

### OTP Service (`src/services/otp.service.ts`)

**Methods:**

#### `generateOTP(userId, phoneNumber, purpose)`
Generates and stores a 6-digit OTP code.
- Expires in 5 minutes
- Purpose: 'wallet_funding', 'transfer', 'withdrawal'
- Returns: OTP code string

#### `verifyOTP(userId, otpCode, purpose)`
Verifies the OTP code.
- Checks expiration
- Validates purpose
- Increments attempt counter
- Max 3 attempts allowed
- Returns: boolean

#### `sendOTPViaSMS(phoneNumber, otpCode)`
Sends SMS with OTP code.
- Currently logs to console (demo mode)
- Ready for SMS gateway integration

**Usage Example:**
```typescript
// Generate OTP
const otp = await otpService.generateOTP(userId, '+218925551234', 'wallet_funding');
await otpService.sendOTPViaSMS('+218925551234', otp);

// Verify OTP
const isValid = await otpService.verifyOTP(userId, '123456', 'wallet_funding');
```

### Coupon Service (`src/services/coupon.service.ts`)

**Methods:**

#### `validateCoupon(code, amount, currency)`
Validates coupon and calculates discount.
- Checks expiration
- Validates minimum purchase
- Calculates discount (fixed or percentage)
- Applies maximum discount cap
- Returns: `{ valid, error?, discount_amount?, final_amount? }`

#### `applyCoupon(userId, code, transactionId, originalAmount, discountAmount, finalAmount, currency)`
Records coupon usage.
- Creates usage record
- Increments usage counter
- Prevents duplicate usage

#### `getAvailableCoupons()`
Retrieves active, valid coupons.
- Only returns unexpired coupons
- Sorted by discount value

**Usage Example:**
```typescript
// Validate coupon
const result = await couponService.validateCoupon('WELCOME2024', 500, 'LYD');
if (result.valid) {
  console.log(`Discount: ${result.discount_amount} LYD`);
  console.log(`Final: ${result.final_amount} LYD`);
}

// Apply coupon
await couponService.applyCoupon(userId, 'WELCOME2024', txId, 500, 50, 450, 'LYD');
```

### Location Service (`src/services/location.service.ts`)

**Methods:**

#### `getAllLocations()`
Retrieves all active cash deposit locations.

#### `getLocationsByCity(city)`
Filters locations by city.

#### `getLocationsByService(service)`
Filters locations by service type (deposit, withdrawal, pickup).

#### `getCities()`
Gets list of unique cities with locations.

**Usage Example:**
```typescript
// Get all locations
const locations = await locationService.getAllLocations();

// Get locations in Tripoli
const tripoliLocations = await locationService.getLocationsByCity('Tripoli');

// Get deposit-enabled locations
const depositLocations = await locationService.getLocationsByService('deposit');
```

## Integration with Fund Wallet Pages

### Enhanced Features

1. **OTP Verification Flow:**
   - User enters amount
   - System generates OTP
   - OTP sent via SMS
   - User enters received code
   - System verifies before processing

2. **Coupon Support:**
   - Input field for coupon code
   - Real-time validation
   - Discount calculation display
   - Applied to final amount

3. **Cash Deposit Locations:**
   - Interactive location list
   - Filterable by city
   - Display working hours
   - Contact information
   - Map placeholder (ready for integration)

4. **Payment Gateway Selection:**
   - List of available gateways
   - Commission display
   - Supported cards shown
   - Min/max amount validation

## Security Features

### OTP Security
- ✅ 5-minute expiration
- ✅ Maximum 3 attempts
- ✅ One-time use
- ✅ Purpose-specific validation
- ✅ User-scoped access

### Coupon Security
- ✅ Unique code per coupon
- ✅ Usage limit enforcement
- ✅ Expiration date validation
- ✅ Minimum purchase requirement
- ✅ Anti-fraud duplicate prevention

### Data Privacy
- ✅ RLS policies on all tables
- ✅ User can only access own data
- ✅ Secure phone number storage
- ✅ Transaction isolation

## Testing Checklist

### OTP Verification
- [x] Generate OTP creates 6-digit code
- [x] OTP expires after 5 minutes
- [x] Failed attempts increment counter
- [x] Max 3 attempts enforced
- [x] Verified OTP cannot be reused
- [x] Purpose validation works

### Coupon System
- [x] Valid coupon applies discount
- [x] Fixed discount calculates correctly
- [x] Percentage discount calculates correctly
- [x] Maximum discount cap enforced
- [x] Minimum purchase validated
- [x] Expired coupons rejected
- [x] Usage limit enforced
- [x] Duplicate usage prevented

### Cash Locations
- [x] All locations retrieved
- [x] City filtering works
- [x] Service filtering works
- [x] Inactive locations hidden
- [x] Contact info displayed

### Payment Gateways
- [x] Active gateways listed
- [x] Commission calculated
- [x] Card types displayed
- [x] Amount limits validated

## Future Enhancements

### SMS Integration
1. Integrate with Libyan SMS gateway (Libyana, Almadar)
2. Add SMS delivery confirmation
3. Track SMS costs
4. Implement backup delivery methods

### Payment Gateway Integration
1. Sadad API integration
2. Moamalat payment flow
3. Libyan Post Tahweel integration
4. Webhook handlers for callbacks
5. 3D Secure support
6. Payment status tracking

### Coupon Enhancements
1. User-specific coupons
2. First-time user bonuses
3. Referral rewards
4. Bulk coupon generation
5. A/B testing support
6. Analytics dashboard

### Location Features
1. Interactive map with Google Maps/OpenStreetMap
2. Distance calculation
3. Navigation integration
4. Real-time availability status
5. Appointment booking
6. Queue management

### OTP Improvements
1. Fallback to email OTP
2. Voice call OTP
3. Biometric verification option
4. Remember device feature
5. Risk-based authentication
6. Rate limiting per phone number

## Usage Documentation

### For Developers

**To add OTP to a transaction flow:**
```typescript
import { otpService } from '../services/otp.service';

// 1. Generate and send OTP
const otp = await otpService.generateOTP(
  userId,
  userPhone,
  'wallet_funding'
);
await otpService.sendOTPViaSMS(userPhone, otp);

// 2. User enters OTP in UI

// 3. Verify OTP before processing
const isValid = await otpService.verifyOTP(
  userId,
  enteredOTP,
  'wallet_funding'
);

if (!isValid) {
  throw new Error('Invalid or expired OTP');
}

// 4. Process transaction
```

**To validate and apply coupon:**
```typescript
import { couponService } from '../services/coupon.service';

// 1. User enters coupon code
const validation = await couponService.validateCoupon(
  couponCode,
  amount,
  'LYD'
);

if (!validation.valid) {
  alert(validation.error);
  return;
}

// 2. Show discount to user
console.log(`Discount: ${validation.discount_amount} LYD`);
console.log(`You pay: ${validation.final_amount} LYD`);

// 3. After successful payment, record usage
await couponService.applyCoupon(
  userId,
  couponCode,
  transactionId,
  amount,
  validation.discount_amount,
  validation.final_amount,
  'LYD'
);
```

## Migration Status

All database tables and security policies have been successfully created:
- ✅ `otp_verifications` table with RLS
- ✅ `cash_deposit_locations` table with RLS
- ✅ `coupon_codes` table with RLS
- ✅ `coupon_usage` table with RLS
- ✅ `payment_gateways` table with RLS
- ✅ `payment_transactions` table with RLS
- ✅ Sample data inserted for testing
- ✅ All services implemented and tested
- ✅ Build successful

## Support

For questions or issues related to these features:
1. Check service method documentation
2. Review database schema
3. Test with sample data provided
4. Verify RLS policies are correct
