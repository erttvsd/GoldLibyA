# Invoice PDF Download Feature

## Overview
After a successful purchase, users can now download their invoice as a professional PDF document.

## Features Implemented

### 1. Automatic Download Button on Purchase Success
- ✅ Prominent "Download Invoice PDF" button appears in the success message
- ✅ Green-themed button matches the success state
- ✅ Positioned immediately after purchase confirmation
- ✅ One-click download without additional navigation

### 2. Manual Download Option
- ✅ "Download PDF" button available at any time on invoice page
- ✅ Works for both new purchases and historical invoices
- ✅ Accessible from invoice history

### 3. PDF Content

#### Digital Gold/Silver Purchases
The PDF includes:
- Transaction receipt header
- Purchase type: "Digital Gold Purchase" or "Digital Silver Purchase"
- Transaction ID and timestamp
- Customer information (name, email)
- Digital balance details:
  - Metal type (gold/silver)
  - Grams purchased
  - Price per gram
  - Shared bar serial number
- Payment summary:
  - Subtotal
  - Commission (1.5%)
  - Total amount
  - Payment method
  - Wallet balance before/after
- Platform branding footer

#### Physical Gold Bar Purchases
The PDF includes:
- Transaction receipt header
- Purchase type: "Physical Gold Purchase"
- Transaction ID and timestamp
- Customer information (name, email, phone)
- Product details:
  - Bar name (e.g., "Gold Bar 50g")
  - Weight in grams
  - Karat (if applicable)
  - Serial number
- Payment summary:
  - Base price
  - Commission (1.5%)
  - Total amount
  - Payment method
  - Wallet balance before/after
- Pickup information:
  - Store name
  - Store address
  - Pickup deadline
  - Storage fee warning (30 LYD/day after deadline)
- Platform branding footer

## User Experience Flow

### Purchase Success Screen
```
┌─────────────────────────────────────┐
│  ✓ Purchase Successful!             │
│  Your order has been confirmed.     │
│                                     │
│  [Download Invoice PDF]             │
└─────────────────────────────────────┘
```

### Invoice Page
```
┌─────────────────────────────────────┐
│         Invoice #INV-123456         │
│                                     │
│  [View Detailed Receipt]            │
│  [Download PDF] [Book Pickup]       │
└─────────────────────────────────────┘
```

## Technical Implementation

### File: `src/pages/InvoicePage.tsx`

#### handleDownload Function
```typescript
const handleDownload = () => {
  if (!invoice || !profile || !user) return;

  let receipt: TransactionReceiptData;

  // Generate receipt data based on purchase type
  if (invoice.is_digital) {
    receipt = receiptService.generateDigitalPurchaseReceipt({...});
  } else if (invoice.asset) {
    receipt = receiptService.generatePhysicalPurchaseReceipt({...});
  }

  // Download PDF
  downloadReceiptPDF(receipt);
};
```

#### Success Card with Download Button
```typescript
{isNewPurchase && (
  <Card className="bg-green-50 dark:bg-green-900/20">
    <CheckCircle className="text-green-600" />
    <h3>Purchase Successful!</h3>
    <Button onClick={handleDownload} icon={Download}>
      Download Invoice PDF
    </Button>
  </Card>
)}
```

### Dependencies Used
- `jsPDF` - PDF generation library
- `receiptService` - Receipt data formatting
- `downloadReceiptPDF` - PDF creation and download utility

## PDF Format

### Document Structure
1. **Header Section**
   - "TRANSACTION RECEIPT" title
   - Platform name

2. **Transaction Info Section**
   - Transaction type
   - Status
   - Transaction ID
   - Date and time
   - Transaction hash (if applicable)

3. **Customer Section**
   - Full name
   - Email address
   - Phone number

4. **Product/Asset Section**
   - Item details
   - Weight/quantity
   - Serial numbers
   - Specifications

5. **Payment Section**
   - Itemized costs
   - Commission breakdown
   - Total amount
   - Payment method
   - Wallet balance changes

6. **Pickup Section** (Physical only)
   - Store location
   - Address
   - Pickup deadline
   - Storage fee warning

7. **Footer**
   - "This receipt is your proof of transaction"
   - Platform branding

## File Naming
Downloaded files are named: `receipt-[TRANSACTION_ID].pdf`
- Example: `receipt-INV-1729876543-ABC123XYZ.pdf`

## Browser Compatibility
- ✅ Chrome/Edge - Direct download
- ✅ Firefox - Direct download
- ✅ Safari - Direct download
- ✅ Mobile browsers - Download to device

## Security Considerations
- Invoice data only accessible to the purchasing user
- PDF generated client-side (no server transmission)
- No sensitive information exposed in file names
- Invoice retrieval protected by RLS policies

## Future Enhancements
1. Add company logo to PDF header
2. Include QR code for verification
3. Multi-language support
4. Email PDF option
5. Batch download for multiple invoices
6. Print-optimized layout
7. Watermark for different statuses

## Testing Checklist
- [x] PDF downloads after digital gold purchase
- [x] PDF downloads after digital silver purchase
- [x] PDF downloads after physical bar purchase
- [x] Download button appears on success screen
- [x] Manual download button works on invoice page
- [x] All invoice data correctly displayed in PDF
- [x] Pickup information included for physical bars
- [x] Payment summary accurate
- [x] File downloads with correct name
- [x] Works on different browsers

## Usage Notes
- Users should download and save their invoices for records
- PDFs serve as proof of purchase for pickup
- Can be shared with customs/authorities if needed
- Recommended to download immediately after purchase
