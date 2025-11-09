# Transaction Receipt System - Complete Guide

## Overview
The Gold Trading App features a comprehensive receipt/invoice system that generates detailed, professional receipts for all types of transactions. Every transaction produces a full-screen modal receipt with complete transaction details, payment information, and actionable buttons.

## Components

### TransactionReceipt Component
**Location**: `/src/components/invoice/TransactionReceipt.tsx`

A universal, full-featured receipt modal that handles all transaction types with a consistent, professional design.

### Receipt Service
**Location**: `/src/services/receipt.service.ts`

Helper functions to generate properly formatted receipt data for different transaction types.

## Supported Transaction Types

### 1. Digital Gold/Silver Purchase
**Type**: `digital_purchase`

Generated when users buy fractional (digital) gold or silver.

**Data Included**:
- Customer information (name, email)
- Digital balance (metal type, grams, price per gram)
- Payment summary (subtotal, no commission)
- Wallet balance before/after
- Transaction ID and TX Hash
- Special note: "No commission on digital purchases"

**Trigger**: After successful digital purchase in MarketPage

**Example**:
```typescript
const receipt = receiptService.generateDigitalPurchaseReceipt({
  userId: user.id,
  userName: "Ahmed Albibas",
  userEmail: "ahmed@example.com",
  metalType: 'gold',
  grams: 10.5,
  pricePerGram: 875,
  totalAmount: 9187.5,
  currency: 'LYD',
  walletBalanceBefore: 200000,
  walletBalanceAfter: 190812.5,
  transactionId: 'INV-1234567890-ABC'
});
```

---

### 2. Physical Gold/Silver Purchase
**Type**: `physical_purchase`

Generated when users buy physical bullion bars.

**Data Included**:
- Customer information
- Product details (name, type, weight, karat, serial number)
- Payment breakdown (subtotal, 1.5% commission, total)
- Wallet balance changes
- Pickup information (store, address, deadline)
- Warning about storage fees (30 LYD/day after 3 days)
- Transaction ID and TX Hash

**Trigger**: After successful physical purchase in MarketPage, viewable from InvoicePage

**Example**:
```typescript
const receipt = receiptService.generatePhysicalPurchaseReceipt({
  userId: user.id,
  userName: "Ahmed Albibas",
  product: {
    name: "24K Gold Bar 100g",
    type: 'gold',
    weight: 100,
    carat: 24,
    serialNumber: 'GB-995934'
  },
  basePrice: 87500,
  commission: 1312.5,
  totalAmount: 88812.5,
  currency: 'LYD',
  walletBalanceBefore: 200000,
  walletBalanceAfter: 111187.5,
  pickupStore: "Tripoli Main Branch",
  pickupAddress: "Tripoli, Martyrs' Square",
  pickupDeadline: "2025-10-27T10:30:00Z",
  transactionId: 'INV-1234567890-DEF'
});
```

---

### 3. Ownership Transfer (In-App)
**Type**: `ownership_transfer`

Generated when transferring a physical bar (not yet received) to another user.

**Data Included**:
- Sender information
- Recipient information (name, email, phone)
- Product details
- Status (success or pending for manual review)
- Risk score information (if flagged)
- Transaction ID and TX Hash
- No fees (free transfer)

**Trigger**: After successful transfer in TransferOwnershipPage

**Status Logic**:
- **Success**: Risk score < 0.8
- **Pending**: Risk score ≥ 0.8 (manual review required)

**Example**:
```typescript
const receipt = receiptService.generateOwnershipTransferReceipt({
  userId: user.id,
  userName: "Ahmed Albibas",
  recipientName: "Sarah Mahmoud",
  recipientEmail: "sarah@example.com",
  recipientPhone: "0925551234",
  product: {
    name: "24K Gold Bar 50g",
    type: 'gold',
    weight: 50,
    serialNumber: 'GB-995934'
  },
  transactionId: 'TRF-1234567890-GHI',
  riskScore: 0.3
});
```

---

### 4. Location Change
**Type**: `location_change`

Generated when changing the pickup location of a bar awaiting collection.

**Data Included**:
- Customer information
- Product details with both old and new serial numbers
- Location change (from store → to store)
- Location change fee (50 LYD)
- Wallet balance changes
- Note about new serial number assignment
- New 3-day pickup deadline
- Transaction ID and TX Hash

**Trigger**: After confirming location change in ChangeLocationModal

**Example**:
```typescript
const receipt = receiptService.generateLocationChangeReceipt({
  userId: user.id,
  userName: "Ahmed Albibas",
  product: {
    name: "999 Silver Bar 100g",
    type: 'silver',
    weight: 100,
    oldSerialNumber: 'GB-000282',
    newSerialNumber: 'GB-558841'
  },
  fromStore: "Tripoli Main Branch",
  toStore: "Benghazi Branch",
  locationChangeFee: 50,
  currency: 'LYD',
  walletBalanceBefore: 199990,
  walletBalanceAfter: 199940,
  transactionId: 'LOC-1234567890-JKL'
});
```

---

### 5. Digital Transfer (Send Grams)
**Type**: `digital_transfer`

Generated when sending digital gold/silver grams to another user.

**Data Included**:
- Sender information
- Recipient information
- Digital metal type and grams transferred
- Shared bar serial number (if applicable)
- No fees (instant, free transfer)
- Transaction ID and TX Hash

**Trigger**: After successful transfer in DigitalTransferPage

**Example**:
```typescript
const receipt = receiptService.generateDigitalTransferReceipt({
  userId: user.id,
  userName: "Ahmed Albibas",
  recipientName: "Fatima Ali",
  recipientEmail: "fatima@example.com",
  recipientPhone: "0925551234",
  metalType: 'gold',
  grams: 25.5,
  transactionId: 'DGT-1234567890-MNO',
  sharedBarSerial: 'SB-1761301234'
});
```

---

### 6. Receive Physical (Digital → Physical Conversion)
**Type**: `receive_physical`

Generated when converting digital grams to a physical bar for pickup.

**Data Included**:
- Customer information
- Product details (created bar)
- Digital grams deducted
- Fabrication fee (75 LYD)
- Wallet balance changes
- Pickup information (store, deadline)
- Note about digital balance deduction
- Serial number for new bar
- Transaction ID and TX Hash

**Trigger**: After confirming conversion in ReceiveDigitalBullionPage

**Example**:
```typescript
const receipt = receiptService.generateReceivePhysicalReceipt({
  userId: user.id,
  userName: "Ahmed Albibas",
  metalType: 'gold',
  grams: 100,
  fabricationFee: 75,
  currency: 'LYD',
  walletBalanceBefore: 199990,
  walletBalanceAfter: 199915,
  pickupStore: "Tripoli Main Branch",
  pickupAddress: "Tripoli, Martyrs' Square",
  pickupDeadline: "2025-10-27T10:30:00Z",
  serialNumber: 'GB-778899',
  transactionId: 'CNV-1234567890-PQR'
});
```

---

### 7. Wallet Deposit
**Type**: `wallet_deposit`

Generated when depositing funds into fiat wallets.

**Data Included**:
- Customer information
- Deposit amount and currency
- Wallet balance before/after
- Deposit method
- Transaction ID and TX Hash

**Trigger**: After successful deposit in Fund Wallets flow

**Example**:
```typescript
const receipt = receiptService.generateWalletDepositReceipt({
  userId: user.id,
  userName: "Ahmed Albibas",
  amount: 10000,
  currency: 'LYD',
  walletBalanceBefore: 199990,
  walletBalanceAfter: 209990,
  transactionId: 'DEP-1234567890-STU',
  depositMethod: 'bank_transfer'
});
```

---

## Receipt UI Features

### Header Section
- Transaction type icon (dynamic based on type)
- Success checkmark (green circle with check icon)
- Transaction title
- Status badge (Success, Pending, Failed)

### Information Cards

#### Transaction Details Card
- Transaction ID
- Date & Time (formatted)
- TX Hash (shortened)

#### Customer Information Card
- Name
- Email (if available)
- Phone (if available)

#### Recipient Information Card (for transfers)
- Name
- Email (if available)
- Phone (if available)
- Blue background to distinguish from sender

#### Product Details Card
- Product name
- Type (GOLD/SILVER)
- Weight in grams
- Karat/Purity
- Serial Number (monospace font)

#### Digital Balance Card (for digital transactions)
- Metal type (GOLD/SILVER)
- Amount in grams
- Price per gram
- Total value
- Yellow background

#### Location Change Card (for location changes)
- From location
- To location
- Purple background

#### Payment Summary Card (Dark gradient)
- Subtotal (if applicable)
- Commission 1.5% (if applicable)
- Service Fees (if applicable)
- Fabrication Fee (if applicable)
- Storage Fee (if applicable)
- **Total Amount** (large, bold)
- White text on dark background

#### Payment Method Card
- Method name
- Balance Before
- Balance After

#### Pickup Information Card (Green)
- Store name
- Deadline (formatted)
- Address
- Warning about storage fees (yellow box)

#### Notes Card (Blue)
- Additional transaction-specific information

### Action Buttons

1. **Download PDF** (outline button with download icon)
   - Currently shows "coming soon" alert
   - Future: Generate and download PDF receipt

2. **Share** (outline button with share icon)
   - Currently shows "coming soon" alert
   - Future: Share via email, WhatsApp, etc.

3. **Close** (primary button)
   - Closes the receipt modal

### Footer
- "This receipt is your proof of transaction"
- "Keep it for your records"
- "Gold Trading Platform" branding

---

## Integration Points

### InvoicePage
**File**: `/src/pages/InvoicePage.tsx`

After any purchase, users see the InvoicePage which shows a simplified invoice. Users can click **"View Detailed Receipt"** button to open the full TransactionReceipt modal.

**Features**:
- Loads invoice data from database
- Generates receipt data using `receiptService`
- Opens TransactionReceipt modal
- Handles both digital and physical purchases

### ChangeLocationModal
**File**: `/src/components/wallet/WalletModals.tsx`

When successfully changing pickup location:
1. Success screen appears
2. Shows new serial number
3. **"View Receipt"** button opens TransactionReceipt
4. Includes location change fee details

### Future Integration Points

These flows should also generate receipts:

#### TransferOwnershipPage
When completing in-app ownership transfer, generate receipt showing:
- Sender and recipient details
- Product being transferred
- Risk score status
- TX hash

#### DigitalTransferPage
When sending digital grams, generate receipt showing:
- Amount transferred
- Recipient details
- Shared bar serial (if applicable)
- Instant confirmation

#### ReceiveDigitalBullionPage
When converting digital → physical, generate receipt showing:
- Grams converted
- Fabrication fee charged
- New bar serial number
- Pickup details

#### Fund Wallets Pages
When depositing to LYD/USD wallet, generate receipt showing:
- Amount deposited
- Deposit method
- New balance

---

## Design System

### Colors

**Success (Genuine)**:
- Icon: Green (#059669)
- Background: Green-50/Green-900
- Border: Green-200/Green-800

**Warning (Uncertain/Pending)**:
- Icon: Yellow (#D97706)
- Background: Yellow-50/Yellow-900
- Border: Yellow-200/Yellow-800

**Error (Failed/Counterfeit)**:
- Icon: Red (#DC2626)
- Background: Red-50/Red-900
- Border: Red-200/Red-800

**Digital Balance**:
- Background: Yellow-50/Yellow-900
- Text: Yellow-600

**Location Change**:
- Background: Purple-50/Purple-900
- Icon: Purple-600

**Recipient Info**:
- Background: Blue-50/Blue-900
- Border: Blue-200/Blue-800

**Payment Summary**:
- Background: Gradient from Gray-900 to Gray-800
- Text: White
- Border: White/20 opacity

**Pickup Info**:
- Background: Green-50/Green-900
- Border: Green-200/Green-800
- Warning: Yellow-100/Yellow-900

### Typography

**Receipt Title**: 2xl, bold
**Card Titles**: base/lg, bold
**Labels**: sm, gray-600
**Values**: sm, font-semibold, gray-900
**Large Values**: xl/2xl, bold
**Serial Numbers**: font-mono, xs
**Status**: sm, font-semibold, capitalized

### Spacing

**Modal**: max-w-md, max-h-90vh, rounded-xl
**Outer Padding**: p-6
**Section Spacing**: space-y-6
**Card Spacing**: space-y-3
**Detail Row Spacing**: space-y-2

### Icons

All icons from `lucide-react`:
- **CheckCircle**: Success confirmation (w-10 h-10 green)
- **ShoppingCart**: Purchases (w-12 h-12 yellow/gray)
- **Send**: Transfers (w-12 h-12 blue)
- **MapPin**: Location changes (w-12 h-12 purple)
- **Package**: Physical conversion (w-12 h-12 green)
- **ArrowRightLeft**: General transactions (w-12 h-12 gray)
- **Download**: PDF download
- **Share2**: Sharing
- **X**: Close modal
- **FileText**: View receipt button

---

## Usage Examples

### In InvoicePage (After Purchase)

```typescript
const handleViewReceipt = () => {
  if (!invoice || !profile || !user) return;

  let receipt: TransactionReceiptData;

  if (invoice.is_digital) {
    receipt = receiptService.generateDigitalPurchaseReceipt({
      userId: user.id,
      userName: `${profile.first_name} ${profile.last_name}`,
      userEmail: profile.email,
      metalType: invoice.digital_metal_type as 'gold' | 'silver',
      grams: invoice.digital_grams || 0,
      pricePerGram: invoice.amount_lyd / (invoice.digital_grams || 1),
      totalAmount: invoice.amount_lyd,
      currency: 'LYD',
      walletBalanceBefore: 0, // Fetch from wallet service
      walletBalanceAfter: 0,  // Fetch from wallet service
      transactionId: invoice.invoice_number,
    });
  } else {
    receipt = receiptService.generatePhysicalPurchaseReceipt({
      // ...physical purchase data
    });
  }

  setReceiptData(receipt);
  setShowReceipt(true);
};
```

### In ChangeLocationModal (After Location Change)

```typescript
const handleConfirm = async () => {
  // ...confirmation logic

  const receipt = receiptService.generateLocationChangeReceipt({
    userId: user.id,
    userName: `${profile.first_name} ${profile.last_name}`,
    userEmail: profile.email,
    product: {
      name: asset.product?.name || 'Gold Bar',
      type: asset.product?.type === 'gold' ? 'gold' : 'silver',
      weight: parseFloat(asset.product?.weight_grams || '0'),
      oldSerialNumber: asset.serial_number,
      newSerialNumber: newSerialNumber,
    },
    fromStore: asset.store?.name || 'Previous Location',
    toStore: selectedStore.name,
    locationChangeFee: 50,
    currency: 'LYD',
    walletBalanceBefore: 199990,
    walletBalanceAfter: 199940,
    transactionId: `LOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  });

  setReceiptData(receipt);
  setStep(2); // Success screen
};
```

### Display Receipt Modal

```typescript
{showReceipt && receiptData && (
  <TransactionReceipt
    data={receiptData}
    onClose={() => setShowReceipt(false)}
    onDownload={() => alert('PDF download coming soon!')}
    onShare={() => alert('Share feature coming soon!')}
  />
)}
```

---

## Business Rules Encoded in Receipts

### Commission Rates
- **Digital purchases**: 0% commission (explicitly noted)
- **Physical purchases**: 1.5% commission (shown in breakdown)

### Fees
- **Location change**: 50 LYD fixed fee
- **Fabrication**: 75 LYD for digital → physical conversion
- **Storage**: 30 LYD/day after 3-day grace period (noted in warnings)

### Pickup Deadlines
- **Grace period**: 3 days from purchase/location change
- **Storage fees**: Start accumulating after deadline
- Always shown prominently in pickup information card

### Risk Scoring
- **Transfer threshold**: 0.8
- **Below 0.8**: Instant transfer (Success status)
- **Above 0.8**: Manual review (Pending status)
- Clear messaging in receipt notes

### Digital Transfers
- **No fees**: Completely free, instant
- **Shared ownership**: Shared bar serial numbers tracked
- **Balance tracking**: Instant deduction/addition

---

## Future Enhancements

### PDF Generation
```typescript
const handleDownload = async () => {
  // Use library like jsPDF or pdfmake
  const pdf = await generatePDF(receiptData);
  pdf.download(`receipt-${receiptData.transactionId}.pdf`);
};
```

### Share Functionality
```typescript
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: 'Transaction Receipt',
      text: `Receipt for ${receiptData.transactionId}`,
      url: generateReceiptURL(receiptData)
    });
  } else {
    // Fallback: copy link, email, WhatsApp
  }
};
```

### Email Receipts
```typescript
// After transaction, automatically email receipt
await emailService.sendReceipt({
  to: user.email,
  receiptData,
  attachPDF: true
});
```

### Print Functionality
```typescript
const handlePrint = () => {
  window.print();
  // Or create print-optimized version
};
```

### Receipt History
```typescript
// Store all receipts in database
await supabase.from('transaction_receipts').insert({
  user_id: user.id,
  transaction_id: receiptData.transactionId,
  receipt_data: receiptData,
  created_at: new Date().toISOString()
});

// View all past receipts
const receipts = await walletService.getReceiptHistory(user.id);
```

### QR Code Integration
```typescript
// Add QR code to receipt for verification
import QRCode from 'qrcode';

const qrCode = await QRCode.toDataURL(receiptData.txHash);

// Display in receipt
<img src={qrCode} alt="Transaction QR Code" />
```

---

## Testing Checklist

### Digital Purchase Receipt
- [ ] Shows correct grams and metal type
- [ ] Calculates price correctly
- [ ] Shows no commission note
- [ ] Displays wallet balance changes
- [ ] Includes TX hash

### Physical Purchase Receipt
- [ ] Shows product details with serial number
- [ ] Includes 1.5% commission calculation
- [ ] Shows pickup location and deadline
- [ ] Displays storage fee warning
- [ ] Includes TX hash

### Ownership Transfer Receipt
- [ ] Shows both sender and recipient details
- [ ] Displays product being transferred
- [ ] Shows correct status (success/pending)
- [ ] Includes risk score messaging
- [ ] No fees displayed (free transfer)

### Location Change Receipt
- [ ] Shows both old and new location
- [ ] Displays both serial numbers (old and new)
- [ ] Includes 50 LYD fee
- [ ] Shows wallet balance deduction
- [ ] Notes new 3-day deadline

### Digital Transfer Receipt
- [ ] Shows grams transferred
- [ ] Displays recipient details
- [ ] Shows shared bar serial (if applicable)
- [ ] Notes instant, free transfer
- [ ] Includes TX hash

### Convert to Physical Receipt
- [ ] Shows grams being converted
- [ ] Includes 75 LYD fabrication fee
- [ ] Displays new bar serial number
- [ ] Shows pickup details
- [ ] Notes digital balance deduction

### Wallet Deposit Receipt
- [ ] Shows deposit amount
- [ ] Displays deposit method
- [ ] Shows balance before/after
- [ ] Includes TX hash

---

## Files Reference

### Core Components
- `/src/components/invoice/TransactionReceipt.tsx` - Main receipt component
- `/src/services/receipt.service.ts` - Receipt generation helpers

### Integration Files
- `/src/pages/InvoicePage.tsx` - Purchase receipts
- `/src/components/wallet/WalletModals.tsx` - Location change receipts

### Future Integration Files
- `/src/pages/wallet/TransferOwnershipPage.tsx` - Transfer receipts
- `/src/pages/wallet/DigitalTransferPage.tsx` - Digital transfer receipts
- `/src/pages/wallet/ReceiveDigitalBullionPage.tsx` - Conversion receipts
- `/src/pages/profile/FundDinarWalletPage.tsx` - Deposit receipts
- `/src/pages/profile/FundDollarWalletPage.tsx` - Deposit receipts

---

## Summary

The Transaction Receipt System provides:
✅ **7 transaction types** fully supported
✅ **Professional design** with icons, colors, cards
✅ **Complete information** for audit and records
✅ **Responsive modal** with scrolling for long receipts
✅ **Consistent branding** across all transaction types
✅ **User-friendly** with clear sections and readable text
✅ **Actionable buttons** for download and share (coming soon)
✅ **Transaction proofs** with TX hashes for verification
✅ **Business rules** encoded (fees, commissions, deadlines)
✅ **Security information** (risk scores, status)

Every user action that involves money or asset changes now generates a complete, professional receipt!
