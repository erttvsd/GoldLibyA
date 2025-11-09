import { useState, useEffect } from 'react';
import { ArrowLeft, Package, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/wallet.service';
import { marketService } from '../../services/market.service';
import { Button, Input, Card } from '../../components/ui';
import { DigitalBalance, Store } from '../../types';
import { formatGrams, formatCurrency } from '../../utils/format';

interface ReceiveDigitalBullionPageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onBack: () => void;
}

export const ReceiveDigitalBullionPage = ({ onNavigate, onBack }: ReceiveDigitalBullionPageProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [digitalBalances, setDigitalBalances] = useState<DigitalBalance[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedMetal, setSelectedMetal] = useState<'gold' | 'silver'>('gold');
  const [grams, setGrams] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fabricationFee = 75;

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [balances, storesData] = await Promise.all([
        walletService.getDigitalBalances(user!.id),
        marketService.getStores(),
      ]);
      setDigitalBalances(balances);
      setStores(storesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const currentBalance = digitalBalances.find((b) => b.metal_type === selectedMetal);
  const availableGrams = currentBalance?.grams || 0;
  const requestedGrams = parseFloat(grams) || 0;

  const handleConfirm = async () => {
    if (requestedGrams <= 0 || requestedGrams > availableGrams || !selectedStore) {
      setError('Invalid request');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    setStep(2);
  };

  const handleComplete = () => {
    onNavigate('wallet', 'bookAppointment', {
      assetId: 'placeholder',
      fromConversion: true,
      metal: selectedMetal,
      grams: requestedGrams,
      store: selectedStore
    });
  };

  if (step === 2) {
    return (
      <div className="p-4 space-y-6 animate-fade-in">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold">Conversion Successful!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your {formatGrams(requestedGrams)} of digital {selectedMetal} has been converted to a physical bar.
          </p>
          <Card className="bg-gray-50 dark:bg-gray-800 text-left">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                <span className="font-semibold capitalize">{selectedMetal} Bar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Weight</span>
                <span className="font-semibold">{formatGrams(requestedGrams)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pickup Location</span>
                <span className="font-semibold">{selectedStore?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Fabrication Fee</span>
                <span className="font-semibold">{formatCurrency(fabricationFee, 'LYD')}</span>
              </div>
            </div>
          </Card>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Please book an appointment to pick up your physical bar within 3 days.
            </p>
          </div>
          <Button onClick={handleComplete} variant="primary" size="lg" fullWidth>
            Book Appointment
          </Button>
          <Button onClick={onBack} variant="outline" size="lg" fullWidth>
            Back to Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Receive Physical Bar</h1>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        Convert your digital gold or silver into a physical bar for pickup.
      </p>

      <div>
        <label className="block text-sm font-medium mb-2">Select Metal Type:</label>
        <div className="flex space-x-3">
          <button
            onClick={() => setSelectedMetal('gold')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition ${
              selectedMetal === 'gold'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            Gold
          </button>
          <button
            onClick={() => setSelectedMetal('silver')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition ${
              selectedMetal === 'silver'
                ? 'border-gray-500 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            Silver
          </button>
        </div>
      </div>

      <Card className="bg-gray-50 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
        <p className="text-2xl font-bold text-yellow-600">{formatGrams(availableGrams)}</p>
      </Card>

      <Input
        type="number"
        label="Grams to Convert"
        placeholder="Enter amount"
        value={grams}
        onChange={(e) => setGrams(e.target.value)}
        step="0.01"
        min="0"
        max={availableGrams}
      />

      {requestedGrams > availableGrams && (
        <p className="text-sm text-red-600">Insufficient balance</p>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Select Pickup Location:</label>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {store.city} - {store.address}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-bold mb-2">Conversion Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Digital {selectedMetal} to convert:</span>
            <span className="font-semibold">{formatGrams(requestedGrams)}</span>
          </div>
          <div className="flex justify-between">
            <span>Fabrication & cutting fee:</span>
            <span className="font-semibold">{formatCurrency(fabricationFee, 'LYD')}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-blue-300 dark:border-blue-700">
            <span className="font-bold">Total Cost:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(fabricationFee, 'LYD')}
            </span>
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={requestedGrams <= 0 || requestedGrams > availableGrams || !selectedStore}
        icon={Package}
      >
        Confirm Conversion
      </Button>
    </div>
  );
};
