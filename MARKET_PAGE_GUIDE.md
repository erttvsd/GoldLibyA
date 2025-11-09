# Market (Store) Page - Gold Trading Application

## Overview
The Market page is a complete e-commerce experience for buying gold and silver, both digital and physical. It includes product browsing, filtering, store selection, payment processing, and invoice generation, all integrated with the Supabase database.

## Features

### 1. Search Functionality
- **Search bar**: Filter products by name or weight
- **Real-time filtering**: Results update as user types
- **Case-insensitive**: Matches partial strings
- **Data Source**: `products` table

### 2. Filter Options
Three filter buttons:
- **All**: Shows all products (default)
- **Gold**: Gold products only
- **Silver**: Silver products only
- **Visual feedback**: Active filter highlighted

### 3. Digital Products Section

**Two cards for instant digital purchases**:
- "Buy Digital Gold" - at current market price
- "Buy Digital Silver" - at current market price

**Features**:
- Shows live price per gram from `live_prices` table
- Clicking opens purchase modal directly
- No store selection needed (digital assets)
- Adjustable gram quantity

**Flow**: Click → PurchaseFlowModal (no store selection)

### 4. Physical Products List

**Product Cards display**:
- Product image (or placeholder)
- Name and karat (24K, 22K, 21K, 999 for silver)
- Weight in grams
- Price in LYD
- Stock status (aggregated across all stores)
- Buy button (disabled if out of stock)

**Data Sources**:
- `products` table - Product details
- `inventory` table - Stock levels per store
- Aggregated stock = sum across all stores

**Stock Display**:
- "In Stock: X" (green badge) - when available
- "Out of Stock" (red badge) - when quantity = 0

### 5. Store Availability Modal

**Opens when**: User clicks Buy on physical product with multiple stores in stock

**Displays**:
- Product name and specs
- List of stores with available stock
- Store details: name, city, address
- Stock quantity at each store
- Clickable cards to select store

**Flow**: Select Store → PurchaseFlowModal

### 6. Purchase Flow Modal

**2-Step Wizard**:

#### Step 1: Product & Payment Selection

**Product Info**:
- Product name and karat
- Pickup location (for physical)
- Gram input (for digital purchases only)
- Fixed weight display (for physical)

**Payment Method Options**:
1. **Dinar Wallet** (LYD balance)
2. **Dollar Wallet** (USD balance)
3. **Coupon** (promotional codes)
4. **Cash on Pickup** (physical only, disabled for digital)

**Business Rules**:
- Digital purchases: Cash option disabled
- Physical purchases: All options available
- Commission: 1.5% on physical, 0% on digital

**Price Breakdown**:
- Subtotal: Base price × quantity
- Commission: 1.5% (physical only)
- Total: Subtotal + Commission

#### Step 2: Security Verification (non-cash payments)

**Required for**: Wallet payments and coupons
**Not required for**: Cash on pickup

**Fields**:
- Password input
- SMS verification code (6 digits)
- Mock implementation (any values accepted after delay)

**Validation**:
- Password must be filled
- SMS code must be 6 digits
- Confirm button disabled until valid

### 7. Purchase Processing

**When user confirms purchase**:

1. **Validate payment** (simulate 1.5s delay)
2. **Deduct from wallet** (if wallet payment)
   - Update `wallets` table balance
3. **Update digital balance** (if digital purchase)
   - Add grams to `digital_balances` table
4. **Create purchase invoice**
   - Insert into `purchase_invoices` table
   - Generate unique invoice number
5. **Create asset record** (if physical)
   - Insert into `owned_assets` table
   - Generate serial number
   - Set pickup deadline (3 days from now)
   - Status: 'not_received'
6. **Record transaction**
   - Insert into `transactions` table
   - Type: 'purchase'
   - Description with item details
7. **Navigate to invoice page**
   - Pass invoice ID
   - Mark as new purchase

## Invoice Page

### Header
- Success message (if new purchase)
- Invoice title and number

### Invoice Details Card
- **Date**: Purchase timestamp
- **Seller**: Store name or "Gold Trading App"
- **Buyer**: User's full name
- **Pickup Location**: Store city and address (physical only)

### Item Details Card

**Digital Purchases**:
- Type: "Digital Gold/Silver"
- Quantity: Grams with 3 decimal places
- Unit Price: Price per gram
- Shared Bar SN: Ledger reference number

**Physical Purchases**:
- Product: Name and specs
- Weight: Fixed weight in grams
- Serial Number: Unique asset identifier (monospace font)

### Payment Summary Card
- Subtotal
- Commission (if applicable)
- Payment Method (user-friendly name)
- **Total Paid** (highlighted in yellow)

### Important Notices (Physical Only)

**Pickup Deadline Warning**:
- Yellow alert box with warning icon
- Days remaining until deadline
- Storage fee information (30 LYD/day after grace period)
- Exact deadline date

**Grace Period**: 3 days
**Storage Fee**: 30 LYD per day after grace period

### Action Buttons

1. **Download PDF** (outline button)
   - Mock function (not implemented)
   - For all purchases

2. **Book Pickup** (primary button)
   - Only for physical purchases
   - Navigates to appointment booking
   - Passes asset ID

3. **Close** (secondary button)
   - Returns to market page
   - Only shows when invoice opened as modal

## Database Integration

### Tables Used

1. **products**
   - Product catalog
   - Prices, weights, specs

2. **stores**
   - Pickup locations
   - Store details

3. **inventory**
   - Stock levels per store/product
   - Updated on purchase (future)

4. **live_prices**
   - Current market rates
   - Gold and silver per gram

5. **wallets**
   - User balances (LYD, USD)
   - Deducted on purchase

6. **digital_balances**
   - User's digital holdings
   - Increased on digital purchase

7. **owned_assets**
   - Physical assets owned
   - Serial numbers, status

8. **purchase_invoices**
   - Purchase records
   - Invoice details

9. **transactions**
   - Transaction history
   - For wallet ledger

### Data Flow

**Digital Purchase**:
```
1. User selects grams
2. Choose payment method
3. Verify (if not cash)
4. Deduct from wallet
5. Add to digital_balances
6. Create invoice (is_digital=true)
7. Create transaction record
8. Show invoice
```

**Physical Purchase**:
```
1. Select product
2. Choose store (if multiple)
3. Choose payment method
4. Verify (if not cash)
5. Deduct from wallet (if not cash)
6. Create owned_asset (status='not_received')
7. Set pickup deadline (+3 days)
8. Create invoice with asset_id
9. Create transaction record
10. Show invoice with deadline warning
```

## Business Rules

### Pricing
- Physical: Fixed price from product catalog
- Digital: Live price per gram
- Commission: 1.5% on physical only

### Payment
- Cash: Only for physical purchases
- Wallets: Check sufficient balance (future)
- Coupon: Validate code (future)

### Stock Management
- Aggregated across all stores
- No stock reservation (race conditions possible)
- Inventory decrement on purchase (future)

### Pickup Rules
- 3-day grace period
- 30 LYD/day storage fee after deadline
- Must book appointment
- Status changes on pickup

## Testing

### Test Digital Purchase
1. Click "Buy" on Digital Gold/Silver
2. Enter grams (e.g., 5.5)
3. Select Dinar Wallet
4. Enter any password
5. Enter 6-digit code (e.g., 123456)
6. Confirm purchase
7. See success message and invoice
8. Check digital balance increased

### Test Physical Purchase
1. Click "Buy" on any product in stock
2. Select store (if multiple)
3. Select payment method
4. Verify identity
5. Confirm purchase
6. See invoice with deadline warning
7. Check transaction in history

### Test Search & Filter
1. Type product name or weight
2. Results filter in real-time
3. Click filter buttons
4. Only matching products shown

### Test Out of Stock
1. Find product with 0 stock
2. Buy button should be disabled
3. "Out of Stock" badge shown

## Performance Considerations

### Optimizations
- Parallel data loading
- Efficient inventory aggregation
- Minimal re-renders
- Optimistic UI updates (future)

### Future Improvements
1. Stock reservation system
2. Real-time inventory updates
3. Multiple payment gateways
4. QR code scanning
5. Barcode generation for invoices
6. Push notifications for deadlines
7. Automatic pickup reminders

## Error Handling

### Current
- Console logging
- Generic error messages
- No recovery mechanisms

### Recommended
1. Validation before submission
2. Balance checking
3. Stock verification
4. Transaction rollback on failure
5. User-friendly error messages
6. Retry mechanisms
7. Offline support

## Security

### Implemented
- RLS on all database tables
- User can only see own purchases
- Payment verification step

### TODO
1. Real SMS verification
2. Payment gateway integration
3. Rate limiting
4. Fraud detection
5. Secure coupon codes
6. Audit logging

## Related Files
- `/src/pages/MarketPage.tsx` - Main market component
- `/src/pages/InvoicePage.tsx` - Invoice display
- `/src/services/market.service.ts` - Product & price data
- `/src/services/asset.service.ts` - Purchase & asset creation
- `/src/services/wallet.service.ts` - Balance management
- `/src/components/ui/Modal.tsx` - Reusable modal
- `/src/utils/format.ts` - Formatting helpers
