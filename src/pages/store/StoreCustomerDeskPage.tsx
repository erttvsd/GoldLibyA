import { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Filter, Download } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { customerService, CustomerInteraction } from '../../services/customer.service';
import { CustomerDetailModal } from '../../components/store/CustomerDetailModal';

interface StoreCustomerDeskPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreCustomerDeskPage = ({ storeId, onBack }: StoreCustomerDeskPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [barFilter, setBarFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerInteraction[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerInteraction[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInteraction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [storeId]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, barFilter, statusFilter]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await customerService.getCustomerInteractions(storeId);
      if (error) throw new Error(error);
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.customer_name.toLowerCase().includes(term) ||
        c.customer_email.toLowerCase().includes(term) ||
        c.customer_phone?.toLowerCase().includes(term)
      );
    }

    if (barFilter) {
      filtered = filtered.filter(c =>
        c.asset_bar_number?.toLowerCase().includes(barFilter.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(c => c.interaction_type === statusFilter);
    }

    setFilteredCustomers(filtered);
  };

  const getStatusBadge = (status: CustomerInteraction['interaction_type']) => {
    const badges = {
      appointment_set: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      picked_up: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      transferred: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    const labels = {
      appointment_set: 'Appointment Set',
      picked_up: 'Picked Up',
      transferred: 'Transferred',
      pending: 'Pending',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['Customer Name', 'Email', 'Phone', 'Bar Number', 'Weight (g)', 'Purity', 'Status', 'Date'];
    const rows = filteredCustomers.map(c => [
      c.customer_name,
      c.customer_email,
      c.customer_phone || '',
      c.asset_bar_number || '',
      c.asset_weight?.toString() || '',
      c.asset_purity || '',
      c.interaction_type,
      new Date(c.created_at).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
        <Button onClick={exportToCSV} variant="outline" icon={Download} size="sm">
          Export CSV
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Customer Desk</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Search and manage customer information
        </p>
      </div>

      <Card>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-grow">
              <Input
                label=""
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or phone..."
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? 'primary' : 'outline'}
              icon={Filter}
            >
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium mb-1">Bar Number</label>
                <Input
                  label=""
                  value={barFilter}
                  onChange={(e) => setBarFilter(e.target.value)}
                  placeholder="Filter by bar..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="appointment_set">Appointment Set</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="transferred">Transferred</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredCustomers.length} of {customers.length} customers
      </div>

      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">No customers found</p>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-lg transition"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-grow">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold truncate">{customer.customer_name}</p>
                    <p className="text-sm text-gray-500 truncate">{customer.customer_email}</p>
                    {customer.asset_bar_number && (
                      <p className="text-xs text-gray-400 mt-1">
                        Bar: {customer.asset_bar_number} | {customer.asset_weight}g | {customer.asset_purity}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                  {getStatusBadge(customer.interaction_type)}
                  <span className="text-xs text-gray-400">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          interaction={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={loadCustomers}
        />
      )}
    </div>
  );
};
