# Wallet System - Gold Trading Application

## Overview
The Wallet system is the most comprehensive section of the application, providing complete management of fiat balances, digital assets, physical bars, transfers, appointments, and investment planning. It integrates with the Supabase database for real-time data and transaction management.

## Main Wallet Page

### 1. Fiat Balances Section

Two prominent balance cards:
- **Libyan Dinar (LYD)** - Green gradient card
- **US Dollar (USD)** - Blue gradient card

Each card displays:
- Currency name
- Current balance
- Wallet icon
- Gradient background for visual appeal

**Data Source**: `wallets` table

### 2. Digital Balances Section

Two clickable cards for digital holdings:
- **Digital Gold** - Yellow gradient card
- **Digital Silver** - Gray gradient card

Each card displays:
- Metal type
- Balance in grams with 3 decimals
- "Tap for options" prompt
- QR code icon

**Interaction**: Clicking opens DigitalOptionsModal

**Data Source**: `digital_balances` table

### 3. Quick Actions

Three action buttons:
1. **Transfer Balance** - Send digital grams to another user
2. **Receive Physical Bar** - Convert digital to physical
3. **Buy Digital** - Navigate to market

### 4. Bars Awaiting Pickup Section

Lists physical assets with `status='not_received'`

**Asset Card Features**:
- Product image/icon
- Name and specifications
- Serial number
- Pickup location
- Countdown or overdue warning

**Deadline Logic**:
- Shows days until 3-day pickup deadline
- After deadline: Shows overdue days
- Calculates storage fees: 30 LYD per day

**Action Buttons**:
- Book Appointment
- Transfer Ownership
- Change Location
- View Details

**Data Source**: `owned_assets` table (filtered)

### 5. Bars Received Section

Lists physical assets with `status='received'`

**Features**:
- Green checkmark icon
- "In your possession" badge
- Simplified action buttons

**Actions**:
- Register Handover Transfer
- View Details

### 6. Smart Investment Advisor CTA

Prominent blue gradient card with:
- Title and description
- "Start Planning" button
- Navigates to InvestmentPlannerPage

## Modals

### DigitalOptionsModal

**Triggered by**: Clicking digital balance card

**Three Options**:
1. **Transfer to Another User**
   - Icon: Send
   - Action: Opens DigitalTransferPage

2. **Receive as Physical Bar**
   - Icon: Package
   - Action: Opens ReceiveDigitalBullionPage

3. **Buy More**
   - Icon: Shopping Cart
   - Action: Navigates to Market

**Display**: Current balance prominently shown at top

### BullionDetailsModal

**Comprehensive asset information in sections**:

**1. Basic Information**
- Type (Gold/Silver Bar)
- Weight in grams
- Karat/Purity
- Serial Number (monospaced font)
- Packaging details

**2. XRF Analysis**
- Composition percentages
- Gold, Silver, Copper, Zinc, Nickel
- Analysis image if available
- Professional data display

**3. Physical Properties**
- Dimensions
- Shape
- Other characteristics

**4. Ownership & History**
- Current owner
- Purchase date
- Manufacture date
- Origin country/region
- Invoice reference

**5. QR Code**
- Verification QR code image
- "Scan to verify" prompt

**Data Source**: `owned_assets` with joined `products`

### ChangeLocationModal

**Purpose**: Move pickup location to different store

**2-Step Process**:

**Step 1: Select New Location**
- Lists all stores except current
- Shows store name, city, address
- Radio button selection
- Info box with fees and warnings

**Fee Information**:
- 50 LYD location change fee
- Serial number will be reassigned
- Highlighted in blue info box

**Step 2: Success Confirmation**
- Green checkmark
- Success message
- Warning about serial number change
- "Done" button

**Simulated**: 1.5 second processing delay

### HandoverTransferModal

**Purpose**: Register physical handover outside app

**2-Step Process**:

**Step 1: Enter Recipient Details**
- Asset information displayed
- Recipient name input
- Recipient phone input
- Explanation text

**Step 2: Success Confirmation**
- Green checkmark
- Confirmation message
- Blue info box with next steps
- Instructs recipient to contact support

**Use Case**: Manual transfer of received bar to someone without app account

## Wallet Sub-Pages

### TransferOwnershipPage (In-App Transfer)

**4-Step Wizard for not_received bars**:

**Step 1: Select Asset**
- Lists all assets awaiting pickup
- Radio selection cards
- Shows asset details
- Highlights selected asset

**Step 2: Verify Recipient**
- Email or phone input
- Verification check
- Mock verification: `0925551234` or `user@example.com`
- Shows recipient name on success
- Error message if not found

**Step 3: Confirm & Authenticate**
- Summary of transfer
- Warning about irreversibility
- Password input
- SMS OTP input (6 digits)
- Resend countdown (60 seconds)

**Security**: Mock authentication with delay

**Step 4: Result**
- **Success Path**:
  - Green checkmark
  - Transaction hash displayed
  - Risk score shown
  - Low risk (< 80%) proceeds

- **Manual Review Path**:
  - Shield icon (yellow)
  - Risk score > 80%
  - Manual review required message
  - 24-hour review time
  - Notification promise

**Risk Scoring**: Random simulation (80% threshold)

**Data Updates**:
- Asset ownership transferred
- Transaction recorded
- Risk assessment logged

### ReceiveDigitalBullionPage (Digital to Physical)

**2-Step Conversion Flow**:

**Step 1: Configure Conversion**

**Metal Selection**:
- Toggle between Gold and Silver
- Shows available balance
- Visual button styling

**Grams Input**:
- Number input with validation
- Max = available balance
- Real-time validation

**Pickup Location Selection**:
- Lists all active stores
- Radio button selection
- Shows address details

**Conversion Summary Card**:
- Digital grams to convert
- Fabrication & cutting fee: 75 LYD
- Total cost display

**Validation**:
- Grams > 0
- Grams ≤ available balance
- Store selected

**Step 2: Success & Next Steps**
- Green checkmark
- Conversion confirmed
- Summary card with details
- Yellow warning about 3-day deadline
- "Book Appointment" button
- Links to BookAppointmentPage

**Business Rules**:
- Fixed fee: 75 LYD
- Immediate balance deduction
- Creates owned_asset record
- Sets 3-day pickup deadline

### DigitalTransferPage (Send Grams)

**3-Step Transfer Flow**:

**Step 1: Transfer Details**

**Metal Selection**:
- Gold or Silver toggle
- Shows available balance

**Recipient Input**:
- Email or phone number
- Validates format

**Amount Input**:
- Grams to transfer
- Validates against balance
- Real-time feedback

**Validation**:
- Grams > 0
- Grams ≤ available
- Recipient identifier provided

**Step 2: Confirm & Authenticate**

**Summary Display**:
- Metal type
- Amount in grams
- Recipient name (verified)

**Security Inputs**:
- Password
- SMS OTP (6 digits)
- Resend functionality

**Warning**:
- Irreversible transaction notice
- Yellow alert box

**Step 3: Success**
- Green checkmark
- Success message
- Transaction ID (unique)
- Shared Bar Serial Number (generated)
- New balance displayed

**Transaction Details**:
```
Transaction ID: TXN{timestamp}{random}
Shared Bar SN: SB-GOLD-{random8chars}
```

**Data Updates**:
- Deduct from sender balance
- Add to recipient balance
- Create digital_transfer record
- Generate transaction record

### BookAppointmentPage

**Appointment Scheduling**:

**Asset Display** (if applicable):
- Asset details card
- Serial number
- Pickup location

**Date Selection**:
- Calendar-style grid
- Next 14 days available
- Day name and number
- Click to select
- Yellow highlight when selected

**Time Selection** (shows after date):
- Grid of time slots
- 7 slots per day:
  - 09:00 AM, 10:00 AM, 11:00 AM
  - 12:00 PM
  - 02:00 PM, 03:00 PM, 04:00 PM
- Yellow highlight when selected

**Confirmation**:
- "Confirm Appointment" button
- Disabled until date & time selected
- 1.5 second processing

**Success Screen**:
- Green checkmark
- Booking ID generated: `BK{timestamp}{random}`
- Summary card:
  - Booking ID (large, yellow)
  - Asset details
  - Location
  - Date & Time (formatted)
- "What to Bring" section:
  - Valid ID
  - Booking confirmation
  - Purchase invoice

**Data Updates**:
- Creates appointment record
- Links to asset
- Sets status to 'scheduled'

### InvestmentPlannerPage

**Smart Portfolio Recommendations**:

**Risk Tolerance Slider**:
- Range: 1 to 5
- Visual gradient background
- Blue → Green → Yellow → Orange → Red
- Labels: Conservative, Moderate, Aggressive

**5 Risk Profiles**:

**1. Very Conservative (Level 1)**
- Label: "Very Conservative"
- Description: Minimal risk, capital preservation
- Allocation: 20% Gold, 10% Silver, 70% Cash
- Color: Blue
- Advice: Emphasize safety and liquidity

**2. Conservative (Level 2)**
- Label: "Conservative"
- Description: Low risk, steady returns
- Allocation: 35% Gold, 15% Silver, 50% Cash
- Color: Green
- Advice: Balanced safety with modest growth

**3. Moderate (Level 3)** [Default]
- Label: "Moderate"
- Description: Balanced risk and reward
- Allocation: 50% Gold, 25% Silver, 25% Cash
- Color: Yellow
- Advice: Optimal balance for most investors

**4. Aggressive (Level 4)**
- Label: "Aggressive"
- Description: Higher risk for higher returns
- Allocation: 60% Gold, 30% Silver, 10% Cash
- Color: Orange
- Advice: Focus on precious metals growth

**5. Very Aggressive (Level 5)**
- Label: "Very Aggressive"
- Description: Maximum risk, maximum reward
- Allocation: 65% Gold, 35% Silver, 0% Cash
- Color: Red
- Advice: Full commitment to metals

**Allocation Display**:
- Three animated progress bars
- Gold (🪙): Yellow bar
- Silver (⚪): Gray bar
- Cash (💵): Green bar
- Percentage labels
- Smooth transitions on change

**Investment Strategy Card**:
- Blue info box
- Personalized advice based on level
- Clear, actionable guidance

**Key Considerations**:
- Gold: Stability, inflation hedge
- Silver: Industrial demand, volatility
- Cash: Liquidity, opportunities
- Diversification: Risk management

**Action Buttons**:
- "Start Investing" → Market page
- "Back to Wallet" → Returns

**Educational**:
- Disclaimer text
- Consult advisor notice
- Past performance warning

## Data Flow & Integration

### Database Tables Used

1. **wallets**
   - Fiat currency balances
   - LYD and USD holdings
   - Available vs held balance

2. **digital_balances**
   - Gold and silver grams
   - Per-user tracking
   - Real-time updates

3. **owned_assets**
   - Physical bar inventory
   - Status tracking
   - Serial numbers
   - Pickup details

4. **products**
   - Bar specifications
   - Weight, karat, type
   - Pricing information

5. **stores**
   - Pickup locations
   - Address details
   - Active status

6. **appointments**
   - Scheduled pickups
   - Booking IDs
   - Status management

7. **digital_transfers**
   - Transfer history
   - Shared bar serials
   - Transaction links

8. **asset_transfers**
   - Ownership changes
   - Risk scores
   - Transaction hashes

9. **transactions**
   - All financial movements
   - Audit trail
   - Reference tracking

### Real-Time Updates

**Wallet Page**:
- Loads on mount
- Refreshes after modal actions
- Updates after transfers
- Reflects balance changes

**Modals**:
- Trigger parent refresh on success
- Update local state
- Navigate to next step

**Sub-Pages**:
- Independent data loading
- Navigate back to wallet
- Trigger full reload

## Business Rules

### Pickup Deadlines
- 3-day grace period from purchase
- Storage fee: 30 LYD per day after
- Countdown display
- Overdue warnings

### Transfer Rules
- Not_received: Can transfer ownership
- Received: Can register handover
- Verification required
- Irreversible actions

### Conversion Fees
- Digital to Physical: 75 LYD
- Location Change: 50 LYD
- No fees for digital transfers

### Risk Scoring
- Automated risk assessment
- Score > 0.8 → Manual review
- 24-hour review timeframe
- Notification system

## Testing Scenarios

### Test Wallet Overview
1. Login with sample user
2. View fiat balances
3. Click digital gold card
4. See DigitalOptionsModal
5. Check asset sections

### Test Transfer Ownership
1. Select asset awaiting pickup
2. Enter `0925551234`
3. Verify shows "Ahmed Ali"
4. Enter password and 6-digit OTP
5. Confirm transfer
6. Check risk score outcome

### Test Digital to Physical
1. Click "Receive Physical Bar"
2. Select gold or silver
3. Enter 5 grams
4. Choose store
5. See 75 LYD fee
6. Confirm conversion
7. Book appointment

### Test Digital Transfer
1. Click "Transfer Balance"
2. Select metal type
3. Enter recipient email
4. Enter 3 grams
5. Authenticate
6. See transaction ID and serial

### Test Appointments
1. Click "Book Appointment"
2. Select future date
3. Choose time slot
4. Confirm booking
5. Note booking ID

### Test Investment Planner
1. Click "Smart Investment Advisor"
2. Move risk slider
3. Watch allocation update
4. Read recommendations
5. Click "Start Investing"

## Performance Optimizations

### Current
- Parallel data fetching
- Conditional rendering
- Modal lazy loading
- Efficient state updates

### Recommended
1. Cache wallet balances
2. Optimistic UI updates
3. Background refresh
4. Pagination for assets
5. Virtual scrolling for lists

## Security Features

### Authentication
- Password verification
- SMS OTP validation
- Resend cooldown
- Session management

### Risk Assessment
- Automated scoring
- Manual review threshold
- Transaction monitoring
- Fraud prevention

### Data Protection
- RLS policies enforced
- User-specific queries
- No cross-user access
- Audit logging

## Error Handling

### Current
- Console logging
- User-facing errors in modals
- Validation feedback
- Loading states

### Improvements Needed
1. Toast notifications
2. Retry mechanisms
3. Network error handling
4. Offline detection
5. Conflict resolution
6. Rollback capabilities

## Future Enhancements

### Features
1. Multi-signature transfers
2. Scheduled conversions
3. Auto-rebalancing
4. Price alerts
5. QR code scanning
6. NFC authentication
7. Biometric verification

### UX Improvements
1. Pull-to-refresh
2. Skeleton loaders
3. Progressive disclosure
4. Guided tours
5. Tooltips and help
6. Undo functionality

### Analytics
1. Portfolio performance
2. Transaction history charts
3. Investment insights
4. Market comparisons
5. ROI calculations

## Related Files

**Main Components**:
- `/src/pages/WalletPage.tsx` - Main wallet view
- `/src/components/wallet/WalletModals.tsx` - All modals

**Sub-Pages**:
- `/src/pages/wallet/TransferOwnershipPage.tsx` - 4-step transfer
- `/src/pages/wallet/ReceiveDigitalBullionPage.tsx` - Digital to physical
- `/src/pages/wallet/DigitalTransferPage.tsx` - Send grams
- `/src/pages/wallet/BookAppointmentPage.tsx` - Schedule pickup
- `/src/pages/wallet/InvestmentPlannerPage.tsx` - Portfolio advisor

**Services**:
- `/src/services/wallet.service.ts` - Balance operations
- `/src/services/asset.service.ts` - Asset management

**Types**:
- `/src/types/index.ts` - TypeScript definitions
