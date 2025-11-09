complete Store KYC → Store Creation Integration

## Overview

The Store KYC system is **fully integrated** with store creation. When a business KYC is approved, the system automatically:
1. Creates a physical store location
2. Creates the store entity
3. Links the store to the KYC owner
4. Assigns the user as store owner
5. Grants full store console access

## Complete User Flow

### For New Store Account

```
1. Registration
   ↓
2. Select "Store Account" type
   ↓
3. Redirected to Business KYC form
   ↓
4. Complete 4-step KYC:
   - Business Information
   - Address & Contact
   - Banking Details
   - Compliance
   ↓
5. Submit for Review (status: under_review)
   ↓
6. Compliance Team Reviews
   ↓
7. KYC Approved ✓
   ↓
8. **AUTOMATIC STORE CREATION** 🎉
   ↓
9. User assigned as Store Owner
   ↓
10. Store Console Access Granted
```

## Database Flow (Automatic)

When KYC status changes from any state → `approved`:

### Trigger: `store_kyc_approval_trigger`

**Executes Function:** `create_store_on_kyc_approval()`

**Steps Performed:**
1. Creates `cash_deposit_locations` entry:
   - Name: Business name
   - Address: Business address
   - Phone: Business phone
   - Working hours: Default 09:00-17:00
   - Branch code: From registration number

2. Creates `stores` entry:
   - Name: Business legal name or trade name
   - Links to location
   - Sets phone and email
   - Sets active status

3. Creates `store_profiles` entry:
   - Links user to store
   - Links user to location

4. Creates `store_users` entry:
   - Assigns user as 'owner'
   - Grants high-value approval permission
   - Sets active status

5. Updates `store_kyc_details`:
   - Adds store_id reference

6. Logs to `store_kyc_verification_log`:
   - Action: 'approved'
   - Notes: Store name and ID

## UI Experience

### Before KYC Approval:

**Profile Page:**
- Shows "Business KYC" option
- Status badge shows "Pending" or "Under Review"

**Store Console:**
- Not accessible
- Shows: "No store found. Please complete your Business KYC verification first..."

### After KYC Approval:

**Profile → Business KYC:**
- Status badge shows "Approved" (green)
- New card appears: "Store Created Successfully!"
- Shows store name and address
- Message: "You can now access the Store Console from the bottom navigation!"

**Bottom Navigation:**
- "Console" button appears (for store accounts)
- Replaces market/news/wallet buttons

**Store Console:**
- Full access granted
- Dashboard shows real-time stats
- All store features unlocked:
  - Customer Desk
  - Appointments & Handover
  - Point of Sale
  - Inventory Management
  - Reports

## Testing the Flow

### Option 1: Complete KYC Through UI

1. Create account, select "Store Account"
2. Fill out complete Business KYC form
3. Click "Submit for Review"
4. Run approval SQL (as admin):

```sql
UPDATE store_kyc_details
SET status = 'approved',
    reviewed_by = '<admin_user_id>',
    reviewed_at = now()
WHERE user_id = '<store_user_id>';
```

5. Refresh page - store appears!

### Option 2: Use Test Script

Run `TEST_KYC_APPROVAL.sql` which:
- Finds pending KYC
- Approves it
- Verifies store creation
- Shows all linked records

### Option 3: Create Test Data

```sql
-- 1. Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- 2. Create test KYC
INSERT INTO store_kyc_details (
  user_id, business_legal_name, business_type,
  registration_number, tax_id, registration_date,
  business_address, business_city, business_phone,
  business_email, industry_sector, business_description,
  source_of_funds, status
) VALUES (
  '<your_user_id>', 'My Gold Store', 'limited_liability',
  'REG-12345', 'TAX-12345', '2024-01-01',
  '123 Main St', 'Tripoli', '+218-91-123-4567',
  'store@example.com', 'Precious Metals', 'Gold trading',
  'business_operations', 'approved' -- Create as approved
);
```

## Verification Queries

### Check if store was created:
```sql
SELECT
  k.business_legal_name,
  k.status,
  s.name as store_name,
  l.address,
  su.role
FROM store_kyc_details k
LEFT JOIN stores s ON s.id = k.store_id
LEFT JOIN cash_deposit_locations l ON l.id = s.location_id
LEFT JOIN store_users su ON su.store_id = k.store_id AND su.user_id = k.user_id
WHERE k.user_id = '<user_id>';
```

### Check user's store access:
```sql
SELECT * FROM store_users WHERE user_id = '<user_id>';
```

### Get store details:
```sql
SELECT * FROM get_user_store('<user_id>');
```

## API Functions

### Check KYC Status:
```typescript
import { storeKycService } from './services/storeKyc.service';

const { approved, storeId, status } = await storeKycService.isKycApproved(userId);
if (approved && storeId) {
  // Redirect to store console
}
```

### Get User's Store:
```typescript
const { data: store } = await storeKycService.getUserStore(userId);
if (store) {
  console.log(`Store: ${store.store_name}`);
  console.log(`Location: ${store.location_name}`);
}
```

## Security Features

### RLS Enforcement:
- Users can only access their own KYC data
- Store data is scoped to store members
- Admin access requires special role

### Automatic Assignment:
- KYC owner becomes store owner automatically
- No manual assignment needed
- Cannot be bypassed

### Audit Trail:
- All KYC status changes logged
- Store creation logged
- Approval timestamps recorded
- Reviewer tracked

## Troubleshooting

### KYC Approved but No Store Created:

**Check 1:** Trigger exists?
```sql
SELECT * FROM pg_trigger WHERE tgname = 'store_kyc_approval_trigger';
```

**Check 2:** Function exists?
```sql
SELECT proname FROM pg_proc WHERE proname = 'create_store_on_kyc_approval';
```

**Check 3:** KYC has store_id?
```sql
SELECT store_id FROM store_kyc_details WHERE user_id = '<user_id>';
```

**Fix:** Re-run approval:
```sql
UPDATE store_kyc_details
SET status = 'pending'
WHERE user_id = '<user_id>';

-- Then approve again
UPDATE store_kyc_details
SET status = 'approved', reviewed_by = '<admin_id>', reviewed_at = now()
WHERE user_id = '<user_id>';
```

### Store Console Shows "No Store Found":

**Check 1:** User has store_users entry?
```sql
SELECT * FROM store_users WHERE user_id = '<user_id>';
```

**Check 2:** Store is active?
```sql
SELECT s.* FROM stores s
JOIN store_kyc_details k ON k.store_id = s.id
WHERE k.user_id = '<user_id>';
```

**Fix:** Manually assign if needed:
```sql
INSERT INTO store_users (store_id, user_id, role, is_active)
SELECT store_id, user_id, 'owner', true
FROM store_kyc_details
WHERE user_id = '<user_id>'
ON CONFLICT DO NOTHING;
```

### Profile Not Showing Store Options:

**Check:** account_type is set?
```sql
SELECT account_type FROM profiles WHERE id = '<user_id>';
```

**Fix:**
```sql
UPDATE profiles SET account_type = 'store' WHERE id = '<user_id>';
```

## Benefits of This Integration

✅ **Automated**: No manual store creation needed
✅ **Instant**: Store appears immediately after KYC approval
✅ **Secure**: Cannot bypass KYC requirements
✅ **Auditable**: Complete trail of store creation
✅ **Scalable**: Works for any number of stores
✅ **User-Friendly**: Clear status messages throughout
✅ **Compliant**: Enforces regulatory requirements
✅ **Linked**: KYC and store permanently connected

## Summary

The Store KYC → Store Creation integration ensures:
1. All stores have verified business information
2. Owners are properly identified and authorized
3. Regulatory compliance is maintained
4. Store access is automatic upon approval
5. No manual intervention required
6. Complete audit trail exists

Users simply complete KYC → compliance approves → store appears automatically! 🎉
