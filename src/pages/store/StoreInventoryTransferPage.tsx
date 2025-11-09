import { useEffect, useState } from 'react';
import { ArrowLeft, Package, Check, X, Plus, Truck, CheckCircle } from 'lucide-react';
import { Card, Button, Modal, Input } from '../../components/ui';
import { storeInventoryTransferService } from '../../services/store-inventory-transfer.service';

interface StoreInventoryTransferPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreInventoryTransferPage = ({ storeId, onBack }: StoreInventoryTransferPageProps) => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'ship' | 'receive' | null>(null);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    toStoreId: '',
    productId: '',
    serialNumber: '',
    quantity: '1',
    reason: '',
    notes: '',
  });

  const [actionNotes, setActionNotes] = useState('');
  const [shippingReference, setShippingReference] = useState('');

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    try {
      const [transfersRes, storesRes, inventoryRes] = await Promise.all([
        storeInventoryTransferService.getTransferRequests(storeId),
        storeInventoryTransferService.getAllStores(),
        storeInventoryTransferService.getStoreInventory(storeId),
      ]);

      if (transfersRes.error) throw transfersRes.error;
      if (storesRes.error) throw storesRes.error;
      if (inventoryRes.error) throw inventoryRes.error;

      setTransfers(transfersRes.data || []);
      setStores((storesRes.data || []).filter((s: any) => s.id !== storeId));
      setInventory(inventoryRes.data || []);
    } catch (err: any) {
      console.error('Error loading transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTransfer = async () => {
    if (!formData.toStoreId || !formData.productId || !formData.serialNumber || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    setProcessing(true);
    try {
      const items = [
        {
          product_id: formData.productId,
          serial_number: formData.serialNumber,
          quantity: parseInt(formData.quantity) || 1,
        },
      ];

      const { error } = await storeInventoryTransferService.requestTransfer(
        storeId,
        formData.toStoreId,
        items,
        formData.reason,
        formData.notes || undefined
      );

      if (error) throw error;

      alert('Transfer request created successfully');
      setShowNewTransferModal(false);
      setFormData({
        toStoreId: '',
        productId: '',
        serialNumber: '',
        quantity: '1',
        reason: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create transfer request');
    } finally {
      setProcessing(false);
    }
  };

  const handleAction = async () => {
    if (!selectedTransfer || !actionType) return;

    setProcessing(true);
    try {
      let error;

      switch (actionType) {
        case 'approve':
          ({ error } = await storeInventoryTransferService.approveTransfer(
            selectedTransfer.id,
            actionNotes || undefined
          ));
          break;
        case 'reject':
          ({ error } = await storeInventoryTransferService.rejectTransfer(
            selectedTransfer.id,
            actionNotes || undefined
          ));
          break;
        case 'ship':
          ({ error } = await storeInventoryTransferService.shipTransfer(
            selectedTransfer.id,
            shippingReference || undefined,
            actionNotes || undefined
          ));
          break;
        case 'receive':
          ({ error } = await storeInventoryTransferService.receiveTransfer(
            selectedTransfer.id,
            actionNotes || undefined
          ));
          break;
      }

      if (error) throw error;

      alert(`Transfer ${actionType}d successfully`);
      setShowActionModal(false);
      setSelectedTransfer(null);
      setActionType(null);
      setActionNotes('');
      setShippingReference('');
      loadData();
    } catch (err: any) {
      alert(err.message || `Failed to ${actionType} transfer`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'received':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
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
              <Package className="text-yellow-500" size={24} />
              <h1 className="text-xl font-bold">Inventory Transfers</h1>
            </div>
          </div>
          <Button onClick={() => setShowNewTransferModal(true)} className="flex items-center gap-2">
            <Plus size={16} /> New Transfer
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {transfers.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No inventory transfers yet</p>
            <p className="text-sm mt-2">Create your first transfer request</p>
          </Card>
        ) : (
          transfers.map((transfer) => (
            <Card key={transfer.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">{transfer.transfer_number}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {transfer.from_store.name} → {transfer.to_store.name}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transfer.status)}`}>
                  {transfer.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Total Items</div>
                  <div className="font-semibold">{transfer.total_items}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Requested By</div>
                  <div className="font-medium">
                    {transfer.requester.first_name} {transfer.requester.last_name}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-500">Reason</div>
                <div className="text-sm">{transfer.reason}</div>
              </div>

              {transfer.shipping_reference && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500">Tracking Number</div>
                  <div className="text-sm font-mono">{transfer.shipping_reference}</div>
                </div>
              )}

              <div className="text-xs text-gray-400">
                Created: {new Date(transfer.created_at).toLocaleString()}
              </div>

              <div className="flex gap-2 mt-3">
                {transfer.status === 'requested' && (
                  <>
                    <Button
                      onClick={() => {
                        setSelectedTransfer(transfer);
                        setActionType('approve');
                        setShowActionModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 text-sm"
                    >
                      <Check size={14} /> Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedTransfer(transfer);
                        setActionType('reject');
                        setShowActionModal(true);
                      }}
                      variant="secondary"
                      className="flex-1 flex items-center justify-center gap-2 text-sm"
                    >
                      <X size={14} /> Reject
                    </Button>
                  </>
                )}

                {transfer.status === 'approved' && transfer.from_store_id === storeId && (
                  <Button
                    onClick={() => {
                      setSelectedTransfer(transfer);
                      setActionType('ship');
                      setShowActionModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 text-sm"
                  >
                    <Truck size={14} /> Ship
                  </Button>
                )}

                {transfer.status === 'in_transit' && transfer.to_store_id === storeId && (
                  <Button
                    onClick={() => {
                      setSelectedTransfer(transfer);
                      setActionType('receive');
                      setShowActionModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 text-sm bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle size={14} /> Receive
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {showNewTransferModal && (
        <Modal
          isOpen={showNewTransferModal}
          onClose={() => setShowNewTransferModal(false)}
          title="Request Inventory Transfer"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Destination Store</label>
              <select
                value={formData.toStoreId}
                onChange={(e) => setFormData({ ...formData, toStoreId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Select store...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">Select product...</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.product_id}>
                    {item.product.name} ({item.quantity} available)
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Serial Number"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              placeholder="e.g., GOLD-001234"
            />

            <Input
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              min="1"
            />

            <Input
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Restock low inventory"
            />

            <Input
              label="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
            />

            <div className="flex gap-2">
              <Button onClick={handleRequestTransfer} disabled={processing} className="flex-1">
                {processing ? 'Processing...' : 'Request Transfer'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowNewTransferModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showActionModal && selectedTransfer && actionType && (
        <Modal
          isOpen={showActionModal}
          onClose={() => setShowActionModal(false)}
          title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Transfer`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-semibold mb-2">{selectedTransfer.transfer_number}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTransfer.from_store.name} → {selectedTransfer.to_store.name}
              </div>
              <div className="text-sm mt-2">
                <span className="text-gray-500">Items:</span> {selectedTransfer.total_items}
              </div>
            </div>

            {actionType === 'ship' && (
              <Input
                label="Tracking/Shipping Reference"
                value={shippingReference}
                onChange={(e) => setShippingReference(e.target.value)}
                placeholder="e.g., TRACK-12345"
              />
            )}

            <Input
              label={`${actionType === 'reject' ? 'Rejection' : 'Notes'} (optional)`}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Add notes..."
            />

            <div className="flex gap-2">
              <Button onClick={handleAction} disabled={processing} className="flex-1">
                {processing ? 'Processing...' : `${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowActionModal(false)}
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
