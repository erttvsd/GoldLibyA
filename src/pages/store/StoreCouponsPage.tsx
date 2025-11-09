import { useState, useEffect } from 'react';
import { ArrowLeft, Tag, Plus, TrendingUp, Edit, Trash2, Power } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { couponService } from '../../services/coupon.service';

interface Coupon {
  id: string;
  store_id: string;
  code: string;
  kind: string;
  value: number;
  max_discount_lyd?: number;
  min_purchase_lyd?: number;
  starts_at?: string;
  ends_at?: string;
  max_usage?: number;
  usage_count: number;
  active: boolean;
  created_at: string;
}

interface StoreCouponsPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreCouponsPage = ({ storeId, onBack }: StoreCouponsPageProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('active');

  const [formData, setFormData] = useState({
    code: '',
    kind: 'percent' as 'percent' | 'fixed',
    value: '',
    max_discount_lyd: '',
    min_purchase_lyd: '',
    starts_at: '',
    ends_at: '',
    max_usage: '',
  });

  useEffect(() => {
    loadCoupons();
  }, [storeId, filter]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await couponService.getCoupons(storeId);
      if (error) throw error;

      let filtered = data || [];
      const now = new Date();

      if (filter === 'active') {
        filtered = filtered.filter(c =>
          c.active &&
          (!c.ends_at || new Date(c.ends_at) > now) &&
          (!c.max_usage || c.usage_count < c.max_usage)
        );
      } else if (filter === 'inactive') {
        filtered = filtered.filter(c => !c.active);
      } else if (filter === 'expired') {
        filtered = filtered.filter(c =>
          (c.ends_at && new Date(c.ends_at) < now) ||
          (c.max_usage && c.usage_count >= c.max_usage)
        );
      }

      setCoupons(filtered);
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleCreateCoupon = async () => {
    if (!formData.code || !formData.value) {
      alert('Please enter code and value');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await couponService.createCoupon(storeId, {
        code: formData.code.toUpperCase(),
        kind: formData.kind,
        value: parseFloat(formData.value),
        max_discount_lyd: formData.max_discount_lyd ? parseFloat(formData.max_discount_lyd) : undefined,
        min_purchase_lyd: formData.min_purchase_lyd ? parseFloat(formData.min_purchase_lyd) : undefined,
        starts_at: formData.starts_at || undefined,
        ends_at: formData.ends_at || undefined,
        max_usage: formData.max_usage ? parseInt(formData.max_usage) : undefined,
      });

      if (error) throw error;

      alert('Coupon created successfully!');
      setShowCreateModal(false);
      setFormData({
        code: '',
        kind: 'percent',
        value: '',
        max_discount_lyd: '',
        min_purchase_lyd: '',
        starts_at: '',
        ends_at: '',
        max_usage: '',
      });
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to create coupon');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (couponId: string, currentActive: boolean) => {
    try {
      const { error } = await couponService.toggleCoupon(couponId, !currentActive);
      if (error) throw error;
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle coupon');
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await couponService.deleteCoupon(couponId);
      if (error) throw error;
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.kind === 'percent') {
      return `${coupon.value}% off`;
    }
    return `${coupon.value} LYD off`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Tag className="text-yellow-500" size={24} />
              <h1 className="text-xl font-bold">Coupons Management</h1>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus size={16} /> Create Coupon
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['active', 'all', 'inactive', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                filter === f
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {coupons.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Tag size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No {filter !== 'all' ? filter : ''} coupons found</p>
            <Button onClick={() => setShowCreateModal(true)} className="mt-4">
              Create Your First Coupon
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-xl font-mono">{coupon.code}</div>
                      <div className="text-lg text-yellow-600 font-semibold">
                        {getDiscountText(coupon)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(coupon.id, coupon.active)}
                        className={`p-2 rounded ${
                          coupon.active
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Usage</div>
                      <div className="font-semibold">
                        {coupon.usage_count} {coupon.max_usage ? `/ ${coupon.max_usage}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="font-semibold">
                        {coupon.active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-gray-600">Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {coupon.min_purchase_lyd && (
                    <div className="text-xs text-gray-600">
                      Min purchase: {coupon.min_purchase_lyd} LYD
                    </div>
                  )}

                  {coupon.max_discount_lyd && coupon.kind === 'percent' && (
                    <div className="text-xs text-gray-600">
                      Max discount: {coupon.max_discount_lyd} LYD
                    </div>
                  )}

                  {(coupon.starts_at || coupon.ends_at) && (
                    <div className="text-xs text-gray-600">
                      {coupon.starts_at && (
                        <div>Starts: {new Date(coupon.starts_at).toLocaleDateString()}</div>
                      )}
                      {coupon.ends_at && (
                        <div>Expires: {new Date(coupon.ends_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  )}

                  {coupon.usage_count > 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      <TrendingUp size={16} />
                      Used {coupon.usage_count} times
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Coupon"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Coupon Code</label>
              <div className="flex gap-2">
                <Input
                  label=""
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2025"
                  maxLength={20}
                />
                <Button onClick={generateCode} variant="secondary">
                  Generate
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Discount Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['percent', 'fixed'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, kind: type as any })}
                    className={`p-3 rounded border-2 transition ${
                      formData.kind === type
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-medium capitalize">{type}</div>
                    <div className="text-xs text-gray-500">
                      {type === 'percent' ? 'Percentage off' : 'Fixed amount off'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label={`Discount Value ${formData.kind === 'percent' ? '(%)' : '(LYD)'}`}
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={formData.kind === 'percent' ? '10' : '50.00'}
              step="0.01"
              min="0"
              max={formData.kind === 'percent' ? '100' : undefined}
            />

            {formData.kind === 'percent' && (
              <Input
                label="Maximum Discount (LYD) - Optional"
                type="number"
                value={formData.max_discount_lyd}
                onChange={(e) => setFormData({ ...formData, max_discount_lyd: e.target.value })}
                placeholder="100.00"
                step="0.01"
                min="0"
              />
            )}

            <Input
              label="Minimum Purchase (LYD) - Optional"
              type="number"
              value={formData.min_purchase_lyd}
              onChange={(e) => setFormData({ ...formData, min_purchase_lyd: e.target.value })}
              placeholder="50.00"
              step="0.01"
              min="0"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date - Optional"
                type="date"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
              />
              <Input
                label="End Date - Optional"
                type="date"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
              />
            </div>

            <Input
              label="Maximum Usage - Optional"
              type="number"
              value={formData.max_usage}
              onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
              placeholder="100"
              min="1"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleCreateCoupon}
                disabled={processing || !formData.code || !formData.value}
                className="flex-1"
              >
                {processing ? 'Creating...' : 'Create Coupon'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
