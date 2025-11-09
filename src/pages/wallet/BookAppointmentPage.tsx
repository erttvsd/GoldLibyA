import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { assetService } from '../../services/asset.service';
import { appointmentService } from '../../services/appointment.service';
import { locationService, type CashDepositLocation } from '../../services/location.service';
import { Button, Card } from '../../components/ui';
import { OwnedAsset } from '../../types';

interface BookAppointmentPageProps {
  assetId?: string;
  fromConversion?: boolean;
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onBack: () => void;
}

export const BookAppointmentPage = ({
  assetId,
  fromConversion,
  onNavigate,
  onBack,
}: BookAppointmentPageProps) => {
  const { user } = useAuth();
  const [asset, setAsset] = useState<OwnedAsset | null>(null);
  const [location, setLocation] = useState<CashDepositLocation | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [appointmentNumber, setAppointmentNumber] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (assetId && !fromConversion) {
      loadAssetAndLocation();
    }
  }, [assetId]);

  const loadAssetAndLocation = async () => {
    try {
      setLoadingData(true);
      const assets = await assetService.getUserAssets(user!.id);
      const found = assets.find((a) => a.id === assetId);

      if (!found) {
        setError('Asset not found');
        setLoadingData(false);
        return;
      }

      setAsset(found);

      if (found.pickup_store_id && found.store?.pickup_location) {
        setLocation(found.store.pickup_location);
      } else if (found.pickup_store_id && found.store?.location_id) {
        const locations = await locationService.getAllLocations();
        const assetLocation = locations.find(loc => loc.id === found.store.location_id);
        if (assetLocation) {
          setLocation(assetLocation);
        } else {
          setError('Pickup location not found for this store');
        }
      } else if (found.pickup_store_id) {
        setError('This store does not have a pickup location assigned');
      } else {
        setError('This asset does not have an assigned pickup store');
      }
    } catch (err) {
      console.error('Failed to load asset:', err);
      setError('Failed to load asset information');
    } finally {
      setLoadingData(false);
    }
  };

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  const availableTimes = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
  ];

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select date and time');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!assetId) {
      setError('No asset selected');
      return;
    }

    if (!location?.id) {
      setError('No pickup location assigned to this asset');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const appointment = await appointmentService.createAppointment({
        userId: user.id,
        assetId: assetId,
        locationId: location.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
      });

      setAppointmentNumber(appointment.appointment_number);
      setSuccess(true);
    } catch (err: any) {
      console.error('Failed to create appointment:', err);
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 space-y-6 animate-fade-in">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold">Appointment Confirmed!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your pickup appointment has been successfully booked.
          </p>

          <Card className="bg-gray-50 dark:bg-gray-800 text-left">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Appointment Number</p>
                <p className="font-mono text-lg font-bold text-yellow-600">{appointmentNumber}</p>
              </div>
              {asset && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Asset</p>
                    <p className="font-semibold">{asset.product?.name}</p>
                  </div>
                </>
              )}
              {location && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pickup Location</p>
                  <p className="font-semibold">{location.name}</p>
                  <p className="text-xs text-gray-500">{location.address}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                <p className="font-semibold">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at {selectedTime}
                </p>
              </div>
            </div>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
            <h3 className="font-bold mb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              What to Bring
            </h3>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Valid government-issued ID</li>
              <li>• Appointment Number: {appointmentNumber}</li>
              <li>• Screenshot of QR code (available in My Appointments)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => onNavigate('profile', 'appointments')}
              variant="primary"
              size="lg"
              fullWidth
            >
              View My Appointments
            </Button>
            <Button onClick={onBack} variant="outline" size="lg" fullWidth>
              Back to Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Book Appointment</h1>
      </div>

      {asset && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Asset</span>
              <span className="font-semibold">{asset.product?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Serial Number</span>
              <span className="font-semibold font-mono text-xs">{asset.serial_number}</span>
            </div>
          </div>
        </Card>
      )}

      {location && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Pickup Location
              </h3>
              <p className="font-semibold text-sm">{location.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{location.address}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {location.working_hours} • {location.working_days}
              </p>
              {location.phone && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  📞 {location.phone}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Select Date
        </label>
        <div className="grid grid-cols-3 gap-2">
          {generateAvailableDates().map((date) => {
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`p-3 rounded-lg border-2 text-center transition ${
                  selectedDate === date
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-300 dark:border-gray-700 hover:border-yellow-300'
                }`}
              >
                <p className="text-xs text-gray-600 dark:text-gray-400">{dayName}</p>
                <p className="text-lg font-bold">{dayNum}</p>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Select Time
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableTimes.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`p-3 rounded-lg border-2 font-semibold transition ${
                  selectedTime === time
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-300 dark:border-gray-700 hover:border-yellow-300'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={!selectedDate || !selectedTime || !location || loadingData}
        icon={Calendar}
      >
        Confirm Appointment
      </Button>
    </div>
  );
};
