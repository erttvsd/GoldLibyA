import { X, Calendar, Clock, MapPin, Package, Shield, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PickupAppointment } from '../../services/appointment.service';
import { Button, Card } from '../ui';
import { formatDate } from '../../utils/format';

interface AppointmentDetailsModalProps {
  appointment: PickupAppointment;
  onClose: () => void;
  onCancel?: () => void;
}

export const AppointmentDetailsModal = ({ appointment, onClose, onCancel }: AppointmentDetailsModalProps) => {
  const asset = appointment.asset;
  const location = appointment.location;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'completed':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('appointment-qr') as HTMLCanvasElement;
    if (canvas) {
      const svg = canvas.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `appointment-${appointment.appointment_number}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Appointment Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`flex items-center justify-between p-4 rounded-lg ${getStatusColor(appointment.status)}`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon(appointment.status)}
              <span className="font-semibold capitalize">{appointment.status}</span>
            </div>
            <span className="text-sm font-mono">{appointment.appointment_number}</span>
          </div>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                Scan QR Code at Pickup
              </h3>
              <div id="appointment-qr" className="bg-white p-4 rounded-lg inline-block">
                <QRCodeSVG
                  value={appointment.qr_code_data}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  <p className="font-mono text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {appointment.verification_pin}
                  </p>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Verification PIN - Show this to staff
                </p>
              </div>
              <Button
                onClick={handleDownloadQR}
                variant="outline"
                size="sm"
                icon={Download}
                className="mx-auto"
              >
                Download QR Code
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-3 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Appointment Schedule</span>
            </h3>
            <div className="space-y-2">
              <DetailRow
                icon={Calendar}
                label="Date"
                value={formatDate(appointment.appointment_date)}
              />
              <DetailRow
                icon={Clock}
                label="Time"
                value={appointment.appointment_time}
              />
            </div>
          </Card>

          {location && (
            <Card>
              <h3 className="font-bold mb-3 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>Pickup Location</span>
              </h3>
              <div className="space-y-2">
                <DetailRow label="Branch" value={location.name} />
                <DetailRow label="Address" value={location.address} />
                <DetailRow label="City" value={location.city} />
                <DetailRow label="Phone" value={location.phone} />
                <DetailRow label="Working Hours" value={location.working_hours} />
                <DetailRow label="Working Days" value={location.working_days} />
              </div>
            </Card>
          )}

          {asset && (
            <Card>
              <h3 className="font-bold mb-3 flex items-center space-x-2">
                <Package className="w-5 h-5 text-yellow-600" />
                <span>Gold Bar Details</span>
              </h3>
              <div className="space-y-2">
                <DetailRow
                  label="Product"
                  value={asset.product?.name || 'Gold Bar'}
                />
                <DetailRow
                  label="Serial Number"
                  value={asset.serial_number}
                  valueClass="font-mono text-sm"
                />
                {asset.product?.weight_grams && (
                  <DetailRow
                    label="Weight"
                    value={`${asset.product.weight_grams}g`}
                  />
                )}
                {asset.product?.carat && (
                  <DetailRow
                    label="Carat"
                    value={asset.product.carat}
                  />
                )}
                <DetailRow
                  label="Status"
                  value={asset.status.replace('_', ' ').toUpperCase()}
                  valueClass="capitalize"
                />
              </div>
            </Card>
          )}

          {appointment.notes && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="font-bold mb-2 text-blue-900 dark:text-blue-100">Notes</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">{appointment.notes}</p>
            </Card>
          )}

          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <h3 className="font-bold mb-2 text-amber-900 dark:text-amber-100">
              Important Instructions
            </h3>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
              <li>Bring a valid government-issued ID</li>
              <li>Arrive 10 minutes before your appointment time</li>
              <li>Present this QR code and PIN to the staff</li>
              <li>Have your phone charged for verification</li>
              <li>Storage fees apply after the grace period</li>
            </ul>
          </Card>

          <div className="flex space-x-3">
            {appointment.status === 'pending' && onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                size="lg"
                fullWidth
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Cancel Appointment
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="primary"
              size="lg"
              fullWidth
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({
  icon: Icon,
  label,
  value,
  valueClass = '',
}: {
  icon?: any;
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <div className="flex items-center space-x-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
    <p className={`text-sm font-semibold text-gray-800 dark:text-gray-100 text-right max-w-[60%] ${valueClass}`}>
      {value}
    </p>
  </div>
);
