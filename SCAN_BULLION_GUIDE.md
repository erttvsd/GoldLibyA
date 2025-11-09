# Scan Bullion Feature - Gold Trading Application

## Overview
The Scan Bullion feature provides advanced authentication verification using visual fingerprinting technology. Users can scan physical bullion bars with their phone camera to verify authenticity against a secure database of registered bullion fingerprints.

## Access Points

### Floating Action Button (FAB)
- **Location**: Centered above bottom navigation bar
- **Design**: Large yellow gradient circular button with Scan icon
- **Visibility**: Always visible on all main pages
- **Hover Effect**: Scales up to 110% on hover
- **Z-Index**: 40 (above bottom nav)

### Direct Navigation
- Route: `/scan` in app navigation
- Accessible via `navigate('scan')`

## Database Schema

### bullion_fingerprints Table
Stores unique fingerprint data for each verified bullion bar:

**Fields**:
- `id`: UUID primary key
- `product_id`: Link to products table
- `owned_asset_id`: Link to owned assets (optional)
- `image_hash`: Unique hash of visual fingerprint
- `visual_pattern`: JSON object with texture, reflectivity, patterns
- `surface_texture_hash`: Additional texture identifier
- `weight_signature`: Weight-based verification
- `dimension_signature`: Size/dimension markers
- `scan_date`: When fingerprint was created
- `scanner_device`: Device used for registration
- `scanner_location`: Where it was scanned
- `confidence_score`: Fingerprint quality (0-100)
- `reference_image_url`: Primary reference image
- `detail_images`: JSON array of additional angles

**Security**:
- RLS enabled
- Anyone authenticated can read (for verification)
- Authenticated users can insert (for registration)

### scan_history Table
Records all scan attempts and their results:

**Fields**:
- `id`: UUID primary key
- `user_id`: Who performed the scan
- `scanned_image_url`: Image that was scanned
- `scanned_image_hash`: Hash of scanned image
- `scan_type`: verification | registration | inspection
- `verification_result`: genuine | counterfeit | uncertain | no_match
- `matched_fingerprint_id`: Link to matched fingerprint
- `matched_product_id`: Link to matched product
- `matched_asset_id`: Link to matched asset
- `similarity_score`: Match confidence (0-100)
- `scan_location`: JSON with GPS/location data
- `device_info`: JSON with device details
- `notes`: Optional user notes
- `created_at`: Timestamp

**Security**:
- RLS enabled
- Users can only view/create their own scans

## Main Scan Page

### Initial State

**Header**:
- "Scan Bullion" title
- History button (top right)

**Feature Card**:
- Yellow gradient background
- Camera icon
- "Verify Authenticity" heading
- Description of scanning functionality

**Action Buttons**:
1. **Open Camera** (Primary)
   - Opens device camera
   - Environment-facing (rear camera)
   - 1280x720 resolution

2. **Upload Photo** (Outline)
   - Opens file picker
   - Accepts image files
   - Alternative to live camera

**How It Works Section**:
Four-step guide:
1. Capture clear photo
2. AI analyzes visual fingerprint
3. Compares to database
4. Get instant verification

**Tips for Best Results**:
- Ensure good lighting
- Keep camera steady
- Capture entire bar surface
- Avoid glare and reflections

## Camera Mode

### Full-Screen Camera Interface

**Layout**:
- Black background
- Full-screen video feed
- Object-cover scaling

**Header Overlay** (top):
- Gradient background (black fade)
- "Scan Bullion" title
- X button to close

**Viewfinder** (center):
- 256x256px yellow border square
- Guides user to frame bullion
- Non-interactive overlay

**Bottom Controls**:
- Black background padding
- "Capture Photo" primary button
- Camera icon
- Full width

**Functionality**:
```typescript
// Request camera access
navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'environment',
    width: 1280,
    height: 720
  }
})
```

**Capture Process**:
1. Draw video frame to hidden canvas
2. Convert to JPEG (90% quality)
3. Generate data URL
4. Stop camera stream
5. Begin processing

## Image Processing

### Hash Generation
```typescript
// Simple hash for demo (production would use perceptual hashing)
generateImageHash(imageData: string): string {
  const hashValue = imageData
    .slice(0, 100)
    .split('')
    .reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
  return Math.abs(hashValue).toString(16);
}
```

### Fingerprint Comparison
```typescript
// Compare scanned hash to database fingerprints
1. Fetch all fingerprints from database
2. Calculate similarity score for each
3. Find best match
4. Determine verification result based on score
```

### Similarity Scoring

**Score Thresholds**:
- **≥ 90%**: Genuine (green)
  - High confidence match
  - Verified authentic bullion

- **70-89%**: Uncertain (yellow)
  - Partial match found
  - Manual verification recommended

- **50-69%**: Counterfeit (red)
  - Low similarity score
  - Potential fake detected

- **< 50%**: No Match (gray)
  - Not in database
  - May be unregistered

## Verification Results

### Result Display

**Success/Failure Icon**:
- Genuine: Green check circle (20x20)
- Counterfeit: Red X circle
- Uncertain: Yellow warning triangle
- No Match: Gray warning triangle

**Result Card**:
Title and message based on result:

**Genuine**:
- Title: "Genuine Bullion ✓"
- Message: "This bullion matches our verified database. The fingerprint analysis confirms authenticity."
- Color: Green

**Counterfeit**:
- Title: "Potential Counterfeit ✗"
- Message: "This bullion does not match our verified database. Exercise caution and contact support."
- Color: Red

**Uncertain**:
- Title: "Uncertain Match"
- Message: "The scan shows similarities to our database but confidence is low. Manual verification recommended."
- Color: Yellow

**No Match**:
- Title: "No Match Found"
- Message: "This bullion is not in our database. It may be from another source or needs registration."
- Color: Gray

### Scanned Image Display
- Full width rounded image
- Shows captured photo
- User can verify framing

### Details Card

**Information Displayed**:
- Confidence Score: X.X%
- Similarity: X.X%
- Scan ID: First 8 characters
- Matched Product: Name (if found)
- Weight: Xg (if matched)
- Serial Number: (if asset matched)

**Additional Actions**:
- "View Full Details" button (if asset matched)
  - Opens BullionDetailsModal
  - Shows complete asset information
  - Includes XRF analysis
  - Ownership history

- "Scan Another" button
  - Resets scan state
  - Returns to initial page

## Scan History

### Access
- Click "History" button (top right)
- Shows last 10 scans
- Most recent first

### History Item Card

**Layout**:
- Left: Result icon + details
- Right: Confidence score

**Information**:
- Result type (capitalized)
- Scan date (formatted)
- Matched product name (if any)
- Similarity percentage
- "confidence" label

**Empty State**:
- "No scan history yet" message
- Centered in card

### Navigation
- X button (top right) to close
- Returns to main scan page

## Processing State

### Loading Overlay

**When Active**:
- Scanning = true
- Fixed fullscreen overlay
- Black 50% opacity background
- Centered card

**Content**:
- Spinning loader (16x16 yellow)
- "Analyzing Fingerprint..." text
- Count of bullion in database
- Example: "Comparing against 50+ verified bullion"

**Duration**:
- 2 second simulated delay
- Real implementation would be actual processing time

## Technical Implementation

### Camera Access

**Permissions**:
- Requests `getUserMedia` permission
- Environment-facing camera preferred
- Falls back gracefully if denied

**Error Handling**:
```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({...});
} catch (error) {
  alert('Please allow camera access to scan bullion');
}
```

### File Upload Alternative

**File Input**:
- Hidden input element
- Triggered by "Upload Photo" button
- Accepts `image/*`

**Processing**:
```typescript
const reader = new FileReader();
reader.onload = (e) => {
  const imageData = e.target?.result as string;
  processImage(imageData);
};
reader.readAsDataURL(file);
```

### Database Integration

**Reading Fingerprints**:
```typescript
const { data: fingerprints } = await supabase
  .from('bullion_fingerprints')
  .select(`
    *,
    product:products(*),
    owned_asset:owned_assets(*)
  `)
  .limit(50);
```

**Recording Scan**:
```typescript
await supabase.from('scan_history').insert({
  user_id: user.id,
  scanned_image_url: 'data:image/jpeg',
  scanned_image_hash: hash,
  scan_type: 'verification',
  verification_result: result.result,
  matched_fingerprint_id: match?.id,
  similarity_score: score,
  device_info: { userAgent: navigator.userAgent }
});
```

## Business Rules

### Verification Thresholds
- **90%+ = Genuine**: High confidence authentic
- **70-89% = Uncertain**: Needs manual review
- **50-69% = Counterfeit**: Likely fake
- **< 50% = No Match**: Not registered

### Data Privacy
- Images not permanently stored (data URLs only)
- Scan history user-specific
- RLS enforces data isolation
- Device info captured for auditing

### Security Measures
- All scans logged with timestamps
- Device fingerprinting
- User association required
- Audit trail maintained

## Production Enhancements

### Advanced Fingerprinting
Current implementation uses simple hashing. Production should include:

1. **Perceptual Hashing**
   - pHash algorithm
   - Rotation/scale invariant
   - Lighting compensation

2. **Computer Vision**
   - Edge detection
   - Pattern recognition
   - Texture analysis
   - Surface defect mapping

3. **Multi-Factor Verification**
   - Visual fingerprint
   - Weight verification
   - Dimension matching
   - RFID/NFC chip reading

4. **Machine Learning**
   - Train on genuine samples
   - Detect counterfeit patterns
   - Continuous improvement
   - Anomaly detection

### Image Quality Checks
```typescript
// Pre-processing validation
- Check image resolution (min 800x600)
- Verify lighting conditions
- Detect blur/motion
- Ensure bar is centered
- Validate focus quality
```

### Real-Time Feedback
```typescript
// During camera mode
- Show quality indicators
- Guide user positioning
- Indicate when ready to capture
- Auto-capture when optimal
```

### Blockchain Integration
```typescript
// Immutable verification records
- Store scan hashes on blockchain
- Timestamp verification
- Provenance tracking
- Tamper-proof audit trail
```

## Testing Scenarios

### Test Camera Scanning
1. Click FAB scan button
2. Allow camera permission
3. Point at bullion mockup
4. Frame in viewfinder
5. Click "Capture Photo"
6. Wait for processing
7. View result

### Test File Upload
1. Navigate to scan page
2. Click "Upload Photo"
3. Select bullion image
4. Wait for processing
5. Verify result displayed

### Test Genuine Match
1. Upload/scan image
2. System finds ≥90% match
3. Green check displayed
4. Product details shown
5. "View Full Details" available

### Test Counterfeit Detection
1. Upload suspicious image
2. System finds 50-69% match
3. Red X displayed
4. Warning message shown
5. Advised to contact support

### Test Scan History
1. Perform multiple scans
2. Click "History" button
3. See scan list
4. Verify most recent first
5. Check scores displayed
6. Close history

### Test No Match
1. Upload unregistered image
2. System finds <50% match
3. Gray warning displayed
4. "No Match Found" message
5. Registration suggested

## Future Features

### 1. AR Overlay
- Real-time verification during camera view
- Instant feedback before capture
- Overlay match confidence
- Guide optimal positioning

### 2. Batch Scanning
- Scan multiple bars in sequence
- Queue processing
- Bulk verification report
- Export results

### 3. Offline Mode
- Download fingerprint database
- Local processing
- Sync when online
- Cached results

### 4. QR Code Integration
- Scan QR first
- Pre-filter database
- Faster matching
- Linked verification

### 5. Social Verification
- Crowd-sourced validation
- Community reporting
- Reputation scoring
- Expert verification network

### 6. Integration APIs
- Third-party verification
- Jeweler tools
- Exchange integration
- Customs verification

## Related Files

**Main Component**:
- `/src/pages/ScanBullionPage.tsx` - Complete scan interface

**Database**:
- `bullion_fingerprints` table - Fingerprint storage
- `scan_history` table - Scan records

**Integration**:
- `/src/App.tsx` - FAB and navigation
- `/src/components/wallet/WalletModals.tsx` - Details modal
- `/src/lib/supabase.ts` - Database connection

## Performance Considerations

### Current
- 2-second simulated processing
- Load 50 fingerprints at once
- Simple hash comparison
- In-memory processing

### Optimizations
1. **Lazy Loading**: Load fingerprints on demand
2. **Caching**: Cache recent fingerprints
3. **Worker Threads**: Process in background
4. **Progressive Results**: Show partial matches
5. **Image Compression**: Reduce upload size
6. **CDN Storage**: Faster image retrieval
