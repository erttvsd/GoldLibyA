import { useState, FormEvent } from 'react';
import {
  User,
  Mail,
  KeyRound,
  Calendar,
  FileText,
  Phone,
  MapPin,
  Building,
  DollarSign,
  HandCoins,
  TrendingUp,
  ArrowRight,
  UploadCloud,
} from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword, validatePhone, validateRequired } from '../utils/validation';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
  accountType: 'individual' | 'store';
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  nationalId: string;
  phone: string;
  address: string;
  employmentStatus: string;
  incomeSource: string;
  accountPurpose: string;
  monthlyTransactionVolume: string;
  idFront: File | null;
  idBack: File | null;
  selfie: File | null;
}

export const RegisterPage = ({ onNavigate, accountType }: RegisterPageProps) => {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    nationalId: '',
    phone: '',
    address: '',
    employmentStatus: '',
    incomeSource: '',
    accountPurpose: '',
    monthlyTransactionVolume: '',
    idFront: null,
    idBack: null,
    selfie: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    const firstNameError = validateRequired(formData.firstName, 'First name');
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateRequired(formData.lastName, 'Last name');
    if (lastNameError) newErrors.lastName = lastNameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    const dobError = validateRequired(formData.dateOfBirth, 'Date of birth');
    if (dobError) newErrors.dateOfBirth = dobError;

    const idError = validateRequired(formData.nationalId, 'National ID');
    if (idError) newErrors.nationalId = idError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    const addressError = validateRequired(formData.address, 'Address');
    if (addressError) newErrors.address = addressError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};

    const employmentError = validateRequired(formData.employmentStatus, 'Employment status');
    if (employmentError) newErrors.employmentStatus = employmentError;

    const incomeError = validateRequired(formData.incomeSource, 'Income source');
    if (incomeError) newErrors.incomeSource = incomeError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};

    const purposeError = validateRequired(formData.accountPurpose, 'Account purpose');
    if (purposeError) newErrors.accountPurpose = purposeError;

    const volumeError = validateRequired(formData.monthlyTransactionVolume, 'Transaction volume');
    if (volumeError) newErrors.monthlyTransactionVolume = volumeError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setStep((s) => Math.min(s + 1, 5));
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        nationalId: formData.nationalId,
        address: formData.address,
        employmentStatus: formData.employmentStatus,
        incomeSource: formData.incomeSource,
        accountPurpose: formData.accountPurpose,
        monthlyTransactionVolume: formData.monthlyTransactionVolume,
        accountType,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const FileUpload = ({ name, label }: { name: string; label: string }) => {
    const file = formData[name as keyof FormData] as File | null;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-yellow-500 transition">
          <div className="space-y-1 text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600 dark:text-gray-400">
              <label
                htmlFor={name}
                className="relative cursor-pointer rounded-md font-medium text-yellow-600 hover:text-yellow-500"
              >
                <span>{file ? file.name : 'Click to upload'}</span>
                <input
                  id={name}
                  name={name}
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    handleFileChange(name, selectedFile);
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              label="First Name"
              icon={User}
              name="firstName"
              placeholder="Ahmed"
              value={formData.firstName}
              onChange={handleInputChange}
              error={errors.firstName}
            />
            <Input
              label="Last Name"
              icon={User}
              name="lastName"
              placeholder="Mustafa"
              value={formData.lastName}
              onChange={handleInputChange}
              error={errors.lastName}
            />
            <Input
              label="Email"
              icon={Mail}
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
            />
            <Input
              label="Password"
              icon={KeyRound}
              type="password"
              name="password"
              placeholder="Min 8 characters"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              icon={KeyRound}
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
            />
            <Button onClick={nextStep} type="button" variant="primary" size="lg" fullWidth>
              Next
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Input
              label="Date of Birth"
              icon={Calendar}
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              error={errors.dateOfBirth}
            />
            <Input
              label="National ID"
              icon={FileText}
              name="nationalId"
              placeholder="119900123456"
              value={formData.nationalId}
              onChange={handleInputChange}
              error={errors.nationalId}
            />
            <Input
              label="Phone Number"
              icon={Phone}
              type="tel"
              name="phone"
              placeholder="091-123-4567"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
            />
            <Input
              label="Address"
              icon={MapPin}
              name="address"
              placeholder="Street, City, Country"
              value={formData.address}
              onChange={handleInputChange}
              error={errors.address}
            />
            <div className="flex space-x-4">
              <Button onClick={prevStep} type="button" variant="secondary" size="lg" fullWidth>
                Back
              </Button>
              <Button onClick={nextStep} type="button" variant="primary" size="lg" fullWidth>
                Next
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employment Status
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 pl-10 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none focus:ring-2"
                >
                  <option value="">Select employment status</option>
                  <option value="Employed">Employed</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Retired">Retired</option>
                  <option value="Student">Student</option>
                  <option value="Unemployed">Unemployed</option>
                </select>
              </div>
              {errors.employmentStatus && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.employmentStatus}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Income Source
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  name="incomeSource"
                  value={formData.incomeSource}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 pl-10 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none focus:ring-2"
                >
                  <option value="">Select income source</option>
                  <option value="Salary">Salary</option>
                  <option value="Business">Business</option>
                  <option value="Investments">Investments</option>
                  <option value="Pension">Pension</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {errors.incomeSource && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.incomeSource}</p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button onClick={prevStep} type="button" variant="secondary" size="lg" fullWidth>
                Back
              </Button>
              <Button onClick={nextStep} type="button" variant="primary" size="lg" fullWidth>
                Next
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Purpose
              </label>
              <div className="relative">
                <HandCoins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  name="accountPurpose"
                  value={formData.accountPurpose}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 pl-10 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none focus:ring-2"
                >
                  <option value="">Select account purpose</option>
                  <option value="Savings">Savings</option>
                  <option value="Investment">Investment</option>
                  <option value="Trading">Trading</option>
                  <option value="Business">Business</option>
                </select>
              </div>
              {errors.accountPurpose && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.accountPurpose}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Monthly Transaction Volume
              </label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  name="monthlyTransactionVolume"
                  value={formData.monthlyTransactionVolume}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 pl-10 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none focus:ring-2"
                >
                  <option value="">Select volume range</option>
                  <option value="Less than 1,000 LYD">Less than 1,000 LYD</option>
                  <option value="1,000 - 5,000 LYD">1,000 - 5,000 LYD</option>
                  <option value="5,000 - 20,000 LYD">5,000 - 20,000 LYD</option>
                  <option value="More than 20,000 LYD">More than 20,000 LYD</option>
                </select>
              </div>
              {errors.monthlyTransactionVolume && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.monthlyTransactionVolume}</p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button onClick={prevStep} type="button" variant="secondary" size="lg" fullWidth>
                Back
              </Button>
              <Button onClick={nextStep} type="button" variant="primary" size="lg" fullWidth>
                Next
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload your identification documents for KYC verification (optional for now)
            </p>

            <FileUpload name="idFront" label="ID Card (Front)" />
            <FileUpload name="idBack" label="ID Card (Back)" />
            <FileUpload name="selfie" label="Selfie with ID" />

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <Button onClick={prevStep} type="button" variant="secondary" size="lg" fullWidth>
                Back
              </Button>
              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                Create Account
              </Button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  const progress = (step / 5) * 100;

  return (
    <div className="p-4 animate-fade-in flex flex-col min-h-screen">
      <header className="flex items-center justify-between mb-4">
        <button
          onClick={() => (step === 1 ? onNavigate('login') : prevStep())}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowRight className="text-gray-600 dark:text-gray-300 rotate-180" />
        </button>
        <h1 className="text-xl font-bold">Create New Account</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
          {step}/5
        </span>
      </header>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
        <div
          className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-grow overflow-y-auto">{renderStep()}</div>
    </div>
  );
};
