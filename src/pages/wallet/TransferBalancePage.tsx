import { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle, Download, Share2, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/wallet.service';
import { authService } from '../../services/auth.service';
import { Button, Input, Card } from '../../components/ui';
import { Profile, Wallet as WalletType, Currency } from '../../types';
import { formatCurrency } from '../../utils/format';
import { downloadReceiptPDF, shareReceipt } from '../../utils/pdf-generator';
import { TransactionReceiptData } from '../../components/invoice/TransactionReceipt';

interface TransferBalancePageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onBack: () => void;
}

export const TransferBalancePage = ({ onNavigate, onBack }: TransferBalancePageProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('LYD');
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [recipientVerified, setRecipientVerified] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptData, setReceiptData] = useState<TransactionReceiptData | null>(null);
  const [senderProfile, setSenderProfile] = useState<Profile | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const [walletBalanceBefore, setWalletBalanceBefore] = useState(0);
  const TRANSFER_FEE = 10;

  useEffect(() => {
    if (user) {
      loadWallets();
      loadSenderProfile();
    }
  }, [user]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const loadWallets = async () => {
    try {
      const walletData = await walletService.getWallets(user!.id);
      setWallets(walletData);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadSenderProfile = async () => {
    if (!user) return;
    try {
      const profile = await authService.getProfile(user.id);
      setSenderProfile(profile);
    } catch (error) {
      console.error('Failed to load sender profile:', error);
    }
  };

  const currentWallet = wallets.find((w) => w.currency === selectedCurrency);
  const availableBalance = currentWallet?.balance || 0;
  const requestedAmount = parseFloat(amount) || 0;
  const totalRequired = selectedCurrency === 'LYD'
    ? requestedAmount + TRANSFER_FEE
    : requestedAmount;

  const handleVerifyRecipient = async () => {
    setLoading(true);
    setError('');

    try {
      const recipient = await authService.findUserByEmailOrPhone(recipientIdentifier);

      if (recipient) {
        if (recipient.id === user?.id) {
          setError('You cannot transfer to yourself.');
          setLoading(false);
          return;
        }

        setRecipientVerified(true);
        setRecipientId(recipient.id);
        setRecipientName(`${recipient.first_name} ${recipient.last_name}`);
        setRecipientProfile(recipient);
        setStep(2);
      } else {
        setError('Recipient not found. Please check the email or phone number.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify recipient. Please try again.');
    }

    setLoading(false);
  };

  const handleSendOTP = () => {
    setResendCountdown(60);
  };

  const handleConfirmTransfer = async () => {
    if (!password || otp.length !== 6 || !user || !recipientId) return;

    setLoading(true);
    setError('');

    try {
      const wallet = await walletService.getWalletByCurrency(user.id, selectedCurrency);
      if (!wallet || wallet.balance < totalRequired) {
        setError(`Insufficient balance. You need ${formatCurrency(totalRequired, selectedCurrency)} (including ${TRANSFER_FEE} LYD fee).`);
        setLoading(false);
        return;
      }

      setWalletBalanceBefore(wallet.balance);

      await walletService.updateWalletBalance(user.id, selectedCurrency, -requestedAmount);

      if (selectedCurrency === 'LYD') {
        await walletService.updateWalletBalance(user.id, 'LYD', -TRANSFER_FEE);
      } else {
        const lydWallet = await walletService.getWalletByCurrency(user.id, 'LYD');
        if (!lydWallet || lydWallet.balance < TRANSFER_FEE) {
          await walletService.updateWalletBalance(user.id, selectedCurrency, requestedAmount);
          setError(`Insufficient LYD balance for transfer fee. You need ${TRANSFER_FEE} LYD.`);
          setLoading(false);
          return;
        }
        await walletService.updateWalletBalance(user.id, 'LYD', -TRANSFER_FEE);
      }

      await walletService.updateWalletBalance(recipientId, selectedCurrency, requestedAmount);

      const txId = `WTX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      await walletService.addTransaction({
        user_id: user.id,
        type: 'transfer_out',
        amount: requestedAmount,
        currency: selectedCurrency,
        description: `Transferred ${formatCurrency(requestedAmount, selectedCurrency)} to ${recipientName} - Fee: ${TRANSFER_FEE} LYD`,
        reference_id: txId,
      });

      await walletService.addTransaction({
        user_id: recipientId,
        type: 'transfer_in',
        amount: requestedAmount,
        currency: selectedCurrency,
        description: `Received ${formatCurrency(requestedAmount, selectedCurrency)} from ${senderProfile?.first_name} ${senderProfile?.last_name}`,
        reference_id: txId,
      });

      setTransactionId(txId);

      const receipt: TransactionReceiptData = {
        type: 'digital_transfer',
        transactionId: txId,
        timestamp: new Date().toISOString(),
        status: 'completed',
        user: {
          name: `${senderProfile?.first_name || ''} ${senderProfile?.last_name || ''}`.trim(),
          email: senderProfile?.email,
          phone: senderProfile?.phone,
        },
        recipient: {
          name: recipientName,
          email: recipientProfile?.email,
          phone: recipientProfile?.phone,
        },
        amounts: {
          subtotal: requestedAmount,
          fees: TRANSFER_FEE,
          total: requestedAmount + TRANSFER_FEE,
          currency: selectedCurrency,
        },
        payment: {
          method: selectedCurrency === 'LYD' ? 'wallet_dinar' : 'wallet_dollar',
          walletBalanceBefore: walletBalanceBefore,
          walletBalanceAfter: walletBalanceBefore - (selectedCurrency === 'LYD' ? requestedAmount + TRANSFER_FEE : requestedAmount),
        },
        notes: `Wallet-to-wallet transfer completed successfully. ${selectedCurrency === 'USD' ? `Transfer fee of ${TRANSFER_FEE} LYD was deducted from your Dinar wallet.` : ''}`,
      };

      setReceiptData(receipt);

      await loadWallets();

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (receiptData) {
      downloadReceiptPDF(receiptData);
    }
  };

  const handleShareReceipt = async () => {
    if (receiptData) {
      await shareReceipt(receiptData);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Transfer Details</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Select Currency:</label>
        <div className="flex space-x-3">
          <button
            onClick={() => setSelectedCurrency('LYD')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition ${
              selectedCurrency === 'LYD'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            LYD (Dinar)
          </button>
          <button
            onClick={() => setSelectedCurrency('USD')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition ${
              selectedCurrency === 'USD'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            USD (Dollar)
          </button>
        </div>
      </div>

      <Card className="bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(availableBalance, selectedCurrency)}</p>
          </div>
          <Wallet className="w-10 h-10 text-gray-400" />
        </div>
      </Card>

      <Input
        label="Recipient Email or Phone"
        placeholder="user@example.com or 0925551234"
        value={recipientIdentifier}
        onChange={(e) => setRecipientIdentifier(e.target.value)}
      />

      <Input
        type="number"
        label={`Amount (${selectedCurrency})`}
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.01"
        min="0"
      />

      {requestedAmount > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Transfer Amount:</span>
              <span className="font-semibold">{formatCurrency(requestedAmount, selectedCurrency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Transfer Fee:</span>
              <span className="font-semibold">{formatCurrency(TRANSFER_FEE, 'LYD')}</span>
            </div>
            <div className="border-t border-blue-300 dark:border-blue-700 pt-2 flex justify-between font-bold">
              <span>Total Required:</span>
              <span className="text-yellow-600">
                {formatCurrency(totalRequired, selectedCurrency)}
                {selectedCurrency === 'USD' && ` + ${TRANSFER_FEE} LYD`}
              </span>
            </div>
          </div>
        </Card>
      )}

      {totalRequired > availableBalance && (
        <p className="text-sm text-red-600">Insufficient balance</p>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <Button
        onClick={handleVerifyRecipient}
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={!recipientIdentifier || requestedAmount <= 0 || totalRequired > availableBalance}
      >
        Continue
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Confirm Transfer</h2>

      <Card className="bg-gray-50 dark:bg-gray-800">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Currency</span>
            <span className="font-semibold">{selectedCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
            <span className="font-semibold">{formatCurrency(requestedAmount, selectedCurrency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Recipient</span>
            <span className="font-semibold">{recipientName}</span>
          </div>
          <div className="border-t border-gray-300 dark:border-gray-600 mt-3 pt-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Transfer Fee</span>
              <span className="font-semibold text-yellow-600">{TRANSFER_FEE} LYD</span>
            </div>
            <div className="flex justify-between mt-2 font-bold">
              <span className="text-sm">Total Deducted</span>
              <span className="text-yellow-600">{formatCurrency(totalRequired, selectedCurrency)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          This transfer cannot be reversed. Please verify all details before confirming.
        </p>
      </div>

      <Input
        type="password"
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div>
        <Input
          label="SMS Verification Code"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
        />
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={handleSendOTP}
            disabled={resendCountdown > 0}
            className="text-sm text-blue-600 dark:text-blue-400 disabled:text-gray-400"
          >
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Send Code'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <Button onClick={() => setStep(1)} variant="outline" size="lg" fullWidth>
          Back
        </Button>
        <Button
          onClick={handleConfirmTransfer}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!password || otp.length !== 6}
        >
          Confirm Transfer
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
      <h2 className="text-xl font-bold">Transfer Successful!</h2>
      <p className="text-gray-600 dark:text-gray-400">
        You have successfully transferred {formatCurrency(requestedAmount, selectedCurrency)} to {recipientName}.
      </p>

      <Card className="bg-gray-50 dark:bg-gray-800 text-left">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction ID</p>
            <p className="font-mono text-sm font-semibold break-all">{transactionId}</p>
          </div>
          <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Amount Transferred</span>
              <span className="font-semibold">{formatCurrency(requestedAmount, selectedCurrency)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Transfer Fee</span>
              <span className="font-semibold text-yellow-600">{formatCurrency(TRANSFER_FEE, 'LYD')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">New {selectedCurrency} Balance</span>
              <span className="font-semibold">{formatCurrency(availableBalance, selectedCurrency)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex space-x-3 mt-6">
        <Button
          onClick={handleShareReceipt}
          variant="outline"
          size="lg"
          fullWidth
          icon={<Share2 className="w-5 h-5" />}
        >
          Share Receipt
        </Button>
        <Button
          onClick={handleDownloadReceipt}
          variant="outline"
          size="lg"
          fullWidth
          icon={<Download className="w-5 h-5" />}
        >
          Download PDF
        </Button>
      </div>

      <Button onClick={onBack} variant="primary" size="lg" fullWidth>
        Done
      </Button>
    </div>
  );

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Transfer Balance</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= s
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              {step > s ? '✓' : s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};
