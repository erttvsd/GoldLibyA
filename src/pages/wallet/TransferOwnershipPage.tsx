import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, Shield, Download, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { assetService } from '../../services/asset.service';
import { authService } from '../../services/auth.service';
import { walletService } from '../../services/wallet.service';
import { Button, Input, Card } from '../../components/ui';
import { OwnedAsset, Profile } from '../../types';
import { downloadReceiptPDF, shareReceipt } from '../../utils/pdf-generator';
import { TransactionReceiptData } from '../../components/invoice/TransactionReceipt';

interface TransferOwnershipPageProps {
  assetId?: string;
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onBack: () => void;
}

export const TransferOwnershipPage = ({ assetId, onNavigate, onBack }: TransferOwnershipPageProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [assets, setAssets] = useState<OwnedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<OwnedAsset | null>(null);
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [recipientVerified, setRecipientVerified] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [manualReview, setManualReview] = useState(false);
  const [receiptData, setReceiptData] = useState<TransactionReceiptData | null>(null);
  const [senderProfile, setSenderProfile] = useState<Profile | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const TRANSFER_FEE = 10;

  useEffect(() => {
    if (user) {
      loadAssets();
      loadSenderProfile();
    }
  }, [user]);

  const loadSenderProfile = async () => {
    if (!user) return;
    try {
      const profile = await authService.getProfile(user.id);
      setSenderProfile(profile);
    } catch (error) {
      console.error('Failed to load sender profile:', error);
    }
  };

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const loadAssets = async () => {
    try {
      const data = await assetService.getUserAssets(user!.id);
      const notReceived = data.filter((a) => a.status === 'not_received');
      setAssets(notReceived);

      if (assetId) {
        const asset = notReceived.find((a) => a.id === assetId);
        if (asset) {
          setSelectedAsset(asset);
          setStep(2);
        }
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

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
        setStep(3);
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
    if (!password || otp.length !== 6 || !selectedAsset || !recipientId || !user) return;

    setLoading(true);
    setError('');

    try {
      const randomRisk = Math.random();
      setRiskScore(randomRisk);

      if (randomRisk > 0.8) {
        setManualReview(true);
        setStep(4);
        setLoading(false);
        return;
      }

      const lydWallet = await walletService.getWalletByCurrency(user.id, 'LYD');
      if (!lydWallet || lydWallet.balance < TRANSFER_FEE) {
        setError(`Insufficient balance. Transfer fee is ${TRANSFER_FEE} LYD.`);
        setLoading(false);
        return;
      }

      const balanceBefore = lydWallet.balance;

      await walletService.updateWalletBalance(user.id, 'LYD', -TRANSFER_FEE);

      await assetService.transferAssetOwnership(selectedAsset.id, recipientId);

      const hash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      await walletService.addTransaction({
        user_id: user.id,
        type: 'transfer_out',
        amount: TRANSFER_FEE,
        currency: 'LYD',
        description: `Transferred ${selectedAsset.product?.name || 'asset'} (SN: ${selectedAsset.serial_number}) to ${recipientName} - Fee: ${TRANSFER_FEE} LYD`,
        reference_id: hash,
      });

      await walletService.addTransaction({
        user_id: recipientId,
        type: 'transfer_in',
        amount: 0,
        currency: 'LYD',
        description: `Received ${selectedAsset.product?.name || 'asset'} (SN: ${selectedAsset.serial_number}) from ${senderProfile?.first_name} ${senderProfile?.last_name}`,
        reference_id: hash,
      });

      setTxHash(hash);

      const receipt: TransactionReceiptData = {
        type: 'ownership_transfer',
        transactionId: hash,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txHash: hash,
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
        product: {
          name: selectedAsset.product?.name || 'Gold Bar',
          type: selectedAsset.product?.type || 'gold',
          weight: selectedAsset.product?.weight_grams || 0,
          carat: selectedAsset.product?.carat,
          serialNumber: selectedAsset.serial_number,
        },
        amounts: {
          subtotal: 0,
          fees: TRANSFER_FEE,
          total: TRANSFER_FEE,
          currency: 'LYD',
        },
        payment: {
          method: 'wallet_dinar',
          walletBalanceBefore: balanceBefore,
          walletBalanceAfter: balanceBefore - TRANSFER_FEE,
        },
        notes: `Risk Score: ${(riskScore * 100).toFixed(1)}% (Low Risk). The recipient can now collect this item from the designated pickup location.`,
      };

      setReceiptData(receipt);

      await loadAssets();

      setStep(4);
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
      <h2 className="text-xl font-bold mb-4">Select Asset to Transfer</h2>

      {assets.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No assets available for transfer
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <Card
              key={asset.id}
              className={`cursor-pointer ${
                selectedAsset?.id === asset.id ? 'border-2 border-yellow-500' : ''
              }`}
              hover
              onClick={() => setSelectedAsset(asset)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{asset.product?.name || 'Gold Bar'}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {asset.product?.weight_grams}g • SN: {asset.serial_number}
                  </p>
                  {asset.store && (
                    <p className="text-xs text-gray-500 mt-1">
                      Pickup: {asset.store.name}
                    </p>
                  )}
                </div>
                <input
                  type="radio"
                  checked={selectedAsset?.id === asset.id}
                  onChange={() => setSelectedAsset(asset)}
                  className="w-5 h-5"
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Button
        onClick={() => setStep(2)}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selectedAsset}
      >
        Continue
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Verify Recipient</h2>

      <Card className="bg-gray-50 dark:bg-gray-800">
        <p className="text-sm mb-1">Transferring</p>
        <p className="font-bold">{selectedAsset?.product?.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">SN: {selectedAsset?.serial_number}</p>
      </Card>

      <Input
        label="Recipient Email or Phone"
        placeholder="user@example.com or 0925551234"
        value={recipientIdentifier}
        onChange={(e) => setRecipientIdentifier(e.target.value)}
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {recipientVerified && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">Recipient Found</p>
              <p className="text-sm text-green-700 dark:text-green-400">{recipientName}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex space-x-3">
        <Button onClick={() => setStep(1)} variant="outline" size="lg" fullWidth>
          Back
        </Button>
        <Button
          onClick={handleVerifyRecipient}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!recipientIdentifier}
        >
          Verify Recipient
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Confirm Transfer</h2>

      <Card className="bg-gray-50 dark:bg-gray-800">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Asset</span>
            <span className="font-semibold">{selectedAsset?.product?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Serial Number</span>
            <span className="font-semibold font-mono text-xs">{selectedAsset?.serial_number}</span>
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
          </div>
        </div>
      </Card>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          The recipient will be able to pick up this bar at the designated store. The transfer cannot be reversed.
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

      <div className="flex space-x-3">
        <Button onClick={() => setStep(2)} variant="outline" size="lg" fullWidth>
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

  const renderStep4 = () => (
    <div className="text-center space-y-4">
      {manualReview ? (
        <>
          <Shield className="w-16 h-16 text-yellow-600 mx-auto" />
          <h2 className="text-xl font-bold">Manual Review Required</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This transfer has been flagged for manual review due to a high risk score ({(riskScore * 100).toFixed(1)}%).
          </p>
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Our team will review this transfer within 24 hours. You will be notified once the review is complete.
            </p>
          </Card>
        </>
      ) : (
        <>
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold">Transfer Successful!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ownership of {selectedAsset?.product?.name} has been transferred to {recipientName}.
          </p>
          <Card className="bg-gray-50 dark:bg-gray-800">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Transaction Hash</span>
              </div>
              <p className="font-mono text-xs break-all text-yellow-600">{txHash}</p>
              <div className="flex justify-between mt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Transfer Fee</span>
                <span className="text-sm font-semibold text-yellow-600">{TRANSFER_FEE} LYD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score</span>
                <span className="text-sm font-semibold text-green-600">
                  {(riskScore * 100).toFixed(1)}% (Low Risk)
                </span>
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
        </>
      )}

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
        <h1 className="text-2xl font-bold">Transfer Ownership</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        {[1, 2, 3, 4].map((s) => (
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
            {s < 4 && (
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
      {step === 4 && renderStep4()}
    </div>
  );
};
