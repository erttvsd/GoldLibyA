import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, Package, Users, Calendar, Download, BarChart3 } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { reportsService } from '../../services/reports.service';

interface StoreReportsPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreReportsPage = ({ storeId, onBack }: StoreReportsPageProps) => {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'customers' | 'financial'>('sales');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, [storeId, reportType, dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (reportType === 'sales') {
        const { data } = await reportsService.getDailySalesReport(storeId, dateRange.to);
        setSalesData(data);
      } else if (reportType === 'inventory') {
        const { data } = await reportsService.getInventoryValuationReport(storeId);
        setInventoryData(data);
      } else if (reportType === 'customers') {
        const { data } = await reportsService.getCustomerPurchaseReport(storeId, dateRange.from, dateRange.to);
        setCustomerData(data);
      } else if (reportType === 'financial') {
        const { data } = await reportsService.getFinancialSummary(storeId, dateRange.from, dateRange.to);
        setFinancialData(data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await reportsService.exportReport(reportType, storeId, dateRange);
      if (data) {
        alert(`Report will be exported to: ${data.filename}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
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
              <BarChart3 className="text-yellow-500" size={24} />
              <h1 className="text-xl font-bold">Store Reports</h1>
            </div>
          </div>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download size={16} /> Export
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'sales', label: 'Sales', icon: DollarSign },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'financial', label: 'Financial', icon: TrendingUp },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id as any)}
              className={`p-4 rounded-lg border-2 transition ${
                reportType === type.id
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              <type.icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">{type.label}</div>
            </button>
          ))}
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Calendar size={20} className="text-gray-500" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
            <Button onClick={loadReports} size="sm">
              Update
            </Button>
          </div>
        </Card>

        {reportType === 'sales' && salesData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="text-sm opacity-90">Total Sales</div>
                <div className="text-3xl font-bold mt-2">{salesData.total_sales || 0}</div>
                <div className="text-xs opacity-75 mt-1">Transactions</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="text-sm opacity-90">Revenue</div>
                <div className="text-3xl font-bold mt-2">{salesData.total_revenue?.toFixed(2) || '0.00'}</div>
                <div className="text-xs opacity-75 mt-1">LYD</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="text-sm opacity-90">Avg Order</div>
                <div className="text-3xl font-bold mt-2">{salesData.avg_order_value?.toFixed(2) || '0.00'}</div>
                <div className="text-xs opacity-75 mt-1">LYD</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Top Selling Products</h3>
              <div className="space-y-2">
                {salesData.top_products?.map((product: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.quantity} sold</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{product.revenue?.toFixed(2)} LYD</div>
                    </div>
                  </div>
                )) || <div className="text-center text-gray-500 py-4">No sales data available</div>}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Sales by Payment Method</h3>
              <div className="space-y-2">
                {salesData.by_payment_method?.map((method: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-medium capitalize">{method.method?.replace('_', ' ')}</div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{method.count} transactions</span>
                      <span className="font-bold">{method.total?.toFixed(2)} LYD</span>
                    </div>
                  </div>
                )) || <div className="text-center text-gray-500 py-4">No payment data available</div>}
              </div>
            </Card>
          </div>
        )}

        {reportType === 'inventory' && inventoryData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="text-sm opacity-90">Total Items</div>
                <div className="text-3xl font-bold mt-2">{inventoryData.total_items || 0}</div>
                <div className="text-xs opacity-75 mt-1">In Stock</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                <div className="text-sm opacity-90">Total Value</div>
                <div className="text-3xl font-bold mt-2">{inventoryData.total_value?.toFixed(2) || '0.00'}</div>
                <div className="text-xs opacity-75 mt-1">LYD</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white">
                <div className="text-sm opacity-90">Low Stock</div>
                <div className="text-3xl font-bold mt-2">{inventoryData.low_stock_count || 0}</div>
                <div className="text-xs opacity-75 mt-1">Items</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Inventory Summary</h3>
              <div className="space-y-2">
                {inventoryData.by_category?.map((cat: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <div className="font-medium">{cat.category}</div>
                      <div className="text-sm text-gray-500">{cat.quantity} items</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{cat.value?.toFixed(2)} LYD</div>
                    </div>
                  </div>
                )) || <div className="text-center text-gray-500 py-4">No inventory data available</div>}
              </div>
            </Card>
          </div>
        )}

        {reportType === 'customers' && customerData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <div className="text-sm opacity-90">Total Customers</div>
                <div className="text-3xl font-bold mt-2">{customerData.total_customers || 0}</div>
                <div className="text-xs opacity-75 mt-1">Unique</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                <div className="text-sm opacity-90">New Customers</div>
                <div className="text-3xl font-bold mt-2">{customerData.new_customers || 0}</div>
                <div className="text-xs opacity-75 mt-1">This period</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                <div className="text-sm opacity-90">Avg Purchase</div>
                <div className="text-3xl font-bold mt-2">{customerData.avg_purchase?.toFixed(2) || '0.00'}</div>
                <div className="text-xs opacity-75 mt-1">LYD</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Top Customers</h3>
              <div className="space-y-2">
                {customerData.top_customers?.map((customer: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.orders} orders</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{customer.total_spent?.toFixed(2)} LYD</div>
                    </div>
                  </div>
                )) || <div className="text-center text-gray-500 py-4">No customer data available</div>}
              </div>
            </Card>
          </div>
        )}

        {reportType === 'financial' && financialData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <div className="text-sm opacity-90">Total Revenue</div>
                <div className="text-3xl font-bold mt-2">{financialData.total_revenue?.toFixed(2) || '0.00'}</div>
                <div className="text-xs opacity-75 mt-1">LYD</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                <div className="text-sm opacity-90">Total Expenses</div>
                <div className="text-3xl font-bold mt-2">{financialData.total_expenses?.toFixed(2) || '0.00'}</div>
                <div className="text-xs opacity-75 mt-1">LYD</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                <div className="text-sm opacity-90">Net Profit</div>
                <div className="text-3xl font-bold mt-2">
                  {((financialData.total_revenue || 0) - (financialData.total_expenses || 0)).toFixed(2)}
                </div>
                <div className="text-xs opacity-75 mt-1">LYD</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Financial Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="font-medium">Cash Sales</span>
                  <span className="font-bold text-green-600">{financialData.cash_sales?.toFixed(2) || '0.00'} LYD</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span className="font-medium">Card Sales</span>
                  <span className="font-bold text-blue-600">{financialData.card_sales?.toFixed(2) || '0.00'} LYD</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <span className="font-medium">Wallet Sales</span>
                  <span className="font-bold text-purple-600">{financialData.wallet_sales?.toFixed(2) || '0.00'} LYD</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Some metrics may show placeholder data until database RPC functions are created.
            See IMPLEMENTATION_COMPLETE_SUMMARY.md for required functions.
          </div>
        </Card>
      </div>
    </div>
  );
};
