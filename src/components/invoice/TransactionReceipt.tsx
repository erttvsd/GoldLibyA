import { useState } from 'react';
import { CheckCircle, Download, Share2, X, ArrowRightLeft, Package, MapPin, ShoppingCart, Send } from 'lucide-react';
import { Card, Button } from '../ui';
import { formatCurrency, formatGrams, formatDate } from '../../utils/format';
import { downloadReceiptPDF, shareReceipt } from '../../utils/pdf-generator';

export type TransactionType =
  | 'digital_purchase'
  | 'physical_purchase'
  | 'ownership_transfer'
  | 'location_change'
  | 'digital_transfer'
  | 'receive_physical'
  | 'wallet_deposit'
  | 'wallet_withdrawal';

export interface TransactionReceiptData {
  transactionId: string;
  type: TransactionType;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';

  user?: {
    name: string;
    email?: string;
    phone?: string;
  };

  recipient?: {
    name: string;
    email?: string;
    phone?: string;
  };

  product?: {
    name: string;
    type: 'gold' | 'silver';
    weight: number;
    carat?: number;
    serialNumber?: string;
  };

  location?: {
    from?: string;
    to?: string;
  };

  amounts: {
    subtotal?: number;
    commission?: number;
    fees?: number;
    fabricationFee?: number;
    storageFee?: number;
    total: number;
    currency: 'LYD' | 'USD';
  };

  digitalGrams?: {
    metal: 'gold' | 'silver';
    grams: number;
    pricePerGram: number;
  };

  payment?: {
    method: 'wallet_lyd' | 'wallet_usd' | 'bank_transfer' | 'cash';
    walletBalanceBefore?: number;
    walletBalanceAfter?: number;
  };

  pickup?: {
    store: string;
    deadline: string;
    address?: string;
  };

  notes?: string;
  txHash?: string;
}

interface TransactionReceiptProps {
  data: TransactionReceiptData;
  onClose: () => void;
}

export const TransactionReceipt = ({ data, onClose }: TransactionReceiptProps) => {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      downloadReceiptPDF(data);

      setTimeout(() => {
        alert('✓ PDF downloaded successfully! Check your downloads folder.');
      }, 500);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setTimeout(() => {
        setDownloading(false);
      }, 1000);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      await shareReceipt(data);
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setSharing(false);
    }
  };

  const getTransactionIcon = () => {
    switch (data.type) {
      case 'digital_purchase':
      case 'physical_purchase':
        return <ShoppingCart className="w-12 h-12 text-yellow-600" />;
      case 'ownership_transfer':
      case 'digital_transfer':
        return <Send className="w-12 h-12 text-blue-600" />;
      case 'location_change':
        return <MapPin className="w-12 h-12 text-purple-600" />;
      case 'receive_physical':
        return <Package className="w-12 h-12 text-green-600" />;
      default:
        return <ArrowRightLeft className="w-12 h-12 text-gray-600" />;
    }
  };

  const getTransactionTitle = () => {
    switch (data.type) {
      case 'digital_purchase':
        return 'Digital Gold Purchase';
      case 'physical_purchase':
        return 'Physical Gold Purchase';
      case 'ownership_transfer':
        return 'Ownership Transfer';
      case 'location_change':
        return 'Location Change';
      case 'digital_transfer':
        return 'Digital Gold Transfer';
      case 'receive_physical':
        return 'Convert to Physical';
      case 'wallet_deposit':
        return 'Wallet Deposit';
      case 'wallet_withdrawal':
        return 'Wallet Withdrawal';
      default:
        return 'Transaction';
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'success':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Transaction Receipt</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-3">
            {data.status === 'success' && (
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
            )}

            <div className="flex justify-center">
              {getTransactionIcon()}
            </div>

            <div>
              <h3 className="text-2xl font-bold">{getTransactionTitle()}</h3>
              <p className={`text-sm ${getStatusColor()} font-semibold capitalize mt-1`}>
                {data.status}
              </p>
            </div>
          </div>

          <Card className="bg-gray-50 dark:bg-gray-800">
            <div className="space-y-3">
              <DetailRow label="Transaction ID" value={data.transactionId} />
              <DetailRow label="Date & Time" value={formatDate(data.timestamp)} />
              {data.txHash && <DetailRow label="TX Hash" value={data.txHash.slice(0, 16) + '...'} />}
            </div>
          </Card>

          {data.user && (
            <Card>
              <h4 className="font-bold mb-3">Customer Information</h4>
              <div className="space-y-2">
                <DetailRow label="Name" value={data.user.name} />
                {data.user.email && <DetailRow label="Email" value={data.user.email} />}
                {data.user.phone && <DetailRow label="Phone" value={data.user.phone} />}
              </div>
            </Card>
          )}

          {data.recipient && (
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-bold mb-3">Recipient Information</h4>
              <div className="space-y-2">
                <DetailRow label="Name" value={data.recipient.name} />
                {data.recipient.email && <DetailRow label="Email" value={data.recipient.email} />}
                {data.recipient.phone && <DetailRow label="Phone" value={data.recipient.phone} />}
              </div>
            </Card>
          )}

          {data.product && (
            <Card>
              <h4 className="font-bold mb-3">Product Details</h4>
              <div className="space-y-2">
                <DetailRow label="Product" value={data.product.name} />
                <DetailRow label="Type" value={data.product.type.toUpperCase()} />
                <DetailRow label="Weight" value={formatGrams(data.product.weight)} />
                {data.product.carat && <DetailRow label="Karat" value={`${data.product.carat}K`} />}
                {data.product.serialNumber && (
                  <DetailRow label="Serial Number" value={data.product.serialNumber} />
                )}
              </div>
            </Card>
          )}

          {data.digitalGrams && (
            <Card className="bg-yellow-50 dark:bg-yellow-900/20">
              <h4 className="font-bold mb-3">Digital {data.digitalGrams.metal.toUpperCase()}</h4>
              <div className="space-y-2">
                <DetailRow label="Amount" value={formatGrams(data.digitalGrams.grams)} />
                <DetailRow
                  label="Price per Gram"
                  value={formatCurrency(data.digitalGrams.pricePerGram, data.amounts.currency)}
                />
                <DetailRow
                  label="Total Value"
                  value={formatCurrency(data.digitalGrams.grams * data.digitalGrams.pricePerGram, data.amounts.currency)}
                />
              </div>
            </Card>
          )}

          {data.location && (
            <Card className="bg-purple-50 dark:bg-purple-900/20">
              <h4 className="font-bold mb-3">Location Change</h4>
              <div className="space-y-2">
                {data.location.from && <DetailRow label="From" value={data.location.from} />}
                {data.location.to && <DetailRow label="To" value={data.location.to} />}
              </div>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white dark:from-gray-800 dark:to-gray-900">
            <h4 className="font-bold mb-3">Payment Summary</h4>
            <div className="space-y-2">
              {data.amounts.subtotal !== undefined && (
                <DetailRow
                  label="Subtotal"
                  value={formatCurrency(data.amounts.subtotal, data.amounts.currency)}
                  isDark
                />
              )}
              {data.amounts.commission !== undefined && data.amounts.commission > 0 && (
                <DetailRow
                  label="Commission (1.5%)"
                  value={formatCurrency(data.amounts.commission, data.amounts.currency)}
                  isDark
                />
              )}
              {data.amounts.fees !== undefined && data.amounts.fees > 0 && (
                <DetailRow
                  label="Service Fees"
                  value={formatCurrency(data.amounts.fees, data.amounts.currency)}
                  isDark
                />
              )}
              {data.amounts.fabricationFee !== undefined && data.amounts.fabricationFee > 0 && (
                <DetailRow
                  label="Fabrication Fee"
                  value={formatCurrency(data.amounts.fabricationFee, data.amounts.currency)}
                  isDark
                />
              )}
              {data.amounts.storageFee !== undefined && data.amounts.storageFee > 0 && (
                <DetailRow
                  label="Storage Fee"
                  value={formatCurrency(data.amounts.storageFee, data.amounts.currency)}
                  isDark
                />
              )}
              <div className="border-t border-white/20 pt-2 mt-2">
                <DetailRow
                  label="Total Amount"
                  value={formatCurrency(data.amounts.total, data.amounts.currency)}
                  isDark
                  isLarge
                />
              </div>
            </div>
          </Card>

          {data.payment && (
            <Card>
              <h4 className="font-bold mb-3">Payment Method</h4>
              <div className="space-y-2">
                <DetailRow
                  label="Method"
                  value={data.payment.method.replace('_', ' ').toUpperCase()}
                />
                {data.payment.walletBalanceBefore !== undefined && (
                  <>
                    <DetailRow
                      label="Balance Before"
                      value={formatCurrency(data.payment.walletBalanceBefore, data.amounts.currency)}
                    />
                    <DetailRow
                      label="Balance After"
                      value={formatCurrency(data.payment.walletBalanceAfter || 0, data.amounts.currency)}
                    />
                  </>
                )}
              </div>
            </Card>
          )}

          {data.pickup && (
            <Card className="bg-green-50 dark:bg-green-900/20">
              <h4 className="font-bold mb-3">Pickup Information</h4>
              <div className="space-y-2">
                <DetailRow label="Store" value={data.pickup.store} />
                <DetailRow label="Deadline" value={formatDate(data.pickup.deadline)} />
                {data.pickup.address && <DetailRow label="Address" value={data.pickup.address} />}
              </div>
              <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Please collect your gold within 3 days to avoid storage fees (30 LYD/day)
                </p>
              </div>
            </Card>
          )}

          {data.notes && (
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-bold mb-2">Notes</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{data.notes}</p>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="lg"
              icon={Download}
              fullWidth
              loading={downloading}
            >
              Download PDF
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
              icon={Share2}
              fullWidth
              loading={sharing}
            >
              Share
            </Button>
          </div>

          <Button
            onClick={onClose}
            variant="primary"
            size="lg"
            fullWidth
          >
            Close
          </Button>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>This receipt is your proof of transaction</p>
            <p>Keep it for your records</p>
            <p className="font-semibold">Gold Trading Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({
  label,
  value,
  isDark = false,
  isLarge = false
}: {
  label: string;
  value: string;
  isDark?: boolean;
  isLarge?: boolean;
}) => (
  <div className="flex justify-between items-center">
    <span className={`${isLarge ? 'text-base font-bold' : 'text-sm'} ${isDark ? 'text-white/70' : 'text-gray-600 dark:text-gray-400'}`}>
      {label}
    </span>
    <span className={`${isLarge ? 'text-xl font-bold' : 'text-sm font-semibold'} ${isDark ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
      {value}
    </span>
  </div>
);
