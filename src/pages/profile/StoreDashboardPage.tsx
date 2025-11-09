import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Package, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface StoreDashboardPageProps {
  onBack: () => void;
}

interface DashboardStats {
  todayAppointments: number;
  pendingPickups: number;
  totalInventory: number;
  todayTransactions: number;
  weeklyRevenue: number;
}

export const StoreDashboardPage = ({ onBack }: StoreDashboardPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingPickups: 0,
    totalInventory: 0,
    todayTransactions: 0,
    weeklyRevenue: 0,
  });
  const [storeInfo, setStoreInfo] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;

    try {
      const { data: storeProfile } = await supabase
        .from('store_profiles')
        .select('*, stores(*), cash_deposit_locations(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (storeProfile) {
        setStoreInfo(storeProfile);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: appointmentsCount } = await supabase
          .from('pickup_appointments')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', storeProfile.location_id)
          .eq('status', 'scheduled')
          .gte('appointment_date', today.toISOString());

        const { count: pendingCount } = await supabase
          .from('pickup_appointments')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', storeProfile.location_id)
          .eq('status', 'scheduled');

        const { data: inventory } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('store_id', storeProfile.store_id);

        const totalInventory = inventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { count: transactionsCount } = await supabase
          .from('store_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeProfile.store_id)
          .gte('created_at', weekAgo.toISOString());

        const { data: revenue } = await supabase
          .from('store_transactions')
          .select('amount, currency')
          .eq('store_id', storeProfile.store_id)
          .eq('transaction_type', 'receive_from_individual')
          .gte('created_at', weekAgo.toISOString());

        const weeklyRevenue = revenue?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

        setStats({
          todayAppointments: appointmentsCount || 0,
          pendingPickups: pendingCount || 0,
          totalInventory,
          todayTransactions: transactionsCount || 0,
          weeklyRevenue,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Store Dashboard</h1>
        {storeInfo && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {storeInfo.business_name} - {storeInfo.cash_deposit_locations?.name || storeInfo.stores?.name}
          </p>
        )}
      </div>

      {!storeInfo?.is_verified && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Verification Pending
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your store account is pending verification. Some features may be limited until verified.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Today</p>
              <p className="text-3xl font-bold mt-1">{stats.todayAppointments}</p>
              <p className="text-xs opacity-75 mt-1">Appointments</p>
            </div>
            <Calendar className="w-12 h-12 opacity-30" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Pending</p>
              <p className="text-3xl font-bold mt-1">{stats.pendingPickups}</p>
              <p className="text-xs opacity-75 mt-1">Pickups</p>
            </div>
            <Users className="w-12 h-12 opacity-30" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Stock</p>
              <p className="text-3xl font-bold mt-1">{stats.totalInventory}</p>
              <p className="text-xs opacity-75 mt-1">Items</p>
            </div>
            <Package className="w-12 h-12 opacity-30" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">This Week</p>
              <p className="text-3xl font-bold mt-1">{stats.todayTransactions}</p>
              <p className="text-xs opacity-75 mt-1">Transactions</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-30" />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-bold mb-4">Weekly Revenue</h2>
        <div className="flex items-baseline space-x-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="text-3xl font-bold text-green-600">
            {stats.weeklyRevenue.toFixed(2)}
          </span>
          <span className="text-gray-500">LYD</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
      </Card>

      <Card>
        <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <div className="flex items-center justify-between">
              <span className="font-medium">Process Pickup</span>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Scan QR code and verify customer</p>
          </button>
          <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <div className="flex items-center justify-between">
              <span className="font-medium">View Appointments</span>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Manage scheduled pickups</p>
          </button>
          <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <div className="flex items-center justify-between">
              <span className="font-medium">Check Inventory</span>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">View stock levels</p>
          </button>
        </div>
      </Card>
    </div>
  );
};
