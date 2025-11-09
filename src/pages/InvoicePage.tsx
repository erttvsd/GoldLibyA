import { useEffect, useState } from 'react';
import { Download, Calendar, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { assetService } from '../services/asset.service';
import { Button, Card } from '../components/ui';
import { TransactionReceipt, TransactionReceiptData } from '../components/invoice/TransactionReceipt';
import { receiptService } from '../services/receipt.service';
import { PurchaseInvoice } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { downloadReceiptPDF } from '../utils/pdf-generator';

interface InvoicePageProps {
  invoiceId: string;
  isNewPurchase?: boolean;
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onClose?: () => void;
}

export const InvoicePage = ({ invoiceId, isNewPurchase = false, onNavigate, onClose }: InvoicePageProps) => {
  const { profile, user } = useAuth();
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<TransactionReceiptData | null>(null);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await assetService.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!invoice || !profile || !user) return;

    let receipt: TransactionReceiptData;

    if (invoice.is_digital) {
      receipt = receiptService.generateDigitalPurchaseReceipt({
        userId: user.id,
        userName: `${profile.first_name} ${profile.last_name}`,
        userEmail: profile.email,
        metalType: invoice.digital_metal_type === 'gold' ? 'gold' : 'silver',
        grams: invoice.digital_grams || 0,
        pricePerGram: invoice.amount_lyd / (invoice.digital_grams || 1),
        totalAmount: invoice.amount_lyd,
        currency: 'LYD',
        walletBalanceBefore: 0,
        walletBalanceAfter: 0,
        transactionId: invoice.invoice_number,
      });
    } else if (invoice.asset) {
      receipt = receiptService.generatePhysicalPurchaseReceipt({
        userId: user.id,
        userName: `${profile.first_name} ${profile.last_name}`,
        userEmail: profile.email,
        product: {
          name: invoice.asset.product?.name || 'Gold Bar',
          type: invoice.asset.product?.type === 'gold' ? 'gold' : 'silver',
          weight: parseFloat(invoice.asset.product?.weight_grams || '0'),
          carat: invoice.asset.product?.carat,
          serialNumber: invoice.asset.serial_number,
        },
        basePrice: invoice.amount_lyd - invoice.commission_lyd,
        commission: invoice.commission_lyd,
        totalAmount: invoice.amount_lyd,
        currency: 'LYD',
        walletBalanceBefore: 0,
        walletBalanceAfter: 0,
        pickupStore: invoice.store?.name || 'Main Branch',
        pickupAddress: invoice.store ? `${invoice.store.city}, ${invoice.store.address}` : undefined,
        pickupDeadline: invoice.asset.pickup_deadline || new Date().toISOString(),
        transactionId: invoice.invoice_number,
      });
    } else {
      return;
    }

    downloadReceiptPDF(receipt);
  };

  const handleViewReceipt = () => {
    if (!invoice || !profile || !user) return;

    if (invoice.is_digital) {
      const receipt = receiptService.generateDigitalPurchaseReceipt({
        userId: user.id,
        userName: `${profile.first_name} ${profile.last_name}`,
        userEmail: profile.email,
        metalType: invoice.digital_metal_type === 'gold' ? 'gold' : 'silver',
        grams: invoice.digital_grams || 0,
        pricePerGram: invoice.amount_lyd / (invoice.digital_grams || 1),
        totalAmount: invoice.amount_lyd,
        currency: 'LYD',
        walletBalanceBefore: 0,
        walletBalanceAfter: 0,
        transactionId: invoice.invoice_number,
      });
      setReceiptData(receipt);
    } else if (invoice.asset) {
      const receipt = receiptService.generatePhysicalPurchaseReceipt({
        userId: user.id,
        userName: `${profile.first_name} ${profile.last_name}`,
        userEmail: profile.email,
        product: {
          name: invoice.asset.product?.name || 'Gold Bar',
          type: invoice.asset.product?.type === 'gold' ? 'gold' : 'silver',
          weight: parseFloat(invoice.asset.product?.weight_grams || '0'),
          carat: invoice.asset.product?.carat,
          serialNumber: invoice.asset.serial_number,
        },
        basePrice: invoice.amount_lyd - invoice.commission_lyd,
        commission: invoice.commission_lyd,
        totalAmount: invoice.amount_lyd,
        currency: 'LYD',
        walletBalanceBefore: 0,
        walletBalanceAfter: 0,
        pickupStore: invoice.store?.name || 'Main Branch',
        pickupAddress: invoice.store ? `${invoice.store.city}, ${invoice.store.address}` : undefined,
        pickupDeadline: invoice.asset.pickup_deadline || new Date().toISOString(),
        transactionId: invoice.invoice_number,
      });
      setReceiptData(receipt);
    }

    setShowReceipt(true);
  };

  const handleBookPickup = () => {
    if (invoice?.asset_id) {
      onNavigate('wallet', 'bookAppointment', { assetId: invoice.asset_id });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Invoice not found</p>
        <Button onClick={onClose || (() => onNavigate('home'))} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isPhysical = !invoice.is_digital;
  const pickupDeadline = invoice.asset?.pickup_deadline
    ? new Date(invoice.asset.pickup_deadline)
    : null;
  const now = new Date();
  const daysUntilDeadline = pickupDeadline
    ? Math.ceil((pickupDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {isNewPurchase && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-bold text-green-800 dark:text-green-300">Purchase Successful!</h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your order has been confirmed.
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownload}
              variant="primary"
              size="md"
              fullWidth
              icon={Download}
              className="bg-green-600 hover:bg-green-700"
            >
              Download Invoice PDF
            </Button>
          </div>
        </Card>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Invoice</h1>
        <p className="text-gray-500 dark:text-gray-400">#{invoice.invoice_number}</p>
      </div>

      <Card>
        <div className="space-y-3">
          <DetailRow label="Date" value={formatDateTime(invoice.created_at)} />
          <DetailRow
            label="Seller"
            value={invoice.store?.name || 'Gold Trading App'}
          />
          <DetailRow
            label="Buyer"
            value={`${profile?.first_name} ${profile?.last_name}`}
          />
          {invoice.store && (
            <DetailRow
              label="Pickup Location"
              value={`${invoice.store.city}, ${invoice.store.address}`}
            />
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">Item Details</h3>
        <div className="space-y-3">
          {invoice.is_digital ? (
            <>
              <DetailRow
                label="Type"
                value={`Digital ${invoice.digital_metal_type === 'gold' ? 'Gold' : 'Silver'}`}
              />
              <DetailRow
                label="Quantity"
                value={`${invoice.digital_grams?.toFixed(3)}g`}
              />
              <DetailRow
                label="Unit Price"
                value={formatCurrency(
                  invoice.amount_lyd / (invoice.digital_grams || 1),
                  'LYD'
                )}
              />
              {invoice.shared_bar_serial && (
                <DetailRow
                  label="Shared Bar SN"
                  value={invoice.shared_bar_serial}
                  valueClass="font-mono text-xs"
                />
              )}
            </>
          ) : (
            <>
              <DetailRow
                label="Product"
                value={invoice.asset?.product?.name || 'Physical Bar'}
              />
              <DetailRow
                label="Weight"
                value={`${invoice.asset?.product?.weight_grams || 0}g`}
              />
              {invoice.asset?.serial_number && (
                <DetailRow
                  label="Serial Number"
                  value={invoice.asset.serial_number}
                  valueClass="font-mono text-xs"
                />
              )}
            </>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">Payment Summary</h3>
        <div className="space-y-3">
          <DetailRow
            label="Subtotal"
            value={formatCurrency(invoice.amount_lyd - invoice.commission_lyd, 'LYD')}
          />
          {invoice.commission_lyd > 0 && (
            <DetailRow
              label="Commission (1.5%)"
              value={formatCurrency(invoice.commission_lyd, 'LYD')}
            />
          )}
          <DetailRow
            label="Payment Method"
            value={
              invoice.payment_method === 'wallet_dinar'
                ? 'Dinar Wallet'
                : invoice.payment_method === 'wallet_dollar'
                ? 'Dollar Wallet'
                : invoice.payment_method === 'coupon'
                ? 'Coupon'
                : 'Cash'
            }
          />
          <div className="pt-3 border-t dark:border-gray-700">
            <DetailRow
              label="Total Paid"
              value={formatCurrency(invoice.amount_lyd, 'LYD')}
              valueClass="text-lg text-yellow-600 font-bold"
            />
          </div>
        </div>
      </Card>

      {isPhysical && pickupDeadline && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="flex-grow">
              <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                Important: Pickup Deadline
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                You have <strong>{daysUntilDeadline} days</strong> to pickup your item.
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                After the grace period, a storage fee of <strong>30 LYD per day</strong> will be applied.
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                Deadline: {formatDate(pickupDeadline.toISOString())}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Button
        onClick={handleViewReceipt}
        variant="primary"
        size="lg"
        fullWidth
        icon={FileText}
      >
        View Detailed Receipt
      </Button>

      <div className="flex space-x-3">
        <Button
          onClick={handleDownload}
          variant="outline"
          size="lg"
          fullWidth
          icon={Download}
        >
          Download PDF
        </Button>
        {isPhysical && (
          <Button
            onClick={handleBookPickup}
            variant="outline"
            size="lg"
            fullWidth
            icon={Calendar}
          >
            Book Pickup
          </Button>
        )}
      </div>

      {onClose && (
        <Button onClick={onClose} variant="secondary" size="lg" fullWidth>
          Close
        </Button>
      )}

      {showReceipt && receiptData && (
        <TransactionReceipt
          data={receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};

const DetailRow = ({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`text-sm font-semibold text-gray-800 dark:text-gray-100 text-right ${valueClass}`}>
      {value}
    </p>
  </div>
);
