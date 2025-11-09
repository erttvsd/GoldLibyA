import { useState } from 'react';
import {
  User,
  FileText,
  Wallet,
  HelpCircle,
  MessageCircle,
  Settings,
  ChevronRight,
  LogOut,
  Camera,
  Receipt,
  Calendar,
  Store,
  Package,
  QrCode,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from '../components/ui';

interface ProfilePageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
}

export const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const { profile, signOut } = useAuth();

  const isStoreAccount = profile?.account_type === 'store';

  const storeMenuItems = [
    {
      id: 'store-dashboard',
      label: 'Store Dashboard',
      description: 'Overview of store operations',
      icon: Store,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      onClick: () => onNavigate('profile', 'store-dashboard'),
    },
    {
      id: 'store-appointments',
      label: 'Manage Appointments',
      description: 'View and process customer pickups',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      onClick: () => onNavigate('profile', 'store-appointments'),
    },
    {
      id: 'store-pickup',
      label: 'Process Pickup',
      description: 'Scan QR code and verify customer ID',
      icon: QrCode,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      onClick: () => onNavigate('profile', 'store-pickup'),
    },
    {
      id: 'store-inventory',
      label: 'Inventory Management',
      description: 'Manage gold and silver stock',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      onClick: () => onNavigate('profile', 'store-inventory'),
    },
    {
      id: 'store-payments',
      label: 'Payments & Transfers',
      description: 'Send LYD/USD to customers',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      onClick: () => onNavigate('profile', 'store-payments'),
    },
    {
      id: 'store-reports',
      label: 'Reports & Analytics',
      description: 'View transaction history',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      onClick: () => onNavigate('profile', 'store-reports'),
    },
  ];

  const menuItems = [
    {
      id: 'appointments',
      label: 'My Appointments',
      description: 'View all pickup appointments and QR codes',
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      onClick: () => onNavigate('profile', 'appointments'),
    },
    {
      id: 'statements',
      label: 'Statements',
      description: 'View and download transaction statements',
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      onClick: () => onNavigate('profile', 'statements'),
    },
    {
      id: 'kyc',
      label: isStoreAccount ? 'Business KYC' : 'KYC Information',
      description: isStoreAccount ? 'Complete business verification' : 'View your verification details',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      onClick: () => onNavigate('profile', isStoreAccount ? 'store-kyc' : 'kyc'),
    },
    {
      id: 'fund',
      label: 'Fund Wallets',
      description: 'Add money to your account',
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      onClick: () => onNavigate('profile', 'fund'),
    },
    {
      id: 'faq',
      label: 'How to Use',
      description: 'Frequently asked questions',
      icon: HelpCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      onClick: () => onNavigate('profile', 'faq'),
    },
    {
      id: 'contact',
      label: 'Contact Us',
      description: 'Get help from support',
      icon: MessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      onClick: () => onNavigate('profile', 'contact'),
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Manage your preferences',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      onClick: () => onNavigate('profile', 'settings'),
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <h1 className="text-center text-2xl font-bold">Profile</h1>

      <Card className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Camera className="w-4 h-4 text-yellow-600" />
            </button>
          </div>
          <div className="flex-grow">
            <h2 className="text-xl font-bold">
              {profile?.first_name} {profile?.last_name}
            </h2>
            {profile?.email && (
              <p className="text-sm opacity-90">{profile.email}</p>
            )}
            {profile?.phone && (
              <p className="text-sm opacity-90">{profile.phone}</p>
            )}
            {profile?.national_id && (
              <p className="text-xs opacity-75 mt-1">ID: {profile.national_id}</p>
            )}
          </div>
        </div>
      </Card>

      {isStoreAccount && (
        <>
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <Store className="w-5 h-5 text-yellow-600" />
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                Store Account
              </p>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Manage your store operations and customer services
            </p>
          </div>

          <div className="space-y-3">
            {storeMenuItems.map((item) => (
              <MenuItem key={item.id} {...item} />
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
        </>
      )}

      <div className="space-y-3">
        {menuItems.map((item) => (
          <MenuItem key={item.id} {...item} />
        ))}
      </div>

      <Button
        onClick={handleSignOut}
        variant="outline"
        size="lg"
        fullWidth
        icon={LogOut}
        className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        Sign Out
      </Button>

      <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
        <p>Gold Trading App v1.0.0</p>
        <p className="mt-1">© 2025 All rights reserved</p>
      </div>
    </div>
  );
};

const MenuItem = ({
  label,
  description,
  icon: Icon,
  color,
  bgColor,
  onClick,
}: {
  label: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  onClick: () => void;
}) => (
  <Card className="cursor-pointer" hover onClick={onClick}>
    <div className="flex items-center space-x-4">
      <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="flex-grow">
        <h3 className="font-semibold">{label}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </div>
  </Card>
);
