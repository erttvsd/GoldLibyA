import { useState } from 'react';
import { Send, Package, ShoppingCart, AlertCircle, CheckCircle, FileText, PlusCircle, MinusCircle } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { TransactionReceipt, TransactionReceiptData } from '../invoice/TransactionReceipt';
import { receiptService } from '../../services/receipt.service';
import { useAuth } from '../../contexts/AuthContext';
import { marketService } from '../../services/market.service';
import { DigitalBalance, OwnedAsset, Store } from '../../types';
import { formatGrams, formatCurrency } from '../../utils/format';

export const DigitalOptionsModal = ({
  balance,
  onClose,
  onTransfer,
  onReceivePhysical,
  onBuyMore,
}: {
  balance: DigitalBalance;
  onClose: () => void;
  onTransfer: () => void;
  onReceivePhysical: () => void;
  onBuyMore: () => void;
}) => {
  return (
    <Modal isOpen={true} onClose={onClose} title={`Digital ${balance.metal_type === 'gold' ? 'Gold' : 'Silver'}`} size="md">
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{formatGrams(balance.grams)}</p>
        </div>

        <div className="space-y-2">
          <OptionButton
            icon={Send}
            label="Transfer to Another User"
            description="Send grams digitally to another user"
            onClick={onTransfer}
          />
          <OptionButton
            icon={Package}
            label="Receive as Physical Bar"
            description="Convert to physical bar for pickup"
            onClick={onReceivePhysical}
          />
          <OptionButton
            icon={ShoppingCart}
            label="Buy More"
            description="Purchase additional grams"
            onClick={onBuyMore}
          />
        </div>
      </div>
    </Modal>
  );
};

export const BullionDetailsModal = ({
  asset,
  onClose,
}: {
  asset: OwnedAsset;
  onClose: () => void;
}) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Bullion Details" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="font-bold mb-3">Basic Information</h3>
          <div className="space-y-2">
            <DetailRow label="Type" value={`${asset.product?.type === 'gold' ? 'Gold' : 'Silver'} Bar`} />
            <DetailRow label="Weight" value={`${asset.product?.weight_grams}g`} />
            <DetailRow label="Karat/Purity" value={`${asset.product?.carat}K`} />
            <DetailRow label="Serial Number" value={asset.serial_number} valueClass="font-mono text-xs" />
            {asset.packaging && <DetailRow label="Packaging" value={asset.packaging} />}
          </div>
        </div>

        {asset.xrf_analysis && (
          <div>
            <h3 className="font-bold mb-3">XRF Analysis</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
              {Object.entries(asset.xrf_analysis).map(([key, value]) => {
                if (key === 'image') return null;
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm capitalize">{key}</span>
                    <span className="text-sm font-semibold">{value}</span>
                  </div>
                );
              })}
            </div>
            {asset.xrf_analysis.image && (
              <img
                src={asset.xrf_analysis.image}
                alt="XRF Analysis"
                className="w-full h-48 object-cover rounded-lg mt-3"
              />
            )}
          </div>
        )}

        {asset.physical_properties && (
          <div>
            <h3 className="font-bold mb-3">Physical Properties</h3>
            <div className="space-y-2">
              <DetailRow label="Dimensions" value={asset.physical_properties.dimensions} />
              <DetailRow label="Shape" value={asset.physical_properties.shape} />
            </div>
          </div>
        )}

        <div>
          <h3 className="font-bold mb-3">Ownership & History</h3>
          <div className="space-y-2">
            <DetailRow label="Current Owner" value="You" />
            <DetailRow label="Purchase Date" value={new Date(asset.created_at).toLocaleDateString()} />
            {asset.manufacture_date && (
              <DetailRow label="Manufacture Date" value={new Date(asset.manufacture_date).toLocaleDateString()} />
            )}
            {asset.origin && <DetailRow label="Origin" value={asset.origin} />}
          </div>
        </div>

        {asset.qr_code_url && (
          <div className="text-center">
            <img src={asset.qr_code_url} alt="QR Code" className="w-32 h-32 mx-auto" />
            <p className="text-xs text-gray-500 mt-2">Scan to verify authenticity</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const ChangeLocationModal = ({
  asset,
  onClose,
  onSuccess,
}: {
  asset: OwnedAsset;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { user, profile } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<TransactionReceiptData | null>(null);
  const [newSerialNumber] = useState(`GB-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`);

  useState(() => {
    marketService.getStores().then((data) => {
      const filtered = data.filter((s) => s.id !== asset.pickup_store_id);
      setStores(filtered);
    });
  });

  const handleConfirm = async () => {
    if (!selectedStore || !user || !profile) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const receipt = receiptService.generateLocationChangeReceipt({
      userId: user.id,
      userName: `${profile.first_name} ${profile.last_name}`,
      userEmail: profile.email,
      product: {
        name: asset.product?.name || 'Gold Bar',
        type: asset.product?.type === 'gold' ? 'gold' : 'silver',
        weight: parseFloat(asset.product?.weight_grams || '0'),
        oldSerialNumber: asset.serial_number,
        newSerialNumber: newSerialNumber,
      },
      fromStore: asset.store?.name || 'Previous Location',
      toStore: selectedStore.name,
      locationChangeFee: 50,
      currency: 'LYD',
      walletBalanceBefore: 0,
      walletBalanceAfter: 0,
      transactionId: `LOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });

    setReceiptData(receipt);
    setLoading(false);
    setStep(2);
  };

  const handleViewReceipt = () => {
    setShowReceipt(true);
  };

  if (step === 2) {
    return (
      <>
        <Modal isOpen={true} onClose={onClose} title="Location Changed" size="md">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <div>
              <h3 className="font-bold text-lg mb-2">Success!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your pickup location has been changed to {selectedStore?.name}.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Note: New serial number assigned: <span className="font-mono font-bold">{newSerialNumber}</span>
                </p>
              </div>
            </div>
            <Button onClick={handleViewReceipt} variant="primary" size="lg" fullWidth icon={FileText}>
              View Receipt
            </Button>
            <Button onClick={onSuccess} variant="outline" size="lg" fullWidth>
              Done
            </Button>
          </div>
        </Modal>

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
    <Modal isOpen={true} onClose={onClose} title="Change Pickup Location" size="md">
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-400">
              <p className="font-semibold mb-1">Location Change Fee: 50 LYD</p>
              <p>Your serial number will be reassigned at the new location.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Select New Location:</label>
          <div className="space-y-2">
            {stores.map((store) => (
              <label
                key={store.id}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="radio"
                  name="store"
                  checked={selectedStore?.id === store.id}
                  onChange={() => setSelectedStore(store)}
                  className="mr-3"
                />
                <div>
                  <p className="font-semibold">{store.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{store.city} - {store.address}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button onClick={onClose} variant="outline" size="lg" fullWidth>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!selectedStore}
          >
            Confirm Change
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const HandoverTransferModal = ({
  asset,
  onClose,
  onSuccess,
}: {
  asset: OwnedAsset;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setStep(2);
  };

  if (step === 2) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Transfer Registered" size="md">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <div>
            <h3 className="font-bold text-lg mb-2">Handover Registered</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The physical handover to {recipientName} has been recorded.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                The new owner should contact support to claim ownership in their account.
              </p>
            </div>
          </div>
          <Button onClick={onSuccess} variant="primary" size="lg" fullWidth>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Register Handover Transfer" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Register the physical handover of this bar to a new owner. This is for out-of-app transfers.
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-sm">
            <strong>Asset:</strong> {asset.product?.name}
          </p>
          <p className="text-sm">
            <strong>Serial:</strong> {asset.serial_number}
          </p>
        </div>

        <Input
          label="Recipient Name"
          placeholder="Full name"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />

        <Input
          label="Recipient Phone"
          placeholder="Phone number"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
        />

        <div className="flex space-x-3">
          <Button onClick={onClose} variant="outline" size="lg" fullWidth>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!recipientName || !recipientPhone}
          >
            Register Transfer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const OptionButton = ({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: any;
  label: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
  >
    <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
      <Icon className="w-5 h-5 text-yellow-600" />
    </div>
    <div className="text-left flex-grow">
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  </button>
);

const DetailRow = ({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
  </div>
);

export const FiatOptionsModal = ({
  currency,
  balance,
  onClose,
  onFund,
  onWithdraw,
}: {
  currency: 'LYD' | 'USD';
  balance: number;
  onClose: () => void;
  onFund: () => void;
  onWithdraw: () => void;
}) => {
  const currencyName = currency === 'LYD' ? 'Libyan Dinar' : 'US Dollar';

  return (
    <Modal isOpen={true} onClose={onClose} title={`${currencyName} Wallet`} size="md">
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {formatCurrency(balance, currency)}
          </p>
        </div>

        <div className="space-y-2">
          <OptionButton
            icon={PlusCircle}
            label="Fund Wallet"
            description={`Add ${currency} to your account`}
            onClick={onFund}
          />
          <OptionButton
            icon={MinusCircle}
            label="Withdraw Funds"
            description="Transfer money to your bank account"
            onClick={onWithdraw}
          />
        </div>
      </div>
    </Modal>
  );
};
