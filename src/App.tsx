import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccountTypeSelectionPage } from './pages/AccountTypeSelectionPage';
import { HomePage } from './pages/HomePage';
import { MarketPage } from './pages/MarketPage';
import { InvoicePage } from './pages/InvoicePage';
import { NewsPage } from './pages/NewsPage';
import { WalletPage } from './pages/WalletPage';
import { TransferOwnershipPage } from './pages/wallet/TransferOwnershipPage';
import { ReceiveDigitalBullionPage } from './pages/wallet/ReceiveDigitalBullionPage';
import { DigitalTransferPage } from './pages/wallet/DigitalTransferPage';
import { TransferBalancePage } from './pages/wallet/TransferBalancePage';
import { BookAppointmentPage } from './pages/wallet/BookAppointmentPage';
import { InvestmentPlannerPage } from './pages/wallet/InvestmentPlannerPage';
import { ProfilePage } from './pages/ProfilePage';
import { KYCPage } from './pages/profile/KYCPage';
import { StoreKYCPage } from './pages/profile/StoreKYCPage';
import { FundWalletsPage } from './pages/profile/FundWalletsPage';
import { FundDinarWalletPage } from './pages/profile/FundDinarWalletPage';
import { FundDollarWalletPage } from './pages/profile/FundDollarWalletPage';
import { WithdrawDinarPage } from './pages/profile/WithdrawDinarPage';
import { WithdrawDollarPage } from './pages/profile/WithdrawDollarPage';
import { HowToUsePage } from './pages/profile/HowToUsePage';
import { ContactUsPage } from './pages/profile/ContactUsPage';
import { SettingsPage } from './pages/profile/SettingsPage';
import { StatementsPage } from './pages/profile/StatementsPage';
import { AppointmentsListPage } from './pages/profile/AppointmentsListPage';
import { StoreDashboardPage } from './pages/profile/StoreDashboardPage';
import { StoreAppointmentsPage } from './pages/profile/StoreAppointmentsPage';
import { StorePickupPage } from './pages/profile/StorePickupPage';
import { StorePaymentsPage } from './pages/profile/StorePaymentsPage';
import { StoreInventoryPage } from './pages/profile/StoreInventoryPage';
import { StoreReportsPage } from './pages/profile/StoreReportsPage';
import { ScanBullionPage } from './pages/ScanBullionPage';
import { StoreConsolePage } from './pages/store/StoreConsolePage';
import { Home, Store, Newspaper, Wallet as WalletIcon, User, Building2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState('home');
  const [subPage, setSubPage] = useState<string | null>(null);
  const [subPageProps, setSubPageProps] = useState<any>(null);
  const [authPage, setAuthPage] = useState('login');
  const [accountType, setAccountType] = useState<'individual' | 'store' | null>(null);

  const navigate = (mainPage: string, sub?: string, props?: any) => {
    setPage(mainPage);
    setSubPage(sub || null);
    setSubPageProps(props || null);
  };

  useEffect(() => {
    document.documentElement.dir = 'ltr';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    if (authPage === 'login') {
      return <LoginPage onNavigate={setAuthPage} />;
    }
    if (authPage === 'accountType') {
      return (
        <AccountTypeSelectionPage
          onSelectType={(type) => {
            setAccountType(type);
            setAuthPage('register');
          }}
          onBack={() => setAuthPage('login')}
        />
      );
    }
    if (authPage === 'register' && accountType) {
      return (
        <RegisterPage
          onNavigate={(page) => {
            if (page === 'login') {
              setAccountType(null);
            }
            setAuthPage(page);
          }}
          accountType={accountType}
        />
      );
    }
    return (
      <div className="p-8 text-center">
        <p>Auth page: {authPage}</p>
        <button onClick={() => setAuthPage('login')} className="text-yellow-600">
          Back to Login
        </button>
      </div>
    );
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'market', label: 'Store', icon: Store },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'wallet', label: 'Wallet', icon: WalletIcon },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // Add store console for store accounts
  const storeNavItems = [
    { id: 'store-console', label: 'Console', icon: Building2 },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'market':
        if (subPage === 'invoice' && subPageProps?.invoiceId) {
          return (
            <InvoicePage
              invoiceId={subPageProps.invoiceId}
              isNewPurchase={true}
              onNavigate={navigate}
              onClose={() => navigate('market')}
            />
          );
        }
        return <MarketPage onNavigate={navigate} />;
      case 'news':
        return <NewsPage />;
      case 'scan':
        return <ScanBullionPage onNavigate={navigate} />;
      case 'wallet':
        if (subPage === 'transferOwnership') {
          return (
            <TransferOwnershipPage
              assetId={subPageProps?.assetId}
              onNavigate={navigate}
              onBack={() => navigate('wallet')}
            />
          );
        }
        if (subPage === 'receivePhysical') {
          return (
            <ReceiveDigitalBullionPage
              onNavigate={navigate}
              onBack={() => navigate('wallet')}
            />
          );
        }
        if (subPage === 'digitalTransfer') {
          return (
            <DigitalTransferPage
              onNavigate={navigate}
              onBack={() => navigate('wallet')}
            />
          );
        }
        if (subPage === 'transferBalance') {
          return (
            <TransferBalancePage
              onNavigate={navigate}
              onBack={() => navigate('wallet')}
            />
          );
        }
        if (subPage === 'bookAppointment') {
          return (
            <BookAppointmentPage
              assetId={subPageProps?.assetId}
              fromConversion={subPageProps?.fromConversion}
              onNavigate={navigate}
              onBack={() => navigate('wallet')}
            />
          );
        }
        if (subPage === 'planner') {
          return (
            <InvestmentPlannerPage
              onNavigate={navigate}
              onBack={() => navigate('wallet')}
            />
          );
        }
        return <WalletPage onNavigate={navigate} subPage={subPage} subPageProps={subPageProps} />;
      case 'profile':
        if (subPage === 'appointments') {
          return <AppointmentsListPage onNavigate={navigate} />;
        }
        if (subPage === 'statements') {
          return <StatementsPage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'kyc') {
          return <KYCPage onNavigate={navigate} onBack={() => navigate('profile')} />;
        }
        if (subPage === 'store-kyc') {
          return <StoreKYCPage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'fund') {
          return <FundWalletsPage onNavigate={navigate} onBack={() => navigate('profile')} />;
        }
        if (subPage === 'fundDinar' || subPage === 'fundDinarWallet') {
          return <FundDinarWalletPage onNavigate={navigate} onBack={() => navigate('profile', 'fund')} />;
        }
        if (subPage === 'fundDollar' || subPage === 'fundDollarWallet') {
          return <FundDollarWalletPage onNavigate={navigate} onBack={() => navigate('profile', 'fund')} />;
        }
        if (subPage === 'withdrawDinar') {
          return <WithdrawDinarPage onNavigate={navigate} onBack={() => navigate('wallet')} />;
        }
        if (subPage === 'withdrawDollar') {
          return <WithdrawDollarPage onNavigate={navigate} onBack={() => navigate('wallet')} />;
        }
        if (subPage === 'faq') {
          return <HowToUsePage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'contact') {
          return <ContactUsPage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'settings') {
          return <SettingsPage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'store-dashboard') {
          return <StoreDashboardPage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'store-appointments') {
          return <StoreAppointmentsPage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'store-pickup') {
          return <StorePickupPage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'store-payments') {
          return <StorePaymentsPage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'store-inventory') {
          return <StoreInventoryPage onBack={() => navigate('profile')} />;
        }
        if (subPage === 'store-reports') {
          return <StoreReportsPage onBack={() => navigate('profile')} />;
        }
        return <ProfilePage onNavigate={navigate} />;
      case 'store-console':
        return <StoreConsolePage onBack={() => navigate('home')} />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <>
      <div className="pb-20">
        {renderPage()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30">
        <div className="flex justify-around">
          {(profile?.account_type === 'store' ? storeNavItems : navItems).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex flex-col items-center justify-center w-full p-3 transition-colors ${
                  page === item.id
                    ? 'text-yellow-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-yellow-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
        <div className="max-w-md mx-auto bg-white dark:bg-black/50 min-h-screen shadow-2xl relative">
          <AppContent />
        </div>
      </div>
    </AuthProvider>
  );
}
