import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/wallet.service';
import { Button, Card } from '../../components/ui';
import { Transaction } from '../../types';
import { formatCurrency, formatDate, formatGrams } from '../../utils/format';
import jsPDF from 'jspdf';

interface StatementsPageProps {
  onBack: () => void;
}

type FilterType = 'all' | 'gold' | 'silver' | 'LYD' | 'USD';

export const StatementsPage = ({ onBack }: StatementsPageProps) => {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [filter, transactions]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await walletService.getTransactions(user!.id, 500);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredTransactions(transactions);
    } else if (filter === 'gold' || filter === 'silver') {
      // Filter for gold/silver related transactions
      setFilteredTransactions(
        transactions.filter(
          (tx) =>
            tx.description?.toLowerCase().includes(filter) ||
            tx.description?.toLowerCase().includes('digital')
        )
      );
    } else {
      // Filter by currency (LYD or USD)
      setFilteredTransactions(transactions.filter((tx) => tx.currency === filter));
    }
  };

  const calculateTotals = (txList: Transaction[]) => {
    const deposits = txList
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = txList
      .filter((t) => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    const purchases = txList
      .filter((t) => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);

    const transfersIn = txList
      .filter((t) => t.type === 'transfer_in')
      .reduce((sum, t) => sum + t.amount, 0);

    const transfersOut = txList
      .filter((t) => t.type === 'transfer_out')
      .reduce((sum, t) => sum + t.amount, 0);

    return { deposits, withdrawals, purchases, transfersIn, transfersOut };
  };

  const handleDownloadPDF = async () => {
    if (!profile) return;

    try {
      setDownloading(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSACTION STATEMENT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Gold Trading Platform', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Account info
      doc.setFontSize(10);
      doc.text(`Account Holder: ${profile.first_name} ${profile.last_name}`, 20, yPos);
      yPos += 6;
      doc.text(`Filter: ${filter === 'all' ? 'All Transactions' : filter.toUpperCase()}`, 20, yPos);
      yPos += 6;
      doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 20, yPos);
      yPos += 6;
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 20, yPos);
      yPos += 12;

      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      // Summary
      const totals = calculateTotals(filteredTransactions);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Summary', 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      if (filter === 'all' || filter === 'LYD' || filter === 'USD') {
        const currency = filter === 'USD' ? 'USD' : 'LYD';
        const txInCurrency =
          filter === 'all'
            ? filteredTransactions
            : filteredTransactions.filter((t) => t.currency === currency);

        if (txInCurrency.length > 0) {
          const currTotals = calculateTotals(txInCurrency);
          doc.text(`${currency} Transactions:`, 20, yPos);
          yPos += 5;
          doc.text(`  Deposits: ${formatCurrency(currTotals.deposits, currency)}`, 20, yPos);
          yPos += 5;
          doc.text(`  Withdrawals: ${formatCurrency(currTotals.withdrawals, currency)}`, 20, yPos);
          yPos += 5;
          doc.text(`  Purchases: ${formatCurrency(currTotals.purchases, currency)}`, 20, yPos);
          yPos += 5;
          doc.text(`  Transfers In: ${formatCurrency(currTotals.transfersIn, currency)}`, 20, yPos);
          yPos += 5;
          doc.text(`  Transfers Out: ${formatCurrency(currTotals.transfersOut, currency)}`, 20, yPos);
          yPos += 8;
        }
      }

      yPos += 5;
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      // Transaction history
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Transaction History', 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      filteredTransactions.forEach((tx, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const isPositive = tx.type === 'deposit' || tx.type === 'transfer_in';
        const sign = isPositive ? '+' : '-';

        doc.text(`${formatDate(tx.created_at)}`, 20, yPos);
        doc.text(tx.type.replace('_', ' ').toUpperCase(), 60, yPos);
        doc.text(tx.description || 'N/A', 90, yPos);
        doc.text(
          `${sign}${formatCurrency(Math.abs(tx.amount), tx.currency)}`,
          pageWidth - 40,
          yPos,
          { align: 'right' }
        );

        yPos += 5;

        if (index < filteredTransactions.length - 1) {
          doc.setDrawColor(230, 230, 230);
          doc.line(20, yPos, pageWidth - 20, yPos);
          yPos += 5;
        }
      });

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, footerY, pageWidth - 20, footerY);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('This is an official transaction statement', pageWidth / 2, footerY + 6, {
        align: 'center',
      });
      doc.text('Gold Trading Platform', pageWidth / 2, footerY + 11, { align: 'center' });

      const fileName = `statement-${filter}-${Date.now()}.pdf`;
      doc.save(fileName);

      setTimeout(() => {
        alert('✓ Statement downloaded successfully!');
      }, 500);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download statement. Please try again.');
    } finally {
      setTimeout(() => {
        setDownloading(false);
      }, 1000);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      alert('Sharing is not supported on this device. Please use the download button instead.');
      return;
    }

    try {
      await navigator.share({
        title: 'Transaction Statement',
        text: `My transaction statement (${filter}) - Gold Trading Platform`,
        url: window.location.href,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '↓';
      case 'withdrawal':
        return '↑';
      case 'purchase':
        return '🛒';
      case 'transfer_in':
        return '←';
      case 'transfer_out':
        return '→';
      default:
        return '•';
    }
  };

  const getTransactionLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const totals = calculateTotals(filteredTransactions);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Statements</h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All"
          color="bg-gray-500"
        />
        <FilterButton
          active={filter === 'gold'}
          onClick={() => setFilter('gold')}
          label="Gold"
          color="bg-yellow-500"
        />
        <FilterButton
          active={filter === 'silver'}
          onClick={() => setFilter('silver')}
          label="Silver"
          color="bg-gray-400"
        />
        <FilterButton
          active={filter === 'LYD'}
          onClick={() => setFilter('LYD')}
          label="LYD"
          color="bg-green-500"
        />
        <FilterButton
          active={filter === 'USD'}
          onClick={() => setFilter('USD')}
          label="USD"
          color="bg-blue-500"
        />
      </div>

      {/* Summary card */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <h3 className="text-lg font-bold mb-4">
          Summary ({filter === 'all' ? 'All' : filter.toUpperCase()})
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="opacity-70 mb-1">Deposits</p>
            <p className="font-bold text-green-400 text-lg">
              {totals.deposits > 0 ? `+${totals.deposits.toFixed(2)}` : '0.00'}
            </p>
          </div>
          <div>
            <p className="opacity-70 mb-1">Withdrawals</p>
            <p className="font-bold text-red-400 text-lg">
              {totals.withdrawals > 0 ? `-${totals.withdrawals.toFixed(2)}` : '0.00'}
            </p>
          </div>
          <div>
            <p className="opacity-70 mb-1">Purchases</p>
            <p className="font-bold text-orange-400 text-lg">
              {totals.purchases > 0 ? `-${totals.purchases.toFixed(2)}` : '0.00'}
            </p>
          </div>
          <div>
            <p className="opacity-70 mb-1">Transactions</p>
            <p className="font-bold text-blue-400 text-lg">{filteredTransactions.length}</p>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleDownloadPDF}
          variant="primary"
          size="lg"
          icon={Download}
          loading={downloading}
          fullWidth
        >
          Download PDF
        </Button>
        <Button onClick={handleShare} variant="outline" size="lg" icon={Share2} fullWidth>
          Share
        </Button>
      </div>

      {/* Transactions list */}
      <div>
        <h3 className="text-lg font-bold mb-3">Transactions</h3>
        {filteredTransactions.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No transactions found for this filter
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const isPositive = tx.type === 'deposit' || tx.type === 'transfer_in';
              return (
                <Card key={tx.id} className="flex items-center justify-between" padding="sm" hover>
                  <div className="flex items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 text-lg ${
                        isPositive
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {tx.description || getTransactionLabel(tx.type)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-bold text-lg ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isPositive ? '+' : '-'}
                    {formatCurrency(Math.abs(tx.amount), tx.currency)}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const FilterButton = ({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
      active
        ? `${color} text-white shadow-md`
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    {label}
  </button>
);
