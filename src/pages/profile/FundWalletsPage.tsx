import { ArrowLeft, Wallet } from 'lucide-react';
import { Card } from '../../components/ui';

interface FundWalletsPageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onBack: () => void;
}

export const FundWalletsPage = ({ onNavigate, onBack }: FundWalletsPageProps) => {
  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Fund Wallets</h1>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        Choose which wallet you'd like to fund
      </p>

      <div className="space-y-3">
        <Card
          className="cursor-pointer bg-gradient-to-br from-green-500 to-green-600 text-white"
          hover
          onClick={() => onNavigate('profile', 'fundDinar')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">Libyan Dinar</h3>
              <p className="text-sm opacity-90">Add LYD to your account</p>
            </div>
            <Wallet className="w-12 h-12 opacity-80" />
          </div>
        </Card>

        <Card
          className="cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          hover
          onClick={() => onNavigate('profile', 'fundDollar')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">US Dollar</h3>
              <p className="text-sm opacity-90">Add USD to your account</p>
            </div>
            <Wallet className="w-12 h-12 opacity-80" />
          </div>
        </Card>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> All deposits are processed securely. Processing times may vary depending on your payment method.
        </p>
      </div>
    </div>
  );
};
