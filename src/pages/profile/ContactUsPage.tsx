import { useState } from 'react';
import { ArrowLeft, Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';

interface ContactUsPageProps {
  onBack: () => void;
}

export const ContactUsPage = ({ onBack }: ContactUsPageProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-4 space-y-6 animate-fade-in">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold">Message Sent!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for contacting us. Our support team will get back to you within 24 hours.
          </p>
          <Button onClick={onBack} variant="primary" size="lg" fullWidth>
            Back to Profile
          </Button>
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
        <h1 className="text-2xl font-bold">Contact Us</h1>
      </div>

      <div className="space-y-3">
        <ContactCard
          icon={Phone}
          title="Phone Support"
          content="+218 21 123 4567"
          color="text-blue-600"
          bgColor="bg-blue-100 dark:bg-blue-900/20"
        />

        <ContactCard
          icon={Mail}
          title="Email Support"
          content="support@goldtrading.ly"
          color="text-green-600"
          bgColor="bg-green-100 dark:bg-green-900/20"
        />

        <ContactCard
          icon={MapPin}
          title="Main Office"
          content="Gargaresh Street, Tripoli, Libya"
          color="text-yellow-600"
          bgColor="bg-yellow-100 dark:bg-yellow-900/20"
        />

        <ContactCard
          icon={Clock}
          title="Business Hours"
          content="Sunday - Thursday: 9:00 AM - 5:00 PM"
          color="text-purple-600"
          bgColor="bg-purple-100 dark:bg-purple-900/20"
        />
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Send us a Message</h2>
        <Card>
          <div className="space-y-4">
            <Input
              label="Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              type="email"
              label="Email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 min-h-32 resize-y"
                placeholder="How can we help you?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={!name || !email || !message}
              icon={Send}
            >
              Send Message
            </Button>
          </div>
        </Card>
      </div>

      <Card className="bg-gray-50 dark:bg-gray-800">
        <h3 className="font-bold mb-2">Other Ways to Reach Us</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>• Live chat support available during business hours</li>
          <li>• WhatsApp: +218 91 123 4567</li>
          <li>• Follow us on social media for updates</li>
        </ul>
      </Card>
    </div>
  );
};

const ContactCard = ({
  icon: Icon,
  title,
  content,
  color,
  bgColor,
}: {
  icon: any;
  title: string;
  content: string;
  color: string;
  bgColor: string;
}) => (
  <Card>
    <div className="flex items-center space-x-3">
      <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{content}</p>
      </div>
    </div>
  </Card>
);
