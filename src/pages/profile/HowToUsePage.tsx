import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../components/ui';

interface HowToUsePageProps {
  onBack: () => void;
}

export const HowToUsePage = ({ onBack }: HowToUsePageProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqData = [
    {
      question: 'How do I buy gold or silver?',
      answer: 'Navigate to the Store tab, browse available products, and click Buy. You can purchase either digital gold/silver (instantly credited) or physical bars (for pickup). Choose your payment method and complete the transaction.',
    },
    {
      question: 'What is the difference between digital and physical gold?',
      answer: 'Digital gold is stored virtually in your account and can be transferred instantly or converted to physical bars. Physical gold bars must be picked up from one of our locations within 3 days and are tangible assets you can hold.',
    },
    {
      question: 'How do I fund my wallet?',
      answer: 'Go to Profile > Fund Wallets, then choose either Dinar or Dollar wallet. You can fund via local/international cards, bank transfer, coupon codes, or cash deposit at our branches.',
    },
    {
      question: 'What happens if I miss the pickup deadline?',
      answer: 'You have a 3-day grace period to pick up physical bars. After that, a storage fee of 30 LYD per day applies. You can book appointments or transfer ownership to avoid fees.',
    },
    {
      question: 'How do I transfer assets to another user?',
      answer: 'For digital gold/silver: Go to Wallet > Transfer Balance. For physical bars awaiting pickup: Go to Wallet, select the bar, and click Transfer Ownership. You\'ll need to verify the recipient and authenticate the transfer.',
    },
    {
      question: 'Can I convert digital gold to a physical bar?',
      answer: 'Yes! Go to Wallet, click on your digital balance, select "Receive as Physical Bar", choose the amount and pickup location. There\'s a 75 LYD fabrication and cutting fee.',
    },
    {
      question: 'How does the Investment Planner work?',
      answer: 'The Smart Investment Advisor helps you build a portfolio based on your risk tolerance. Adjust the slider from Conservative to Aggressive to see recommended allocations between Gold, Silver, and Cash reserves.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'For digital purchases: Dinar wallet, Dollar wallet, or coupons. For physical bar pickups: All methods including cash. We accept local cards, international cards, bank transfers, and cash deposits.',
    },
    {
      question: 'How do I track gold prices?',
      answer: 'Visit the News tab to see live USD exchange rates, local gold prices by karat, global market prices, and latest market updates.',
    },
    {
      question: 'What is KYC and why is it required?',
      answer: 'KYC (Know Your Customer) is a verification process required by law for financial transactions. It helps prevent fraud and ensures secure trading. Complete your KYC in Profile > KYC Information.',
    },
    {
      question: 'How do I book a pickup appointment?',
      answer: 'In your Wallet, find the bar awaiting pickup and click "Book Appointment". Select a date and time, then confirm. Bring your ID, booking confirmation, and original invoice.',
    },
    {
      question: 'Can I change my pickup location?',
      answer: 'Yes, from your Wallet, click the bar and select "Change Location". Choose a new branch. Note: There\'s a 50 LYD fee and your serial number will be reassigned.',
    },
    {
      question: 'What is XRF analysis?',
      answer: 'XRF (X-Ray Fluorescence) analysis shows the exact metal composition of your bar, including percentages of gold, silver, and other elements. This verifies purity and authenticity.',
    },
    {
      question: 'How secure are my assets?',
      answer: 'All assets are secured with encryption, multi-factor authentication, and risk scoring. Physical bars are stored in secure vaults. We follow international security standards.',
    },
    {
      question: 'What if I sell or give away a physical bar?',
      answer: 'For bars you\'ve picked up: Use "Register Handover" to record the transfer. For bars awaiting pickup: Use "Transfer Ownership" to transfer within the app. Both options are in your Wallet.',
    },
  ];

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">How to Use</h1>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        Frequently asked questions about using the Gold Trading App
      </p>

      <div className="space-y-2">
        {faqData.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-bold mb-2">Still have questions?</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Contact our support team via Profile &gt; Contact Us or call us during business hours.
        </p>
      </Card>
    </div>
  );
};

const FAQItem = ({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <Card className="cursor-pointer" hover onClick={onClick}>
    <div className="flex items-center justify-between">
      <h3 className="font-semibold flex-grow">{question}</h3>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      )}
    </div>
    {isOpen && (
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{answer}</p>
    )}
  </Card>
);
