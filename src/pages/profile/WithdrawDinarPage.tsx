import { useState } from 'react';
import { ArrowLeft, Building2, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/wallet.service';
import { receiptService } from '../../services/receipt.service';
import { TransactionReceipt, TransactionReceiptData } from '../../components/invoice/TransactionReceipt';
import { Card, Button, Input } from '../../components/ui';
import { formatCurrency } from '../../utils/format';

interface WithdrawDinarPageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onBack: () => void;
}

export const WithdrawDinarPage = ({ onNavigate, onBack }: WithdrawDinarPageProps) => {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(profile ? `${profile.first_name} ${profile.last_name}` : '');
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<TransactionReceiptData | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [error, setError] = useState('');

  useState(() => {
    if (user) {
      walletService.getWalletByCurrency(user.id, 'LYD').then((wallet) => {
        if (wallet) {
          setCurrentBalance(wallet.balance);
        }
      });
    }
  });

  const handleWithdraw = async () => {
    if (!user || !profile || !amount || parseFloat(amount) <= 0) return;

    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount > currentBalance) {
      setError('Insufficient balance');
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      setError('Please fill in all bank details');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const wallet = await walletService.getWalletByCurrency(user.id, 'LYD');
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const walletBalanceBefore = wallet.balance;

      await walletService.updateWalletBalance(user.id, 'LYD', -withdrawAmount);

      const txId = `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setTransactionId(txId);

      await walletService.addTransaction({
        user_id: user.id,
        type: 'withdrawal',
        amount: withdrawAmount,
        currency: 'LYD',
        description: `Withdrawal to ${bankName} - ${accountNumber}`,
        reference_id: txId,
      });

      const receipt: TransactionReceiptData = {
        transactionId: txId,
        type: 'wallet_withdrawal',
        timestamp: new Date().toISOString(),
        status: 'pending',
        user: {
          name: `${profile.first_name} ${profile.last_name}`,
          email: profile.email,
        },
        amounts: {
          total: withdrawAmount,
          currency: 'LYD',
        },
        payment: {
          method: 'bank_transfer',
          walletBalanceBefore,
          walletBalanceAfter: walletBalanceBefore - withdrawAmount,
        },
        notes: `Withdrawal request submitted successfully. Funds will be transferred to ${bankName} (${accountNumber}) within 2 business days. Account holder: ${accountName}${branchName ? `, Branch: ${branchName}` : ''}`,
        txHash: `TXH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      };

      setReceiptData(receipt);
      setLoading(false);
      setSuccess(true);
      setCurrentBalance(currentBalance - withdrawAmount);
    } catch (error) {
      console.error('Failed to process withdrawal:', error);
      setError('Failed to process withdrawal. Please try again.');
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
            <h2 className="text-xl font-bold">Withdrawal Requested!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your withdrawal of {formatCurrency(parseFloat(amount), 'LYD')} has been requested.
            </p>
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="space-y-3 text-left">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Processing Time:</strong> 2 business days
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Bank:</strong> {bankName}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Account:</strong> {accountNumber}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Account Holder:</strong> {accountName}
                </p>
                {branchName && (
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Branch:</strong> {branchName}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
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
        <h1 className="text-2xl font-bold">Withdraw Dinar</h1>
      </div>

      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {formatCurrency(currentBalance, 'LYD')}
          </p>
        </div>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-400">
            <p className="font-semibold mb-1">Processing Time: 2 Business Days</p>
            <p>Funds will be transferred to your specified bank account within 2 business days.</p>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </Card>
      )}

      <Card>
        <h3 className="font-bold mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-green-600" />
          Bank Account Details
        </h3>
        <div className="space-y-4">
          <Input
            type="number"
            label="Withdrawal Amount (LYD)"
            placeholder="Enter amount to withdraw"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
          />

          <Input
            label="Bank Name"
            placeholder="e.g., Jumhouria Bank"
            value={bankName}
            onChange={(e) => {
              setBankName(e.target.value);
              setError('');
            }}
          />

          <Input
            label="Account Number / IBAN"
            placeholder="Enter your account number"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value);
              setError('');
            }}
          />

          <Input
            label="Account Holder Name"
            placeholder="Name as registered with bank"
            value={accountName}
            onChange={(e) => {
              setAccountName(e.target.value);
              setError('');
            }}
          />

          <Input
            label="Branch Name (Optional)"
            placeholder="e.g., Tripoli Main Branch"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />
        </div>
      </Card>

      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Important Notes:</h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
          <li>• Ensure your bank details are correct</li>
          <li>• Account name must match your registered name</li>
          <li>• Minimum withdrawal: 100 LYD</li>
          <li>• Funds will be deducted immediately</li>
          <li>• Bank transfer will be processed within 2 business days</li>
          <li>• You will receive a confirmation email once processed</li>
        </ul>
      </Card>

      <div className="flex space-x-3">
        <Button onClick={onBack} variant="outline" size="lg" fullWidth>
          Cancel
        </Button>
        <Button
          onClick={handleWithdraw}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) < 100 ||
            parseFloat(amount) > currentBalance ||
            !bankName ||
            !accountNumber ||
            !accountName
          }
        >
          Withdraw Funds
        </Button>
      </div>
    </div>
  );
};
