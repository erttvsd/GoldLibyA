# Profile & Settings System - Gold Trading Application

## Overview
The Profile section is the user's central hub for account management, funding, support, and settings. It provides a clean menu-driven interface with multiple sub-pages for different functions.

## Main Profile Page

### Profile Card
**Prominent user info card with gradient background**:
- Avatar display (or default user icon)
- Camera button for photo upload (stub)
- Full name (first + last)
- Phone number
- National ID (if available)
- Yellow gradient background

### Menu Options

Six main menu items with icon-coded sections:

1. **KYC Information**
   - Icon: FileText (Blue)
   - Description: "View your verification details"
   - Action: Navigate to KYCPage

2. **Fund Wallets**
   - Icon: Wallet (Green)
   - Description: "Add money to your account"
   - Action: Navigate to funding hub

3. **How to Use**
   - Icon: HelpCircle (Yellow)
   - Description: "Frequently asked questions"
   - Action: Navigate to FAQ page

4. **Contact Us**
   - Icon: MessageCircle (Purple)
   - Description: "Get help from support"
   - Action: Navigate to contact page

5. **Settings**
   - Icon: Settings (Gray)
   - Description: "Manage your preferences"
   - Action: Navigate to settings page

### Footer
- Sign Out button (red, outlined)
- App version info
- Copyright notice

## Sub-Pages

### KYCPage

**Purpose**: View current KYC verification status and information

**Status Badge Display**:
Three possible states with color-coded badges:
- ✓ **Verified** (Green): Successfully verified
- ⏱ **Pending Review** (Yellow): Awaiting verification
- ✗ **Rejected** (Red): Verification failed

**Personal Information Section**:
- Place of Birth
- Nationality
- Marital Status
- Employment Status

**AML Information Section**:
- Income Source
- Account Purpose
- Expected Monthly Volume

**Document Verification Section**:
Three document cards with upload status:
1. **ID Front**
   - Shows uploaded image or placeholder
   - Green checkmark if uploaded
2. **ID Back**
   - Shows uploaded image or placeholder
   - Green checkmark if uploaded
3. **Selfie**
   - Shows uploaded image or placeholder
   - Green checkmark if uploaded

**Actions**:
- "Update Information" button (stub)

**Empty State**:
If no KYC data exists:
- Large document icon
- "No KYC Information" message
- "Start Verification" button

**Data Source**: `kyc_details` table joined with `profiles`

### FundWalletsPage

**Purpose**: Hub to choose which wallet to fund

**Two Wallet Cards**:

1. **Libyan Dinar**
   - Green gradient background
   - Wallet icon
   - "Add LYD to your account"
   - Navigates to FundDinarWalletPage

2. **US Dollar**
   - Blue gradient background
   - Wallet icon
   - "Add USD to your account"
   - Navigates to FundDollarWalletPage

**Info Box**:
Blue notice about secure processing and variable timing

### FundDinarWalletPage

**Purpose**: Add LYD to wallet via local payment methods

**4 Payment Methods**:

**1. Local Card Payment**
- Icon: CreditCard (Blue)
- Description: "Pay with Libyan debit/credit card"
- Expandable form:
  - Amount input (LYD)
  - "Proceed to Payment" button
  - Simulated payment gateway

**2. Coupon Code**
- Icon: Ticket (Purple)
- Description: "Redeem a promotional coupon"
- Expandable form:
  - Coupon code input
  - "Apply Coupon" button (stub)

**3. Bank Transfer**
- Icon: Building2 (Green)
- Description: "Transfer from local Libyan bank"
- Expandable details:
  - Bank Name: Jumhouria Bank
  - Account Name: Gold Trading LLC
  - Account Number: 1234567890123
  - Branch: Tripoli Main Branch
  - SWIFT Code: JUMBLY2T
  - Important: Include account ID in reference

**4. Cash Deposit**
- Icon: MapPin (Orange)
- Description: "Deposit cash at our locations"
- Expandable content:
  - 3 Location cards:
    - **Tripoli Branch**
      - Address: Gargaresh Street, Tripoli
      - Hours: Sun-Thu 9AM-5PM
    - **Benghazi Branch**
      - Address: Jamal Abdul Nasser Street, Benghazi
      - Hours: Sun-Thu 9AM-5PM
    - **Misrata Branch**
      - Address: Central Market Area, Misrata
      - Hours: Sun-Thu 9AM-4PM
  - Map placeholder (gray box)

**Success Flow**:
After payment initiation:
- Green checkmark
- Amount confirmation
- Processing message
- "Back to Profile" button

### FundDollarWalletPage

**Purpose**: Add USD to wallet via international payment methods

**3 Payment Methods**:

**1. International Card**
- Icon: CreditCard (Blue)
- Description: "Pay with Visa/Mastercard/Amex"
- Expandable form:
  - Amount input (USD)
  - Card network logos (VISA, MC, AMEX)
  - "Gateway redirect" notice
  - "Proceed to Gateway" button (stub)

**2. Coupon Code**
- Icon: Ticket (Purple)
- Same as Dinar wallet

**3. International Bank Transfer**
- Icon: Building2 (Green)
- Description: "Wire transfer via SWIFT"
- Expandable details:
  - Bank Name: Emirates NBD
  - Account Name: Gold Trading International LLC
  - IBAN: AE070331234567890123456
  - SWIFT/BIC: EBILAEAD
  - Bank Address: Dubai, UAE
  - Routing Number: 026009593
  - Important notes:
    - Include account ID in reference
    - 2-5 business days processing
    - Wire fees are sender's responsibility

**Success Flow**:
Similar to Dinar wallet with international timing notice

### HowToUsePage (FAQ)

**Purpose**: Comprehensive FAQ with accordion interface

**15 Question-Answer Pairs**:

1. How do I buy gold or silver?
2. What is the difference between digital and physical gold?
3. How do I fund my wallet?
4. What happens if I miss the pickup deadline?
5. How do I transfer assets to another user?
6. Can I convert digital gold to a physical bar?
7. How does the Investment Planner work?
8. What payment methods are accepted?
9. How do I track gold prices?
10. What is KYC and why is it required?
11. How do I book a pickup appointment?
12. Can I change my pickup location?
13. What is XRF analysis?
14. How secure are my assets?
15. What if I sell or give away a physical bar?

**Features**:
- Collapsible accordion cards
- One question open at a time
- Chevron icons (up/down)
- First question open by default
- Smooth transitions

**Footer Box**:
Blue info card with link to Contact Us

### ContactUsPage

**Purpose**: Customer support information and message form

**4 Contact Info Cards**:

1. **Phone Support**
   - Icon: Phone (Blue)
   - Content: +218 21 123 4567

2. **Email Support**
   - Icon: Mail (Green)
   - Content: support@goldtrading.ly

3. **Main Office**
   - Icon: MapPin (Yellow)
   - Content: Gargaresh Street, Tripoli, Libya

4. **Business Hours**
   - Icon: Clock (Purple)
   - Content: Sunday - Thursday: 9:00 AM - 5:00 PM

**Message Form**:
- Name input
- Email input
- Message textarea (multi-line)
- "Send Message" button
- Form validation (all fields required)
- Submit simulation (1.5s delay)

**Success State**:
- Green checkmark
- "Message Sent!" heading
- 24-hour response time notice
- "Back to Profile" button

**Additional Contact Methods Box**:
Gray info card listing:
- Live chat during business hours
- WhatsApp: +218 91 123 4567
- Social media links

### SettingsPage

**Purpose**: App preferences and security settings

**4 Setting Categories**:

**1. Notifications** (Bell icon)
Four toggle options:
- **Push Notifications**: Receive app notifications
- **Price Alerts**: Significant price changes
- **Transaction Alerts**: All transactions
- **Marketing Emails**: Promotional offers

**2. Appearance** (Moon icon)
One toggle:
- **Dark Mode**: Use dark theme throughout app

**3. Language & Region** (Globe icon)
Dropdown selector:
- English (default)
- العربية (Arabic)
- Français (French)
- Note: App restart required for changes

**4. Security** (Shield icon)
Three toggle options with icons:
- **Two-Factor Authentication** (Lock): SMS code requirement
- **Biometric Authentication** (Fingerprint): Face/fingerprint ID
- **Auto-Logout** (Eye): 15-minute timeout

**Additional Actions**:
Two clickable cards (stubs):
- "Change Password" (Blue text)
- "Delete Account" (Red text)

**Footer**:
"Settings are saved automatically" notice

**Toggle UI**:
- Custom yellow toggle switches
- Smooth transitions
- Labels with descriptions
- Icons for security settings

## Data Flow

### Profile Data Loading
```typescript
// Load on mount
useAuth() → profile data
kycService.getKYCDetails() → KYC status
```

### KYC Integration
- Loads from `kyc_details` table
- Joins with user profile
- Shows verification status
- Displays document upload status
- Read-only view

### Funding Flow
1. User selects wallet type
2. Chooses payment method
3. Enters amount/details
4. Simulates payment processing
5. Shows success confirmation
6. Returns to profile

**Note**: All payment processing is currently simulated

### Settings Persistence
- Toggle changes saved to state
- Auto-save functionality (stub)
- Would integrate with `user_preferences` table

## Business Rules

### KYC Requirements
- Required for large transactions
- Three verification stages
- Document upload mandatory
- Admin approval needed

### Funding Limits
- No hard limits shown
- Would implement min/max amounts
- Different limits per method
- Compliance with regulations

### Support Response
- 24-hour email response time
- Business hours for phone/chat
- Support tickets tracked
- Priority for verified users

## UI/UX Features

### Profile Menu
- Icon-coded sections
- Color-coordinated cards
- Hover effects
- Chevron indicators
- Clear descriptions

### Funding Pages
- Method selection cards
- Expandable details
- Inline forms
- Success confirmations
- Back navigation

### FAQ Accordion
- Smooth animations
- Single-open mode
- Easy navigation
- Comprehensive coverage
- Searchable (future)

### Contact Form
- Real-time validation
- Loading states
- Success feedback
- Error handling
- Accessibility

### Settings
- Toggle switches
- Visual feedback
- Grouped logically
- Danger actions separated
- Auto-save indication

## Testing Scenarios

### Test Profile Navigation
1. Click Profile tab
2. View profile card with user info
3. Click each menu option
4. Verify navigation works
5. Test back buttons

### Test KYC Display
1. Navigate to KYC Information
2. View verification status
3. Check personal info display
4. Review AML data
5. See document status

### Test Dinar Funding
1. Go to Fund Wallets
2. Select Libyan Dinar
3. Try each payment method
4. Expand bank transfer details
5. View cash deposit locations
6. Submit card payment
7. See success confirmation

### Test Dollar Funding
1. Select US Dollar wallet
2. Try international card
3. View SWIFT transfer details
4. Check coupon redemption
5. Complete funding flow

### Test FAQ
1. Open How to Use
2. Click question to expand
3. Verify answer displays
4. Test multiple questions
5. Check accordion behavior

### Test Contact Form
1. Go to Contact Us
2. View contact information
3. Fill message form
4. Submit with validation
5. See success message

### Test Settings
1. Open Settings page
2. Toggle notifications
3. Change language
4. Enable security features
5. Verify auto-save

## Performance Considerations

### Current
- Lazy loading of sub-pages
- Minimal re-renders
- Efficient state management
- Simulated delays realistic

### Optimizations
1. Cache profile data
2. Debounce settings changes
3. Lazy load FAQ content
4. Optimize image loading
5. Compress avatar uploads

## Security Features

### KYC Verification
- Multi-stage process
- Document validation
- Admin approval
- Secure storage

### Funding Security
- Payment gateway integration
- Transaction encryption
- Audit logging
- Fraud detection

### Settings Protection
- 2FA enforcement
- Biometric options
- Auto-logout
- Session management

## Future Enhancements

### Profile
1. Avatar upload
2. Profile editing
3. Social links
4. Activity timeline
5. Achievements/badges

### KYC
1. Live document upload
2. Real-time verification
3. Identity scoring
4. Automated checks
5. Progress tracking

### Funding
1. Real payment gateways
2. Recurring deposits
3. Auto-funding rules
4. Payment history
5. Receipt downloads

### Support
1. Live chat integration
2. Ticket system
3. Knowledge base
4. Video tutorials
5. Community forum

### Settings
1. Advanced security options
2. Theme customization
3. Notification rules
4. Data export
5. Account backup

## Related Files

**Main Components**:
- `/src/pages/ProfilePage.tsx` - Main profile hub

**Sub-Pages**:
- `/src/pages/profile/KYCPage.tsx` - KYC verification view
- `/src/pages/profile/FundWalletsPage.tsx` - Wallet selection hub
- `/src/pages/profile/FundDinarWalletPage.tsx` - LYD funding methods
- `/src/pages/profile/FundDollarWalletPage.tsx` - USD funding methods
- `/src/pages/profile/HowToUsePage.tsx` - FAQ accordion
- `/src/pages/profile/ContactUsPage.tsx` - Support contact
- `/src/pages/profile/SettingsPage.tsx` - App preferences

**Services**:
- `/src/services/kyc.service.ts` - KYC data operations
- `/src/services/wallet.service.ts` - Wallet balance updates

**Context**:
- `/src/contexts/AuthContext.tsx` - User profile, sign out
