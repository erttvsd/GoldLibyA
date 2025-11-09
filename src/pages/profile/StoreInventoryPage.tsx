import { useEffect, useState } from 'react';
import { ArrowLeft, Package, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { AddInventoryModal } from '../../components/store/AddInventoryModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface StoreInventoryPageProps {
  onBack: () => void;
}

interface InventoryItem {
  id: string;
  metal_type: string;
  weight: number;
  purity: string;
  quantity: number;
  unit_price: number;
}

export const StoreInventoryPage = ({ onBack }: StoreInventoryPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    loadInventory();
  }, [user]);

  const loadInventory = async () => {
    if (!user) return;

    try {
      const { data: storeProfile } = await supabase
        .from('store_profiles')
        .select('store_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!storeProfile) return;

      setStoreId(storeProfile.store_id);

      const { data } = await supabase
        .from('inventory')
        .select(`
          *,
          products(name, type, carat, weight_grams, base_price_lyd)
        `)
        .eq('store_id', storeProfile.store_id);

      if (data) {
        setInventory(data as any);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft} className="mb-4">
          Back
        </Button>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const goldItems = inventory.filter((i: any) => i.products?.type === 'gold');
  const silverItems = inventory.filter((i: any) => i.products?.type === 'silver');

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage store stock
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} variant="primary" icon={Plus}>
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-1">Total Items</p>
          <p className="text-2xl font-bold">{totalItems}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-1">Gold</p>
          <p className="text-2xl font-bold text-yellow-600">
            {goldItems.reduce((sum, i) => sum + i.quantity, 0)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-1">Silver</p>
          <p className="text-2xl font-bold text-gray-400">
            {silverItems.reduce((sum, i) => sum + i.quantity, 0)}
          </p>
        </Card>
      </div>

      {inventory.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No inventory items</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Stock Items</h2>
          {inventory.map((item: any) => (
            <Card key={item.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      item.products?.type === 'gold'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Package
                      className={`w-6 h-6 ${
                        item.products?.type === 'gold' ? 'text-yellow-600' : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {item.products?.name || 'Product'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.products?.weight_grams}g - {item.products?.type === 'gold' ? `${item.products?.carat}K` : `${(item.products?.carat || 999) / 10}%`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{item.quantity}</p>
                  <p className="text-xs text-gray-500">in stock</p>
                </div>
              </div>
              {item.products?.base_price_lyd && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Unit Price: <span className="font-semibold">{item.products.base_price_lyd} LYD</span>
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <AddInventoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        storeId={storeId}
        onSuccess={loadInventory}
      />
    </div>
  );
};
