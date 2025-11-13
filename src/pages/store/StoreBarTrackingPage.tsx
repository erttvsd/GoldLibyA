import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Filter, Search, Download } from 'lucide-react';
import { Button, Card, Input, Modal } from '../../components/ui';
import { BarDetailsView } from '../../components/store/BarDetailsView';
import { barTrackingService, InventoryBar } from '../../services/bar-tracking.service';

interface StoreBarTrackingPageProps {
  onBack?: () => void;
}

export const StoreBarTrackingPage = ({ onBack }: StoreBarTrackingPageProps = {}) => {
  const [bars, setBars] = useState<InventoryBar[]>([]);
  const [filteredBars, setFilteredBars] = useState<InventoryBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'sold' | 'reserved'>('all');
  const [selectedBar, setSelectedBar] = useState<InventoryBar | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const storeId = localStorage.getItem('current_store_id');

  useEffect(() => {
    loadBars();
  }, []);

  useEffect(() => {
    filterBars();
  }, [bars, searchTerm, statusFilter]);

  const loadBars = async () => {
    if (!storeId) {
      alert('No store selected');
      if (onBack) onBack();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await barTrackingService.getStoreBars(storeId);
      if (error) throw new Error(error);
      setBars(data || []);
    } catch (error: any) {
      alert(error.message || 'Failed to load bars');
    } finally {
      setLoading(false);
    }
  };

  const filterBars = () => {
    let filtered = bars;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((bar) => bar.status === statusFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (bar) =>
          bar.serial_number.toLowerCase().includes(search) ||
          bar.bar_number.toLowerCase().includes(search) ||
          bar.product_name.toLowerCase().includes(search) ||
          (bar.buyer_name && bar.buyer_name.toLowerCase().includes(search)) ||
          (bar.certification_number && bar.certification_number.toLowerCase().includes(search))
      );
    }

    setFilteredBars(filtered);
  };

  const handleBarClick = (bar: InventoryBar) => {
    setSelectedBar(bar);
    setShowDetailsModal(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'sold':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: bars.length,
    in_stock: bars.filter((b) => b.status === 'in_stock').length,
    sold: bars.filter((b) => b.status === 'sold').length,
    reserved: bars.filter((b) => b.status === 'reserved').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button onClick={onBack} variant="outline" icon={ArrowLeft}>
                Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bar Tracking</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track all inventory bars with detailed information
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Bars</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Package className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Stock</p>
                <p className="text-3xl font-bold text-green-600">{stats.in_stock}</p>
              </div>
              <Package className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sold</p>
                <p className="text-3xl font-bold text-red-600">{stats.sold}</p>
              </div>
              <Package className="w-10 h-10 text-red-600 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reserved</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.reserved}</p>
              </div>
              <Package className="w-10 h-10 text-yellow-600 opacity-50" />
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                label=""
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by serial number, bar number, or buyer name..."
                icon={Search}
              />
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="sold">Sold</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading bars...</p>
            </div>
          </Card>
        ) : filteredBars.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No bars found</p>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by adding bars to your inventory'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBars.map((bar) => (
              <Card
                key={bar.bar_id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleBarClick(bar)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {bar.product_name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadgeColor(bar.status)}`}
                      >
                        {bar.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Bar Number</p>
                        <p className="font-semibold">{bar.bar_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Serial Number</p>
                        <p className="font-semibold">{bar.serial_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Weight</p>
                        <p className="font-semibold">{bar.weight_grams}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Purity</p>
                        <p className="font-semibold">{bar.purity}</p>
                      </div>
                    </div>
                    {bar.status === 'sold' && bar.buyer_name && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Buyer</p>
                            <p className="font-semibold">{bar.buyer_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                            <p className="font-semibold">{bar.buyer_phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sale Total</p>
                            <p className="font-semibold text-red-600">
                              {bar.sale_total?.toFixed(2)} LYD
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showDetailsModal && selectedBar && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBar(null);
          }}
          title={`Bar Details - ${selectedBar.bar_number}`}
        >
          <BarDetailsView bar={selectedBar} />
        </Modal>
      )}
    </div>
  );
};
