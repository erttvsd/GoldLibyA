import { useEffect, useState } from 'react';
import { ArrowLeft, Wallet, DollarSign, TrendingUp, TrendingDown, Plus, Minus, RefreshCw } from 'lucide-react';
import { Card, Button, Modal, Input } from '../../components/ui';
import { storeFinanceService, StoreFinancialAccount, StoreFinancialTransaction } from '../../services/store-finance.service';

interface StoreFinancePageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreFinancePage = ({ storeId, onBack }: StoreFinancePageProps) => {
  const [accounts, setAccounts] = useState<StoreFinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<StoreFinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'LYD' | 'USD'>('LYD');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        storeFinanceService.getFinancialAccounts(storeId),
        storeFinanceService.getFinancialTransactions(storeId, { limit: 20 }),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      setAccounts(accountsRes.data || []);
      setTransactions(transactionsRes.data || []);
    } catch (err: any) {
      console.error('Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await storeFinanceService.depositFunds(
        storeId,
        selectedCurrency,
        parseFloat(amount),
        description || undefined
      );

      if (error) throw error;

      alert('Deposit successful');
      setShowDepositModal(false);
      setAmount('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deposit funds');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await storeFinanceService.withdrawFunds(
        storeId,
        selectedCurrency,
        parseFloat(amount),
        description || undefined
      );

      if (error) throw error;

      alert('Withdrawal successful');
      setShowWithdrawModal(false);
      setAmount('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw funds');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'deposit' || type === 'transfer_in') return <TrendingUp className="text-green-500" size={16} />;
    if (type === 'withdrawal' || type === 'transfer_out') return <TrendingDown className="text-red-500" size={16} />;
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
            <Wallet className="text-yellow-500" size={24} />
            <h1 className="text-xl font-bold">Store Finance</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="text-yellow-500" size={20} />
                  <span className="font-semibold">{account.currency} Wallet</span>
                </div>
                <button
                  onClick={loadData}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <div className="text-xs text-gray-500">Total Balance</div>
                  <div className="text-2xl font-bold">
                    {account.balance.toLocaleString()} {account.currency}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Available</div>
                    <div className="font-semibold text-green-600">
                      {account.available_balance.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Held</div>
                    <div className="font-semibold text-orange-600">
                      {account.held_balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedCurrency(account.currency as 'LYD' | 'USD');
                    setShowDepositModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} /> Deposit
                </Button>
                <Button
                  onClick={() => {
                    setSelectedCurrency(account.currency as 'LYD' | 'USD');
                    setShowWithdrawModal(true);
                  }}
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  <Minus size={16} /> Withdraw
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No transactions yet</div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.transaction_type)}
                    <div>
                      <div className="font-medium text-sm capitalize">
                        {tx.transaction_type.replace('_', ' ')}
                      </div>
                      {tx.description && (
                        <div className="text-xs text-gray-500">{tx.description}</div>
                      )}
                      <div className="text-xs text-gray-400">
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        tx.transaction_type === 'deposit' || tx.transaction_type === 'transfer_in'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {tx.transaction_type === 'deposit' || tx.transaction_type === 'transfer_in'
                        ? '+'
                        : '-'}
                      {tx.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Balance: {tx.balance_after.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {showDepositModal && (
        <Modal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          title={`Deposit ${selectedCurrency}`}
        >
          <div className="space-y-4">
            <Input
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.001"
            />
            <Input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Cash deposit"
            />
            <div className="flex gap-2">
              <Button onClick={handleDeposit} disabled={processing} className="flex-1">
                {processing ? 'Processing...' : 'Deposit'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDepositModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showWithdrawModal && (
        <Modal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          title={`Withdraw ${selectedCurrency}`}
        >
          <div className="space-y-4">
            <Input
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.001"
            />
            <Input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Supplier payment"
            />
            <div className="flex gap-2">
              <Button onClick={handleWithdraw} disabled={processing} className="flex-1">
                {processing ? 'Processing...' : 'Withdraw'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowWithdrawModal(false)}
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
