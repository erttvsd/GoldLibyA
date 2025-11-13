import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Shield, User, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { Button, Card, Modal } from '../../components/ui';
import { barTrackingService, InventoryBar } from '../../services/bar-tracking.service';
import { BarDetailsView } from '../../components/store/BarDetailsView';

interface MyBarsPageProps {
  onBack: () => void;
}

export const MyBarsPage = ({ onBack }: MyBarsPageProps) => {
  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBar, setSelectedBar] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadMyBars();
  }, []);

  const loadMyBars = async () => {
    setLoading(true);
    try {
      const { data, error } = await barTrackingService.getUserBars();
      if (error) throw new Error(error);
      setBars(data || []);
    } catch (error: any) {
      console.error('Error loading bars:', error);
      alert(error.message || 'Failed to load your bars');
    } finally {
      setLoading(false);
    }
  };

  const handleBarClick = (bar: any) => {
    setSelectedBar(bar);
    setShowDetailsModal(true);
  };

  const formatBarForDetails = (bar: any): InventoryBar => {
    return {
      bar_id: bar.id,
      serial_number: bar.serial_number,
      bar_number: bar.bar_number,
      product_name: bar.products?.name || 'Unknown Product',
      weight_grams: bar.weight_grams,
      purity: bar.purity,
      xrf_gold_percentage: bar.xrf_gold_percentage || 0,
      xrf_silver_percentage: bar.xrf_silver_percentage || 0,
      xrf_copper_percentage: bar.xrf_copper_percentage || 0,
      xrf_other_metals: bar.xrf_other_metals || {},
      manufacturer: bar.manufacturer,
      manufacture_date: bar.manufacture_date,
      certification_number: bar.certification_number,
      status: bar.status,
      sale_date: bar.sale_date,
      buyer_name: 'You',
      buyer_email: '',
      buyer_phone: '',
      sale_number: '',
      sale_total: 0,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="outline" icon={ArrowLeft}>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bars</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your purchased bullion bars with complete information
            </p>
          </div>
        </div>

        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your bars...</p>
            </div>
          </Card>
        ) : bars.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Bars Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You haven't purchased any bullion bars yet
              </p>
            </div>
          </Card>
        ) : (
          <>
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Bars Owned</p>
                  <p className="text-3xl font-bold text-yellow-600">{bars.length}</p>
                </div>
                <Package className="w-12 h-12 text-yellow-600 opacity-50" />
              </div>
            </Card>

            <div className="space-y-3">
              {bars.map((bar) => (
                <Card
                  key={bar.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleBarClick(bar)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {bar.products?.name || 'Gold Bar'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bar.bar_number}
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full text-xs font-semibold">
                        OWNED
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Serial Number</p>
                        <p className="font-semibold text-sm">{bar.serial_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weight</p>
                        <p className="font-semibold">{bar.weight_grams}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Purity</p>
                        <p className="font-semibold">{bar.purity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Manufacturer</p>
                        <p className="font-semibold text-sm">{bar.manufacturer}</p>
                      </div>
                    </div>

                    {bar.stores && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Stored at</p>
                            <p className="font-semibold">{bar.stores.name}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Shield className="w-4 h-4" />
                      <span>XRF Certified • {bar.certification_number}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
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
          <BarDetailsView bar={formatBarForDetails(selectedBar)} />
        </Modal>
      )}
    </div>
  );
};
