import { useEffect, useState } from 'react';
import {
  Wallet as WalletIcon,
  Package,
  CheckCircle,
  Calendar,
  Send,
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft,
  QrCode,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { walletService } from '../services/wallet.service';
import { assetService } from '../services/asset.service';
import { appointmentService, PickupAppointment } from '../services/appointment.service';
import { Card, Button } from '../components/ui';
import {
  DigitalOptionsModal,
  BullionDetailsModal,
  ChangeLocationModal,
  HandoverTransferModal,
  FiatOptionsModal
} from '../components/wallet/WalletModals';
import { AppointmentDetailsModal } from '../components/appointment/AppointmentDetailsModal';
import { ContactSupplierModal } from '../components/wallet/ContactSupplierModal';
import { Wallet, DigitalBalance, OwnedAsset } from '../types';
import { formatCurrency, formatGrams, formatDate } from '../utils/format';

interface WalletPageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  subPage?: string;
  subPageProps?: any;
}

export const WalletPage = ({ onNavigate, subPage, subPageProps }: WalletPageProps) => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [digitalBalances, setDigitalBalances] = useState<DigitalBalance[]>([]);
  const [assets, setAssets] = useState<OwnedAsset[]>([]);
  const [appointments, setAppointments] = useState<PickupAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDigital, setSelectedDigital] = useState<DigitalBalance | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<OwnedAsset | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<PickupAppointment | null>(null);
  const [showDigitalModal, setShowDigitalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChangeLocationModal, setShowChangeLocationModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showFiatModal, setShowFiatModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useState<'LYD' | 'USD'>('LYD');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletsData, digitalData, assetsData, appointmentsData] = await Promise.all([
        walletService.getWallets(user!.id),
        walletService.getDigitalBalances(user!.id),
        assetService.getUserAssets(user!.id),
        appointmentService.getAppointments(user!.id),
      ]);

      setWallets(walletsData);
      setDigitalBalances(digitalData);
      setAssets(assetsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDigitalClick = (balance: DigitalBalance) => {
    setSelectedDigital(balance);
    setShowDigitalModal(true);
  };

  const handleFiatClick = (currency: 'LYD' | 'USD') => {
    setSelectedFiatCurrency(currency);
    setShowFiatModal(true);
  };

  const handleAssetDetails = (asset: OwnedAsset) => {
    setSelectedAsset(asset);
    setShowDetailsModal(true);
  };

  const handleViewAppointment = async (assetId: string) => {
    try {
      const appointment = await appointmentService.getAppointmentByAssetId(assetId);
      if (appointment) {
        setSelectedAppointment(appointment);
        setShowAppointmentModal(true);
      }
    } catch (error) {
      console.error('Failed to load appointment:', error);
    }
  };

  const getAssetAppointment = (assetId: string): PickupAppointment | undefined => {
    return appointments.find(apt => apt.asset_id === assetId && apt.status !== 'completed' && apt.status !== 'cancelled');
  };

  const handleChangeLocation = (asset: OwnedAsset) => {
    setSelectedAsset(asset);
    setShowChangeLocationModal(true);
  };

  const handleHandoverTransfer = (asset: OwnedAsset) => {
    setSelectedAsset(asset);
    setShowHandoverModal(true);
  };

  const handleContactSupplier = (asset: OwnedAsset) => {
    setSelectedAsset(asset);
    setShowContactModal(true);
  };

  const calculateOverdueFees = (deadline: string): { isOverdue: boolean; daysOverdue: number; fees: number } => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = now.getTime() - deadlineDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { isOverdue: false, daysOverdue: 0, fees: 0 };
    }

    return {
      isOverdue: true,
      daysOverdue: diffDays,
      fees: diffDays * 30
    };
  };

  const lydWallet = wallets.find((w) => w.currency === 'LYD');
  const usdWallet = wallets.find((w) => w.currency === 'USD');
  const goldBalance = digitalBalances.find((b) => b.metal_type === 'gold');
  const silverBalance = digitalBalances.find((b) => b.metal_type === 'silver');

  const awaitingPickup = assets.filter((a) => a.status === 'not_received');
  const received = assets.filter((a) => a.status === 'received');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <h1 className="text-center text-2xl font-bold">Wallet</h1>

      <div>
        <h2 className="text-lg font-bold mb-3">Fiat Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BalanceCard
            title="Libyan Dinar"
            balance={lydWallet?.balance || 0}
            currency="LYD"
            color="green"
            onClick={() => handleFiatClick('LYD')}
          />
          <BalanceCard
            title="US Dollar"
            balance={usdWallet?.balance || 0}
            currency="USD"
            color="blue"
            onClick={() => handleFiatClick('USD')}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Digital Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DigitalBalanceCard
            title="Digital Gold"
            balance={goldBalance?.grams || 0}
            color="yellow"
            onClick={() => goldBalance && handleDigitalClick(goldBalance)}
          />
          <DigitalBalanceCard
            title="Digital Silver"
            balance={silverBalance?.grams || 0}
            color="gray"
            onClick={() => silverBalance && handleDigitalClick(silverBalance)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          onClick={() => onNavigate('wallet', 'myBars')}
          variant="outline"
          size="md"
          fullWidth
          icon={Package}
        >
          My Bars
        </Button>
        <Button
          onClick={() => onNavigate('wallet', 'digitalTransfer')}
          variant="outline"
          size="md"
          fullWidth
          icon={Send}
        >
          Transfer Digital
        </Button>
        <Button
          onClick={() => onNavigate('wallet', 'transferBalance')}
          variant="outline"
          size="md"
          fullWidth
          icon={ArrowRightLeft}
        >
          Transfer Wallet
        </Button>
        <Button
          onClick={() => onNavigate('wallet', 'receivePhysical')}
          variant="outline"
          size="md"
          fullWidth
          icon={Package}
        >
          Receive Physical
        </Button>
        <Button
          onClick={() => onNavigate('market')}
          variant="primary"
          size="md"
          fullWidth
          icon={TrendingUp}
        >
          Buy Digital
        </Button>
      </div>

      {awaitingPickup.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Bars Awaiting Pickup ({awaitingPickup.length})
          </h2>
          <div className="space-y-3">
            {awaitingPickup.map((asset) => {
              const overdueInfo = asset.pickup_deadline
                ? calculateOverdueFees(asset.pickup_deadline)
                : { isOverdue: false, daysOverdue: 0, fees: 0 };

              const appointment = getAssetAppointment(asset.id);
              return (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  appointment={appointment}
                  overdueInfo={overdueInfo}
                  onDetails={() => handleAssetDetails(asset)}
                  onBookAppointment={() => onNavigate('wallet', 'bookAppointment', { assetId: asset.id })}
                  onViewAppointment={() => handleViewAppointment(asset.id)}
                  onTransfer={() => onNavigate('wallet', 'transferOwnership', { assetId: asset.id })}
                  onChangeLocation={() => handleChangeLocation(asset)}
                  onContactSupplier={() => handleContactSupplier(asset)}
                />
              );
            })}
          </div>
        </div>
      )}

      {received.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Bars Received ({received.length})
          </h2>
          <div className="space-y-3">
            {received.map((asset) => (
              <ReceivedAssetCard
                key={asset.id}
                asset={asset}
                onDetails={() => handleAssetDetails(asset)}
                onHandover={() => handleHandoverTransfer(asset)}
              />
            ))}
          </div>
        </div>
      )}

      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Smart Investment Advisor</h3>
            <p className="text-sm opacity-90">Get personalized portfolio recommendations</p>
          </div>
          <Button
            onClick={() => onNavigate('wallet', 'planner')}
            variant="outline"
            size="sm"
            className="bg-white text-blue-600 hover:bg-gray-100 border-white"
          >
            Start Planning
          </Button>
        </div>
      </Card>

      {showDigitalModal && selectedDigital && (
        <DigitalOptionsModal
          balance={selectedDigital}
          onClose={() => {
            setShowDigitalModal(false);
            setSelectedDigital(null);
          }}
          onTransfer={() => {
            setShowDigitalModal(false);
            onNavigate('wallet', 'digitalTransfer');
          }}
          onReceivePhysical={() => {
            setShowDigitalModal(false);
            onNavigate('wallet', 'receivePhysical');
          }}
          onBuyMore={() => {
            setShowDigitalModal(false);
            onNavigate('market');
          }}
        />
      )}

      {showDetailsModal && selectedAsset && (
        <BullionDetailsModal
          asset={selectedAsset}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAsset(null);
          }}
        />
      )}

      {showChangeLocationModal && selectedAsset && (
        <ChangeLocationModal
          asset={selectedAsset}
          onClose={() => {
            setShowChangeLocationModal(false);
            setSelectedAsset(null);
          }}
          onSuccess={() => {
            setShowChangeLocationModal(false);
            setSelectedAsset(null);
            loadData();
          }}
        />
      )}

      {showHandoverModal && selectedAsset && (
        <HandoverTransferModal
          asset={selectedAsset}
          onClose={() => {
            setShowHandoverModal(false);
            setSelectedAsset(null);
          }}
          onSuccess={() => {
            setShowHandoverModal(false);
            setSelectedAsset(null);
            loadData();
          }}
        />
      )}

      {showFiatModal && (
        <FiatOptionsModal
          currency={selectedFiatCurrency}
          balance={selectedFiatCurrency === 'LYD' ? lydWallet?.balance || 0 : usdWallet?.balance || 0}
          onClose={() => setShowFiatModal(false)}
          onFund={() => {
            setShowFiatModal(false);
            if (selectedFiatCurrency === 'LYD') {
              onNavigate('profile', 'fundDinarWallet');
            } else {
              onNavigate('profile', 'fundDollarWallet');
            }
          }}
          onWithdraw={() => {
            setShowFiatModal(false);
            if (selectedFiatCurrency === 'LYD') {
              onNavigate('profile', 'withdrawDinar');
            } else {
              onNavigate('profile', 'withdrawDollar');
            }
          }}
        />
      )}

      {showAppointmentModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedAppointment(null);
          }}
          onCancel={async () => {
            if (selectedAppointment) {
              try {
                await appointmentService.cancelAppointment(selectedAppointment.id, 'Cancelled by user');
                setShowAppointmentModal(false);
                setSelectedAppointment(null);
                await loadData();
              } catch (error) {
                console.error('Failed to cancel appointment:', error);
              }
            }
          }}
        />
      )}

      {showContactModal && selectedAsset && (
        <ContactSupplierModal
          asset={selectedAsset}
          onClose={() => {
            setShowContactModal(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
};

const BalanceCard = ({ title, balance, currency, color, onClick }: any) => (
  <Card
    className={`cursor-pointer bg-gradient-to-br ${
      color === 'green' ? 'from-green-500 to-green-600' : 'from-blue-500 to-blue-600'
    } text-white hover:opacity-90 transition`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm opacity-80">{title}</span>
      <WalletIcon className="w-5 h-5 opacity-80" />
    </div>
    <p className="text-2xl font-bold">{formatCurrency(balance, currency)}</p>
    <p className="text-xs opacity-80 mt-2">Tap for options</p>
  </Card>
);

const DigitalBalanceCard = ({ title, balance, color, onClick }: any) => (
  <Card
    className={`cursor-pointer ${
      color === 'yellow'
        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500'
        : 'bg-gradient-to-br from-gray-400 to-gray-500'
    } text-white hover:opacity-90 transition`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm opacity-80">{title}</span>
      <QrCode className="w-5 h-5 opacity-80" />
    </div>
    <p className="text-2xl font-bold">{formatGrams(balance)}</p>
    <p className="text-xs opacity-80 mt-2">Tap for options</p>
  </Card>
);

const AssetCard = ({ asset, appointment, overdueInfo, onDetails, onBookAppointment, onViewAppointment, onTransfer, onChangeLocation, onContactSupplier }: any) => (
  <Card>
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
        <Package className="w-8 h-8 text-yellow-600" />
      </div>
      <div className="flex-grow">
        <h3 className="font-bold">{asset.product?.name || 'Gold Bar'}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {asset.product?.weight_grams}g • SN: {asset.serial_number}
        </p>
        {asset.store && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Pickup: {asset.store.name}, {asset.store.city}
          </p>
        )}

        {appointment && (
          <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
            <div className="flex items-center space-x-1 text-blue-700 dark:text-blue-300">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Appointment Scheduled</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {formatDate(appointment.appointment_date)} at {appointment.appointment_time}
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
              #{appointment.appointment_number}
            </p>
          </div>
        )}

        {!appointment && asset.pickup_deadline && (
          <div className="mt-2">
            {overdueInfo.isOverdue ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    Overdue: {overdueInfo.daysOverdue} days
                  </span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Storage fees: {formatCurrency(overdueInfo.fees, 'LYD')}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Pickup by: {formatDate(asset.pickup_deadline)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <Button onClick={onContactSupplier} size="sm" variant="primary" icon={MessageCircle}>
            Contact Supplier
          </Button>
          {appointment ? (
            <Button onClick={onViewAppointment} size="sm" variant="outline" icon={QrCode}>
              View Appointment
            </Button>
          ) : (
            <Button onClick={onBookAppointment} size="sm" variant="outline" icon={Calendar}>
              Book Appointment
            </Button>
          )}
          <Button onClick={onTransfer} size="sm" variant="outline" icon={Send}>
            Transfer
          </Button>
          <Button onClick={onChangeLocation} size="sm" variant="outline" icon={ArrowRightLeft}>
            Change Location
          </Button>
          <Button onClick={onDetails} size="sm" variant="outline">
            Details
          </Button>
        </div>
      </div>
    </div>
  </Card>
);

const ReceivedAssetCard = ({ asset, onDetails, onHandover }: any) => (
  <Card>
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <div className="flex-grow">
        <h3 className="font-bold">{asset.product?.name || 'Gold Bar'}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {asset.product?.weight_grams}g • SN: {asset.serial_number}
        </p>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          ✓ In your possession
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button onClick={onHandover} size="sm" variant="outline" icon={Send}>
            Register Handover
          </Button>
          <Button onClick={onDetails} size="sm" variant="outline">
            Details
          </Button>
        </div>
      </div>
    </div>
  </Card>
);
