import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, ArrowRight, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { locationChangeService } from '../../services/location-change.service';

interface StoreLocationChangePageProps {
  storeId: string;
  onBack: () => void;
}

interface LocationChangeRequest {
  id: string;
  asset_id: string;
  from_store_id: string;
  to_store_id: string;
  status: string;
  reason: string;
  resolution_note?: string;
  created_at: string;
  owned_assets?: any;
  from_store?: any;
  to_store?: any;
  requester?: any;
}

export const StoreLocationChangePage = ({ storeId, onBack }: StoreLocationChangePageProps) => {
  const [requests, setRequests] = useState<LocationChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LocationChangeRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'moved'>('pending');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, [storeId, filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await locationChangeService.getRequests(
        storeId,
        filter === 'all' ? undefined : filter
      );
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const { error } = await locationChangeService.approveRequest(selectedRequest.id, resolutionNotes);
      if (error) throw error;

      alert('Request approved successfully!');
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setResolutionNotes('');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!resolutionNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await locationChangeService.rejectRequest(selectedRequest.id, resolutionNotes);
      if (error) throw error;

      alert('Request rejected');
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setResolutionNotes('');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteMove = async (request: LocationChangeRequest) => {
    if (!confirm('Confirm that the asset has been physically moved and received?')) return;

    try {
      const { error } = await locationChangeService.completeMove(request.id);
      if (error) throw error;
      alert('Location change completed!');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to complete move');
    }
  };

  const openApprovalModal = (request: LocationChangeRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setResolutionNotes('');
    setShowApprovalModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'approved':
        return 'blue';
      case 'moved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'approved':
        return <CheckCircle size={16} />;
      case 'moved':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const isFromStore = (request: LocationChangeRequest) => request.from_store_id === storeId;

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
              <MapPin className="text-yellow-500" size={24} />
              <h1 className="text-xl font-bold">Location Changes</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['pending', 'approved', 'moved', 'rejected', 'all'].map((f) => (
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

        {requests.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No {filter !== 'all' ? filter : ''} location change requests found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const statusColor = getStatusColor(request.status);
              const fromCurrentStore = isFromStore(request);

              return (
                <Card key={request.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium bg-${statusColor}-100 text-${statusColor}-700 flex items-center gap-1`}
                          >
                            {getStatusIcon(request.status)}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                          {fromCurrentStore && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                              Outgoing
                            </span>
                          )}
                          {!fromCurrentStore && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              Incoming
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <Package size={16} className="text-gray-500" />
                          <div className="font-medium">
                            {request.owned_assets?.products?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Serial: {request.owned_assets?.serial_number || 'N/A'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="font-medium">{request.from_store?.name || 'Unknown'}</span>
                            <span className="text-gray-500">({request.from_store?.city || 'N/A'})</span>
                          </div>
                          <ArrowRight size={16} className="text-gray-400" />
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="font-medium">{request.to_store?.name || 'Unknown'}</span>
                            <span className="text-gray-500">({request.to_store?.city || 'N/A'})</span>
                          </div>
                        </div>

                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <div className="text-xs text-gray-500 mb-1">Reason:</div>
                          <div>{request.reason}</div>
                        </div>

                        {request.resolution_note && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Resolution Note:</div>
                            <div className="text-blue-800 dark:text-blue-200">{request.resolution_note}</div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-2">
                          Requested by {request.requester?.first_name || 'Unknown'}{' '}
                          {request.requester?.last_name || ''} on {new Date(request.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <Button
                          onClick={() => openApprovalModal(request, 'approve')}
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </Button>
                        <Button
                          onClick={() => openApprovalModal(request, 'reject')}
                          variant="secondary"
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <XCircle size={14} />
                          Reject
                        </Button>
                      </div>
                    )}

                    {request.status === 'approved' && !fromCurrentStore && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <Button
                          onClick={() => handleCompleteMove(request)}
                          size="sm"
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={14} />
                          Confirm Asset Received
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showApprovalModal && selectedRequest && (
        <Modal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title={actionType === 'approve' ? 'Approve Location Change' : 'Reject Location Change'}
        >
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="font-medium mb-2">
                {selectedRequest.owned_assets?.products?.name || 'Unknown Product'}
              </div>
              <div className="text-sm text-gray-500">
                Serial: {selectedRequest.owned_assets?.serial_number || 'N/A'}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span>{selectedRequest.from_store?.name}</span>
                <ArrowRight size={14} />
                <span>{selectedRequest.to_store?.name}</span>
              </div>
            </div>

            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Request Reason:</div>
              <div className="text-blue-800 dark:text-blue-200">{selectedRequest.reason}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder={
                  actionType === 'approve' ? 'Add any notes...' : 'Please provide a reason for rejection...'
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
              />
            </div>

            <div className="flex gap-2">
              {actionType === 'approve' ? (
                <Button onClick={handleApprove} disabled={processing} className="flex-1">
                  {processing ? 'Approving...' : 'Approve Request'}
                </Button>
              ) : (
                <Button
                  onClick={handleReject}
                  disabled={processing || !resolutionNotes.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {processing ? 'Rejecting...' : 'Reject Request'}
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowApprovalModal(false)} disabled={processing}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
