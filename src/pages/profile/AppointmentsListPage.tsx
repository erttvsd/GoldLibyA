import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  ChevronLeft,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointment.service';
import { AppointmentDetailsModal } from '../../components/appointment/AppointmentDetailsModal';
import { Card, Button } from '../../components/ui';
import { formatDate } from '../../utils/format';
import type { PickupAppointment } from '../../types';

interface AppointmentsListPageProps {
  onNavigate: (page: string, subPage?: string) => void;
}

export const AppointmentsListPage = ({ onNavigate }: AppointmentsListPageProps) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<PickupAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<PickupAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<PickupAppointment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user?.id]);

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(appointments.filter(apt => apt.status === filterStatus));
    }
  }, [filterStatus, appointments]);

  const loadAppointments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await appointmentService.getAppointments(user.id);
      setAppointments(data);
      setFilteredAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          borderColor: 'border-green-300 dark:border-green-700'
        };
      case 'confirmed':
        return {
          icon: CheckCircle,
          label: 'Confirmed',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          borderColor: 'border-blue-300 dark:border-blue-700'
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-300 dark:border-yellow-700'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Cancelled',
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          borderColor: 'border-red-300 dark:border-red-700'
        };
      case 'no_show':
        return {
          icon: AlertCircle,
          label: 'No Show',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          borderColor: 'border-orange-300 dark:border-orange-700'
        };
      default:
        return {
          icon: Clock,
          label: status,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          borderColor: 'border-gray-300 dark:border-gray-700'
        };
    }
  };

  const getAppointmentCounts = () => {
    return {
      all: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      no_show: appointments.filter(a => a.status === 'no_show').length,
    };
  };

  const counts = getAppointmentCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-yellow-600" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white p-6 pb-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => onNavigate('profile')}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-grow text-center text-2xl font-bold pr-10">My Appointments</h1>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-3xl font-bold">{counts.all}</p>
              <p className="text-sm opacity-90">Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{counts.completed}</p>
              <p className="text-sm opacity-90">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 -mt-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <FilterButton
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
            label="All"
            count={counts.all}
          />
          <FilterButton
            active={filterStatus === 'pending'}
            onClick={() => setFilterStatus('pending')}
            label="Pending"
            count={counts.pending}
            color="yellow"
          />
          <FilterButton
            active={filterStatus === 'confirmed'}
            onClick={() => setFilterStatus('confirmed')}
            label="Confirmed"
            count={counts.confirmed}
            color="blue"
          />
          <FilterButton
            active={filterStatus === 'completed'}
            onClick={() => setFilterStatus('completed')}
            label="Completed"
            count={counts.completed}
            color="green"
          />
          <FilterButton
            active={filterStatus === 'cancelled'}
            onClick={() => setFilterStatus('cancelled')}
            label="Cancelled"
            count={counts.cancelled}
            color="red"
          />
          <FilterButton
            active={filterStatus === 'no_show'}
            onClick={() => setFilterStatus('no_show')}
            label="No Show"
            count={counts.no_show}
            color="orange"
          />
        </div>

        {filteredAppointments.length === 0 ? (
          <Card className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Appointments Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filterStatus === 'all'
                ? "You haven't scheduled any appointments yet."
                : `No ${filterStatus} appointments found.`}
            </p>
            <Button onClick={() => onNavigate('wallet')}>
              Go to Wallet
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onClick={() => setSelectedAppointment(appointment)}
                statusConfig={getStatusConfig(appointment.status)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={loadAppointments}
        />
      )}
    </div>
  );
};

const FilterButton = ({
  active,
  onClick,
  label,
  count,
  color = 'gray'
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) => {
  const colorClasses = {
    gray: active ? 'bg-gray-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    yellow: active ? 'bg-yellow-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    blue: active ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    green: active ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    red: active ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    orange: active ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2
        transition-all duration-200 shadow-sm
        ${colorClasses[color as keyof typeof colorClasses]}
      `}
    >
      {label}
      <span className={`
        px-2 py-0.5 rounded-full text-xs font-bold
        ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}
      `}>
        {count}
      </span>
    </button>
  );
};

const AppointmentCard = ({
  appointment,
  onClick,
  statusConfig
}: {
  appointment: PickupAppointment;
  onClick: () => void;
  statusConfig: ReturnType<typeof getStatusConfig>;
}) => {
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className={`cursor-pointer border-l-4 ${statusConfig.borderColor}`}
      hover
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusConfig.bgColor} ${statusConfig.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              {appointment.appointment_number}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{formatDate(appointment.appointment_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{appointment.appointment_time}</span>
          </div>
        </div>

        {appointment.location && (
          <div className="flex items-start gap-2 text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-600 dark:text-gray-400 line-clamp-1">
              {appointment.location.name}
            </span>
          </div>
        )}

        {appointment.asset && (
          <div className="flex items-start gap-2 text-sm bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
            <Package className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow min-w-0">
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                {appointment.asset.weight}g {appointment.asset.carat}K Gold Bar
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 font-mono truncate">
                {appointment.asset.serial_number}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
