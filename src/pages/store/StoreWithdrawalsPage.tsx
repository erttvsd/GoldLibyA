import { useState, useEffect } from 'react';
import { ArrowLeft, Banknote, CheckCircle, XCircle, Clock, User, Calendar, DollarSign } from 'lucide-react';
import { Card, Button, Modal } from '../../components/ui';
import { supabase } from '../../lib/supabase';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  appointment_date?: string;
  notes?: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface StoreWithdrawalsPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreWithdrawalsPage = ({ storeId, onBack }: StoreWithdrawalsPageProps) => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'complete' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, [storeId, filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user:profiles(first_name, last_name, email, phone)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Failed to load withdrawal requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: WithdrawalRequest, action: 'approve' | 'complete' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);
    try {
      let updates: any = {};

      if (actionType === 'approve') {
        updates = { status: 'approved' };
      } else if (actionType === 'complete') {
        updates = { status: 'completed' };
      } else if (actionType === 'reject') {
        if (!rejectReason.trim()) {
          alert('Please provide a reason for rejection');
          setProcessing(false);
          return;
        }
        updates = {
          status: 'rejected',
          rejection_reason: rejectReason
        };
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await loadRequests();
      setShowModal(false);
      setSelectedRequest(null);
      setActionType(null);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to process request:', error);
      alert('Failed to process request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(2)} LYD`;
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
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Customer Withdrawals</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Process customer money withdrawal requests
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              filter === f
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-blue-600">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'completed').length}
              </p>
            </div>
            <Banknote className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {requests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Banknote className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No withdrawal requests found
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} padding="md">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {request.user?.first_name} {request.user?.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.user?.email}
                      </p>
                      {request.user?.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.user.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                    <p className="font-semibold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(request.amount, request.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Requested</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>

                {request.appointment_date && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Appointment</p>
                    <p className="font-semibold">{formatDate(request.appointment_date)}</p>
                  </div>
                )}

                {request.notes && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                    <p className="text-sm">{request.notes}</p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-3">
                    <Button
                      onClick={() => handleAction(request, 'approve')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleAction(request, 'reject')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {request.status === 'approved' && (
                  <Button
                    onClick={() => handleAction(request, 'complete')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && selectedRequest && (
        <Modal onClose={() => setShowModal(false)} title="Confirm Action">
          <div className="space-y-4">
            {actionType === 'approve' && (
              <p>
                Are you sure you want to approve this withdrawal request for{' '}
                <strong>{formatCurrency(selectedRequest.amount, selectedRequest.currency)}</strong>?
              </p>
            )}

            {actionType === 'complete' && (
              <p>
                Confirm that you have given{' '}
                <strong>{formatCurrency(selectedRequest.amount, selectedRequest.currency)}</strong>{' '}
                to <strong>{selectedRequest.user?.first_name} {selectedRequest.user?.last_name}</strong>?
              </p>
            )}

            {actionType === 'reject' && (
              <div className="space-y-3">
                <p>Please provide a reason for rejecting this request:</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  rows={3}
                  placeholder="Enter rejection reason..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="flex-1"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                className={`flex-1 ${
                  actionType === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
