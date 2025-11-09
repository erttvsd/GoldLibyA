import { X, Package, User, Calendar, DollarSign, FileText, MapPin } from 'lucide-react';
import { Modal, Button } from '../ui';
import { formatDate } from '../../utils/format';

interface BarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  barData: {
    serial_number: string;
    product?: {
      name: string;
      type: string;
      carat: number;
      weight_grams: number;
      base_price_lyd: number;
    };
    status: string;
    owner?: {
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      national_id?: string;
    };
    purchase_date?: string;
    current_location?: string;
    qr_code_url?: string;
  } | null;
}

export const BarDetailModal = ({ isOpen, onClose, barData }: BarDetailModalProps) => {
  if (!barData) return null;

  const metalColor = barData.product?.type === 'gold' ? 'text-yellow-600' : 'text-gray-500';
  const bgColor = barData.product?.type === 'gold' ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-gray-100 dark:bg-gray-800';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Bar Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`${bgColor} rounded-lg p-6 text-center`}>
          <Package className={`w-16 h-16 ${metalColor} mx-auto mb-3`} />
          <h3 className="text-xl font-bold mb-2">{barData.product?.name || 'N/A'}</h3>
          <div className="inline-block px-4 py-2 bg-white/50 dark:bg-black/30 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Serial Number</p>
            <p className="font-mono font-bold text-lg">{barData.serial_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Weight</p>
            <p className="text-lg font-bold">{barData.product?.weight_grams}g</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Purity</p>
            <p className="text-lg font-bold">
              {barData.product?.type === 'gold'
                ? `${barData.product?.carat}K`
                : `${(barData.product?.carat || 999) / 10}%`}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Price</p>
            <p className="text-lg font-bold">{barData.product?.base_price_lyd} LYD</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="text-lg font-bold capitalize">{barData.status?.replace('_', ' ')}</p>
          </div>
        </div>

        {barData.owner && (
          <div className="border-t pt-4">
            <h3 className="font-bold mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Owner Information
            </h3>
            <div className="space-y-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-lg">
                    {barData.owner.first_name} {barData.owner.last_name}
                  </p>
                  {barData.owner.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{barData.owner.email}</p>
                  )}
                  {barData.owner.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{barData.owner.phone}</p>
                  )}
                  {barData.owner.national_id && (
                    <p className="text-xs text-gray-500 mt-2">
                      National ID: {barData.owner.national_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {barData.current_location && (
          <div className="flex items-start space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500">Current Location</p>
              <p className="font-medium">{barData.current_location}</p>
            </div>
          </div>
        )}

        {barData.purchase_date && (
          <div className="flex items-start space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500">Purchase Date</p>
              <p className="font-medium">{formatDate(barData.purchase_date)}</p>
            </div>
          </div>
        )}

        {barData.qr_code_url && (
          <div className="text-center pt-4 border-t">
            <img
              src={barData.qr_code_url}
              alt="QR Code"
              className="w-32 h-32 mx-auto border rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-2">Scan to verify</p>
          </div>
        )}

        <Button onClick={onClose} variant="outline" fullWidth>
          Close
        </Button>
      </div>
    </Modal>
  );
};
