import { useEffect, useState } from 'react';
import { Store, Calendar, DollarSign, Package, TrendingUp, Users, Wallet, ArrowRightLeft, BarChart3, Tag, Shield, Megaphone, MapPin, Building2, ShoppingBag, ChevronRight } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { storeService } from '../../services/store.service';
import { marketplaceService, MarketplaceItem } from '../../services/marketplace.service';
import { ItemPurchaseModal } from '../../components/store/ItemPurchaseModal';

interface StoreDashboardPageProps {
  storeId: string;
  onNavigate: (page: string) => void;
}

export const StoreDashboardPage = ({ storeId, onNavigate }: StoreDashboardPageProps) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [featuredItems, setFeaturedItems] = useState<MarketplaceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [storeId]);

  const loadDashboard = async () => {
    try {
      const [statsRes, storeRes, itemsRes] = await Promise.all([
        storeService.getDashboardStats(storeId),
        storeService.getStoreDetails(storeId),
        marketplaceService.getMarketplaceItems(storeId, true),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (storeRes.data) setStoreInfo(storeRes.data);
      if (itemsRes.data) setFeaturedItems(itemsRes.data.slice(0, 6));
    } catch (error) {
      console.error('Error loading dashboard:', error);
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

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <Store className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Store Console</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {storeInfo?.name || 'Store Dashboard'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Today</p>
              <p className="text-3xl font-bold mt-1">{stats?.today_appointments || 0}</p>
              <p className="text-xs opacity-75 mt-1">Appointments</p>
            </div>
            <Calendar className="w-12 h-12 opacity-30" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Sales</p>
              <p className="text-3xl font-bold mt-1">{stats?.today_sales || 0}</p>
              <p className="text-xs opacity-75 mt-1">Today</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-30" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Revenue</p>
              <p className="text-3xl font-bold mt-1">
                {Number(stats?.today_revenue || 0).toFixed(2)} LYD
              </p>
              <p className="text-xs opacity-75 mt-1">Today's total</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-30" />
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Featured Items
          </h2>
          <Button onClick={() => onNavigate('marketplace')} variant="ghost" size="sm">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {featuredItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-lg transition"
              onClick={() => setSelectedItem(item)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <p className="font-semibold text-sm line-clamp-1">{item.item_name}</p>
                    <p className="text-xs text-gray-500">
                      {item.weight}g • {item.purity}
                    </p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                    {item.metal_type}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-bold text-sm">{item.price_lyd.toFixed(0)} LYD</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Stock</p>
                    <p className="font-semibold text-sm">{item.quantity_available}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Quick Actions</h2>

        <Card
          className="cursor-pointer hover:shadow-lg transition"
          onClick={() => onNavigate('customers')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Customer Desk</p>
                <p className="text-sm text-gray-500">Search & manage customers</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition"
          onClick={() => onNavigate('appointments')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Appointments & Handover</p>
                <p className="text-sm text-gray-500">Process pickups</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition"
          onClick={() => onNavigate('inventory')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold">Inventory</p>
                <p className="text-sm text-gray-500">Manage stock</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition"
          onClick={() => onNavigate('finance')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">Finance</p>
                <p className="text-sm text-gray-500">Manage wallets & transactions</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition"
          onClick={() => onNavigate('reports')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold">Analytics & Reports</p>
                <p className="text-sm text-gray-500">View detailed analytics</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition"
          onClick={() => onNavigate('staff')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="font-semibold">Staff Management</p>
                <p className="text-sm text-gray-500">Manage roles & permissions</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition"
          onClick={() => onNavigate('announcements')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold">Announcements</p>
                <p className="text-sm text-gray-500">Store communications</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition"
          onClick={() => onNavigate('location-changes')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-lime-600" />
              </div>
              <div>
                <p className="font-semibold">Location Changes</p>
                <p className="text-sm text-gray-500">Approve asset transfers</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition"
          onClick={() => onNavigate('bank-accounts')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900/30 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold">Bank Accounts</p>
                <p className="text-sm text-gray-500">Manage bank transactions</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {selectedItem && (
        <ItemPurchaseModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            setSelectedItem(null);
            loadDashboard();
          }}
        />
      )}
    </div>
  );
};
