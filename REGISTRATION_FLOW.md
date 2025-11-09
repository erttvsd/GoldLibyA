# Registration Flow - Gold Trading Application

## Overview
The registration page is a comprehensive 5-step wizard that collects user information and stores it in the Supabase database.

## Registration Steps

### Step 1: Account Creation
- **Fields**: First Name, Last Name, Email, Password, Confirm Password
- **Validation**:
  - Email format validation
  - Password must be at least 8 characters with uppercase, lowercase, and number
  - Passwords must match
- **Database**: Creates user in Supabase Auth

### Step 2: Personal Information
- **Fields**: Date of Birth, National ID, Phone Number, Address
- **Validation**:
  - All fields required
  - Phone number format validation
- **Database**: Stored in `profiles` table

### Step 3: Employment & Income (AML Compliance)
- **Fields**: Employment Status, Primary Income Source
- **Options**:
  - Employment: Employed, Self-employed, Retired, Student, Unemployed
  - Income: Salary, Business, Investments, Pension, Other
- **Database**: Stored in `kyc_details` table

### Step 4: Account Details (AML Compliance)
- **Fields**: Account Purpose, Expected Monthly Transaction Volume
- **Options**:
  - Purpose: Savings, Investment, Trading, Business
  - Volume: <1,000 LYD, 1,000-5,000 LYD, 5,000-20,000 LYD, >20,000 LYD
- **Database**: Stored in `kyc_details` table

### Step 5: Document Upload (Optional)
- **Fields**: ID Card Front, ID Card Back, Selfie with ID
- **Storage**: Files can be uploaded to Supabase Storage
- **Database**: URLs stored in `kyc_details` table

## Database Tables Created on Registration

### 1. Auth User
- Created by Supabase Auth automatically

### 2. profiles
```sql
- id (references auth.users)
- first_name
- last_name
- phone
- date_of_birth
- national_id
- address
- created_at
- updated_at
```

### 3. wallets (2 records created)
```sql
- user_id
- currency (LYD and USD)
- balance (initialized to 0)
- available_balance (initialized to 0)
- held_balance (initialized to 0)
```

### 4. digital_balances (2 records created)
```sql
- user_id
- metal_type (gold and silver)
- grams (initialized to 0)
```

### 5. kyc_details
```sql
- user_id
- employment_status
- income_source
- account_purpose
- expected_monthly_volume
- verification_status (set to 'pending')
- id_front_url (optional)
- id_back_url (optional)
- selfie_url (optional)
```

## Features

### Form Validation
- Real-time validation on all fields
- Custom error messages for each field
- Step-by-step validation before proceeding

### Progress Tracking
- Visual progress bar (0-100%)
- Step counter (1/5, 2/5, etc.)
- Back button to review previous steps

### Security
- Passwords are hashed by Supabase Auth
- Row Level Security (RLS) ensures users can only access their own data
- KYC documents stored securely in Supabase Storage

### User Experience
- Smooth animations between steps
- Dark mode support
- Mobile-first responsive design
- Loading states during submission
- Clear error messages

## Testing Registration

1. Navigate to the login page
2. Click "Create one" link
3. Fill out all 5 steps:
   - Step 1: Enter name, email, and password
   - Step 2: Enter personal details
   - Step 3: Select employment info
   - Step 4: Select account purpose
   - Step 5: Optionally upload documents
4. Click "Create Account"
5. User is automatically logged in upon success

## Backend Integration

The registration page integrates with:
- `authService.signUp()` - Creates user and all related records
- `kycService` - Handles KYC document uploads (optional)
- Supabase Auth - Manages authentication
- Supabase Database - Stores all user data

## Next Steps for Production

1. **Email Verification**: Enable email confirmation in Supabase
2. **Document Upload**: Implement actual file upload to Supabase Storage
3. **KYC Review**: Create admin panel to review and approve KYC documents
4. **Enhanced Validation**: Add more specific validation for National ID format
5. **Error Recovery**: Better handling of partial registration failures
6. **Testing**: Add comprehensive test coverage
