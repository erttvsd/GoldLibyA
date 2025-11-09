import { Store, User } from 'lucide-react';
import { Card, Button } from '../components/ui';

interface AccountTypeSelectionPageProps {
  onSelectType: (type: 'individual' | 'store') => void;
  onBack: () => void;
}

export const AccountTypeSelectionPage = ({ onSelectType, onBack }: AccountTypeSelectionPageProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
      <div className="max-w-md mx-auto bg-white dark:bg-black/50 min-h-screen shadow-2xl relative">
        <div className="p-8 flex flex-col justify-center min-h-screen animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Choose Account Type</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Select the type of account you want to create
            </p>
          </div>

          <div className="space-y-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-yellow-500"
              onClick={() => onSelectType('individual')}
            >
              <div className="flex items-start space-x-4 p-4">
                <div className="flex-shrink-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold mb-2">Individual Account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    For personal gold and silver trading, investments, and digital assets management.
                  </p>
                  <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                    <li>• Buy and sell gold & silver</li>
                    <li>• Digital asset management</li>
                    <li>• Book pickup appointments</li>
                    <li>• Transfer ownership</li>
                    <li>• Investment planning</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-yellow-500"
              onClick={() => onSelectType('store')}
            >
              <div className="flex items-start space-x-4 p-4">
                <div className="flex-shrink-0 w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <Store className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold mb-2">Store Account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    For businesses and stores to manage inventory, appointments, and customer transactions.
                  </p>
                  <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                    <li>• Manage inventory & products</li>
                    <li>• Process customer pickups</li>
                    <li>• Scan QR codes & verify ID</li>
                    <li>• Manage appointments</li>
                    <li>• Send/receive payments</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onBack}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
