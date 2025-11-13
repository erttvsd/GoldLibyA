import { useEffect, useState } from 'react';
import { StoreDashboardPage } from './StoreDashboardPage';
import { StoreCustomerDeskPage } from './StoreCustomerDeskPage';
import { StoreFinancePage } from './StoreFinancePage';
import { StoreFundTransfersPage } from './StoreFundTransfersPage';
import { StoreInventoryTransferPage } from './StoreInventoryTransferPage';
import { StoreAppointmentsPage } from '../profile/StoreAppointmentsPage';
import { StoreInventoryPage } from '../profile/StoreInventoryPage';
import { StorePaymentsPage } from '../profile/StorePaymentsPage';
import { StorePickupPage } from '../profile/StorePickupPage';
import { StoreReportsPage as ProfileStoreReportsPage } from '../profile/StoreReportsPage';
import { StoreReportsPage } from './StoreReportsPage';
import { StoreCouponsPage } from './StoreCouponsPage';
import { StoreStaffPage } from './StoreStaffPage';
import { StoreAnnouncementsPage } from './StoreAnnouncementsPage';
import { StoreLocationChangePage } from './StoreLocationChangePage';
import { StoreBankAccountsPage } from './StoreBankAccountsPage';
import { StoreMarketplacePage } from './StoreMarketplacePage';
import { StoreBarTrackingPage } from './StoreBarTrackingPage';
import { storeService } from '../../services/store.service';
import { Card } from '../../components/ui';

interface StoreConsolePageProps {
  onBack: () => void;
}

export const StoreConsolePage = ({ onBack }: StoreConsolePageProps) => {
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    try {
      const { data, error } = await storeService.getUserStores();
      if (error) throw error;

      if (!data || data.length === 0) {
        setError('No store found. Please complete your Business KYC verification first, then your store will be created automatically upon approval.');
        setLoading(false);
        return;
      }

      // Use first store if user has multiple
      const storeIdValue = data[0].store_id;
      setStoreId(storeIdValue);
      localStorage.setItem('current_store_id', storeIdValue);
    } catch (err: any) {
      setError(err.message || 'Failed to load store information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error || !storeId) {
    return (
      <div className="p-4">
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-6">
          <p className="text-red-800 dark:text-red-200">{error || 'No store access'}</p>
          <button
            onClick={onBack}
            className="mt-4 text-sm text-red-600 hover:underline"
          >
            Go Back
          </button>
        </Card>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <StoreDashboardPage storeId={storeId} onNavigate={setCurrentPage} />;
      case 'marketplace':
        return <StoreMarketplacePage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'customers':
        return <StoreCustomerDeskPage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'finance':
        return <StoreFinancePage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'fund-transfers':
        return <StoreFundTransfersPage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'inventory-transfers':
        return <StoreInventoryTransferPage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'appointments':
        return <StoreAppointmentsPage onBack={() => setCurrentPage('dashboard')} />;
      case 'pos':
        return <StorePaymentsPage onBack={() => setCurrentPage('dashboard')} />;
      case 'pickup':
        return <StorePickupPage onBack={() => setCurrentPage('dashboard')} />;
      case 'inventory':
        return <StoreInventoryPage onBack={() => setCurrentPage('dashboard')} />;
      case 'reports':
        return <StoreReportsPage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'profile-reports':
        return <ProfileStoreReportsPage onBack={() => setCurrentPage('dashboard')} />;
      case 'coupons':
        return <StoreCouponsPage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'staff':
        return <StoreStaffPage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'announcements':
        return <StoreAnnouncementsPage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'location-changes':
        return <StoreLocationChangePage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'bank-accounts':
        return <StoreBankAccountsPage storeId={storeId} onBack={() => setCurrentPage('dashboard')} />;
      case 'bar-tracking':
        return <StoreBarTrackingPage onBack={() => setCurrentPage('dashboard')} />;
      default:
        return <StoreDashboardPage storeId={storeId} onNavigate={setCurrentPage} />;
    }
  };

  return <div className="min-h-screen">{renderPage()}</div>;
};
