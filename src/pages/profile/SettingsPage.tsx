import { useState } from 'react';
import { ArrowLeft, Bell, Moon, Globe, Shield, Lock, Eye, Fingerprint } from 'lucide-react';
import { Card } from '../../components/ui';

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoLogout, setAutoLogout] = useState(true);

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications
        </h2>
        <Card>
          <div className="space-y-4">
            <ToggleRow
              label="Push Notifications"
              description="Receive app notifications"
              checked={notificationEnabled}
              onChange={setNotificationEnabled}
            />
            <ToggleRow
              label="Price Alerts"
              description="Get notified of significant price changes"
              checked={priceAlerts}
              onChange={setPriceAlerts}
            />
            <ToggleRow
              label="Transaction Alerts"
              description="Notifications for all transactions"
              checked={transactionAlerts}
              onChange={setTransactionAlerts}
            />
            <ToggleRow
              label="Marketing Emails"
              description="Receive promotional offers and news"
              checked={marketingEmails}
              onChange={setMarketingEmails}
            />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center">
          <Moon className="w-5 h-5 mr-2" />
          Appearance
        </h2>
        <Card>
          <ToggleRow
            label="Dark Mode"
            description="Use dark theme throughout the app"
            checked={darkMode}
            onChange={setDarkMode}
          />
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Language & Region
        </h2>
        <Card>
          <div>
            <label className="block text-sm font-medium mb-2">App Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="fr">Français (French)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              App will restart to apply language changes
            </p>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Security
        </h2>
        <Card>
          <div className="space-y-4">
            <ToggleRow
              label="Two-Factor Authentication"
              description="Require SMS code for sensitive actions"
              checked={twoFactorAuth}
              onChange={setTwoFactorAuth}
              icon={Lock}
            />
            <ToggleRow
              label="Biometric Authentication"
              description="Use fingerprint or face ID"
              checked={biometricAuth}
              onChange={setBiometricAuth}
              icon={Fingerprint}
            />
            <ToggleRow
              label="Auto-Logout"
              description="Automatically logout after 15 minutes"
              checked={autoLogout}
              onChange={setAutoLogout}
              icon={Eye}
            />
          </div>
        </Card>
      </div>

      <Card>
        <button
          className="w-full text-left text-blue-600 dark:text-blue-400 font-semibold"
          onClick={() => alert('Change password functionality coming soon')}
        >
          Change Password
        </button>
      </Card>

      <Card>
        <button
          className="w-full text-left text-red-600 dark:text-red-400 font-semibold"
          onClick={() => alert('Delete account functionality coming soon')}
        >
          Delete Account
        </button>
      </Card>

      <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
        <p>Settings are saved automatically</p>
      </div>
    </div>
  );
};

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: any;
}) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <div className="flex items-start space-x-3 flex-grow">
      {Icon && <Icon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />}
      <div className="flex-grow">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer ml-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
    </label>
  </div>
);
