import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';

import {
  Home, Store, Newspaper, Wallet, User, Mail, KeyRound, ArrowRight, ShieldCheck,
  Eye, EyeOff, Building, DollarSign, FileText, Phone, MapPin, Calendar, HandCoins,
  TrendingUp, UploadCloud, ArrowRightLeft, PackageCheck, ScanLine, Filter, Sparkles,
  Search, ChevronDown, ChevronLeft, X, Building2, Ticket, Banknote, LogOut, UserCheck,
  HelpCircle, PhoneCall, Settings, CreditCard, Landmark, Globe, Bot, Send, Package,
  Info, Download, Clock, TriangleAlert, ShieldAlert, BarChart2, CheckCircle, CircleAlert,
  Sun, Moon, Bell, Lock, Languages, Map, Camera, QrCode, CalendarDays, Repeat
} from 'lucide-react';

const mockData = {
  user: {
    firstName: "Ahmed",
    lastName: "Mustafa",
    profilePicture: "https://placehold.co/100x100/E2E8F0/4A5568?text=A",
  },
  kycDetails: {
    fullName: "Ahmed Mustafa Abdulsalam",
    dob: "1990-05-15",
    nationalId: "119900123456",
    phone: "091-123-4567",
    address: "Jamal Abdul Nasser St, Tripoli, Libya",
    email: "user@example.com",
    employmentStatus: "Employed",
    incomeSource: "Salary",
    accountPurpose: "Savings",
    monthlyTransactionVolume: "1,000 - 5,000 LYD",
    verificationStatus: "Verified",
  },
  livePrices: {
    gold: { price: 813.20, change: 0.5 },
    silver: { price: 9.12, change: -0.2 },
  },
  dollarPrices: {
    blackMarket: 7.60,
    official: 4.87,
  },
  goldPricesLYD: {
    '24 Karat': 813.20,
    '21 Karat': 711.55,
    '18 Karat': 609.90,
  },
  goldPricesUSD: {
    turkey: 107.50,
    uae: 107.25,
    london: 107.00,
  },
  marketNews: [
    { source: "Central Bank of Libya", text: "New adjustment in the official exchange rate of the dollar.", icon: Landmark },
    { source: "Economic Analysis", text: "Expectations of a global rise in gold prices during the next quarter.", icon: BarChart2 },
    { source: "App Updates", text: "A new security feature has been added to protect your account.", icon: ShieldAlert },
    { source: "Ministry of Economy", text: "New program to support merchants and small business owners.", icon: Building },
  ],
  wallet: {
    dinar: { balance: 12500.75, currency: "LYD" },
    dollar: { balance: 2500.00, currency: "USD" },
    transactionHistory: [
        { type: 'purchase', description: 'Bought 10g Gold Bar', amount: -8132.00, currency: 'LYD', date: new Date(new Date().setDate(new Date().getDate() - 1)) },
        { type: 'deposit', description: 'Cash Deposit', amount: 10000.00, currency: 'LYD', date: new Date(new Date().setDate(new Date().getDate() - 3))},
        { type: 'purchase', description: 'Bought 5.5g Digital Gold', amount: -4472.60, currency: 'LYD', date: new Date(new Date().setDate(new Date().getDate() - 5))},
        { type: 'transfer', description: 'Sent to Ali Al-Ahmed', amount: -100.00, currency: 'USD', date: new Date(new Date().setDate(new Date().getDate() - 7))},
    ]
  },
  digitalBalance: {
    goldGrams: 15.75,
    silverGrams: 120.50,
  },
  products: [
    { id: 'prod-g-1', name: "Gold Bar", carat: 24, weight: 1, price: 813.20, image: 'https://placehold.co/100x100/FFD700/000000?text=1g', type: 'gold', physical: true },
    { id: 'prod-g-5', name: "Gold Bar", carat: 24, weight: 5, price: 4066.00, image: 'https://placehold.co/100x100/FFD700/000000?text=5g', type: 'gold', physical: true },
    { id: 'prod-g-10', name: "Gold Bar", carat: 24, weight: 10, price: 8132.00, image: 'https://placehold.co/100x100/FFD700/000000?text=10g', type: 'gold', physical: true },
    { id: 'prod-g-50', name: "Gold Bar", carat: 24, weight: 50, price: 40660.00, image: 'https://placehold.co/100x100/FFD700/000000?text=50g', type: 'gold', physical: true },
    { id: 'prod-s-100', name: "Silver Bar", carat: 999, weight: 100, price: 912.00, image: 'https://placehold.co/100x100/C0C0C0/000000?text=100g', type: 'silver', physical: true },
    { id: 'prod-g-100', name: "Gold Bar", carat: 24, weight: 100, price: 81320.00, image: 'https://placehold.co/100x100/FFD700/000000?text=100g', type: 'gold', physical: true },
    { id: 'prod-s-500-o', name: "Silver Bar", carat: 999, weight: 500, price: 4560.00, image: 'https://placehold.co/100x100/C0C0C0/000000?text=500g', type: 'silver', physical: true },
  ],
  ownedAssets: [
    {
      id: "asset-12345",
      type: "gold",
      name: "Gold Bar",
      carat: 24,
      weight: 50,
      serialNumber: "AU-TR-24K-50G-XYZ123",
      image: "https://placehold.co/80x80/FFD700/000000?text=50g+Gold",
      owner: "Ahmed Mustafa",
      status: 'not_received',
      purchaseDetails: {
        invoiceId: "INV-2025-001",
        date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        price: 40660.00,
        commission: 609.90,
        paymentMethod: "wallet_dinar",
        store: "Central Gold Store - Tripoli",
        manufactureDate: "2023-01-10T10:00:00Z",
      },
      physicalProperties: { dimensions: "45x25x2mm", shape: "Rectangle" },
      xrfAnalysis: { gold: "99.99%", silver: "0.01%" , image: "https://placehold.co/200x100/eeeeee/000000?text=XRF+Scan" },
      origin: "Raw",
      packaging: "Sealed security envelope",
      qrCodeUrl: "https://example.com/qr/AU-TR-24K-50G-XYZ123"
    },
    {
      id: "asset-67890",
      type: "silver",
      name: "Silver Bar",
      carat: 999,
      weight: 100,
      serialNumber: "AG-LB-999-100G-ABC456",
      image: "https://placehold.co/80x80/C0C0C0/000000?text=100g+Silver",
      owner: "Ahmed Mustafa",
      status: 'received',
      purchaseDetails: {
        invoiceId: "INV-2025-002",
        date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        price: 912.00,
        commission: 13.68,
        paymentMethod: "cash",
        store: "Benghazi Branch",
        manufactureDate: "2022-11-20T10:00:00Z",
      },
      physicalProperties: { dimensions: "50x30x3mm", shape: "Rectangle" },
      xrfAnalysis: { silver: "99.9%", copper: "0.1%", image: "https://placehold.co/200x100/eeeeee/000000?text=XRF+Scan" },
      origin: "Recycled",
      packaging: "No packaging",
      qrCodeUrl: "https://example.com/qr/AG-LB-999-100G-ABC456"
    },
     {
      id: "asset-11223",
      type: "gold",
      name: "Gold Bar",
      carat: 24,
      weight: 10.5,
      serialNumber: "AU-TR-24K-10G-QWE789",
      image: "https://placehold.co/80x80/FFD700/000000?text=10.5g+Gold",
      owner: "Ahmed Mustafa",
      status: 'not_received',
      purchaseDetails: {
        invoiceId: "INV-2025-003",
        date: new Date().toISOString(),
        price: 8538.60,
        commission: 128.08,
        paymentMethod: "wallet_dollar",
        store: "Central Gold Store - Tripoli",
        manufactureDate: "2023-03-05T10:00:00Z",
      },
       physicalProperties: { dimensions: "20x10x1.5mm", shape: "Rectangle" },
       xrfAnalysis: { gold: "99.99%", silver: "0.01%", image: "https://placehold.co/200x100/eeeeee/000000?text=XRF+Scan" },
       origin: "Raw",
       packaging: "Sealed security envelope",
       qrCodeUrl: "https://example.com/qr/AU-TR-24K-10G-QWE789"
    },
  ],
  digitalAssets: {
    sharedGoldBarSN: 'KILO-BAR-AU-LB-007',
    sharedSilverBarSN: 'KILO-BAR-AG-LB-011',
  },
  pickupLocations: {
    tripoli: [{ id: 'store-tri-1', name: "Central Gold Store", address: "City Center, Tripoli", mapLink: "https://goo.gl/maps/example" }],
    benghazi: [{ id: 'store-ben-1', name: "Benghazi Branch", address: "Venicia St, Benghazi", mapLink: "https://goo.gl/maps/example" }],
    misrata: [{ id: 'store-mis-1', name: "Misrata Point of Sale", address: "Tripoli St, Misrata", mapLink: "https://goo.gl/maps/example" }],
  },
  inventory: {
    'store-tri-1': { 'prod-g-1': 50, 'prod-g-5': 20, 'prod-g-10': 15, 'prod-g-50': 5, 'prod-s-100': 30, 'prod-g-100': 2, 'prod-s-500-o': 0 },
    'store-ben-1': { 'prod-g-1': 30, 'prod-g-5': 15, 'prod-g-10': 10, 'prod-g-50': 2, 'prod-s-100': 50, 'prod-g-100': 0, 'prod-s-500-o': 1 },
    'store-mis-1': { 'prod-g-1': 20, 'prod-g-5': 10, 'prod-g-10': 5, 'prod-g-50': 1, 'prod-s-100': 20, 'prod-g-100': 1, 'prod-s-500-o': 1 },
  },
  cashDepositLocations: [
    { name: "MyTransfer Main Office - Tripoli", city: "Tripoli", address: "Omar Al-Mukhtar St", hours: "09:00 - 17:00" },
    { name: "Authorized Agent - Benghazi", city: "Benghazi", address: "Sidi Hussein Area", hours: "10:00 - 16:00" },
  ],
  bankAccounts: {
    local: { bankName: "Jumhouria Bank", accountName: "Gold Trading App", accountNumber: "001234567890123", instructions: "Please include your user ID in the notes field when transferring." },
    international: { bankName: "Bank of Valletta", beneficiary: "Gold Trading App Ltd.", iban: "MT88VALL22013000000040012345678", swift: "VALLMTMT", bankAddress: "Valletta, Malta", instructions: "Please use your account number as a payment reference." },
  },
  supportInfo: {
    phone: "1919",
    email: "support@goldapp.ly",
    address: "Tripoli Tower, 10th Floor, Tripoli, Libya",
    workingHours: "Sunday - Thursday, 09:00 - 17:00"
  },
  faq: [
    { q: "What is the difference between digital gold and physical bars?", a: "Digital gold is a share you own in a large, shared bar stored in our vaults. You can buy and sell it instantly. Physical bars are individual gold pieces with a unique serial number that you can pick up yourself." },
    { q: "How can I buy gold?", a: "From the 'Store' page, you can choose to buy 'digital gold' by the gram directly, or select a 'physical bar' of a specific weight. Follow the payment steps to complete the process." },
    { q: "Are there transaction fees?", a: "Yes, there is a small 1.5% commission on the purchase of physical bars. Buying digital gold is currently commission-free. There are also fees for services like changing the pickup location or delaying asset pickup." },
    { q: "How do I fund my wallet?", a: "From 'My Profile', select 'Fund Wallets', then choose the Dinar or Dollar wallet. You can fund via bank cards, transfers, coupons, or cash deposits at our agents." },
  ],
  promotions: [
      { id: 1, title: "5% Off Bullion", description: "For a limited time, get an instant discount when you buy any 24k gold bar.", buttonText: "Shop Now", page: "market" }
  ]
};

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState('home');
  const [subPage, setSubPage] = useState<string | null>(null);
  const [subPageProps, setSubPageProps] = useState({});
  const [authPage, setAuthPage] = useState('login');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.dir = 'ltr';
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navigate = (mainPage: string, sub: string | null = null, props = {}) => {
    setPage(mainPage);
    setSubPage(sub);
    setSubPageProps(props);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthPage('login');
    navigate('home');
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const contextValue = {
    isLoggedIn,
    page,
    subPage,
    subPageProps,
    authPage,
    darkMode,
    navigate,
    setAuthPage,
    handleLogin,
    handleLogout,
    toggleDarkMode
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

const Icon = ({ component: IconComponent, className = '' }: any) => {
  return <IconComponent className={`inline-block ${className}`} />;
};

const InputWithIcon = ({ icon, ...props }: any) => {
  return (
    <div className="relative">
      <input
        {...props}
        className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-lg p-3 pl-12 text-left focus:ring-2 focus:ring-amber-500 transition"
      />
      <div className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
        <Icon component={icon} />
      </div>
    </div>
  );
};

const SelectInput = ({ icon, children, ...props }: any) => (
    <div className="relative">
        <select
            {...props}
            className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-lg p-3 pl-12 text-left appearance-none focus:ring-2 focus:ring-amber-500 transition"
        >
            {children}
        </select>
        <div className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon component={icon} />
        </div>
        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon component={ChevronDown} />
        </div>
    </div>
);

const FileInput = ({ id, label, onFileSelect }: any) => {
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      onFileSelect(id, file);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <div className="space-y-1 text-center">
            <Icon component={UploadCloud} className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600 dark:text-gray-400">
              <p className="pr-1">
                {fileName ? <span className="text-green-500 font-semibold">{fileName}</span> : 'Click to upload'}
              </p>
              <input ref={inputRef} id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
    </div>
  );
};

const BottomNav = () => {
    const { page, navigate } = useContext(AppContext);
    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'market', label: 'Store', icon: Store },
        { id: 'news', label: 'News', icon: Newspaper },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30">
            <div className="flex justify-around">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={`flex flex-col items-center justify-center w-full p-3 transition-colors ${page === item.id ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400 hover:text-amber-400'}`}
                    >
                        <Icon component={item.icon} />
                        <span className="text-xs mt-1">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const DetailRow = ({ label, value, valueClass = "" }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-sm font-semibold text-gray-800 dark:text-gray-100 text-right ${valueClass}`}>{value}</p>
    </div>
);

const CollapsibleOption = ({ title, icon, children, defaultOpen = false }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <div className="flex items-center">
                    <Icon component={icon} className="w-5 h-5 mr-3 text-amber-600 dark:text-amber-400"/>
                    <span className="font-semibold">{title}</span>
                </div>
                 <Icon component={ChevronDown} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 border-t dark:border-gray-700 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    )
};

const LoginPage = () => {
  const { setAuthPage, handleLogin } = useContext(AppContext);
  const [showPassword, setShowPassword] = useState(false);

  const onLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="p-8 flex flex-col h-screen animate-fade-in">
      <div className="text-center my-auto">
        <Icon component={Landmark} className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Log in to continue to your account</p>
      </div>
      <form onSubmit={onLoginSubmit} className="space-y-6">
        <InputWithIcon icon={Mail} type="email" placeholder="Email" required />
        <div className="relative">
            <InputWithIcon
                icon={KeyRound}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Icon component={showPassword ? EyeOff : Eye} />
            </button>
        </div>
        <div className="text-right">
            <a href="#" onClick={(e) => { e.preventDefault(); setAuthPage('forgotPassword'); }} className="text-sm text-amber-600 hover:underline">
                Forgot password?
            </a>
        </div>
        <button type="submit" className="w-full bg-amber-500 text-white font-bold p-3 rounded-lg hover:bg-amber-600 transition shadow-md">
          Log In
        </button>
        <div className="flex items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>
         <button type="button" onClick={() => setAuthPage('social')} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold p-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            Continue with Google or Facebook
        </button>
      </form>
      <div className="text-center mt-8">
        <p className="text-gray-500 dark:text-gray-400">
          Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setAuthPage('register'); }} className="font-bold text-amber-600 hover:underline">Create one</a>
        </p>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const { setAuthPage, handleLogin } = useContext(AppContext);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    fullName: '', email: '', password: '', confirmPassword: '',
    dob: '', nationalId: '', phone: '', address: '',
    employmentStatus: '', incomeSource: '',
    accountPurpose: '', monthlyTransactionVolume: '',
    idFront: null, idBack: null, selfieWithId: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (id: string, file: File) => {
      setFormData((prev: any) => ({ ...prev, [id]: file }));
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const onRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <InputWithIcon icon={User} name="fullName" placeholder="Full Name" onChange={handleInputChange} required/>
            <InputWithIcon icon={Mail} name="email" type="email" placeholder="Email" onChange={handleInputChange} required/>
            <InputWithIcon icon={KeyRound} name="password" type="password" placeholder="Password" onChange={handleInputChange} required/>
            <InputWithIcon icon={KeyRound} name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleInputChange} required/>
            <button onClick={nextStep} type="button" className="w-full bg-amber-500 text-white font-bold p-3 rounded-lg hover:bg-amber-600 transition">Next</button>
          </div>
        );
      case 2:
        return (
            <div className="space-y-4">
                <InputWithIcon icon={Calendar} name="dob" type="date" placeholder="Date of Birth" onChange={handleInputChange} required/>
                <InputWithIcon icon={FileText} name="nationalId" placeholder="National ID" onChange={handleInputChange} required/>
                <InputWithIcon icon={Phone} name="phone" type="tel" placeholder="Phone Number" onChange={handleInputChange} required/>
                <InputWithIcon icon={MapPin} name="address" placeholder="Detailed Address" onChange={handleInputChange} required/>
                 <div className="flex space-x-4">
                    <button onClick={prevStep} type="button" className="w-full bg-gray-200 text-gray-800 font-bold p-3 rounded-lg hover:bg-gray-300 transition">Back</button>
                    <button onClick={nextStep} type="button" className="w-full bg-amber-500 text-white font-bold p-3 rounded-lg hover:bg-amber-600 transition">Next</button>
                </div>
            </div>
        );
      case 3:
        return (
            <div className="space-y-4">
                <SelectInput icon={Building} name="employmentStatus" onChange={handleInputChange} required>
                    <option value="">Employment Status</option>
                    <option value="Employed">Employed</option>
                    <option value="Self-employed">Self-employed</option>
                    <option value="Retired">Retired</option>
                    <option value="Student">Student</option>
                </SelectInput>
                <SelectInput icon={DollarSign} name="incomeSource" onChange={handleInputChange} required>
                    <option value="">Primary Source of Income</option>
                    <option value="Salary">Salary</option>
                    <option value="Business">Business</option>
                    <option value="Investments">Investments</option>
                </SelectInput>
                 <div className="flex space-x-4">
                    <button onClick={prevStep} type="button" className="w-full bg-gray-200 text-gray-800 font-bold p-3 rounded-lg hover:bg-gray-300 transition">Back</button>
                    <button onClick={nextStep} type="button" className="w-full bg-amber-500 text-white font-bold p-3 rounded-lg hover:bg-amber-600 transition">Next</button>
                </div>
            </div>
        );
    case 4:
        return (
            <div className="space-y-4">
                <SelectInput icon={HandCoins} name="accountPurpose" onChange={handleInputChange} required>
                    <option value="">Purpose of Account</option>
                    <option value="Savings">Savings</option>
                    <option value="Investment">Investment</option>
                    <option value="Trading">Trading</option>
                </SelectInput>
                <SelectInput icon={TrendingUp} name="monthlyTransactionVolume" onChange={handleInputChange} required>
                    <option value="">Expected Monthly Transaction Volume</option>
                    <option value="Less than 1,000 LYD">Less than 1,000 LYD</option>
                    <option value="1,000 - 5,000 LYD">1,000 - 5,000 LYD</option>
                    <option value="5,000 - 20,000 LYD">5,000 - 20,000 LYD</option>
                    <option value="More than 20,000 LYD">More than 20,000 LYD</option>
                </SelectInput>
                 <div className="flex space-x-4">
                    <button onClick={prevStep} type="button" className="w-full bg-gray-200 text-gray-800 font-bold p-3 rounded-lg hover:bg-gray-300 transition">Back</button>
                    <button onClick={nextStep} type="button" className="w-full bg-amber-500 text-white font-bold p-3 rounded-lg hover:bg-amber-600 transition">Next</button>
                </div>
            </div>
        );
      case 5:
        return (
            <form onSubmit={onRegisterSubmit} className="space-y-4">
                <FileInput id="idFront" label="ID Card (Front)" onFileSelect={handleFileSelect} />
                <FileInput id="idBack" label="ID Card (Back)" onFileSelect={handleFileSelect} />
                <FileInput id="selfieWithId" label="Selfie with ID" onFileSelect={handleFileSelect} />
                 <div className="flex space-x-4 pt-4">
                    <button type="button" onClick={prevStep} className="w-full bg-gray-200 text-gray-800 font-bold p-3 rounded-lg hover:bg-gray-300 transition">Back</button>
                    <button type="submit" className="w-full bg-green-600 text-white font-bold p-3 rounded-lg hover:bg-green-700 transition">Create Account</button>
                </div>
            </form>
        );
      default: return null;
    }
  };

  const progress = (step / 5) * 100;

  return (
    <div className="p-4 animate-fade-in flex flex-col h-screen">
        <header className="flex items-center justify-between mb-4">
            <button onClick={() => step === 1 ? setAuthPage('login') : prevStep()} className="p-2">
                <Icon component={ArrowRight} className="text-gray-600 dark:text-gray-300 rotate-180" />
            </button>
            <h1 className="text-xl font-bold">Create New Account</h1>
            <span className="text-sm text-gray-500">{step}/5</span>
        </header>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 dark:bg-gray-700">
            <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {renderStep()}
        </div>
    </div>
  );
};

const ForgotPasswordPage = () => {
    const { setAuthPage } = useContext(AppContext);
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="p-4 animate-fade-in">
            <header className="flex items-center mb-8">
                <button onClick={() => setAuthPage('login')} className="p-2">
                    <Icon component={ArrowRight} className="text-gray-600 dark:text-gray-300 rotate-180"/>
                </button>
                <h1 className="text-xl font-bold mx-auto">Forgot Password</h1>
            </header>
            {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <p className="text-center text-gray-600 dark:text-gray-400">
                        Enter your registered email to send a password reset link.
                    </p>
                    <InputWithIcon icon={Mail} type="email" placeholder="Email" required />
                    <button type="submit" className="w-full bg-amber-500 text-white font-bold p-3 rounded-lg hover:bg-amber-600 transition">
                        Send Reset Link
                    </button>
                </form>
            ) : (
                <div className="text-center space-y-4 p-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Icon component={ShieldCheck} className="mx-auto h-16 w-16 text-green-500" />
                    <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Link Sent!</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        We have sent a password reset link to your email. Please check your inbox.
                    </p>
                    <button onClick={() => setAuthPage('login')} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold p-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition mt-4">
                        Back to Login
                    </button>
                </div>
            )}
        </div>
    );
};

const SocialLoginPage = () => {
    const { handleLogin } = useContext(AppContext);

    const GoogleIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.938,44,30.417,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
    );

    const FacebookIcon = () => (
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px" fill="white">
            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 5.52 4.5 10.02 10 10.02s10-4.5 10-10.02C22 6.53 17.5 2.04 12 2.04zM16.5 8.25h-2.25c-.25 0-.5.25-.5.5v1.5h2.75l-.5 2H13.75v5.5h-3.5V12.25H8.5V10.25h1.75V8.5c0-1.5 1.5-2.25 3-2.25h3.25v2z"/>
        </svg>
    );

    return (
        <div className="p-8 flex flex-col h-screen items-center justify-center animate-fade-in">
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Continue with</h1>
             <div className="w-full max-w-xs space-y-4">
                <button
                    onClick={handleLogin}
                    className="w-full bg-white border border-gray-300 text-gray-700 font-semibold p-3 rounded-lg flex items-center justify-center space-x-3 hover:bg-gray-50 transition"
                >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                </button>
                 <button
                    onClick={handleLogin}
                    className="w-full bg-blue-600 text-white font-semibold p-3 rounded-lg flex items-center justify-center space-x-3 hover:bg-blue-700 transition"
                >
                    <FacebookIcon />
                    <span>Continue with Facebook</span>
                </button>
             </div>
        </div>
    );
};

const HomePage = () => {
    const { navigate } = useContext(AppContext);
    const { user, wallet, livePrices, promotions } = mockData;

    const QuickAction = ({ icon, label, onClick }: any) => (
        <div className="flex flex-col items-center space-y-2" onClick={onClick}>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition">
                <Icon component={icon} className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
        </div>
    );

     const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            <header className="flex justify-between items-center">
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Welcome back,</p>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.firstName}</h1>
                </div>
                 <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-12 h-12 rounded-full cursor-pointer border-2 border-amber-500/50"
                    onClick={() => navigate('profile')}
                />
            </header>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
                <p className="opacity-80">Total Balance</p>
                <p className="text-3xl font-bold tracking-wider">
                  {formatCurrency(wallet.dinar.balance, 'LYD')}
                </p>
                 <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                    <span className="opacity-80">Gold Balance</span>
                    <span className="font-semibold">{mockData.digitalBalance.goldGrams.toFixed(2)} grams</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <PriceCard metal="Gold" price={livePrices.gold.price} change={livePrices.gold.change} currency="LYD/gram" color="amber" />
                <PriceCard metal="Silver" price={livePrices.silver.price} change={livePrices.silver.change} currency="LYD/gram" color="gray" />
            </div>

            <div>
                <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <QuickAction icon={ArrowRightLeft} label="Transfer" onClick={() => navigate('wallet', 'transferOwnership')} />
                    <QuickAction icon={PackageCheck} label="Pickup" onClick={() => navigate('wallet', 'bookAppointment')} />
                    <QuickAction icon={ScanLine} label="Scan" onClick={() => navigate('home', 'scanBullion')} />
                    <QuickAction icon={Store} label="Store" onClick={() => navigate('market')} />
                </div>
            </div>

            {promotions.length > 0 && (
                <div className="bg-gray-800 dark:bg-gray-900 rounded-xl p-6 text-white overflow-hidden relative">
                    <div className="absolute -top-4 -right-8 w-24 h-24 bg-amber-500/20 rounded-full"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-amber-400">{promotions[0].title}</h3>
                        <p className="mt-2 text-gray-300">{promotions[0].description}</p>
                        <button onClick={() => navigate(promotions[0].page)} className="mt-4 bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition">
                            {promotions[0].buttonText}
                        </button>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
                <div className="space-y-2">
                    {wallet.transactionHistory.slice(0, 3).map((tx, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-full mr-3 ${tx.amount > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                    <Icon component={tx.type === 'deposit' ? Download : (tx.type === 'purchase' ? Store : Send)} className={`w-5 h-5 ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`} />
                                </div>
                                <div>
                                    <p className="font-semibold">{tx.description}</p>
                                    <p className="text-xs text-gray-500">{tx.date.toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} {tx.currency}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PriceCard = ({ metal, price, change, currency, color }: any) => {
    const isUp = change >= 0;
    const colorClasses: any = {
        amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-800 dark:text-amber-300' },
        gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' },
    };

    return (
        <div className={`${colorClasses[color].bg} p-4 rounded-lg`}>
            <p className={`font-bold ${colorClasses[color].text}`}>{metal}</p>
            <p className={`text-lg font-mono font-semibold mt-1 ${colorClasses[color].text}`}>{price.toFixed(2)}</p>
            <div className="flex items-center mt-1">
                <span className={`text-xs ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isUp ? '+' : ''}{change.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{currency}</span>
            </div>
        </div>
    );
};

const MarketPage = () => {
    const { navigate } = useContext(AppContext);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = mockData.products.filter(p => {
        const matchesFilter = filter === 'all' || p.type === filter;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.weight.toString().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    const getTotalStock = (productId: string) => {
        return Object.values(mockData.inventory).reduce((total: number, storeInventory: any) => {
            return total + (storeInventory[productId] || 0);
        }, 0);
    };

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            <h1 className="text-center text-2xl font-bold">Store</h1>
            <div className="relative">
                <InputWithIcon icon={Search} placeholder="Search for a bar..." value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)}/>
            </div>

            <div>
                <h2 className="text-lg font-bold mb-2">Buy Digital Assets</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DigitalProductCard metal="gold" />
                    <DigitalProductCard metal="silver" />
                </div>
            </div>

            <div>
                <h2 className="text-lg font-bold mb-2">Buy Physical Bars</h2>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button onClick={() => setFilter('all')} className={`px-4 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>All</button>
                        <button onClick={() => setFilter('gold')} className={`px-4 py-1 rounded-md text-sm ${filter === 'gold' ? 'bg-amber-500 text-white shadow' : ''}`}>Gold</button>
                        <button onClick={() => setFilter('silver')} className={`px-4 py-1 rounded-md text-sm ${filter === 'silver' ? 'bg-gray-400 text-white shadow' : ''}`}>Silver</button>
                    </div>
                    <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                        <Icon component={Filter} className="w-4 h-4"/>
                        <span className="text-sm">Filter</span>
                    </button>
                </div>

                <div className="space-y-3">
                    {filteredProducts.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          totalStock={getTotalStock(product.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const DigitalProductCard = ({ metal }: any) => {
    const isGold = metal === 'gold';
    const data = isGold ? mockData.livePrices.gold : mockData.livePrices.silver;

    return (
        <div className={`rounded-lg p-4 flex items-center justify-between ${isGold ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <div className="flex items-center space-x-3">
                <Icon component={Sparkles} className={`w-8 h-8 ${isGold ? 'text-amber-500' : 'text-gray-500'}`} />
                <div>
                    <h3 className="font-bold">{isGold ? 'Buy Digital Gold' : 'Buy Digital Silver'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{data.price.toFixed(2)} LYD/gram</p>
                </div>
            </div>
            <button className={`px-4 py-2 rounded-lg text-sm font-semibold ${isGold ? 'bg-amber-500 text-white' : 'bg-gray-600 text-white'}`}>Buy</button>
        </div>
    );
};

const ProductCard = ({ product, totalStock }: any) => {
    const isAvailable = totalStock > 0;
    return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex space-x-4">
            <img src={product.image} alt={product.name} className="w-20 h-20 rounded-md object-cover"/>
            <div className="flex-grow">
                <h3 className="font-bold text-gray-900 dark:text-white">{product.name} {product.carat}K</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.weight} grams</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{product.price.toFixed(2)} LYD</p>
            </div>
            <div className="flex flex-col justify-between items-end">
                <div className={`text-xs px-2 py-1 rounded-full ${isAvailable ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>
                    {isAvailable ? `In Stock: ${totalStock}` : 'Out of Stock'}
                </div>
                <button
                    disabled={!isAvailable}
                    className="bg-amber-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 transition disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Buy
                </button>
            </div>
        </div>
    );
};

const NewsPage = () => {
    return (
        <div className="p-4 space-y-6 animate-fade-in">
            <h1 className="text-center text-2xl font-bold">News & Prices</h1>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h2 className="font-bold mb-3">US Dollar Prices</h2>
                <div className="flex justify-around items-center text-center">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Parallel Market</p>
                        <p className="text-xl font-bold text-red-600 font-mono">{mockData.dollarPrices.blackMarket.toFixed(2)} LYD</p>
                    </div>
                    <div className="h-12 border-l border-gray-200 dark:border-gray-700"></div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Official Rate</p>
                        <p className="text-xl font-bold text-green-600 font-mono">{mockData.dollarPrices.official.toFixed(2)} LYD</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                 <h2 className="font-bold mb-3">Local Gold Prices (gram / LYD)</h2>
                 <div className="space-y-2">
                     {Object.entries(mockData.goldPricesLYD).map(([carat, price]) => (
                        <div key={carat} className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">{carat}</span>
                            <span className="font-semibold text-amber-700 dark:text-amber-400 font-mono">{price.toFixed(2)} LYD</span>
                        </div>
                     ))}
                 </div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                 <h2 className="font-bold mb-3">Global Gold Prices (gram / USD)</h2>
                 <div className="space-y-2">
                      {Object.entries(mockData.goldPricesUSD).map(([market, price]) => {
                          const marketNames: any = {turkey: 'Turkey 🇹🇷', uae: 'UAE 🇦🇪', london: 'London 🇬🇧'};
                          return (
                            <div key={market} className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">{marketNames[market]}</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">${price.toFixed(2)}</span>
                            </div>
                         )
                      })}
                 </div>
            </div>

            <div>
                 <h2 className="text-lg font-bold mb-3">Latest Market News</h2>
                 <div className="space-y-3">
                     {mockData.marketNews.map((news, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex items-start space-x-3">
                            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                                <Icon component={news.icon} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{news.source}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{news.text}</p>
                            </div>
                        </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

const WalletPage = () => {
    const { wallet, digitalBalance } = mockData;

      const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            <h1 className="text-center text-2xl font-bold">Wallet</h1>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
                    <p className="text-sm opacity-80">Dinar Balance</p>
                    <p className="text-xl font-bold font-mono tracking-wide">{formatCurrency(wallet.dinar.balance, 'LYD')}</p>
                </div>
                 <div className="bg-green-600 text-white p-4 rounded-lg shadow-md">
                    <p className="text-sm opacity-80">Dollar Balance</p>
                    <p className="text-xl font-bold font-mono tracking-wide">{formatCurrency(wallet.dollar.balance, 'USD')}</p>
                </div>
            </div>

             <div>
                <h2 className="text-lg font-bold mb-2">Digital Balance</h2>
                <div className="space-y-2">
                    <DigitalAssetCard type="gold" balance={digitalBalance.goldGrams} />
                    <DigitalAssetCard type="silver" balance={digitalBalance.silverGrams} />
                </div>
            </div>

             <div>
                <h2 className="text-lg font-bold mb-2">My Owned Assets</h2>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-gray-500 dark:text-gray-400">You have {mockData.ownedAssets.length} physical assets</p>
                </div>
             </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center space-x-4">
                <Icon component={Bot} className="w-10 h-10 text-green-600" />
                <div>
                    <h3 className="font-bold text-green-800 dark:text-green-300">Smart Investment Advisor</h3>
                    <p className="text-sm text-green-700 dark:text-green-400">Get a personalized investment plan.</p>
                </div>
            </div>
        </div>
    );
};

const DigitalAssetCard = ({ type, balance }: any) => {
    const isGold = type === 'gold';
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex justify-between items-center">
            <div className="flex items-center space-x-3">
                 <Icon component={Sparkles} className={`w-6 h-6 ${isGold ? 'text-amber-500' : 'text-gray-400'}`} />
                 <span className="font-semibold">{isGold ? 'Digital Gold' : 'Digital Silver'}</span>
            </div>
            <span className="font-mono font-bold">{balance.toFixed(2)} grams</span>
        </div>
    );
};

const ProfilePage = () => {
    const { navigate, handleLogout } = useContext(AppContext);

    const { user, kycDetails } = mockData;
    const menuItems = [
        { label: "KYC Information", icon: UserCheck, page: "kyc" },
        { label: "Fund Wallets", icon: Wallet, page: "fundWalletsHub" },
        { label: "How to Use (FAQ)", icon: HelpCircle, page: "howToUse" },
        { label: "Contact Us", icon: PhoneCall, page: "contactUs" },
        { label: "Settings", icon: Settings, page: "settings" },
    ];

    return (
        <div className="p-4 animate-fade-in">
             <div className="text-center pt-6 pb-4">
                 <div className="relative w-24 h-24 mx-auto">
                    <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover border-4 border-amber-500/30"
                    />
                 </div>
                <h1 className="text-2xl font-bold mt-4">{kycDetails.fullName}</h1>
                <p className="text-gray-500 dark:text-gray-400">{kycDetails.phone}</p>
             </div>

             <div className="space-y-3 pt-6">
                {menuItems.map(item => (
                    <button
                        key={item.label}
                        onClick={() => navigate('profile', item.page)}
                        className="w-full flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        <div className="flex items-center">
                            <Icon component={item.icon} className="w-5 h-5 mr-4 text-amber-600" />
                            <span className="font-semibold">{item.label}</span>
                        </div>
                        <Icon component={ChevronLeft} className="text-gray-400 rotate-180"/>
                    </button>
                ))}
             </div>

            <div className="mt-8">
                 <button onClick={handleLogout} className="w-full flex justify-center items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition">
                     <Icon component={LogOut} className="w-5 h-5 mr-2" />
                     Log Out
                 </button>
            </div>
        </div>
    );
};

const AppContent = () => {
    const { isLoggedIn, page, authPage } = useContext(AppContext);

    if (!isLoggedIn) {
        switch(authPage) {
            case 'register': return <RegisterPage />;
            case 'forgotPassword': return <ForgotPasswordPage />;
            case 'social': return <SocialLoginPage />;
            case 'login':
            default:
                return <LoginPage />;
        }
    }

    const renderPage = () => {
        switch(page) {
            case 'market': return <MarketPage />;
            case 'news': return <NewsPage />;
            case 'wallet': return <WalletPage />;
            case 'profile': return <ProfilePage />;
            case 'home':
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="pb-20">
            {renderPage()}
            <BottomNav />
        </div>
    );
}

export default function App() {
  return (
    <AppProvider>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
        <div className="max-w-md mx-auto bg-white dark:bg-black/50 min-h-screen shadow-2xl relative">
           <AppContent />
        </div>
      </div>
    </AppProvider>
  );
}
