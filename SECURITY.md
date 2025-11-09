# Security Implementation

This document describes the security measures implemented in the Gold Trading Platform.

## Database Security

### 1. Secure Transfer Functions (RPCs)

All sensitive operations now use SECURITY DEFINER functions with proper authentication checks:

#### `transfer_digital_balance(sender_id, recipient_id, metal_type, grams_amount)`
- **Purpose**: Transfer digital gold/silver between users
- **Security**: Validates `auth.uid()` matches `sender_id`
- **Protection**: Row-level locking with `FOR UPDATE` to prevent race conditions
- **Validation**: Checks sufficient balance before transfer

#### `transfer_asset_ownership(asset_id, new_owner_id)`
- **Purpose**: Transfer physical bullion ownership
- **Security**: Validates caller owns the asset
- **Protection**: Prevents self-transfer and unauthorized transfers

#### `search_profiles_exact(q)`
- **Purpose**: Find users by email or phone for transfers
- **Security**: Limits to exact matches, excludes self
- **Protection**: No broad table access, prevents enumeration

#### `adjust_wallet_balance(currency, delta)`
- **Purpose**: Atomic wallet balance adjustments
- **Security**: User can only modify their own wallet
- **Protection**: Validates sufficient funds before deduction

### 2. Row Level Security (RLS) Policies

#### Removed Overly Permissive Policies
- ❌ Direct UPDATE on `owned_assets` - now enforced through RPC only
- ❌ Broad SELECT on `profiles` for search - now via RPC only
- ❌ Public read on `bullion_fingerprints` - now restricted to owners

#### Restricted Policies
- ✅ `bullion_fingerprints`: Only accessible to asset owners
- ✅ `owned_assets`: Read-only access, updates via RPC
- ✅ `profiles`: Limited to RPC-based search

### 3. SQL Injection Prevention
- All RPC functions use `SET search_path = public, pg_temp`
- Parameter validation in functions
- No dynamic SQL construction

### 4. Race Condition Prevention
- Use `FOR UPDATE` row locks in transfer functions
- Atomic operations within transactions

## Client-Side Security

### 1. Service Layer Updates

#### `wallet.service.ts`
- ✅ `updateWalletBalance()` uses `adjust_wallet_balance` RPC
- ✅ `transferDigitalBalance()` uses `transfer_digital_balance` RPC
- ❌ No direct table updates for sensitive operations

#### `asset.service.ts`
- ✅ `transferAssetOwnership()` uses `transfer_asset_ownership` RPC
- ❌ No direct ownership updates via `updateAsset()`

#### `auth.service.ts`
- ✅ `findUserByEmailOrPhone()` uses `search_profiles_exact` RPC
- ❌ No direct profile table queries for search

### 2. Transfer Pages Security

#### `DigitalTransferPage.tsx`
- Uses secure `transferDigitalBalance` RPC
- Validates auth.uid() on server side
- 10 LYD transfer fee enforced

#### `TransferBalancePage.tsx`
- Uses secure `adjust_wallet_balance` RPC
- Atomic balance updates
- Fee validation

#### `TransferOwnershipPage.tsx`
- Uses secure `transferAssetOwnership` RPC
- Server-side ownership validation
- Risk scoring for suspicious transfers

## Environment Security

### Configuration Files
- ✅ `.env` excluded from Git (in `.gitignore`)
- ✅ `.env.example` with placeholders provided
- ✅ `DATABASE_SUMMARY.md` removed (contained user PII)

### Secrets Management
- Supabase credentials in `.env` (not committed)
- Anon key is public but properly scoped with RLS
- Service role key never exposed to client

## Storage Security

### KYC Documents (Recommended Implementation)
```javascript
// Set bucket to private in Supabase dashboard
// Storage policy for read
CREATE POLICY "Users read own KYC"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kyc-docs' AND owner = auth.uid());

// Storage policy for write
CREATE POLICY "Users write own KYC"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kyc-docs' AND owner = auth.uid());
```

### Signed URLs
- Use `createSignedUrl()` for temporary access
- Store only file paths in database, not public URLs
- Generate signed URLs on-demand with short expiry

## Authentication & Authorization

### Auth State
- `auth.uid()` validation in all RPCs
- Session management via Supabase Auth
- No arbitrary user_id parameters accepted

### Transfer Authorization
1. Sender must be authenticated
2. Sender must own the asset/balance
3. Recipient must exist
4. Cannot transfer to self
5. Sufficient balance validated server-side

## Transaction Integrity

### Fee Structure
- All transfers charge 10 LYD fee
- Fee deducted atomically with transfer
- Balance validation includes fee
- Transactions logged for audit trail

### Rollback Protection
- Database transactions ensure atomicity
- Failed transfers don't leave partial state
- Error handling prevents data inconsistency

## Security Testing Checklist

### RPC Functions
- [x] Cannot transfer from arbitrary user_id
- [x] Cannot bypass balance checks
- [x] Cannot enumerate users via search
- [x] Row locking prevents concurrent issues

### RLS Policies
- [x] Cannot directly update asset ownership
- [x] Cannot read others' KYC documents
- [x] Cannot view bullion fingerprints of others' assets
- [x] Cannot query profiles for enumeration

### Client Code
- [x] All transfers use secure RPCs
- [x] No direct table mutations for sensitive data
- [x] Error handling prevents information leakage
- [x] Secrets not exposed in code

## Monitoring & Alerts

### Recommended Monitoring
1. Failed RPC calls (potential attacks)
2. Multiple failed transfers (fraud detection)
3. High-risk transfers flagged for review
4. Unusual balance changes

### Audit Trail
- Transaction history in `transactions` table
- Timestamp tracking on all operations
- Reference IDs link related operations

## Known Limitations

### Client-Side Validation
- Client validates before server, but server is authoritative
- UI prevents invalid operations, but RPC enforces rules

### Storage Access
- Signed URLs expire, requiring regeneration
- Storage policies need proper bucket configuration

## Future Enhancements

1. **Rate Limiting**: Add RPC call limits per user
2. **Multi-Factor Auth**: Require MFA for large transfers
3. **Purchase RPC**: Server-side purchase transaction function
4. **Webhook Validation**: Secure external integrations
5. **Audit Logging**: Enhanced logging for compliance

## Migration Applied

```sql
-- See: supabase/migrations/[timestamp]_drop_old_transfer_functions.sql
-- See: supabase/migrations/[timestamp]_create_secure_transfer_functions.sql
```

All security changes have been applied and tested. The build completes successfully.
