import { useState } from 'react';
import { ArrowLeft, CreditCard, Ticket, Building2, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/wallet.service';
import { receiptService } from '../../services/receipt.service';
import { TransactionReceipt, TransactionReceiptData } from '../../components/invoice/TransactionReceipt';
import { Card, Button, Input } from '../../components/ui';
import { formatCurrency } from '../../utils/format';

interface FundDollarWalletPageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onBack: () => void;
}

export const FundDollarWalletPage = ({ onNavigate, onBack }: FundDollarWalletPageProps) => {
  const { user, profile } = useAuth();
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<TransactionReceiptData | null>(null);
  const [transactionId, setTransactionId] = useState('');

  const handleProceed = async () => {
    if (!user || !profile || !amount || parseFloat(amount) <= 0) return;

    try {
      setLoading(true);

      const depositAmount = parseFloat(amount);
      const wallet = await walletService.getWalletByCurrency(user.id, 'USD');

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const walletBalanceBefore = wallet.balance;

      await walletService.updateWalletBalance(user.id, 'USD', depositAmount);

      const txId = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setTransactionId(txId);

      await walletService.addTransaction({
        user_id: user.id,
        type: 'deposit',
        amount: depositAmount,
        currency: 'USD',
        description: `Wallet deposit via ${activeMethod === 'card' ? 'International Card' : activeMethod === 'bank' ? 'Wire Transfer' : 'Other'}`,
        reference_id: txId,
      });

      const receipt = receiptService.generateWalletDepositReceipt({
        userId: user.id,
        userName: `${profile.first_name} ${profile.last_name}`,
        userEmail: profile.email,
        amount: depositAmount,
        currency: 'USD',
        walletBalanceBefore,
        walletBalanceAfter: walletBalanceBefore + depositAmount,
        transactionId: txId,
        depositMethod: activeMethod === 'card' ? 'International Card' : activeMethod === 'bank' ? 'Wire Transfer' : 'Other',
      });

      setReceiptData(receipt);
      setLoading(false);
      setSuccess(true);
    } catch (error) {
      console.error('Failed to process deposit:', error);
      alert('Failed to process deposit. Please try again.');
      setLoading(false);
    }
  };

  const handleViewReceipt = () => {
    setShowReceipt(true);
  };

  if (success) {
    return (
      <>
        <div className="p-4 space-y-6 animate-fade-in">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-xl font-bold">Deposit Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your deposit of {formatCurrency(parseFloat(amount), 'USD')} has been credited to your wallet.
            </p>
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✓ Funds are now available in your wallet
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Transaction ID: {transactionId}
              </p>
            </Card>
            <Button onClick={handleViewReceipt} variant="primary" size="lg" fullWidth icon={FileText}>
              View Receipt
            </Button>
            <Button onClick={() => onNavigate('wallet')} variant="outline" size="lg" fullWidth>
              Go to Wallet
            </Button>
            <Button onClick={onBack} variant="secondary" size="lg" fullWidth>
              Back to Profile
            </Button>
          </div>
        </div>

        {showReceipt && receiptData && (
          <TransactionReceipt
            data={receiptData}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Fund Dollar Wallet</h1>
      </div>

      <div className="space-y-3">
        <MethodCard
          icon={CreditCard}
          title="International Card"
          description="Pay with Visa/Mastercard/Amex"
          color="text-blue-600"
          bgColor="bg-blue-100 dark:bg-blue-900/20"
          active={activeMethod === 'card'}
          onClick={() => setActiveMethod('card')}
        />

        {activeMethod === 'card' && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="space-y-3">
              <Input
                type="number"
                label="Amount (USD)"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  You will be redirected to our secure payment gateway
                </p>
                <div className="flex space-x-2">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    MC
                  </div>
                  <div className="w-12 h-8 bg-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">
                    AMEX
                  </div>
                </div>
              </div>
              <Button
                onClick={handleProceed}
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Proceed to Gateway
              </Button>
            </div>
          </Card>
        )}

        <MethodCard
          icon={Ticket}
          title="Coupon Code"
          description="Redeem a promotional coupon"
          color="text-purple-600"
          bgColor="bg-purple-100 dark:bg-purple-900/20"
          active={activeMethod === 'coupon'}
          onClick={() => setActiveMethod('coupon')}
        />

        {activeMethod === 'coupon' && (
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <div className="space-y-3">
              <Input
                label="Coupon Code"
                placeholder="Enter your coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button
                onClick={() => alert('Coupon validation coming soon')}
                variant="primary"
                size="lg"
                fullWidth
                disabled={!couponCode}
              >
                Apply Coupon
              </Button>
            </div>
          </Card>
        )}

        <MethodCard
          icon={Building2}
          title="International Bank Transfer"
          description="Wire transfer via SWIFT"
          color="text-green-600"
          bgColor="bg-green-100 dark:bg-green-900/20"
          active={activeMethod === 'bank'}
          onClick={() => setActiveMethod('bank')}
        />

        {activeMethod === 'bank' && (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h3 className="font-bold mb-3">International Wire Details</h3>
            <div className="space-y-2 text-sm">
              <DetailRow label="Bank Name" value="Emirates NBD" />
              <DetailRow label="Account Name" value="Gold Trading International LLC" />
              <DetailRow label="Account Number (IBAN)" value="AE070331234567890123456" />
              <DetailRow label="SWIFT/BIC Code" value="EBILAEAD" />
              <DetailRow label="Bank Address" value="Dubai, United Arab Emirates" />
              <DetailRow label="Routing Number" value="026009593" />
            </div>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                <strong>Important:</strong> Please include your account ID or email in the transfer reference. International transfers typically take 2-5 business days.
              </p>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                <strong>Note:</strong> Wire transfer fees charged by intermediary banks are the sender's responsibility.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const MethodCard = ({
  icon: Icon,
  title,
  description,
  color,
  bgColor,
  active,
  onClick,
}: any) => (
  <Card
    className={`cursor-pointer ${active ? 'border-2 border-yellow-500' : ''}`}
    hover
    onClick={onClick}
  >
    <div className="flex items-center space-x-3">
      <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="flex-grow">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  </Card>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-1">
    <span className="text-gray-600 dark:text-gray-400">{label}:</span>
    <span className="font-semibold text-right">{value}</span>
  </div>
);
