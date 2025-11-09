# Store Console System Documentation

## Overview

The Store Console enables authorized store staff to serve customers end-to-end through a comprehensive point-of-sale and customer management system.

## Store Roles

### Owner
- Full access to all store operations
- Staff management (assign/remove staff)
- Device management
- Settings configuration
- Approve high-value transactions

### Manager
- All operational functions (handover, POS, returns)
- Approve location change requests
- View reports and analytics
- Approve high-value transactions
- Cannot modify staff or system settings

### Clerk
- Point of Sale operations
- Process appointments and pickups
- Add customer notes
- Create return requests (cannot approve)
- Basic customer messaging

### Vault
- Receive stock transfers
- Process handovers
- Asset transfers
- Cycle counts and inventory audits

### Support
- Customer messaging
- View and add customer notes
- Create announcements
- Cannot process handovers or sales

### Auditor
- Read-only access to all data
- Export capabilities
- View all reports
- Cannot perform operational actions

## Setup

### 1. Assign User to Store

To give a user access to the store console:

```sql
-- First, ensure the store exists
SELECT * FROM stores WHERE name = 'دار السكة';

-- Assign user to store
INSERT INTO store_users (store_id, user_id, role, can_approve_high_value, is_active)
VALUES (
  '<store_id>',
  '<user_id>',
  'clerk', -- or 'owner', 'manager', 'vault', 'auditor', 'support'
  false, -- set true for owners/managers
  true
);
```

### 2. Set Profile Account Type

For the bottom navigation to show the Store Console:

```sql
UPDATE profiles
SET account_type = 'store'
WHERE id = '<user_id>';
```

## Features

### Customer Desk
- **Search**: Find customers by name, email, or phone
- **Profile View**: Limited PII exposure (name, contact, KYC status)
- **Notes**: Add internal notes for customer history
- **Flags**: View customer flags (high_value, watchlist, blocked, etc.)

**Access**: All roles

### Appointments & Handover
- **Scan QR Code**: Verify appointment QR and PIN
- **Customer Verification**: View customer and asset details
- **Collect Fees**: Storage fees with multiple payment methods
- **Complete Handover**: Update asset status to "received"
- **Receipt**: Generate pickup receipt

**Access**: Owner, Manager, Clerk, Vault

**Process**:
1. Customer presents appointment QR code
2. Staff scans/enters QR code
3. System verifies PIN matches
4. Staff reviews customer ID
5. Collect storage fee if applicable
6. Capture signatures/photos
7. Complete handover
8. Asset status updated to "received"

### Point of Sale (POS)
- **Product Selection**: Browse store inventory
- **Cart Management**: Add/remove items with quantities
- **Coupon Application**: Apply store coupons (percent/fixed discount)
- **Payment Methods**: Cash, Card, Wallet (LYD/USD), Bank Transfer
- **Receipt**: Generate sales receipt
- **Stock Updates**: Automatic inventory deduction

**Access**: Owner, Manager, Clerk

**Sales Flow**:
1. Build cart from inventory
2. Apply coupon if provided
3. Calculate totals (subtotal, discount, tax, total)
4. Select payment method
5. Process payment
6. Update inventory
7. Record cash movement (if cash payment)
8. Generate receipt

### Returns & Exchanges
- **Create Request**: Customer initiates return
- **Inspection**: Staff inspects item and documents condition
- **Actions**:
  - Approve: Accept return
  - Reject: Decline return
  - Restock: Add back to inventory
  - Scrap: Mark as damaged/unsellable
  - Refund: Issue monetary refund

**Access**:
- Create: Clerk, Manager, Owner
- Approve/Process: Manager, Owner

### Cash Drawer Management
- **Open Drawer**: Record opening balance at shift start
- **Movements**: Track all cash in/out during shift
- **Close Drawer**: Record closing balance and calculate variance
- **Z-Report**: Daily closing report with totals

**Access**: Owner, Manager, Clerk

### Inventory Management
- **View Stock**: See all products with quantities
- **Add Products**: Create new products and set quantities
- **Stock Movements**: Track all inventory changes
- **Low Stock Alerts**: Monitor inventory levels

**Access**: All roles (view), Owner/Manager (modify)

### Reports & Analytics
- **Dashboard**: Today's appointments, sales, revenue
- **Sales Report**: Transaction history with filters
- **Handover Report**: Completed pickups
- **Cash Report**: Cash movements and balance
- **Exceptions**: Flagged transactions or discrepancies

**Access**: All roles

## Security Features

### Row-Level Security (RLS)
- All tables enforce store-scoped access via `is_store_user()` function
- Users can only access data for stores they're assigned to
- Cross-store data leakage prevented at database level

### Secure RPCs
- All operations use `SECURITY DEFINER` functions
- Search path locked to `public, pg_temp`
- User membership validated before any operation
- Audit trails maintained for critical actions

### PII Protection
- Customer search returns minimal information
- Full customer data only accessible via secure RPCs
- Sensitive fields hidden from UI
- Staff cannot export full customer databases

### Two-Person Rule
High-value transactions (configurable threshold) require:
1. Primary staff initiates transaction
2. Manager/Owner approves
3. Both actions logged with timestamps

### Audit Trail
All critical operations logged:
- Handovers: who, when, amount, photos
- POS Sales: clerk, items, payment method
- Returns: inspector, action, refund amount
- Cash Movements: clerk, type, amount

## API Usage

### TypeScript Service Layer

```typescript
import { storeService } from './services/store.service';

// Search customer
const { data: customers } = await storeService.searchCustomer(storeId, 'john@example.com');

// Process handover
const { data: handoverId } = await storeService.handoverAsset(
  storeId,
  appointmentId,
  '1234', // PIN
  50, // storage fee
  'cash',
  'Customer verified with national ID'
);

// Create POS sale
const { data: saleId } = await storeService.posSale(storeId, {
  items: [
    { product_id: 'xxx', quantity: 2, unit_price: 100 }
  ],
  payment_method: 'cash'
});

// Get dashboard stats
const { data: stats } = await storeService.getDashboardStats(storeId);
```

## Database Schema

### Core Tables

**store_users**: Staff assignments
- `store_id`: Which store
- `user_id`: Which user
- `role`: Staff role (enum)
- `can_approve_high_value`: Approval permission
- `is_active`: Currently active

**store_customer_notes**: Internal notes
- `store_id`: Store scope
- `user_id`: Customer
- `author_id`: Who wrote the note
- `body`: Note content
- `is_internal`: Not visible to customer

**pos_sales**: Point of sale transactions
- `store_id`: Store
- `sale_number`: Unique identifier
- `clerk_id`: Who processed
- `total_lyd`: Final amount
- `status`: completed/cancelled/refunded

**asset_handovers**: Pickup completions
- `appointment_id`: Related appointment
- `asset_id`: Which asset
- `storage_fee_lyd`: Fee collected
- `id_photo_url`, `customer_photo_url`: Verification photos

**store_cash_movements**: Cash drawer tracking
- `movement_type`: open/close/sale/refund/deposit/withdrawal
- `amount_lyd`: Amount (positive or negative)
- `reference_id`, `reference_type`: What caused this movement

## Troubleshooting

### User Cannot Access Store Console

1. Check store_users assignment:
```sql
SELECT * FROM store_users WHERE user_id = '<user_id>';
```

2. Check profile account_type:
```sql
SELECT account_type FROM profiles WHERE id = '<user_id>';
```

3. Verify store is active:
```sql
SELECT * FROM stores WHERE id = '<store_id>';
```

### Handover Fails

- Verify appointment status is 'confirmed' or 'pending'
- Check PIN matches `verification_pin` in pickup_appointments
- Ensure appointment's location_id matches store's location_id
- Confirm user is a store_user for that store

### POS Sale Stock Issues

- Check inventory quantity before sale
- Verify product_id exists in products table
- Ensure inventory record exists for store_id + product_id
- Review stock_movements for audit trail

## Best Practices

1. **Daily Cash Drawer**: Open at shift start, close at shift end
2. **Customer Verification**: Always verify ID for handovers
3. **Photo Evidence**: Capture ID and customer photos for all pickups
4. **Notes**: Document any unusual circumstances
5. **High-Value**: Follow two-person rule for large transactions
6. **End of Day**: Run Z-report and verify cash matches system
7. **Inventory Counts**: Regular cycle counts to maintain accuracy

## Support

For technical issues or questions:
- Check logs in Supabase dashboard
- Review RLS policies if permission errors
- Verify store_users assignments
- Check RPCs are deployed correctly

## Version History

- v1.0.0: Initial store console release
  - Customer desk
  - Appointments & handover
  - Point of sale
  - Cash management
  - Basic reports
