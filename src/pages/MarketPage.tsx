import { useState, useEffect } from 'react';
import { Search, Filter, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { marketService } from '../services/market.service';
import { assetService } from '../services/asset.service';
import { walletService } from '../services/wallet.service';
import { Card, Input, Button, Modal } from '../components/ui';
import { Product, Store, LivePrice, PaymentMethod } from '../types';
import { formatCurrency, formatGrams } from '../utils/format';

interface MarketPageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
}

export const MarketPage = ({ onNavigate }: MarketPageProps) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [livePrices, setLivePrices] = useState<LivePrice[]>([]);
  const [inventory, setInventory] = useState<Map<string, Map<string, number>>>(new Map());
  const [filter, setFilter] = useState<'all' | 'gold' | 'silver'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedKarats, setSelectedKarats] = useState<number[]>([]);
  const [weightRange, setWeightRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isDigitalPurchase, setIsDigitalPurchase] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, storesData, pricesData, inventoryData] = await Promise.all([
        marketService.getProducts(),
        marketService.getStores(),
        marketService.getLivePrices(),
        marketService.getInventory(),
      ]);

      setProducts(productsData);
      setStores(storesData);
      setLivePrices(pricesData);

      const inventoryMap = new Map<string, Map<string, number>>();
      inventoryData.forEach((inv) => {
        if (!inventoryMap.has(inv.store_id)) {
          inventoryMap.set(inv.store_id, new Map());
        }
        inventoryMap.get(inv.store_id)!.set(inv.product_id, inv.quantity);
      });
      setInventory(inventoryMap);
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalStock = (productId: string): number => {
    let total = 0;
    inventory.forEach((storeInv) => {
      total += storeInv.get(productId) || 0;
    });
    return total;
  };

  const getStoresWithStock = (productId: string): { store: Store; quantity: number }[] => {
    const result: { store: Store; quantity: number }[] = [];
    stores.forEach((store) => {
      const storeInv = inventory.get(store.id);
      const quantity = storeInv?.get(productId) || 0;
      if (quantity > 0) {
        result.push({ store, quantity });
      }
    });
    return result;
  };

  const handleDigitalPurchase = (metalType: 'gold' | 'silver') => {
    const price = livePrices.find((p) => p.metal_type === metalType);
    if (!price) return;

    const mockProduct: Product = {
      id: `digital-${metalType}`,
      name: `Digital ${metalType === 'gold' ? 'Gold' : 'Silver'}`,
      type: metalType,
      carat: metalType === 'gold' ? 24 : 999,
      weight_grams: 1,
      base_price_lyd: price.price_lyd_per_gram,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setSelectedProduct(mockProduct);
    setIsDigitalPurchase(true);
    setSelectedStore(null);
    setShowPurchaseModal(true);
  };

  const handlePhysicalProductClick = (product: Product) => {
    const availableStores = getStoresWithStock(product.id);
    if (availableStores.length === 0) return;

    setSelectedProduct(product);
    setIsDigitalPurchase(false);

    if (availableStores.length === 1) {
      setSelectedStore(availableStores[0].store);
      setShowPurchaseModal(true);
    } else {
      setShowStoreModal(true);
    }
  };

  const handleStoreSelection = (store: Store) => {
    setSelectedStore(store);
    setShowStoreModal(false);
    setShowPurchaseModal(true);
  };

  const availableKarats = Array.from(new Set(products.map(p => p.carat).filter(k => k !== null))) as number[];
  availableKarats.sort((a, b) => a - b);

  const toggleKarat = (karat: number) => {
    setSelectedKarats(prev =>
      prev.includes(karat) ? prev.filter(k => k !== karat) : [...prev, karat]
    );
  };

  const clearFilters = () => {
    setSelectedKarats([]);
    setWeightRange({ min: 0, max: 1000 });
  };

  const filteredProducts = products.filter((p) => {
    const matchesFilter = filter === 'all' || p.type === filter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.weight_grams.toString().includes(searchTerm);
    const matchesKarat = selectedKarats.length === 0 || (p.carat && selectedKarats.includes(p.carat));
    const matchesWeight = p.weight_grams >= weightRange.min && p.weight_grams <= weightRange.max;
    return matchesFilter && matchesSearch && matchesKarat && matchesWeight;
  });

  const goldPrice = livePrices.find((p) => p.metal_type === 'gold');
  const silverPrice = livePrices.find((p) => p.metal_type === 'silver');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <h1 className="text-center text-2xl font-bold">Store</h1>

      <Input
        icon={Search}
        placeholder="Search for a bar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div>
        <h2 className="text-lg font-bold mb-2">Buy Digital Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DigitalProductCard
            metal="gold"
            price={goldPrice?.price_lyd_per_gram || 0}
            onBuy={() => handleDigitalPurchase('gold')}
          />
          <DigitalProductCard
            metal="silver"
            price={silverPrice?.price_lyd_per_gram || 0}
            onBuy={() => handleDigitalPurchase('silver')}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2">Buy Physical Bars</h2>
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1 rounded-md text-sm transition ${
                filter === 'all' ? 'bg-white dark:bg-gray-700 shadow' : ''
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('gold')}
              className={`px-4 py-1 rounded-md text-sm transition ${
                filter === 'gold' ? 'bg-yellow-500 text-white shadow' : ''
              }`}
            >
              Gold
            </button>
            <button
              onClick={() => setFilter('silver')}
              className={`px-4 py-1 rounded-md text-sm transition ${
                filter === 'silver' ? 'bg-gray-400 text-white shadow' : ''
              }`}
            >
              Silver
            </button>
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-yellow-600 transition relative"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
            {(selectedKarats.length > 0 || weightRange.min > 0 || weightRange.max < 1000) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const totalStock = getTotalStock(product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                totalStock={totalStock}
                onClick={() => handlePhysicalProductClick(product)}
              />
            );
          })}
        </div>
      </div>

      {showStoreModal && selectedProduct && (
        <StoreAvailabilityModal
          product={selectedProduct}
          stores={getStoresWithStock(selectedProduct.id)}
          onSelectStore={handleStoreSelection}
          onClose={() => setShowStoreModal(false)}
        />
      )}

      {showPurchaseModal && selectedProduct && (
        <PurchaseFlowModal
          product={selectedProduct}
          store={selectedStore}
          isDigital={isDigitalPurchase}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedProduct(null);
            setSelectedStore(null);
          }}
          onSuccess={(invoiceId) => {
            setShowPurchaseModal(false);
            onNavigate('market', 'invoice', { invoiceId });
          }}
        />
      )}

      {showFilters && (
        <FiltersModal
          availableKarats={availableKarats}
          selectedKarats={selectedKarats}
          onToggleKarat={toggleKarat}
          weightRange={weightRange}
          onWeightRangeChange={setWeightRange}
          onClear={clearFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};

const DigitalProductCard = ({
  metal,
  price,
  onBuy,
}: {
  metal: 'gold' | 'silver';
  price: number;
  onBuy: () => void;
}) => {
  const isGold = metal === 'gold';
  return (
    <Card
      className={`flex items-center justify-between ${
        isGold ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-100 dark:bg-gray-800'
      }`}
      padding="md"
    >
      <div className="flex items-center space-x-3">
        <Sparkles className={`w-8 h-8 ${isGold ? 'text-yellow-500' : 'text-gray-500'}`} />
        <div>
          <h3 className="font-bold">Buy Digital {isGold ? 'Gold' : 'Silver'}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatCurrency(price, 'LYD')}/gram
          </p>
        </div>
      </div>
      <Button
        onClick={onBuy}
        variant="primary"
        size="sm"
        className={isGold ? '' : 'bg-gray-600 hover:bg-gray-700'}
      >
        Buy
      </Button>
    </Card>
  );
};

const ProductCard = ({
  product,
  totalStock,
  onClick,
}: {
  product: Product;
  totalStock: number;
  onClick: () => void;
}) => {
  const isAvailable = totalStock > 0;
  return (
    <Card className="flex space-x-4" padding="sm" hover onClick={isAvailable ? onClick : undefined}>
      <img
        src={product.image_url || `https://placehold.co/80x80/FFD700/000000?text=${product.weight_grams}g`}
        alt={product.name}
        className="w-20 h-20 rounded-md object-cover"
      />
      <div className="flex-grow">
        <h3 className="font-bold text-gray-900 dark:text-white">
          {product.name} {product.carat}K
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{formatGrams(product.weight_grams)}</p>
        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mt-1">
          {formatCurrency(product.base_price_lyd, 'LYD')}
        </p>
      </div>
      <div className="flex flex-col justify-between items-end">
        <div
          className={`text-xs px-2 py-1 rounded-full ${
            isAvailable
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {isAvailable ? `In Stock: ${totalStock}` : 'Out of Stock'}
        </div>
        <Button
          disabled={!isAvailable}
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Buy
        </Button>
      </div>
    </Card>
  );
};

const StoreAvailabilityModal = ({
  product,
  stores,
  onSelectStore,
  onClose,
}: {
  product: Product;
  stores: { store: Store; quantity: number }[];
  onSelectStore: (store: Store) => void;
  onClose: () => void;
}) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Select Pickup Location" size="md">
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {product.name} {product.carat}K - {formatGrams(product.weight_grams)}
        </p>
        {stores.map(({ store, quantity }) => (
          <Card
            key={store.id}
            className="flex justify-between items-center cursor-pointer"
            padding="sm"
            hover
            onClick={() => onSelectStore(store)}
          >
            <div>
              <h3 className="font-bold">{store.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{store.city}</p>
              <p className="text-xs text-gray-400">{store.address}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-600">{quantity} in stock</p>
            </div>
          </Card>
        ))}
      </div>
    </Modal>
  );
};

const FiltersModal = ({
  availableKarats,
  selectedKarats,
  onToggleKarat,
  weightRange,
  onWeightRangeChange,
  onClear,
  onClose,
}: {
  availableKarats: number[];
  selectedKarats: number[];
  onToggleKarat: (karat: number) => void;
  weightRange: { min: number; max: number };
  onWeightRangeChange: (range: { min: number; max: number }) => void;
  onClear: () => void;
  onClose: () => void;
}) => {
  const handleApply = () => {
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Filter Products" size="md">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">Karat (Purity)</h3>
            {selectedKarats.length > 0 && (
              <button
                onClick={() => selectedKarats.forEach(k => onToggleKarat(k))}
                className="text-xs text-yellow-600 hover:text-yellow-700"
              >
                Clear Karats
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableKarats.map((karat) => (
              <button
                key={karat}
                onClick={() => onToggleKarat(karat)}
                className={`px-4 py-2 rounded-lg border-2 transition ${
                  selectedKarats.includes(karat)
                    ? 'bg-yellow-500 border-yellow-500 text-white font-semibold shadow-md'
                    : 'border-gray-300 dark:border-gray-600 hover:border-yellow-400 dark:hover:border-yellow-500'
                }`}
              >
                {karat}K
              </button>
            ))}
          </div>
          {availableKarats.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No karats available</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">Weight (grams)</h3>
            {(weightRange.min > 0 || weightRange.max < 1000) && (
              <button
                onClick={() => onWeightRangeChange({ min: 0, max: 1000 })}
                className="text-xs text-yellow-600 hover:text-yellow-700"
              >
                Clear Weight
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Minimum: {weightRange.min}g
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="1"
                value={weightRange.min}
                onChange={(e) =>
                  onWeightRangeChange({ ...weightRange, min: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Maximum: {weightRange.max}g
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="1"
                value={weightRange.max}
                onChange={(e) =>
                  onWeightRangeChange({ ...weightRange, max: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-yellow-500"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={weightRange.min}
                  onChange={(e) =>
                    onWeightRangeChange({ ...weightRange, min: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>
              <div className="flex items-end pb-2">
                <span className="text-gray-400">-</span>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={weightRange.max}
                  onChange={(e) =>
                    onWeightRangeChange({ ...weightRange, max: parseInt(e.target.value) || 1000 })
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={onClear} variant="secondary" size="lg" fullWidth>
            Clear All Filters
          </Button>
          <Button onClick={handleApply} variant="primary" size="lg" fullWidth>
            Apply Filters
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const PurchaseFlowModal = ({
  product,
  store,
  isDigital,
  onClose,
  onSuccess,
}: {
  product: Product;
  store: Store | null;
  isDigital: boolean;
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet_dinar');
  const [grams, setGrams] = useState(isDigital ? 1 : product.weight_grams);
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pricePerGram = isDigital ? product.base_price_lyd : product.base_price_lyd / product.weight_grams;
  const subtotal = isDigital ? pricePerGram * grams : product.base_price_lyd;
  const commission = isDigital ? 0 : subtotal * 0.015;
  const total = subtotal + commission;

  const handlePurchase = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      if (paymentMethod !== 'cash') {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const currency = paymentMethod === 'wallet_dollar' ? 'USD' : 'LYD';

      if (paymentMethod === 'wallet_dinar' || paymentMethod === 'wallet_dollar') {
        await walletService.updateWalletBalance(user.id, currency, -total);
      }

      if (isDigital) {
        await walletService.updateDigitalBalance(user.id, product.type, grams);
      }

      const purchaseData = {
        userId: user.id,
        productId: isDigital ? undefined : product.id,
        storeId: store?.id,
        paymentMethod,
        amountLyd: total,
        commissionLyd: commission,
        isDigital,
        digitalMetalType: isDigital ? product.type : undefined,
        digitalGrams: isDigital ? grams : undefined,
      };

      const { invoice } = await assetService.createPurchase(purchaseData);

      await walletService.addTransaction({
        user_id: user.id,
        type: 'purchase',
        amount: total,
        currency: 'LYD',
        description: `Bought ${isDigital ? `${grams}g` : product.weight_grams + 'g'} ${product.type === 'gold' ? 'Gold' : 'Silver'}`,
        reference_id: invoice.id,
      });

      onSuccess(invoice.id);
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Purchase" size="md">
      <div className="space-y-4">
        {step === 1 && (
          <>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">
                {product.name} {product.carat}K
              </h3>
              {store && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pickup: {store.name}, {store.city}
                </p>
              )}
              {isDigital && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Grams to purchase:</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={grams}
                    onChange={(e) => setGrams(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Method:</label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="radio"
                    name="payment"
                    value="wallet_dinar"
                    checked={paymentMethod === 'wallet_dinar'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mr-3"
                  />
                  <span>Dinar Wallet</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="radio"
                    name="payment"
                    value="wallet_dollar"
                    checked={paymentMethod === 'wallet_dollar'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mr-3"
                  />
                  <span>Dollar Wallet</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="radio"
                    name="payment"
                    value="coupon"
                    checked={paymentMethod === 'coupon'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mr-3"
                  />
                  <span>Coupon</span>
                </label>
                {!isDigital && (
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mr-3"
                    />
                    <span>Cash on Pickup</span>
                  </label>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal, 'LYD')}</span>
              </div>
              {commission > 0 && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Commission (1.5%):</span>
                  <span>{formatCurrency(commission, 'LYD')}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-yellow-600">{formatCurrency(total, 'LYD')}</span>
              </div>
            </div>

            <Button
              onClick={() => (paymentMethod === 'cash' ? handlePurchase() : setStep(2))}
              variant="primary"
              size="lg"
              fullWidth
            >
              {paymentMethod === 'cash' ? 'Confirm Purchase' : 'Continue'}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For security, please verify your identity:
            </p>
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="SMS Verification Code"
              placeholder="Enter 6-digit code"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
              maxLength={6}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex space-x-3">
              <Button onClick={() => setStep(1)} variant="secondary" size="lg" fullWidth>
                Back
              </Button>
              <Button
                onClick={handlePurchase}
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={!password || smsCode.length !== 6}
              >
                Confirm Purchase
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
