import { useState } from 'react';
import { ShoppingCart, Package, DollarSign } from 'lucide-react';
import { Modal, Button, Input, Card } from '../ui';
import { MarketplaceItem, marketplaceService } from '../../services/marketplace.service';

interface ItemPurchaseModalProps {
  item: MarketplaceItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const ItemPurchaseModal = ({ item, onClose, onSuccess }: ItemPurchaseModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash' | 'bank_transfer'>('wallet');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPriceLyd = item.price_lyd * quantity;
  const totalPriceUsd = item.price_usd * quantity;

  const handlePurchase = async () => {
    if (quantity < 1 || quantity > item.quantity_available) {
      alert('Invalid quantity');
      return;
    }

    setLoading(true);
    try {
      const { error } = await marketplaceService.createOrder(
        item.id,
        quantity,
        paymentMethod,
        deliveryMethod,
        notes
      );

      if (error) throw new Error(error);

      alert('Order placed successfully!');
      onSuccess();
    } catch (error: any) {
      alert(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bar: 'Gold Bar',
      coin: 'Gold Coin',
      jewelry: 'Jewelry',
      ingot: 'Ingot',
      bullion: 'Bullion',
    };
    return labels[type] || type;
  };

  return (
    <Modal isOpen onClose={onClose} title="Purchase Item">
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{item.item_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getItemTypeLabel(item.item_type)}
                </p>
              </div>
              <span className="text-xs bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100 px-3 py-1 rounded-full font-semibold">
                {item.metal_type.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Weight</p>
                <p className="font-bold">{item.weight}g</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Purity</p>
                <p className="font-bold">{item.purity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Available</p>
                <p className="font-bold">{item.quantity_available}</p>
              </div>
            </div>

            {item.description && (
              <div className="pt-3 border-t border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <Input
              type="number"
              label=""
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(item.quantity_available, parseInt(e.target.value) || 1)))}
              min={1}
              max={item.quantity_available}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="wallet">Digital Wallet</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Delivery Method</label>
            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="pickup">Store Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <Input
              label=""
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions..."
            />
          </div>
        </div>

        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Unit Price (LYD)</span>
              <span className="font-semibold">{item.price_lyd.toFixed(2)} LYD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Unit Price (USD)</span>
              <span className="font-semibold">{item.price_usd.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Quantity</span>
              <span className="font-semibold">{quantity}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="font-bold">Total (LYD)</span>
                <span className="text-xl font-bold text-yellow-600">{totalPriceLyd.toFixed(2)} LYD</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">Total (USD)</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{totalPriceUsd.toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            variant="primary"
            icon={ShoppingCart}
            disabled={loading || quantity < 1 || quantity > item.quantity_available}
            className="flex-1"
          >
            {loading ? 'Processing...' : 'Place Order'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
