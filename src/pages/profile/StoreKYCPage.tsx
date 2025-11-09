import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Upload, Plus, X, CheckCircle, AlertCircle, Store } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { storeKycService } from '../../services/storeKyc.service';
import { useAuth } from '../../contexts/AuthContext';

interface StoreKYCPageProps {
  onBack: () => void;
}

export const StoreKYCPage = ({ onBack }: StoreKYCPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [kycData, setKycData] = useState<any>(null);
  const [formData, setFormData] = useState({
    // Business Information
    business_legal_name: '',
    business_trade_name: '',
    business_type: 'limited_liability',
    registration_number: '',
    tax_id: '',
    registration_date: '',
    registration_country: 'Libya',

    // Business Address
    business_address: '',
    business_city: '',
    business_state: '',
    business_postal_code: '',
    business_country: 'Libya',

    // Contact
    business_phone: '',
    business_email: '',
    business_website: '',

    // Business Details
    industry_sector: '',
    number_of_employees: '',
    annual_revenue_range: '0-100k',
    business_description: '',

    // Banking
    bank_name: '',
    bank_account_number: '',
    bank_branch: '',
    iban: '',

    // Regulatory
    is_pep_related: false,
    pep_details: '',
    is_high_risk_industry: false,
    risk_mitigation_measures: '',

    // Source of Funds
    source_of_funds: 'business_operations',
    source_of_funds_details: '',
    expected_monthly_volume_lyd: '',

    // Compliance
    aml_policy_in_place: false,
    compliance_officer_name: '',
    compliance_officer_email: '',
    compliance_officer_phone: '',
  });

  const [beneficialOwners, setBeneficialOwners] = useState<any[]>([]);
  const [authorizedPersons, setAuthorizedPersons] = useState<any[]>([]);

  useEffect(() => {
    loadKYC();
  }, [user]);

  const loadKYC = async () => {
    if (!user) return;

    try {
      const { data, error } = await storeKycService.getKycDetails(user.id);

      if (error) throw error;

      if (data) {
        setKycData(data);
        setFormData(data);

        // Load related data
        const [ubosRes, authRes] = await Promise.all([
          storeKycService.getBeneficialOwners(data.id),
          storeKycService.getAuthorizedPersons(data.id),
        ]);

        if (ubosRes.data) setBeneficialOwners(ubosRes.data);
        if (authRes.data) setAuthorizedPersons(authRes.data);
      }
    } catch (error) {
      console.error('Error loading KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { data, error } = await storeKycService.upsertKyc(user.id, formData);

      if (error) throw error;
      if (data) setKycData(data);

      alert('Saved successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!kycData || !user) {
      alert('Please save your information first');
      return;
    }

    try {
      await storeKycService.submitForReview(kycData.id, user.id);
      alert('Submitted for review! Your store will be created automatically once approved.');
      loadKYC();
    } catch (error: any) {
      alert(error.message || 'Failed to submit');
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft} className="mb-4">
          Back
        </Button>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  const renderBusinessInfo = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Business Information</h3>

      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Business Legal Name *"
          value={formData.business_legal_name}
          onChange={(e) => setFormData({ ...formData, business_legal_name: e.target.value })}
          placeholder="ABC Trading LLC"
          required
        />

        <Input
          label="Trade Name (if different)"
          value={formData.business_trade_name}
          onChange={(e) => setFormData({ ...formData, business_trade_name: e.target.value })}
          placeholder="ABC Store"
        />

        <div>
          <label className="block text-sm font-medium mb-2">Business Type *</label>
          <select
            value={formData.business_type}
            onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
          >
            <option value="sole_proprietorship">Sole Proprietorship</option>
            <option value="partnership">Partnership</option>
            <option value="limited_liability">Limited Liability Company</option>
            <option value="corporation">Corporation</option>
            <option value="cooperative">Cooperative</option>
            <option value="non_profit">Non-Profit</option>
          </select>
        </div>

        <Input
          label="Registration Number *"
          value={formData.registration_number}
          onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
          placeholder="123456789"
          required
        />

        <Input
          label="Tax ID / VAT Number *"
          value={formData.tax_id}
          onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
          placeholder="TAX-123456"
          required
        />

        <Input
          label="Registration Date *"
          type="date"
          value={formData.registration_date}
          onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
          required
        />

        <Input
          label="Industry Sector *"
          value={formData.industry_sector}
          onChange={(e) => setFormData({ ...formData, industry_sector: e.target.value })}
          placeholder="Precious Metals Trading"
          required
        />

        <Input
          label="Number of Employees"
          type="number"
          value={formData.number_of_employees}
          onChange={(e) => setFormData({ ...formData, number_of_employees: e.target.value })}
          placeholder="10"
        />

        <div>
          <label className="block text-sm font-medium mb-2">Annual Revenue Range</label>
          <select
            value={formData.annual_revenue_range}
            onChange={(e) => setFormData({ ...formData, annual_revenue_range: e.target.value })}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
          >
            <option value="0-100k">0 - 100,000 LYD</option>
            <option value="100k-500k">100,000 - 500,000 LYD</option>
            <option value="500k-1m">500,000 - 1,000,000 LYD</option>
            <option value="1m-5m">1,000,000 - 5,000,000 LYD</option>
            <option value="5m+">5,000,000+ LYD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Business Description *</label>
          <textarea
            value={formData.business_description}
            onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
            rows={4}
            placeholder="Describe your business activities..."
            required
          />
        </div>
      </div>
    </div>
  );

  const renderAddressContact = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Business Address & Contact</h3>

      <Input
        label="Business Address *"
        value={formData.business_address}
        onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
        placeholder="123 Main Street"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City *"
          value={formData.business_city}
          onChange={(e) => setFormData({ ...formData, business_city: e.target.value })}
          placeholder="Tripoli"
          required
        />

        <Input
          label="State/Province"
          value={formData.business_state}
          onChange={(e) => setFormData({ ...formData, business_state: e.target.value })}
          placeholder="Tripoli"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Postal Code"
          value={formData.business_postal_code}
          onChange={(e) => setFormData({ ...formData, business_postal_code: e.target.value })}
          placeholder="12345"
        />

        <Input
          label="Country *"
          value={formData.business_country}
          onChange={(e) => setFormData({ ...formData, business_country: e.target.value })}
          placeholder="Libya"
          required
        />
      </div>

      <Input
        label="Business Phone *"
        value={formData.business_phone}
        onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
        placeholder="+218-91-123-4567"
        required
      />

      <Input
        label="Business Email *"
        type="email"
        value={formData.business_email}
        onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
        placeholder="info@company.com"
        required
      />

      <Input
        label="Website"
        value={formData.business_website}
        onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
        placeholder="https://www.company.com"
      />
    </div>
  );

  const renderBanking = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Banking Information</h3>

      <Input
        label="Bank Name"
        value={formData.bank_name}
        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
        placeholder="National Bank of Libya"
      />

      <Input
        label="Account Number"
        value={formData.bank_account_number}
        onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
        placeholder="123456789"
      />

      <Input
        label="Branch"
        value={formData.bank_branch}
        onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
        placeholder="Main Branch"
      />

      <Input
        label="IBAN"
        value={formData.iban}
        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
        placeholder="LY12 3456 7890 1234 5678"
      />
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Compliance & Regulatory</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Source of Funds *</label>
        <select
          value={formData.source_of_funds}
          onChange={(e) => setFormData({ ...formData, source_of_funds: e.target.value })}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
        >
          <option value="business_operations">Business Operations</option>
          <option value="investments">Investments</option>
          <option value="loans">Loans</option>
          <option value="grants">Grants</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Source of Funds Details</label>
        <textarea
          value={formData.source_of_funds_details}
          onChange={(e) => setFormData({ ...formData, source_of_funds_details: e.target.value })}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
          rows={3}
          placeholder="Provide details about your source of funds..."
        />
      </div>

      <Input
        label="Expected Monthly Volume (LYD)"
        type="number"
        value={formData.expected_monthly_volume_lyd}
        onChange={(e) => setFormData({ ...formData, expected_monthly_volume_lyd: e.target.value })}
        placeholder="50000"
      />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.aml_policy_in_place}
          onChange={(e) => setFormData({ ...formData, aml_policy_in_place: e.target.checked })}
          className="w-4 h-4"
        />
        <label className="text-sm">AML/CFT Policy in Place</label>
      </div>

      {formData.aml_policy_in_place && (
        <>
          <Input
            label="Compliance Officer Name"
            value={formData.compliance_officer_name}
            onChange={(e) => setFormData({ ...formData, compliance_officer_name: e.target.value })}
            placeholder="John Doe"
          />

          <Input
            label="Compliance Officer Email"
            type="email"
            value={formData.compliance_officer_email}
            onChange={(e) => setFormData({ ...formData, compliance_officer_email: e.target.value })}
            placeholder="compliance@company.com"
          />

          <Input
            label="Compliance Officer Phone"
            value={formData.compliance_officer_phone}
            onChange={(e) => setFormData({ ...formData, compliance_officer_phone: e.target.value })}
            placeholder="+218-91-123-4567"
          />
        </>
      )}
    </div>
  );

  const renderStatus = () => {
    if (!kycData) return null;

    const statusConfig = {
      pending: { color: 'yellow', icon: AlertCircle, text: 'Pending Submission' },
      under_review: { color: 'blue', icon: AlertCircle, text: 'Under Review' },
      approved: { color: 'green', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'red', icon: AlertCircle, text: 'Rejected' },
      requires_update: { color: 'orange', icon: AlertCircle, text: 'Requires Update' },
    };

    const config = statusConfig[kycData.status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <>
        <Card className={`bg-${config.color}-50 dark:bg-${config.color}-900/20 border-${config.color}-200 dark:border-${config.color}-800`}>
          <div className="flex items-center space-x-3">
            <Icon className={`w-6 h-6 text-${config.color}-600`} />
            <div>
              <p className="font-semibold">Status: {config.text}</p>
              {kycData.rejection_reason && (
                <p className="text-sm mt-1">Reason: {kycData.rejection_reason}</p>
              )}
            </div>
          </div>
        </Card>

        {kycData.status === 'approved' && kycData.stores && (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Store Created Successfully!
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  <strong>{kycData.stores.name}</strong>
                </p>
                {kycData.cash_deposit_locations && (
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Location: {kycData.cash_deposit_locations.address}, {kycData.cash_deposit_locations.city}
                  </p>
                )}
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  You can now access the Store Console from the bottom navigation!
                </p>
              </div>
            </div>
          </Card>
        )}
      </>
    );
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <Building2 className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Store/Business KYC</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complete your business verification
          </p>
        </div>
      </div>

      {renderStatus()}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['Business Info', 'Address', 'Banking', 'Compliance'].map((label, idx) => (
          <button
            key={idx}
            onClick={() => setStep(idx + 1)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              step === idx + 1
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        {step === 1 && renderBusinessInfo()}
        {step === 2 && renderAddressContact()}
        {step === 3 && renderBanking()}
        {step === 4 && renderCompliance()}

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button onClick={handleSave} variant="primary" fullWidth disabled={saving}>
            {saving ? 'Saving...' : 'Save Progress'}
          </Button>
          {kycData && kycData.status === 'pending' && (
            <Button onClick={handleSubmitForReview} variant="outline" fullWidth>
              Submit for Review
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
