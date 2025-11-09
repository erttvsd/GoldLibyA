import { useState } from 'react';
import { ArrowLeft, DollarSign, Send, User, Search } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface StorePaymentsPageProps {
  onBack: () => void;
}

export const StorePaymentsPage = ({ onBack }: StorePaymentsPageProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'LYD' | 'USD'>('LYD');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .or(`email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(5);

      if (data && data.length > 0) {
        setSelectedCustomer(data[0]);
      } else {
        setError('Customer not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPayment = async () => {
    if (!selectedCustomer || !amount) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: storeProfile } = await supabase
        .from('store_profiles')
        .select('store_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!storeProfile) {
        throw new Error('Store profile not found');
      }

      await supabase.from('store_transactions').insert({
        store_id: storeProfile.store_id,
        processed_by_user_id: user?.id,
        recipient_user_id: selectedCustomer.id,
        transaction_type: 'send_to_individual',
        amount: parseFloat(amount),
        currency,
        reference_number: `ST${Date.now()}`,
        description: description || `Payment from store`,
        status: 'completed',
      });

      await supabase.rpc('credit_wallet', {
        p_user_id: selectedCustomer.id,
        p_currency: currency,
        p_amount: parseFloat(amount),
      });

      setSuccess(`Successfully sent ${amount} ${currency} to ${selectedCustomer.first_name}`);
      setSelectedCustomer(null);
      setAmount('');
      setDescription('');
      setSearchQuery('');
    } catch (err: any) {
      setError(err.message || 'Failed to send payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Payments & Transfers</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Send LYD or USD to customers
        </p>
      </div>

      {success && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-bold mb-4">Search Customer</h2>
        <div className="flex gap-2">
          <Input
            label=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter email or phone..."
          />
          <Button onClick={handleSearch} variant="primary" icon={Search} disabled={loading}>
            Search
          </Button>
        </div>
      </Card>

      {selectedCustomer && (
        <>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCustomer.email || selectedCustomer.phone}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold mb-4">Payment Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCurrency('LYD')}
                    className={`py-3 rounded-lg font-medium transition ${
                      currency === 'LYD'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    LYD
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`py-3 rounded-lg font-medium transition ${
                      currency === 'USD'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              <Input
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />

              <Input
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment description..."
              />
            </div>
          </Card>

          <Button
            onClick={handleSendPayment}
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading || !amount}
            icon={Send}
          >
            {loading ? 'Sending...' : `Send ${amount || '0'} ${currency}`}
          </Button>
        </>
      )}
    </div>
  );
};
