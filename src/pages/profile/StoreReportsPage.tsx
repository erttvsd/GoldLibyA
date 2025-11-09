import { useEffect, useState } from 'react';
import { ArrowLeft, Receipt, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/format';

interface StoreReportsPageProps {
  onBack: () => void;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  recipient_name?: string;
}

export const StoreReportsPage = ({ onBack }: StoreReportsPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadTransactions();
  }, [user, period]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data: storeProfile } = await supabase
        .from('store_profiles')
        .select('store_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!storeProfile) return;

      let query = supabase
        .from('store_transactions')
        .select(`
          *,
          profiles!store_transactions_recipient_user_id_fkey(first_name, last_name)
        `)
        .eq('store_id', storeProfile.store_id)
        .order('created_at', { ascending: false });

      if (period !== 'all') {
        const now = new Date();
        let startDate = new Date();

        if (period === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      const { data } = await query;

      if (data) {
        const formatted = data.map((t: any) => ({
          ...t,
          recipient_name: t.profiles
            ? `${t.profiles.first_name} ${t.profiles.last_name}`
            : 'N/A',
        }));
        setTransactions(formatted);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
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

  const totalSent = transactions
    .filter((t) => t.transaction_type === 'send_to_individual')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const totalReceived = transactions
    .filter((t) => t.transaction_type === 'receive_from_individual')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View transaction history and analytics
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['today', 'week', 'month', 'all'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p as any)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              period === p
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm opacity-90">Received</p>
          </div>
          <p className="text-2xl font-bold">{totalReceived.toFixed(2)}</p>
          <p className="text-xs opacity-75">LYD</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5" />
            <p className="text-sm opacity-90">Sent</p>
          </div>
          <p className="text-2xl font-bold">{totalSent.toFixed(2)}</p>
          <p className="text-xs opacity-75">LYD</p>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Transaction History</h2>
        {transactions.length === 0 ? (
          <Card className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <Card key={t.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          t.transaction_type === 'send_to_individual'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                      >
                        {t.transaction_type === 'send_to_individual' ? 'Sent' : 'Received'}
                      </span>
                      {t.recipient_name && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t.recipient_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{t.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(t.created_at)}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${
                      t.transaction_type === 'send_to_individual'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {t.transaction_type === 'send_to_individual' ? '-' : '+'}
                      {parseFloat(t.amount.toString()).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{t.currency}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
