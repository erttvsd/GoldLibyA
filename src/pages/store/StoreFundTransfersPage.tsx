import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Check, X, Plus, Building2 } from 'lucide-react';
import { Card, Button, Modal, Input } from '../../components/ui';
import { storeFinanceService, StoreFundTransferRequest } from '../../services/store-finance.service';

interface StoreFundTransfersPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreFundTransfersPage = ({ storeId, onBack }: StoreFundTransfersPageProps) => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    toStoreId: '',
    currency: 'LYD' as 'LYD' | 'USD',
    amount: '',
    reason: '',
    notes: '',
  });

  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    try {
      const [transfersRes, storesRes] = await Promise.all([
        storeFinanceService.getFundTransferRequests(storeId),
        storeFinanceService.getAllStores(),
      ]);

      if (transfersRes.error) throw transfersRes.error;
      if (storesRes.error) throw storesRes.error;

      setTransfers(transfersRes.data || []);
      setStores((storesRes.data || []).filter((s: any) => s.id !== storeId));
    } catch (err: any) {
      console.error('Error loading transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTransfer = async () => {
    if (!formData.toStoreId || !formData.amount || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await storeFinanceService.requestFundTransfer(
        storeId,
        formData.toStoreId,
        formData.currency,
        parseFloat(formData.amount),
        formData.reason,
        formData.notes || undefined
      );

      if (error) throw error;

      alert('Transfer request created successfully');
      setShowNewTransferModal(false);
      setFormData({
        toStoreId: '',
        currency: 'LYD',
        amount: '',
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

  const handleApprove = async () => {
    if (!selectedTransfer) return;

    setProcessing(true);
    try {
      const { error } = await storeFinanceService.approveFundTransfer(
        selectedTransfer.id,
        approvalNotes || undefined
      );

      if (error) throw error;

      alert('Transfer approved and completed');
      setShowApprovalModal(false);
      setSelectedTransfer(null);
      setApprovalNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve transfer');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTransfer) return;

    setProcessing(true);
    try {
      const { error } = await storeFinanceService.rejectFundTransfer(
        selectedTransfer.id,
        approvalNotes || undefined
      );

      if (error) throw error;

      alert('Transfer rejected');
      setShowApprovalModal(false);
      setSelectedTransfer(null);
      setApprovalNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject transfer');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
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
              <ArrowRightLeft className="text-yellow-500" size={24} />
              <h1 className="text-xl font-bold">Fund Transfers</h1>
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
            <ArrowRightLeft size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No fund transfers yet</p>
            <p className="text-sm mt-2">Create your first transfer request</p>
          </Card>
        ) : (
          transfers.map((transfer) => (
            <Card key={transfer.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-gray-500" />
                  <div>
                    <div className="font-semibold text-sm">
                      {transfer.from_store.name} → {transfer.to_store.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {transfer.from_store.city} to {transfer.to_store.city}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transfer.status)}`}>
                  {transfer.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="font-semibold">
                    {transfer.amount.toLocaleString()} {transfer.currency}
                  </div>
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
                {transfer.notes && (
                  <div className="text-xs text-gray-500 mt-1">{transfer.notes}</div>
                )}
              </div>

              {transfer.approval_notes && (
                <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-xs text-gray-500">Approval Notes</div>
                  <div className="text-sm">{transfer.approval_notes}</div>
                </div>
              )}

              <div className="text-xs text-gray-400">
                Created: {new Date(transfer.created_at).toLocaleString()}
              </div>

              {transfer.status === 'pending' && transfer.to_store_id === storeId && (
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => {
                      setSelectedTransfer(transfer);
                      setShowApprovalModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Review
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {showNewTransferModal && (
        <Modal
          isOpen={showNewTransferModal}
          onClose={() => setShowNewTransferModal(false)}
          title="Request Fund Transfer"
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
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'LYD' | 'USD' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="LYD">LYD</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <Input
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.001"
            />

            <Input
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Restock inventory"
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

      {showApprovalModal && selectedTransfer && (
        <Modal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title="Review Transfer Request"
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
              <div>
                <span className="text-sm text-gray-500">From:</span>
                <div className="font-semibold">{selectedTransfer.from_store.name}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Amount:</span>
                <div className="font-semibold text-lg">
                  {selectedTransfer.amount.toLocaleString()} {selectedTransfer.currency}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Reason:</span>
                <div>{selectedTransfer.reason}</div>
              </div>
            </div>

            <Input
              label="Approval/Rejection Notes (optional)"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add notes..."
            />

            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check size={16} /> {processing ? 'Processing...' : 'Approve'}
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing}
                variant="secondary"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <X size={16} /> Reject
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
