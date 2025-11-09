import { useState, useRef } from 'react';
import { ArrowLeft, QrCode, Camera, CheckCircle, User, Package, AlertCircle } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface StorePickupPageProps {
  onBack: () => void;
}

export const StorePickupPage = ({ onBack }: StorePickupPageProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'scan' | 'verify' | 'complete'>('scan');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [customerPhoto, setCustomerPhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState('');

  const idPhotoRef = useRef<HTMLInputElement>(null);
  const customerPhotoRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<HTMLInputElement>(null);

  const handleScanQR = async () => {
    if (!qrCode.trim()) {
      setError('Please enter QR code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: appointment } = await supabase
        .from('pickup_appointments')
        .select(`
          *,
          profiles!pickup_appointments_user_id_fkey(first_name, last_name, phone, national_id),
          owned_assets(id, serial_number, metal_type, weight, purity)
        `)
        .eq('qr_code_data', qrCode)
        .in('status', ['confirmed', 'scheduled'])
        .maybeSingle();

      if (!appointment) {
        setError('Invalid QR code or appointment not found');
        return;
      }

      const { data: storeProfile } = await supabase
        .from('store_profiles')
        .select('store_id, location_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!storeProfile || appointment.location_id !== storeProfile.location_id) {
        setError('This appointment is not for your store location');
        return;
      }

      setAppointmentData(appointment);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to verify QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePickup = async () => {
    if (!idPhoto) {
      setError('Please capture customer ID photo');
      return;
    }

    if (!customerPhoto) {
      setError('Please capture customer photo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: storeProfile } = await supabase
        .from('store_profiles')
        .select('store_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!storeProfile) {
        throw new Error('Store profile not found');
      }

      let idPhotoUrl = '';
      let customerPhotoUrl = '';

      if (idPhoto) {
        const idFileName = `${user?.id}/${Date.now()}_id.jpg`;
        const { data: idUpload } = await supabase.storage
          .from('pickup-photos')
          .upload(idFileName, idPhoto);
        if (idUpload) {
          const { data: urlData } = supabase.storage
            .from('pickup-photos')
            .getPublicUrl(idUpload.path);
          idPhotoUrl = urlData.publicUrl;
        }
      }

      if (customerPhoto) {
        const customerFileName = `${user?.id}/${Date.now()}_customer.jpg`;
        const { data: customerUpload } = await supabase.storage
          .from('pickup-photos')
          .upload(customerFileName, customerPhoto);
        if (customerUpload) {
          const { data: urlData } = supabase.storage
            .from('pickup-photos')
            .getPublicUrl(customerUpload.path);
          customerPhotoUrl = urlData.publicUrl;
        }
      }

      await supabase.from('pickup_logs').insert({
        asset_id: appointmentData.owned_assets[0]?.id,
        appointment_id: appointmentData.id,
        customer_id: appointmentData.user_id,
        store_id: storeProfile.store_id,
        processed_by_user_id: user?.id,
        qr_code_data: qrCode,
        id_photo_url: idPhotoUrl,
        customer_photo_url: customerPhotoUrl,
        verification_notes: notes,
      });

      await supabase
        .from('pickup_appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentData.id);

      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to complete pickup');
    } finally {
      setLoading(false);
    }
  };

  const resetProcess = () => {
    setStep('scan');
    setQrCode('');
    setAppointmentData(null);
    setIdPhoto(null);
    setCustomerPhoto(null);
    setNotes('');
    setError('');
  };

  if (step === 'complete') {
    return (
      <div className="p-4 space-y-6 animate-fade-in">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>

        <Card className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Pickup Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Customer has successfully received their gold bar
          </p>
          <Button onClick={resetProcess} variant="primary" size="lg">
            Process Another Pickup
          </Button>
        </Card>
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
        <h1 className="text-2xl font-bold">Process Pickup</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Scan QR code and verify customer identity
        </p>
      </div>

      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </Card>
      )}

      {step === 'scan' && (
        <Card>
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Scan Customer QR Code</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Ask customer to show their appointment QR code
            </p>

            <div className="max-w-md mx-auto space-y-4">
              <Input
                label="QR Code / Appointment ID"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Enter code manually or scan"
              />

              <input
                ref={qrScannerRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setQrCode('QR-00000001');
                    setError('QR scanning from camera - use manual entry for now');
                  }
                }}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => qrScannerRef.current?.click()}
                  variant="outline"
                  size="lg"
                  icon={Camera}
                >
                  Scan QR
                </Button>
                <Button
                  onClick={handleScanQR}
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  icon={QrCode}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 'verify' && appointmentData && (
        <>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-green-900 dark:text-green-100">
                Appointment Verified
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold">
                    {appointmentData.profiles?.first_name} {appointmentData.profiles?.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">National ID</p>
                  <p className="font-semibold">{appointmentData.profiles?.national_id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Item</p>
                  {appointmentData.owned_assets?.map((asset: any) => (
                    <p key={asset.id} className="font-semibold">
                      {asset.metal_type} {asset.weight}g ({asset.purity}) - SN: {asset.serial_number}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-4">Verification Photos</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer ID Photo</label>
                <input
                  ref={idPhotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setIdPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  onClick={() => idPhotoRef.current?.click()}
                  variant={idPhoto ? 'primary' : 'outline'}
                  icon={Camera}
                  fullWidth
                >
                  {idPhoto ? 'ID Photo Captured ✓' : 'Capture ID Photo'}
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Customer Face Photo</label>
                <input
                  ref={customerPhotoRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => setCustomerPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  onClick={() => customerPhotoRef.current?.click()}
                  variant={customerPhoto ? 'primary' : 'outline'}
                  icon={Camera}
                  fullWidth
                >
                  {customerPhoto ? 'Customer Photo Captured ✓' : 'Capture Customer Photo'}
                </Button>
              </div>

              <Input
                label="Verification Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
              />
            </div>
          </Card>

          <Button
            onClick={handleCompletePickup}
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading || !idPhoto || !customerPhoto}
            icon={CheckCircle}
          >
            {loading ? 'Processing...' : 'Complete Pickup'}
          </Button>
        </>
      )}
    </div>
  );
};
