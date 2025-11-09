# Home Page - Gold Trading Application

## Overview
The Home page is the main dashboard that displays user balances, market prices, quick actions, and recent transactions. It's fully integrated with the Supabase database and loads all data in real-time.

## Features

### 1. Header Section
- **Greeting**: "Welcome back, [First Name]"
- **Avatar**: User's initial in a circular badge
- **Clickable**: Avatar navigates to Profile page

### 2. Total Balance Card
- **Primary Display**: Shows Dinar (LYD) wallet balance only
- **Design**: Gradient yellow background with white text
- **Gold Balance Row**: Displays user's digital gold holdings in grams
- **Data Source**:
  - Dinar balance from `wallets` table (currency = 'LYD')
  - Gold grams from `digital_balances` table (metal_type = 'gold')

### 3. Live Price Cards
Two side-by-side cards showing current market prices:

**Gold Card**:
- Price in LYD per gram
- Percentage change (green if positive, red if negative)
- Up/down arrow indicator
- Amber/yellow color scheme

**Silver Card**:
- Price in LYD per gram
- Percentage change (green if positive, red if negative)
- Up/down arrow indicator
- Gray color scheme

**Data Source**: `live_prices` table

### 4. Quick Actions Grid
Four circular buttons providing fast access to key features:

1. **Transfer**: Navigate to wallet transfers
2. **Pickup**: Book appointment for physical gold pickup
3. **Scan**: Scan bullion serial numbers
4. **Store**: Browse and purchase gold/silver

### 5. Promotion Card
- **Design**: Dark gray/black background with decorative circle
- **Content**: Welcome message and call-to-action
- **Button**: "Shop Now" - navigates to Market page
- **Purpose**: Highlight special offers and encourage purchases

### 6. Recent Transactions
Displays the 3 most recent transactions with:

**Transaction Card Details**:
- Icon based on transaction type:
  - Download icon (green) for deposits and incoming transfers
  - Store icon (red) for purchases
  - Send icon (red) for outgoing transfers
- Description/type of transaction
- Date in readable format
- Amount with + or - prefix
- Color coding: green for positive, red for negative

**Transaction Types**:
- `deposit`: Incoming money
- `purchase`: Buying gold/silver
- `transfer_in`: Receiving from another user
- `transfer_out`: Sending to another user
- `withdrawal`: Taking money out

**Data Source**: `transactions` table (limited to 3, ordered by date DESC)

## Database Integration

### Data Loading
The page loads data from multiple tables simultaneously using `Promise.all()`:

```typescript
const [walletsData, digitalData, txData, pricesData] = await Promise.all([
  walletService.getWallets(user.id),
  walletService.getDigitalBalances(user.id),
  walletService.getTransactions(user.id, 3),
  marketService.getLivePrices(),
]);
```

### Tables Used
1. **wallets**: User's fiat currency balances (LYD, USD)
2. **digital_balances**: Digital gold and silver holdings
3. **transactions**: Transaction history
4. **live_prices**: Current market prices for gold and silver
5. **profiles**: User's personal information

## Loading States
- Shows spinner while data is loading
- Graceful handling of missing data
- Fallback values (e.g., "0.00g" if no gold balance)

## Navigation Flow

### From Home Page:
- **Avatar** → Profile page
- **Transfer** → Wallet page (transfer subpage)
- **Pickup** → Wallet page (appointments subpage)
- **Scan** → Home page (scan subpage)
- **Store** → Market page
- **Shop Now button** → Market page

### To Home Page:
- Bottom navigation "Home" tab
- Default landing page after login

## Styling & UX

### Design Elements
- Gradient backgrounds for emphasis
- Card-based layout with shadows
- Consistent spacing and padding
- Hover effects on interactive elements
- Smooth animations on page load

### Dark Mode Support
- All colors have dark mode variants
- Proper contrast for readability
- Seamless theme switching

### Responsive Design
- Mobile-first approach
- Maximum width: 448px (md breakpoint)
- Grid layouts adapt to screen size
- Touch-friendly button sizes

## Testing the Home Page

### Manual Testing Steps
1. **Create an account** and log in
2. **View default state** (zero balances, no transactions)
3. **Add sample data** using the database function:
   ```sql
   SELECT create_sample_user_data('your-user-id-here');
   ```
4. **Refresh page** to see populated data:
   - Balance: 12,500.75 LYD
   - Gold: 15.75g
   - Several transactions
5. **Test navigation** by clicking:
   - Avatar (should go to profile)
   - Quick action buttons
   - Shop Now button

### Expected Behavior
- ✅ All data loads within 2 seconds
- ✅ Live prices show current market rates
- ✅ Transaction icons match their types
- ✅ Currency formatting is correct
- ✅ Date formatting is readable
- ✅ No console errors
- ✅ Smooth transitions between pages

## Adding Sample Data

To populate a user account with test data, run this SQL command in Supabase:

```sql
-- Replace 'user-uuid' with actual user ID from auth.users table
SELECT create_sample_user_data('user-uuid');
```

This will:
- Set LYD wallet to 12,500.75
- Set USD wallet to 2,500.00
- Set gold balance to 15.75g
- Set silver balance to 120.50g
- Create 5 sample transactions

## Performance Considerations

### Optimization
- Parallel data fetching using `Promise.all()`
- Limited transaction query (only 3 records)
- Efficient database queries with proper indexes
- Minimal re-renders with proper state management

### Future Improvements
1. Add caching for live prices (update every minute)
2. Implement pull-to-refresh
3. Add skeleton loaders instead of spinner
4. Real-time updates using Supabase subscriptions
5. Pagination for transactions
6. Export transaction history

## Error Handling

### Current Implementation
- Console logs errors for debugging
- Falls back to zero/empty values
- No user-facing error messages yet

### Recommended Additions
1. Toast notifications for errors
2. Retry mechanism for failed requests
3. Offline mode detection
4. Error boundary component
5. Detailed error logging service

## Related Files
- `/src/pages/HomePage.tsx` - Main component
- `/src/services/wallet.service.ts` - Wallet & transaction data
- `/src/services/market.service.ts` - Price data
- `/src/utils/format.ts` - Formatting helpers
- `/src/components/ui/Card.tsx` - Reusable card component
