import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { kycService } from '../../services/kyc.service';
import { Card, Button } from '../../components/ui';
import { KYCDetails } from '../../types';
import { formatDate } from '../../utils/format';

interface KYCPageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onBack: () => void;
}

export const KYCPage = ({ onNavigate, onBack }: KYCPageProps) => {
  const { user } = useAuth();
  const [kycData, setKycData] = useState<KYCDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadKYCData();
    }
  }, [user]);

  const loadKYCData = async () => {
    try {
      setLoading(true);
      const data = await kycService.getKYCDetails(user!.id);
      setKycData(data);
    } catch (error) {
      console.error('Failed to load KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!kycData) return null;

    const statusConfig = {
      verified: {
        icon: CheckCircle,
        text: 'Verified',
        color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
      },
      pending: {
        icon: Clock,
        text: 'Pending Review',
        color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
      },
      rejected: {
        icon: XCircle,
        text: 'Rejected',
        color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
      },
    };

    const config = statusConfig[kycData.verification_status];
    const Icon = config.icon;

    return (
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${config.color}`}>
        <Icon className="w-5 h-5" />
        <span className="font-semibold">{config.text}</span>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">KYC Information</h1>
      </div>

      {!kycData ? (
        <Card>
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">No KYC Information</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven't submitted your KYC verification yet.
            </p>
            <Button variant="primary" size="lg">
              Start Verification
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">Verification Status</h3>
                {kycData.verified_at && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verified on {formatDate(kycData.verified_at)}
                  </p>
                )}
              </div>
              {getStatusBadge()}
            </div>
          </Card>

          <div>
            <h2 className="text-lg font-bold mb-3">Personal Information</h2>
            <Card>
              <div className="space-y-3">
                <DetailRow label="Place of Birth" value={kycData.place_of_birth || 'Not provided'} />
                <DetailRow label="Nationality" value={kycData.nationality || 'Not provided'} />
                <DetailRow label="Marital Status" value={kycData.marital_status || 'Not provided'} />
                <DetailRow label="Employment Status" value={kycData.employment_status || 'Not provided'} />
              </div>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3">AML Information</h2>
            <Card>
              <div className="space-y-3">
                <DetailRow label="Income Source" value={kycData.income_source || 'Not provided'} />
                <DetailRow label="Account Purpose" value={kycData.account_purpose || 'Not provided'} />
                <DetailRow
                  label="Expected Monthly Volume"
                  value={kycData.expected_monthly_volume || 'Not provided'}
                />
              </div>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3">Document Verification</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DocumentCard
                label="ID Front"
                imageUrl={kycData.id_front_url}
                uploaded={!!kycData.id_front_url}
              />
              <DocumentCard
                label="ID Back"
                imageUrl={kycData.id_back_url}
                uploaded={!!kycData.id_back_url}
              />
              <DocumentCard
                label="Selfie"
                imageUrl={kycData.selfie_url}
                uploaded={!!kycData.selfie_url}
              />
            </div>
          </div>

          <Button
            onClick={() => alert('Update functionality coming soon')}
            variant="outline"
            size="lg"
            fullWidth
          >
            Update Information
          </Button>
        </>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-right capitalize">{value}</span>
  </div>
);

const DocumentCard = ({
  label,
  imageUrl,
  uploaded,
}: {
  label: string;
  imageUrl?: string;
  uploaded: boolean;
}) => (
  <Card className={uploaded ? 'border-green-200 dark:border-green-800' : ''}>
    <div className="text-center">
      {imageUrl ? (
        <div className="relative">
          <img src={imageUrl} alt={label} className="w-full h-32 object-cover rounded-lg mb-2" />
          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>
      ) : (
        <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-gray-500">
        {uploaded ? (
          <span className="text-green-600 dark:text-green-400">✓ Uploaded</span>
        ) : (
          <span className="text-gray-500">Not uploaded</span>
        )}
      </p>
    </div>
  </Card>
);
