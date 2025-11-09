import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { supabase } from '../../lib/supabase';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onSuccess: () => void;
}

export const AddInventoryModal = ({ isOpen, onClose, storeId, onSuccess }: AddInventoryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'gold',
    carat: '24',
    weight: '',
    price: '',
    quantity: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name || `${formData.type} Bar ${formData.weight}g`,
          type: formData.type,
          carat: parseInt(formData.carat),
          weight_grams: parseFloat(formData.weight),
          base_price_lyd: parseFloat(formData.price),
          is_active: true,
        })
        .select()
        .single();

      if (productError) throw productError;

      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          store_id: storeId,
          product_id: product.id,
          quantity: parseInt(formData.quantity),
        });

      if (inventoryError) throw inventoryError;

      onSuccess();
      onClose();
      setFormData({
        name: '',
        type: 'gold',
        carat: '24',
        weight: '',
        price: '',
        quantity: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add Inventory Item</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Metal Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'gold', carat: '24' })}
              className={`py-3 rounded-lg font-medium transition ${
                formData.type === 'gold'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Gold
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'silver', carat: '999' })}
              className={`py-3 rounded-lg font-medium transition ${
                formData.type === 'silver'
                  ? 'bg-gray-400 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Silver
            </button>
          </div>
        </div>

        <Input
          label="Product Name (Optional)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Gold Bar 10g"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Weight (grams)"
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="10"
            required
          />
          <Input
            label={formData.type === 'gold' ? 'Carat (K)' : 'Purity'}
            value={formData.carat}
            onChange={(e) => setFormData({ ...formData, carat: e.target.value })}
            placeholder={formData.type === 'gold' ? '24' : '999'}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price (LYD)"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="2800"
            required
          />
          <Input
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="10"
            required
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" onClick={onClose} variant="outline" fullWidth>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth icon={Plus} disabled={loading}>
            {loading ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
