import { useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Button, Card } from '../ui';
import jsPDF from 'jspdf';

interface StatementModalProps {
  transactions: Transaction[];
  userName: string;
  onClose: () => void;
}

export const StatementModal = ({ transactions, userName, onClose }: StatementModalProps) => {
  const [downloading, setDownloading] = useState(false);

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

  const calculateTotals = () => {
    const lydDeposits = transactions
      .filter((t) => t.type === 'deposit' && t.currency === 'LYD')
      .reduce((sum, t) => sum + t.amount, 0);
    const lydWithdrawals = transactions
      .filter((t) => t.type === 'withdrawal' && t.currency === 'LYD')
      .reduce((sum, t) => sum + t.amount, 0);
    const lydPurchases = transactions
      .filter((t) => t.type === 'purchase' && t.currency === 'LYD')
      .reduce((sum, t) => sum + t.amount, 0);

    const usdDeposits = transactions
      .filter((t) => t.type === 'deposit' && t.currency === 'USD')
      .reduce((sum, t) => sum + t.amount, 0);
    const usdWithdrawals = transactions
      .filter((t) => t.type === 'withdrawal' && t.currency === 'USD')
      .reduce((sum, t) => sum + t.amount, 0);
    const usdPurchases = transactions
      .filter((t) => t.type === 'purchase' && t.currency === 'USD')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      lydDeposits,
      lydWithdrawals,
      lydPurchases,
      lydNet: lydDeposits - lydWithdrawals - lydPurchases,
      usdDeposits,
      usdWithdrawals,
      usdPurchases,
      usdNet: usdDeposits - usdWithdrawals - usdPurchases,
    };
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSACTION STATEMENT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Gold Trading Platform', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(10);
      doc.text(`Account Holder: ${userName}`, 20, yPos);
      yPos += 6;
      doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 20, yPos);
      yPos += 6;
      doc.text(`Total Transactions: ${transactions.length}`, 20, yPos);
      yPos += 12;

      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      const totals = calculateTotals();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Summary', 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      if (totals.lydDeposits > 0 || totals.lydWithdrawals > 0 || totals.lydPurchases > 0) {
        doc.text('Libyan Dinar (LYD):', 20, yPos);
        yPos += 5;
        doc.text(`  Deposits: ${formatCurrency(totals.lydDeposits, 'LYD')}`, 20, yPos);
        yPos += 5;
        doc.text(`  Withdrawals: ${formatCurrency(totals.lydWithdrawals, 'LYD')}`, 20, yPos);
        yPos += 5;
        doc.text(`  Purchases: ${formatCurrency(totals.lydPurchases, 'LYD')}`, 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(`  Net: ${formatCurrency(totals.lydNet, 'LYD')}`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 8;
      }

      if (totals.usdDeposits > 0 || totals.usdWithdrawals > 0 || totals.usdPurchases > 0) {
        doc.text('US Dollar (USD):', 20, yPos);
        yPos += 5;
        doc.text(`  Deposits: ${formatCurrency(totals.usdDeposits, 'USD')}`, 20, yPos);
        yPos += 5;
        doc.text(`  Withdrawals: ${formatCurrency(totals.usdWithdrawals, 'USD')}`, 20, yPos);
        yPos += 5;
        doc.text(`  Purchases: ${formatCurrency(totals.usdPurchases, 'USD')}`, 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(`  Net: ${formatCurrency(totals.usdNet, 'USD')}`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 8;
      }

      yPos += 5;
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Transaction History', 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      transactions.forEach((tx, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const isPositive = tx.type === 'deposit' || tx.type === 'transfer_in';
        const sign = isPositive ? '+' : '-';

        doc.text(`${formatDate(tx.created_at)}`, 20, yPos);
        doc.text(getTransactionLabel(tx.type), 70, yPos);
        doc.text(tx.reference_id || tx.id.substring(0, 16), 110, yPos);
        doc.text(`${sign}${formatCurrency(Math.abs(tx.amount), tx.currency)}`, 160, yPos, {
          align: 'right',
        });

        yPos += 5;

        if (index < transactions.length - 1) {
          doc.setDrawColor(230, 230, 230);
          doc.line(20, yPos, pageWidth - 20, yPos);
          yPos += 5;
        }
      });

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

      const fileName = `statement-${Date.now()}.pdf`;
      doc.save(fileName);

      setTimeout(() => {
        alert('✓ Statement downloaded successfully! Check your downloads folder.');
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

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold">Transaction Statements</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mb-6">
            <h3 className="text-lg font-bold mb-4">Account Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(totals.lydDeposits > 0 ||
                totals.lydWithdrawals > 0 ||
                totals.lydPurchases > 0) && (
                <div>
                  <p className="text-sm opacity-70 mb-2">Libyan Dinar (LYD)</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-80">Deposits:</span>
                      <span className="font-semibold text-green-400">
                        +{formatCurrency(totals.lydDeposits, 'LYD')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">Withdrawals:</span>
                      <span className="font-semibold text-red-400">
                        -{formatCurrency(totals.lydWithdrawals, 'LYD')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">Purchases:</span>
                      <span className="font-semibold text-red-400">
                        -{formatCurrency(totals.lydPurchases, 'LYD')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/20">
                      <span className="font-bold">Net:</span>
                      <span
                        className={`font-bold ${
                          totals.lydNet >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {totals.lydNet >= 0 ? '+' : ''}
                        {formatCurrency(totals.lydNet, 'LYD')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {(totals.usdDeposits > 0 ||
                totals.usdWithdrawals > 0 ||
                totals.usdPurchases > 0) && (
                <div>
                  <p className="text-sm opacity-70 mb-2">US Dollar (USD)</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-80">Deposits:</span>
                      <span className="font-semibold text-green-400">
                        +{formatCurrency(totals.usdDeposits, 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">Withdrawals:</span>
                      <span className="font-semibold text-red-400">
                        -{formatCurrency(totals.usdWithdrawals, 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">Purchases:</span>
                      <span className="font-semibold text-red-400">
                        -{formatCurrency(totals.usdPurchases, 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/20">
                      <span className="font-bold">Net:</span>
                      <span
                        className={`font-bold ${
                          totals.usdNet >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {totals.usdNet >= 0 ? '+' : ''}
                        {formatCurrency(totals.usdNet, 'USD')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 text-sm">
              <div className="flex justify-between">
                <span className="opacity-80">Total Transactions:</span>
                <span className="font-semibold">{transactions.length}</span>
              </div>
            </div>
          </Card>

          <h3 className="text-lg font-bold mb-3">All Transactions</h3>

          {transactions.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No transactions found
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isPositive = tx.type === 'deposit' || tx.type === 'transfer_in';
                return (
                  <Card
                    key={tx.id}
                    className="flex items-center justify-between"
                    padding="sm"
                    hover
                  >
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
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                          {tx.reference_id || tx.id}
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

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadPDF}
              variant="primary"
              size="lg"
              icon={Download}
              fullWidth
              loading={downloading}
            >
              Download PDF Statement
            </Button>
            <Button onClick={onClose} variant="outline" size="lg" fullWidth>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
