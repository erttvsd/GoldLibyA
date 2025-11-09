import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, Plus, Minus, TrendingUp, TrendingDown, Lock, Unlock, Calculator } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { cashDrawerService } from '../../services/cash-drawer.service';

interface StoreCashDrawerPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreCashDrawerPage = ({ storeId, onBack }: StoreCashDrawerPageProps) => {
  const [movements, setMovements] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAddCashModal, setShowAddCashModal] = useState(false);
  const [showRemoveCashModal, setShowRemoveCashModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadCashDrawer();
  }, [storeId]);

  const loadCashDrawer = async () => {
    try {
      const [movementsRes, balanceRes] = await Promise.all([
        cashDrawerService.getCashMovements(storeId, new Date().toISOString().split('T')[0]),
        cashDrawerService.getCurrentBalance(storeId),
      ]);

      if (movementsRes.data) setMovements(movementsRes.data);
      if (balanceRes.data) {
        setCurrentBalance(balanceRes.data.balance || 0);
        setDrawerOpen(balanceRes.data.is_open || false);
      }
    } catch (error) {
      console.error('Error loading cash drawer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = async () => {
    if (!amount || parseFloat(amount) < 0) {
      alert('Please enter valid opening amount');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await cashDrawerService.openDrawer(storeId, parseFloat(amount), notes);
      if (error) throw error;

      alert('Cash drawer opened successfully');
      setShowOpenModal(false);
      setAmount('');
      setNotes('');
      loadCashDrawer();
    } catch (err: any) {
      alert(err.message || 'Failed to open drawer');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseDrawer = async () => {
    if (!amount || parseFloat(amount) < 0) {
      alert('Please enter valid closing amount');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await cashDrawerService.closeDrawer(storeId, parseFloat(amount), notes);
      if (error) throw error;

      const difference = parseFloat(amount) - currentBalance;
      const message = difference === 0
        ? 'Drawer balanced perfectly!'
        : difference > 0
        ? `Over by ${difference.toFixed(2)} LYD`
        : `Short by ${Math.abs(difference).toFixed(2)} LYD`;

      alert(`Cash drawer closed. ${message}`);
      setShowCloseModal(false);
      setAmount('');
      setNotes('');
      loadCashDrawer();
    } catch (err: any) {
      alert(err.message || 'Failed to close drawer');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddCash = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter valid amount');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await cashDrawerService.addCash(storeId, parseFloat(amount), notes);
      if (error) throw error;

      alert('Cash added successfully');
      setShowAddCashModal(false);
      setAmount('');
      setNotes('');
      loadCashDrawer();
    } catch (err: any) {
      alert(err.message || 'Failed to add cash');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCash = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter valid amount');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await cashDrawerService.removeCash(storeId, parseFloat(amount), notes);
      if (error) throw error;

      alert('Cash removed successfully');
      setShowRemoveCashModal(false);
      setAmount('');
      setNotes('');
      loadCashDrawer();
    } catch (err: any) {
      alert(err.message || 'Failed to remove cash');
    } finally {
      setProcessing(false);
    }
  };

  const getMovementIcon = (type: string) => {
    if (type === 'open') return <Unlock className="text-blue-500" size={16} />;
    if (type === 'close') return <Lock className="text-gray-500" size={16} />;
    if (type === 'deposit' || type === 'sale') return <TrendingUp className="text-green-500" size={16} />;
    if (type === 'withdrawal') return <TrendingDown className="text-red-500" size={16} />;
    return <DollarSign className="text-gray-500" size={16} />;
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
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <DollarSign className="text-yellow-500" size={24} />
            <h1 className="text-xl font-bold">Cash Drawer</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className={`p-6 ${drawerOpen ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {drawerOpen ? <Unlock size={32} className="text-green-600" /> : <Lock size={32} className="text-gray-400" />}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Drawer Status</div>
                <div className="text-lg font-bold">{drawerOpen ? 'OPEN' : 'CLOSED'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Balance</div>
              <div className="text-3xl font-bold text-yellow-600">{currentBalance.toFixed(2)} LYD</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {!drawerOpen ? (
              <Button
                onClick={() => setShowOpenModal(true)}
                fullWidth
                className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Unlock size={16} />
                Open Drawer
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setShowAddCashModal(true)}
                  variant="secondary"
                  fullWidth
                  className="flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Cash
                </Button>
                <Button
                  onClick={() => setShowRemoveCashModal(true)}
                  variant="secondary"
                  fullWidth
                  className="flex items-center justify-center gap-2"
                >
                  <Minus size={16} />
                  Remove Cash
                </Button>
              </>
            )}
          </div>

          {drawerOpen && (
            <Button
              onClick={() => setShowCloseModal(true)}
              fullWidth
              className="mt-2 bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              Close Drawer
            </Button>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Today's Movements</h3>
          <div className="space-y-2">
            {movements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No movements today</div>
            ) : (
              movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getMovementIcon(movement.movement_type)}
                    <div>
                      <div className="font-medium text-sm capitalize">
                        {movement.movement_type.replace('_', ' ')}
                      </div>
                      {movement.notes && (
                        <div className="text-xs text-gray-500">{movement.notes}</div>
                      )}
                      <div className="text-xs text-gray-400">
                        {new Date(movement.created_at).toLocaleTimeString()} •
                        {movement.profiles?.first_name} {movement.profiles?.last_name}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      ['deposit', 'sale', 'open'].includes(movement.movement_type)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {['deposit', 'sale', 'open'].includes(movement.movement_type) ? '+' : '-'}
                    {movement.amount_lyd.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {showOpenModal && (
        <Modal
          isOpen={showOpenModal}
          onClose={() => setShowOpenModal(false)}
          title="Open Cash Drawer"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Calculator size={20} className="text-blue-600" />
                <span className="font-semibold">Starting Cash Count</span>
              </div>
              <p className="text-sm text-gray-600">Enter the total cash amount in the drawer to begin your shift.</p>
            </div>

            <Input
              label="Opening Amount (LYD)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />

            <Input
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Received from manager..."
            />

            <div className="flex gap-2">
              <Button onClick={handleOpenDrawer} disabled={processing} className="flex-1">
                {processing ? 'Opening...' : 'Open Drawer'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowOpenModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showCloseModal && (
        <Modal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          title="Close Cash Drawer"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
              <div className="font-semibold mb-2">Expected Balance: {currentBalance.toFixed(2)} LYD</div>
              <p className="text-sm text-gray-600">Count all cash in the drawer and enter the actual amount below.</p>
            </div>

            <Input
              label="Actual Closing Amount (LYD)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />

            {amount && (
              <div className="p-3 rounded bg-gray-50 dark:bg-gray-800">
                <div className="text-sm">
                  <span className="text-gray-600">Difference: </span>
                  <span className={`font-bold ${
                    parseFloat(amount) - currentBalance === 0 ? 'text-green-600' :
                    parseFloat(amount) - currentBalance > 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {(parseFloat(amount) - currentBalance).toFixed(2)} LYD
                  </span>
                </div>
              </div>
            )}

            <Input
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Small change shortage..."
            />

            <div className="flex gap-2">
              <Button onClick={handleCloseDrawer} disabled={processing} className="flex-1 bg-red-600 hover:bg-red-700">
                {processing ? 'Closing...' : 'Close Drawer'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowCloseModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showAddCashModal && (
        <Modal
          isOpen={showAddCashModal}
          onClose={() => setShowAddCashModal(false)}
          title="Add Cash"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Add cash to the drawer (e.g., from safe deposit, bank deposit)</p>

            <Input
              label="Amount to Add (LYD)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />

            <Input
              label="Reason"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Safe deposit, Change replenishment..."
            />

            <div className="flex gap-2">
              <Button onClick={handleAddCash} disabled={processing} className="flex-1">
                {processing ? 'Adding...' : 'Add Cash'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowAddCashModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showRemoveCashModal && (
        <Modal
          isOpen={showRemoveCashModal}
          onClose={() => setShowRemoveCashModal(false)}
          title="Remove Cash"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Remove cash from the drawer (e.g., for safe deposit, bank deposit)</p>

            <Input
              label="Amount to Remove (LYD)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={currentBalance.toString()}
            />

            <Input
              label="Reason"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Deposit to safe, Bank deposit..."
            />

            <div className="flex gap-2">
              <Button onClick={handleRemoveCash} disabled={processing} className="flex-1">
                {processing ? 'Removing...' : 'Remove Cash'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowRemoveCashModal(false)}
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
