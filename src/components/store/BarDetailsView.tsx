import { Package, Shield, User, Calendar, Hash, CheckCircle, XCircle, Clock } from 'lucide-react';
import { InventoryBar } from '../../services/bar-tracking.service';
import { Card } from '../ui';

interface BarDetailsViewProps {
  bar: InventoryBar;
}

export const BarDetailsView = ({ bar }: BarDetailsViewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'sold':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="w-4 h-4" />;
      case 'sold':
        return <XCircle className="w-4 h-4" />;
      case 'reserved':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {bar.product_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {bar.bar_number}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(bar.status)}`}>
              {getStatusIcon(bar.status)}
              {bar.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-yellow-200 dark:border-yellow-800">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Serial Number</p>
              <p className="font-bold text-sm">{bar.serial_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Certification</p>
              <p className="font-bold text-sm">{bar.certification_number || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-yellow-200 dark:border-yellow-800">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Weight</p>
              <p className="font-bold">{bar.weight_grams}g</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Purity</p>
              <p className="font-bold">{bar.purity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Manufacturer</p>
              <p className="font-bold text-sm">{bar.manufacturer || 'N/A'}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-gray-900 dark:text-white">XRF Analysis Results</h4>
        </div>
        <div className="space-y-3">
          {bar.xrf_gold_percentage > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Gold (Au)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${bar.xrf_gold_percentage}%` }}
                  />
                </div>
                <span className="font-bold text-sm w-16 text-right">
                  {bar.xrf_gold_percentage.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
          {bar.xrf_silver_percentage > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Silver (Ag)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gray-400 h-2 rounded-full"
                    style={{ width: `${bar.xrf_silver_percentage}%` }}
                  />
                </div>
                <span className="font-bold text-sm w-16 text-right">
                  {bar.xrf_silver_percentage.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
          {bar.xrf_copper_percentage > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Copper (Cu)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${bar.xrf_copper_percentage}%` }}
                  />
                </div>
                <span className="font-bold text-sm w-16 text-right">
                  {bar.xrf_copper_percentage.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
          {Object.keys(bar.xrf_other_metals || {}).length > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Other Metals Detected:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(bar.xrf_other_metals).map(([metal, percentage]) => (
                  <div key={metal} className="text-sm">
                    <span className="font-medium">{metal}:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {bar.status === 'sold' && bar.buyer_name && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-gray-900 dark:text-white">Buyer Information</h4>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Name</p>
                <p className="font-semibold">{bar.buyer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                <p className="font-semibold">{bar.buyer_phone || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
              <p className="font-semibold">{bar.buyer_email || 'N/A'}</p>
            </div>
            <div className="pt-3 border-t border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sale Number</p>
                  <p className="font-semibold">{bar.sale_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sale Total</p>
                  <p className="font-bold text-lg text-red-600">{bar.sale_total.toFixed(2)} LYD</p>
                </div>
              </div>
              {bar.sale_date && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sale Date</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(bar.sale_date).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {bar.manufacture_date && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-gray-900 dark:text-white">Manufacturing Details</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Manufacturer</p>
              <p className="font-semibold">{bar.manufacturer || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Manufacture Date</p>
              <p className="font-semibold">
                {new Date(bar.manufacture_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
