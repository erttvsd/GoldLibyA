import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, User, Package, MapPin, Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { BarDetailModal } from '../../components/store/BarDetailModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatTime } from '../../utils/format';

interface StoreAppointmentsPageProps {
  onBack: () => void;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  assets: {
    serial_number: string;
    metal_type: string;
    weight: number;
  }[];
}

export const StoreAppointmentsPage = ({ onBack }: StoreAppointmentsPageProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('today');
  const [selectedBar, setSelectedBar] = useState<any>(null);
  const [showBarModal, setShowBarModal] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [user, filter]);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      const { data: storeProfile } = await supabase
        .from('store_profiles')
        .select('location_id, store_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!storeProfile) return;

      let query = supabase
        .from('pickup_appointments')
        .select(`
          *,
          profiles!pickup_appointments_user_id_fkey(first_name, last_name, phone, email, national_id),
          owned_assets(
            id,
            serial_number,
            status,
            product_id,
            products(name, type, carat, weight_grams, base_price_lyd)
          )
        `)
        .eq('location_id', storeProfile.location_id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        query = query
          .gte('appointment_date', today.toISOString())
          .lt('appointment_date', tomorrow.toISOString());
      } else if (filter === 'upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query
          .gte('appointment_date', today.toISOString())
          .eq('status', 'scheduled');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data } = await query;

      if (data) {
        const formatted = data.map((apt: any) => ({
          id: apt.id,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          status: apt.status,
          customer_name: `${apt.profiles?.first_name || ''} ${apt.profiles?.last_name || ''}`.trim(),
          customer_phone: apt.profiles?.phone || '',
          notes: apt.notes || '',
          assets: apt.owned_assets || [],
        }));

        setAppointments(formatted);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await supabase
        .from('pickup_appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleViewBarDetails = async (assetId: string) => {
    try {
      const { data: asset } = await supabase
        .from('owned_assets')
        .select(`
          *,
          products(*),
          profiles!owned_assets_user_id_fkey(first_name, last_name, email, phone, national_id)
        `)
        .eq('id', assetId)
        .maybeSingle();

      if (asset) {
        setSelectedBar({
          serial_number: asset.serial_number,
          product: asset.products,
          status: asset.status,
          owner: asset.profiles,
          current_location: 'Store - دار السكة',
          qr_code_url: asset.qr_code_url,
        });
        setShowBarModal(true);
      }
    } catch (error) {
      console.error('Error loading bar details:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft} className="mb-4">
          Back
        </Button>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Manage Appointments</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View and process customer pickup appointments
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['today', 'upcoming', 'completed', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              filter === f
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {appointments.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No appointments found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id} className="hover:shadow-lg transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{apt.customer_name}</p>
                      <p className="text-sm text-gray-500">{apt.customer_phone}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      apt.status === 'scheduled'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : apt.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(apt.appointment_date)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{apt.appointment_time}</span>
                  </div>
                </div>

                {apt.assets.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Items to pickup:</span>
                    </div>
                    <div className="space-y-2">
                      {apt.assets.map((asset: any, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            • {asset.products?.name || 'Bar'} - SN: {asset.serial_number}
                          </p>
                          <button
                            onClick={() => handleViewBarDetails(asset.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          >
                            <Info className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {apt.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    Note: {apt.notes}
                  </p>
                )}

                {apt.status === 'scheduled' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={CheckCircle}
                      onClick={() => handleStatusUpdate(apt.id, 'completed')}
                      className="flex-1"
                    >
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={XCircle}
                      onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <BarDetailModal
        isOpen={showBarModal}
        onClose={() => setShowBarModal(false)}
        barData={selectedBar}
      />
    </div>
  );
};
