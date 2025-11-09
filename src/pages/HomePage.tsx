import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { walletService } from '../services/wallet.service';
import { marketService } from '../services/market.service';
import { receiptService } from '../services/receipt.service';
import { assetService } from '../services/asset.service';
import {
  ArrowRightLeft,
  PackageCheck,
  ScanLine,
  Store,
  Download,
  Send,
  TrendingUp,
  TrendingDown,
  FileText,
  X,
  Plus,
  Building2,
  Coins,
  Vault,
} from 'lucide-react';
import { Card } from '../components/ui';
import { formatCurrency, formatDate, formatGrams } from '../utils/format';
import { Wallet, DigitalBalance, Transaction, LivePrice, OwnedAsset } from '../types';
import { TransactionReceipt, TransactionReceiptData } from '../components/invoice/TransactionReceipt';
import { StatementModal } from '../components/statement/StatementModal';

interface HomePageProps {
  onNavigate: (page: string, subPage?: string) => void;
}

export const HomePage = ({ onNavigate }: HomePageProps) => {
  const { user, profile } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [digitalBalances, setDigitalBalances] = useState<DigitalBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [livePrices, setLivePrices] = useState<LivePrice[]>([]);
  const [ownedAssets, setOwnedAssets] = useState<OwnedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<TransactionReceiptData | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loadingStatements, setLoadingStatements] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletsData, digitalData, txData, pricesData, assetsData] = await Promise.all([
        walletService.getWallets(user!.id),
        walletService.getDigitalBalances(user!.id),
        walletService.getTransactions(user!.id, 3),
        marketService.getLivePrices(),
        assetService.getUserAssets(user!.id),
      ]);

      setWallets(walletsData);
      setDigitalBalances(digitalData);
      setTransactions(txData);
      setLivePrices(pricesData);
      setOwnedAssets(assetsData);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatements = async () => {
    if (!user) return;

    try {
      setLoadingStatements(true);
      const allTx = await walletService.getTransactions(user.id, 100);
      setAllTransactions(allTx);
      setShowAllTransactions(true);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      alert('Failed to load transaction statements. Please try again.');
    } finally {
      setLoadingStatements(false);
    }
  };

  const handleTransactionClick = async (tx: Transaction) => {
    if (!user || !profile) return;

    try {
      const wallet = wallets.find(w => w.currency === tx.currency);
      if (!wallet) return;

      let receipt: TransactionReceiptData;

      if (tx.type === 'deposit') {
        receipt = receiptService.generateWalletDepositReceipt({
          userId: user.id,
          userName: `${profile.first_name} ${profile.last_name}`,
          userEmail: profile.email,
          amount: tx.amount,
          currency: tx.currency,
          walletBalanceBefore: wallet.balance - tx.amount,
          walletBalanceAfter: wallet.balance,
          transactionId: tx.reference_id || tx.id,
          depositMethod: tx.description || 'Wallet Deposit',
        });
      } else if (tx.type === 'withdrawal') {
        receipt = receiptService.generateWalletWithdrawalReceipt({
          userId: user.id,
          userName: `${profile.first_name} ${profile.last_name}`,
          userEmail: profile.email,
          amount: tx.amount,
          currency: tx.currency,
          walletBalanceBefore: wallet.balance + tx.amount,
          walletBalanceAfter: wallet.balance,
          transactionId: tx.reference_id || tx.id,
          withdrawalMethod: tx.description || 'Wallet Withdrawal',
        });
      } else if (tx.type === 'purchase') {
        receipt = {
          transactionId: tx.reference_id || tx.id,
          type: 'digital_purchase',
          timestamp: tx.created_at,
          status: 'success',
          user: {
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
            phone: profile.phone,
          },
          amounts: {
            total: tx.amount,
            currency: tx.currency,
          },
          payment: {
            method: tx.currency === 'LYD' ? 'wallet_lyd' : 'wallet_usd',
            walletBalanceBefore: wallet.balance + tx.amount,
            walletBalanceAfter: wallet.balance,
          },
        };
      } else if (tx.type === 'transfer_out' || tx.type === 'transfer_in') {
        receipt = {
          transactionId: tx.reference_id || tx.id,
          type: 'digital_transfer',
          timestamp: tx.created_at,
          status: 'success',
          user: {
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
            phone: profile.phone,
          },
          amounts: {
            total: tx.amount,
            currency: tx.currency,
          },
          notes: tx.description || undefined,
        };
      } else {
        receipt = {
          transactionId: tx.reference_id || tx.id,
          type: 'wallet_deposit',
          timestamp: tx.created_at,
          status: 'success',
          user: {
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
          },
          amounts: {
            total: tx.amount,
            currency: tx.currency,
          },
        };
      }

      setReceiptData(receipt);
      setShowReceipt(true);
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      alert('Failed to load transaction receipt. Please try again.');
    }
  };

  const dinarWallet = wallets.find((w) => w.currency === 'LYD');
  const dollarWallet = wallets.find((w) => w.currency === 'USD');
  const goldBalance = digitalBalances.find((b) => b.metal_type === 'gold');
  const silverBalance = digitalBalances.find((b) => b.metal_type === 'silver');
  const goldPrice = livePrices.find((p) => p.metal_type === 'gold');
  const silverPrice = livePrices.find((p) => p.metal_type === 'silver');

  const physicalBars = ownedAssets.filter(a => !a.is_digital);
  const barsInStore = physicalBars.filter(a => a.status === 'in_store').length;
  const barsWithCustomer = physicalBars.filter(a => a.status === 'with_customer').length;

  const QuickAction = ({
    icon: Icon,
    label,
    onClick,
  }: {
    icon: any;
    label: string;
    onClick: () => void;
  }) => (
    <div className="flex flex-col items-center space-y-2" onClick={onClick}>
      <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition">
        <Icon className="w-6 h-6 text-yellow-600" />
      </div>
      <span className="text-xs text-gray-700 dark:text-gray-300 text-center">
        {label}
      </span>
    </div>
  );

  const PriceCard = ({
    metal,
    price,
    change,
    color,
  }: {
    metal: string;
    price: number;
    change: number;
    color: 'amber' | 'gray';
  }) => {
    const isUp = change >= 0;
    const colorClasses = {
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-800 dark:text-amber-300',
      },
      gray: {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-800 dark:text-gray-300',
      },
    };

    return (
      <Card className={`${colorClasses[color].bg}`} padding="md">
        <p className={`font-bold ${colorClasses[color].text}`}>{metal}</p>
        <p className={`text-lg font-mono font-semibold mt-1 ${colorClasses[color].text}`}>
          {price.toFixed(2)}
        </p>
        <div className="flex items-center mt-1">
          {isUp ? (
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 mr-1" />
          )}
          <span
            className={`text-xs ${
              isUp
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isUp ? '+' : ''}
            {change.toFixed(2)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            LYD/gram
          </span>
        </div>
      </Card>
    );
  };

  const TransactionIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'deposit':
        return <Download className="w-5 h-5 text-green-600" />;
      case 'purchase':
        return <Store className="w-5 h-5 text-red-600" />;
      case 'transfer_out':
        return <Send className="w-5 h-5 text-red-600" />;
      case 'transfer_in':
        return <Download className="w-5 h-5 text-green-600" />;
      default:
        return <ArrowRightLeft className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Welcome back,</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile?.first_name || 'User'}
          </h1>
        </div>
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-lg cursor-pointer border-2 border-yellow-500/50 hover:scale-105 transition"
          onClick={() => onNavigate('profile')}
        >
          {profile?.first_name?.charAt(0) || 'U'}
        </div>
      </header>

      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white" padding="lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="opacity-80 text-sm">Dar Safe - LYD Wallet</p>
              <p className="text-3xl font-bold tracking-wider mt-1">
                {dinarWallet ? formatCurrency(dinarWallet.balance, 'LYD') : 'LYD 0.00'}
              </p>
            </div>
            <Building2 size={32} className="opacity-50" />
          </div>
          <button
            onClick={() => onNavigate('profile', 'fund-dinar')}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Fund LYD Wallet
          </button>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white" padding="lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="opacity-80 text-sm">Dar Safe - USD Wallet</p>
              <p className="text-3xl font-bold tracking-wider mt-1">
                {dollarWallet ? formatCurrency(dollarWallet.balance, 'USD') : '$0.00'}
              </p>
            </div>
            <Building2 size={32} className="opacity-50" />
          </div>
          <button
            onClick={() => onNavigate('profile', 'fund-dollar')}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Fund USD Wallet
          </button>
        </Card>

        <Card className="bg-gradient-to-br from-amber-600 to-orange-600 text-white" padding="lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="opacity-80 text-sm">Digital Gold</p>
              <p className="text-3xl font-bold tracking-wider mt-1">
                {goldBalance ? formatGrams(goldBalance.grams) : '0.000g'}
              </p>
              <p className="text-sm opacity-80 mt-1">
                Silver: {silverBalance ? formatGrams(silverBalance.grams) : '0.000g'}
              </p>
            </div>
            <Coins size={32} className="opacity-50" />
          </div>
          <button
            onClick={() => onNavigate('market')}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Buy Digital Gold
          </button>
        </Card>

        <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white" padding="lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="opacity-80 text-sm">Physical Gold Bars</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold tracking-wider">
                  {physicalBars.length}
                </p>
                <span className="text-sm opacity-80">bars</span>
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <div>
                  <span className="opacity-80">In Dar Safe: </span>
                  <span className="font-semibold">{barsInStore}</span>
                </div>
                <div>
                  <span className="opacity-80">With You: </span>
                  <span className="font-semibold">{barsWithCustomer}</span>
                </div>
              </div>
            </div>
            <Vault size={32} className="opacity-50" />
          </div>
          <button
            onClick={() => onNavigate('market')}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Buy Physical Bars
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {goldPrice && (
          <PriceCard
            metal="Gold"
            price={goldPrice.price_lyd_per_gram}
            change={goldPrice.change_percent}
            color="amber"
          />
        )}
        {silverPrice && (
          <PriceCard
            metal="Silver"
            price={silverPrice.price_lyd_per_gram}
            change={silverPrice.change_percent}
            color="gray"
          />
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <QuickAction
            icon={ArrowRightLeft}
            label="Transfer"
            onClick={() => onNavigate('wallet', 'transfer')}
          />
          <QuickAction
            icon={PackageCheck}
            label="Pickup"
            onClick={() => onNavigate('wallet', 'appointments')}
          />
          <QuickAction
            icon={ScanLine}
            label="Scan"
            onClick={() => onNavigate('scan')}
          />
          <QuickAction
            icon={Store}
            label="Store"
            onClick={() => onNavigate('market')}
          />
        </div>
      </div>

      <Card className="bg-gray-800 dark:bg-gray-900 overflow-hidden relative">
        <div className="absolute -top-4 -right-8 w-24 h-24 bg-yellow-500/20 rounded-full"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-yellow-400">
            Welcome to Gold Trading
          </h3>
          <p className="mt-2 text-gray-300">
            Start investing in gold and silver with zero commission on digital purchases.
          </p>
          <button
            onClick={() => onNavigate('market')}
            className="mt-4 bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition"
          >
            Shop Now
          </button>
        </div>
      </Card>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Recent Transactions</h2>
          <button
            onClick={handleDownloadStatements}
            disabled={loadingStatements}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-md"
          >
            {loadingStatements ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Download Statements</span>
              </>
            )}
          </button>
        </div>
        {transactions.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No transactions yet
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isPositive = tx.type === 'deposit' || tx.type === 'transfer_in';
              return (
                <Card
                  key={tx.id}
                  className="flex items-center justify-between cursor-pointer"
                  padding="sm"
                  hover
                  onClick={() => handleTransactionClick(tx)}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-full mr-3 ${
                        isPositive
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      <TransactionIcon type={tx.type} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {tx.description || tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
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

      {showReceipt && receiptData && (
        <TransactionReceipt
          data={receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {showAllTransactions && (
        <StatementModal
          transactions={allTransactions}
          userName={`${profile?.first_name} ${profile?.last_name}`}
          onClose={() => setShowAllTransactions(false)}
        />
      )}
    </div>
  );
};
