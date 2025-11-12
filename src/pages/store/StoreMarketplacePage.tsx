import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Filter, Search } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { marketplaceService, MarketplaceItem } from '../../services/marketplace.service';
import { ItemPurchaseModal } from '../../components/store/ItemPurchaseModal';

interface StoreMarketplacePageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreMarketplacePage = ({ storeId, onBack }: StoreMarketplacePageProps) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [metalFilter, setMetalFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadItems();
  }, [storeId]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, typeFilter, metalFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await marketplaceService.getMarketplaceItems(storeId);
      if (error) throw new Error(error);
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(item => item.item_type === typeFilter);
    }

    if (metalFilter && metalFilter !== 'all') {
      filtered = filtered.filter(item => item.metal_type === metalFilter);
    }

    setFilteredItems(filtered);
  };

  const getItemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bar: 'Bar',
      coin: 'Coin',
      jewelry: 'Jewelry',
      ingot: 'Ingot',
      bullion: 'Bullion',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center">
          <ShoppingBag className="w-6 h-6 mr-2" />
          Marketplace
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Browse and purchase precious metals
        </p>
      </div>

      <Card>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-grow">
              <Input
                label=""
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items..."
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? 'primary' : 'outline'}
              icon={Filter}
            >
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="bar">Bars</option>
                  <option value="coin">Coins</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="ingot">Ingots</option>
                  <option value="bullion">Bullion</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Metal</label>
                <select
                  value={metalFilter}
                  onChange={(e) => setMetalFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="all">All Metals</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredItems.length} of {items.length} items
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filteredItems.length === 0 ? (
          <Card className="col-span-2">
            <p className="text-center text-gray-500 py-8">No items found</p>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-lg transition"
              onClick={() => setSelectedItem(item)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <p className="font-semibold text-sm line-clamp-2">{item.item_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getItemTypeLabel(item.item_type)}
                    </p>
                  </div>
                  {item.featured && (
                    <span className="text-xs bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100 px-2 py-0.5 rounded-full font-semibold">
                      Featured
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Weight</p>
                    <p className="font-semibold">{item.weight}g</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Purity</p>
                    <p className="font-semibold">{item.purity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Stock</p>
                    <p className="font-semibold">{item.quantity_available}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-bold text-lg text-yellow-600">{item.price_lyd.toFixed(0)} LYD</p>
                    <p className="text-xs text-gray-400">{item.price_usd.toFixed(2)} USD</p>
                  </div>
                  <Button variant="primary" size="sm" icon={ShoppingBag}>
                    Buy
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {selectedItem && (
        <ItemPurchaseModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            setSelectedItem(null);
            loadItems();
          }}
        />
      )}
    </div>
  );
};
