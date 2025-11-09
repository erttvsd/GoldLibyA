# Store/Business KYC System Guide

## Overview

When users select "Store Account" during registration, they must complete a comprehensive Business KYC (Know Your Customer) process before gaining full access to store features.

## Business KYC Components

### 1. Business Information
**Required Fields:**
- Business Legal Name *
- Business Type * (Sole Proprietorship, Partnership, LLC, Corporation, etc.)
- Registration Number *
- Tax ID / VAT Number *
- Registration Date *
- Registration Country *
- Industry Sector *
- Business Description *

**Optional Fields:**
- Trade Name (if different from legal name)
- Number of Employees
- Annual Revenue Range
- Business Website

### 2. Business Address & Contact
**Required:**
- Complete Business Address
- City
- Country
- Business Phone
- Business Email

**Optional:**
- State/Province
- Postal Code

### 3. Banking Information
All fields optional but recommended:
- Bank Name
- Account Number
- Branch
- IBAN

### 4. Compliance & Regulatory
**Required:**
- Source of Funds (Business Operations, Investments, Loans, etc.)
- Expected Monthly Volume (LYD)

**Conditional:**
- AML/CFT Policy Status
- If AML Policy exists:
  - Compliance Officer Name
  - Compliance Officer Email
  - Compliance Officer Phone

**Risk Assessment:**
- PEP (Politically Exposed Person) related checkbox
- High-risk industry checkbox

## KYC Status Workflow

```
pending → under_review → approved
                      → rejected
                      → requires_update → under_review
```

### Status Definitions:

1. **Pending**: Initial state, user can edit and save
2. **Under Review**: Submitted to compliance team, user cannot edit
3. **Approved**: KYC verified, full store access granted
4. **Rejected**: KYC failed verification, reason provided
5. **Requires Update**: Additional information needed

## Database Schema

### Main Tables

**store_kyc_details**
- Stores all business information
- One record per user
- Tracks approval status and reviewer

**store_kyc_documents**
- Stores uploaded documents
- Links to store_kyc_details
- Document types:
  - Business registration
  - Tax certificate
  - Trade license
  - Articles of incorporation
  - Proof of address
  - Bank statements
  - Audited financials
  - Owner ID documents
  - Authorization letters

**store_kyc_beneficial_owners**
- Ultimate Beneficial Owners (UBOs)
- Anyone owning >10% or controlling the business
- Personal info + ownership percentage
- PEP status tracking

**store_kyc_authorized_persons**
- Authorized signatories
- Transaction limits per person
- Authorization levels (full, limited, view_only)
- Active/inactive status

**store_kyc_verification_log**
- Audit trail of all KYC actions
- Tracks submissions, reviews, approvals, rejections

## User Flow

### For Store Account Registration:

1. **Select Account Type**: User chooses "Store Account"
2. **Complete Registration**: Basic auth.users creation
3. **Redirect to Store KYC**: Automatic navigation to Business KYC form
4. **Fill Business Information** (Step 1):
   - Legal name, type, registration details
   - Industry and description
5. **Add Address & Contact** (Step 2):
   - Physical address
   - Contact information
6. **Banking Details** (Step 3):
   - Optional but recommended
7. **Compliance Information** (Step 4):
   - Source of funds
   - AML policy status
   - Risk factors
8. **Save Progress**: Can save and return later
9. **Submit for Review**: When complete, submit to compliance
10. **Wait for Approval**: Compliance team reviews
11. **Access Granted**: Upon approval, full store console access

### Accessing Store KYC:

- **From Profile**: Click "Business KYC" (only for store accounts)
- **Status Badge**: Shows current status with color coding
  - Yellow: Pending
  - Blue: Under Review
  - Green: Approved
  - Red: Rejected
  - Orange: Requires Update

## Required Documents

### Minimum Required:
1. **Business Registration Certificate**
2. **Tax Registration Certificate**
3. **Owner's National ID** (front and back)
4. **Proof of Business Address** (utility bill, lease)

### Recommended:
- Trade License
- Bank Statement (last 3 months)
- Articles of Incorporation
- Memorandum of Association
- Board Resolution (for corporate entities)
- Shareholder Register
- AML/CFT Policy Document

## Beneficial Owners Requirements

According to AML regulations, you must declare all beneficial owners who:
- Own 10% or more of the company
- Exercise control over the company
- Are ultimate beneficial owners (UBOs)

**For each beneficial owner:**
- Full Name
- Date of Birth
- Nationality
- National ID / Passport
- Residential Address
- Ownership Percentage
- Position/Title
- PEP Status
- Supporting Documents

## Authorized Persons

Individuals authorized to act on behalf of the business:

**Authorization Levels:**
1. **Full**: Complete access, can sign contracts, approve all transactions
2. **Limited**: Restricted access, transaction limits apply
3. **View Only**: Read-only access to data

**For each authorized person:**
- Full Name
- Position/Title
- National ID
- Contact Information
- Authorization Level
- Transaction Limits (if applicable)
- Authorization Letter/Power of Attorney

## API Usage

### Check KYC Status:
```typescript
const { data } = await supabase
  .from('store_kyc_details')
  .select('status')
  .eq('user_id', userId)
  .single();

if (data?.status === 'approved') {
  // Grant store access
}
```

### Create/Update KYC:
```typescript
const kycData = {
  business_legal_name: 'ABC Trading LLC',
  business_type: 'limited_liability',
  registration_number: '123456',
  tax_id: 'TAX-123456',
  // ... other fields
};

await supabase
  .from('store_kyc_details')
  .upsert({ ...kycData, user_id: userId });
```

### Check if KYC Complete:
```sql
SELECT is_store_kyc_complete('<user_id>');
```

## Security & Privacy

### RLS Policies:
- Users can only view/edit their own KYC data
- Compliance team has separate admin access
- Document URLs are secured via Supabase Storage RLS
- Sensitive data encrypted at rest

### Data Retention:
- KYC data retained per regulatory requirements
- Document deletion requires compliance approval
- Audit logs maintained for all actions

## Compliance Notes

### For Compliance Officers:

Review checklist:
- [ ] Business registration verified
- [ ] Tax ID validated
- [ ] Owner identity confirmed
- [ ] Address proof verified
- [ ] All beneficial owners (>10%) declared
- [ ] PEP screening completed
- [ ] Source of funds reasonable
- [ ] Industry risk assessed
- [ ] AML policy reviewed (if applicable)

**Rejection Reasons:**
- Incomplete information
- Invalid documents
- Suspicious activity flags
- Failed PEP screening
- Address mismatch
- Beneficial owner issues

## Troubleshooting

### KYC Not Appearing:
1. Check account_type is 'store' in profiles table
2. Verify user is authenticated
3. Check RLS policies are enabled

### Cannot Submit:
1. Ensure all required fields filled
2. Check status is 'pending'
3. Verify at least one document uploaded

### Status Not Updating:
1. Check store_kyc_verification_log for errors
2. Verify compliance team has permissions
3. Check database triggers are active

## Integration with Store Console

Once KYC is **approved**:
- Store Console becomes accessible
- User can be assigned to stores (store_users table)
- Full store features unlocked
- Can manage inventory, appointments, POS, etc.

Before KYC approval:
- Limited profile access only
- Cannot access Store Console
- Cannot be assigned store roles
- Pending/rejected status shown on profile

## Next Steps After KYC Approval

1. Admin assigns user to a store:
```sql
INSERT INTO store_users (store_id, user_id, role)
VALUES ('<store_id>', '<user_id>', 'manager');
```

2. User can access Store Console from bottom navigation

3. Begin store operations:
   - Manage inventory
   - Process appointments
   - Handle customer transactions
   - Generate reports

---

## Summary

The Store KYC system ensures:
- ✅ Regulatory compliance (AML/CFT)
- ✅ Business identity verification
- ✅ Owner/beneficiary transparency
- ✅ Risk assessment and mitigation
- ✅ Audit trail maintenance
- ✅ Secure document storage
- ✅ Proper authorization levels

All store accounts must complete and maintain approved KYC status for continued access to store features.
