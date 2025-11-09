# News Page - Gold Trading Application

## Overview
The News page provides comprehensive financial information including currency exchange rates, gold prices (local and global), and market news. All data is loaded from the Supabase database in real-time.

## Features

### 1. USD Exchange Rates

**Two Rate Types Displayed**:
- **Parallel Market Rate**: The unofficial/black market exchange rate
- **Official Rate**: The government-set exchange rate

**Rate Card Details**:
- Exchange rate in LYD (e.g., 6.85 LYD per USD)
- Percentage change from previous day
- Color-coded change indicator:
  - Green with up arrow for positive change
  - Red with down arrow for negative change
- Dollar icon for visual identification
- Primary rate (parallel) highlighted with bold text

**Difference Display**:
- Shows the spread between parallel and official rates
- Calculated difference in LYD
- Percentage spread for comparison
- Color-coded in red to indicate premium

**Data Source**: `usd_rates` table
- `rate_type`: 'parallel' or 'official'
- `rate_lyd`: Exchange rate value
- `change_percent`: Daily percentage change
- `updated_at`: Last update timestamp

### 2. Local Gold Prices (Libya)

**Comprehensive Price Table**:

Displays gold prices for all common karats traded in Libya:
- **24K Gold**: 99.9% pure gold (highest price)
- **22K Gold**: 91.6% pure (common for jewelry)
- **21K Gold**: 87.5% pure (popular in Middle East)
- **18K Gold**: 75% pure (most affordable)

**Table Columns**:
1. **Karat**: Gold purity indicator (yellow color-coded)
2. **LYD/Gram**: Price per gram in Libyan Dinars
3. **Change**: Daily percentage change with trend indicator

**Features**:
- Monospaced font for price alignment
- Hover effect on rows for better UX
- Sorted by karat (highest to lowest)
- Change indicators with up/down arrows
- Color-coded changes (green = up, red = down)

**Data Source**: `local_gold_prices` table
- `karat`: Gold purity (24, 22, 21, 18)
- `price_lyd_per_gram`: Current price
- `change_percent`: Daily change
- `updated_at`: Last update time

### 3. Global Gold Prices

**International Market Comparison**:

Shows gold prices from major international markets:
- **Turkey**: Turkish gold market
- **UAE**: Dubai/Emirates market
- **London**: London Bullion Market (LBMA)

**Table Columns**:
1. **Market**: Country/region with flag emoji
2. **USD/Gram**: Price per gram in US Dollars
3. **Change**: Daily percentage change with indicator

**Features**:
- Country flags for visual identification:
  - 🇹🇷 Turkey
  - 🇦🇪 UAE
  - 🇬🇧 London
- Prices in USD for international comparison
- Monospaced font for price values
- Consistent change indicators
- Alphabetically sorted by market

**Data Source**: `global_gold_prices` table
- `market`: Market name/location
- `price_usd_per_gram`: Current USD price
- `change_percent`: Daily change
- `updated_at`: Last update time

### 4. Market Updates (News Feed)

**News Article Cards**:

Displays recent market news and announcements with:
- Category-based icon
- Article title
- Summary/description
- Publication date
- Source attribution

**News Categories & Icons**:
- **market**: 📈 Blue trending up icon
- **gold**: 💰 Gold money bag emoji
- **currency**: 💵 Green dollar sign
- **economy**: 📊 Chart emoji
- **announcement**: 📰 Yellow newspaper icon

**Card Layout**:
- Left side: Icon in rounded square background
- Right side: Content
  - Bold title
  - Gray summary text
  - Footer with date and source
- Hover effect for interactivity
- Chronological order (newest first)

**Data Source**: `news_articles` table
- `title`: Headline
- `summary`: Brief description
- `category`: Article type
- `source`: Publication name
- `published_at`: Publication timestamp

## Visual Design

### Color Coding System

**Change Indicators**:
- **Positive (Up)**: Green (#10B981)
  - Up arrow icon
  - "+" prefix on percentage
- **Negative (Down)**: Red (#EF4444)
  - Down arrow icon
  - Negative percentage
- **Neutral**: Gray (#6B7280)

**Rate Emphasis**:
- Parallel rate: Bold, prominent
- Official rate: Regular weight, slightly muted
- Difference: Red text to highlight spread

### Typography
- Headers: Bold, large (text-lg)
- Table headers: Semi-bold, uppercase-feeling
- Prices: Monospaced font (font-mono) for alignment
- Changes: Small text with icons
- Karat values: Yellow color for gold association

### Tables
- Clean borders with dark mode support
- Hover states on rows
- Responsive overflow with horizontal scroll
- Alternating row colors (subtle)
- Header row with gray background
- Proper spacing (px-4 py-3)

## Database Integration

### Data Loading Strategy
Parallel fetching of all data sources using `Promise.all()`:
```typescript
const [ratesData, localData, globalData, newsData] = await Promise.all([
  newsService.getUSDRates(),
  newsService.getLocalGoldPrices(),
  newsService.getGlobalGoldPrices(),
  newsService.getMarketNews(),
]);
```

### Optimizations
- Single database round-trip for all data
- Sorted queries at database level
- Limited news results (10 articles)
- Efficient re-renders with proper state management

### RLS Policies
All tables have public read access since financial data is public:
- `usd_rates`: Public read, admin write
- `local_gold_prices`: Public read, admin write
- `global_gold_prices`: Public read, admin write
- `news_articles`: Public read, admin write

## Business Logic

### Rate Calculations
```typescript
// Spread between parallel and official
const difference = parallelRate - officialRate;

// Percentage spread
const diffPercent = (difference / officialRate) * 100;
```

### Price Relationships
- 24K price is always highest
- Lower karats proportionally cheaper
- 18K ≈ 75% of 24K price
- Local prices factor in parallel USD rate

### Change Indicators
```typescript
const isPositive = change >= 0;
// Zero is considered positive (neutral)
```

## Testing the News Page

### Verify Data Display
1. Navigate to News tab
2. Check all sections load:
   - ✅ USD rates (both parallel and official)
   - ✅ Difference calculation displayed
   - ✅ Local gold prices (all 4 karats)
   - ✅ Global prices (3 markets)
   - ✅ News articles (5 sample articles)

### Verify Formatting
1. All prices display 2 decimal places
2. Percentages show + or - sign
3. Icons match categories
4. Dates are readable format
5. Tables are properly aligned

### Test Responsiveness
1. Resize browser window
2. Tables should scroll horizontally if needed
3. Cards stack properly on mobile
4. Text remains readable at all sizes

### Test Dark Mode
1. Toggle system dark mode
2. All text should have proper contrast
3. Tables maintain readability
4. Icons remain visible
5. Color indicators work in both themes

## Sample Data Provided

The migration includes realistic sample data:

**USD Rates**:
- Parallel: 6.85 LYD (+0.5%)
- Official: 4.80 LYD (0.0%)
- Spread: 2.05 LYD (42.71%)

**Local Gold Prices**:
- 24K: 425.50 LYD/g (+1.2%)
- 22K: 389.70 LYD/g (+1.1%)
- 21K: 371.80 LYD/g (+1.0%)
- 18K: 318.85 LYD/g (+0.9%)

**Global Prices**:
- Turkey: $67.50/g (+0.8%)
- UAE: $68.20/g (+0.9%)
- London: $69.15/g (+1.0%)

**News Articles**: 5 sample articles across different categories

## Future Enhancements

### Data Updates
1. Real-time price updates (WebSocket)
2. Historical charts
3. Price alerts
4. Push notifications for significant changes

### Features
1. Currency converter
2. Price comparison tools
3. News article detail pages
4. Save favorite articles
5. Share news items
6. Export price data
7. Custom alerts

### Analytics
1. Price trend analysis
2. Volatility indicators
3. Market sentiment
4. Correlation charts
5. Prediction models

## Performance Considerations

### Current
- Single batch data load on mount
- Efficient parallel queries
- Minimal re-renders
- Sorted at database level

### Optimizations
1. Cache rates for 5 minutes
2. Stale-while-revalidate strategy
3. Lazy load news articles
4. Infinite scroll for older articles
5. Service worker caching

## Error Handling

### Current Implementation
- Console logging for errors
- Loading spinner during fetch
- Graceful fallback to empty arrays
- No user-facing error messages

### Recommended Additions
1. Toast notifications for errors
2. Retry mechanism
3. Offline mode with cached data
4. Network status indicator
5. Last updated timestamp
6. Refresh button

## API Integration (Future)

### External Data Sources
1. Central Bank of Libya - Official rates
2. Parallel market aggregators
3. London Bullion Market - Global prices
4. News aggregation APIs
5. Social media sentiment

### Update Frequency
- USD rates: Every 30 minutes
- Gold prices: Every 15 minutes
- News: Real-time or hourly
- Historical data: Daily archive

## Related Files
- `/src/pages/NewsPage.tsx` - Main component
- `/src/services/news.service.ts` - Data fetching
- `/src/types/index.ts` - Type definitions
- `/src/utils/format.ts` - Formatting helpers
- `/src/components/ui/Card.tsx` - Reusable card component
- `/supabase/migrations/*_add_news_rates_tables_v2.sql` - Database schema

## Security Notes

### Public Data
- All financial data is public information
- No user-specific data displayed
- No authentication required for reading
- Safe to cache aggressively

### Admin Updates
- Only admins can update rates/prices
- Rate changes should be logged
- Audit trail for compliance
- Validation on price changes

## Compliance

### Financial Regulations
- Prices are informational only
- Not financial advice
- No guaranteed accuracy
- Updates may be delayed
- Include appropriate disclaimers

### Data Accuracy
- Source verification
- Multiple data points
- Regular audits
- Error correction process
- Transparency in methodology
