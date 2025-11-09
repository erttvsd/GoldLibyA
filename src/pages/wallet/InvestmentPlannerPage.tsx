import { useState } from 'react';
import { ArrowLeft, TrendingUp, Shield, DollarSign } from 'lucide-react';
import { Card, Button } from '../../components/ui';

interface InvestmentPlannerPageProps {
  onNavigate: (page: string, subPage?: string, props?: any) => void;
  onBack: () => void;
}

export const InvestmentPlannerPage = ({ onNavigate, onBack }: InvestmentPlannerPageProps) => {
  const [riskLevel, setRiskLevel] = useState(3);

  const riskProfiles = {
    1: {
      label: 'Very Conservative',
      description: 'Minimal risk, focus on capital preservation',
      allocation: { gold: 20, silver: 10, cash: 70 },
      advice: 'Your portfolio emphasizes capital preservation with minimal risk. Keep most funds in cash reserves while maintaining a small precious metals allocation for long-term stability.',
      color: 'bg-blue-500',
    },
    2: {
      label: 'Conservative',
      description: 'Low risk with steady, predictable returns',
      allocation: { gold: 35, silver: 15, cash: 50 },
      advice: 'A balanced approach with emphasis on safety. Allocate half to cash reserves and the remainder to gold and silver for modest growth potential.',
      color: 'bg-green-500',
    },
    3: {
      label: 'Moderate',
      description: 'Balanced risk and reward',
      allocation: { gold: 50, silver: 25, cash: 25 },
      advice: 'An optimal balance between growth and security. Gold forms your core holding, complemented by silver for diversification and cash for liquidity.',
      color: 'bg-yellow-500',
    },
    4: {
      label: 'Aggressive',
      description: 'Higher risk for potentially higher returns',
      allocation: { gold: 60, silver: 30, cash: 10 },
      advice: 'Focus on precious metals with 90% allocation. Gold remains primary with significant silver exposure. Minimal cash reserves for opportunities.',
      color: 'bg-orange-500',
    },
    5: {
      label: 'Very Aggressive',
      description: 'Maximum risk for maximum potential reward',
      allocation: { gold: 65, silver: 35, cash: 0 },
      advice: 'Full commitment to precious metals. This strategy aims for maximum appreciation but accepts higher volatility. No cash reserves - all capital deployed.',
      color: 'bg-red-500',
    },
  };

  const currentProfile = riskProfiles[riskLevel as keyof typeof riskProfiles];

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Smart Investment Advisor</h1>
      </div>

      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center space-x-3 mb-3">
          <TrendingUp className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">Build Your Portfolio</h2>
            <p className="text-sm opacity-90">Get personalized recommendations based on your risk tolerance</p>
          </div>
        </div>
      </Card>

      <div>
        <label className="block text-sm font-medium mb-3 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Your Risk Tolerance Level
        </label>

        <div className="relative mb-8">
          <input
            type="range"
            min="1"
            max="5"
            value={riskLevel}
            onChange={(e) => setRiskLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #22c55e 25%, #eab308 50%, #f97316 75%, #ef4444 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
            <span>Conservative</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
        </div>

        <Card className={`${currentProfile.color} text-white`}>
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">{currentProfile.label}</h3>
            <p className="opacity-90">{currentProfile.description}</p>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3">Recommended Allocation</h3>

        <div className="space-y-3">
          <AllocationBar
            label="Gold"
            percentage={currentProfile.allocation.gold}
            color="bg-yellow-500"
            icon="🪙"
          />
          <AllocationBar
            label="Silver"
            percentage={currentProfile.allocation.silver}
            color="bg-gray-400"
            icon="⚪"
          />
          <AllocationBar
            label="Cash Reserves"
            percentage={currentProfile.allocation.cash}
            color="bg-green-500"
            icon="💵"
          />
        </div>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-bold mb-2 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Investment Strategy
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">{currentProfile.advice}</p>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">Key Considerations</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start">
            <span className="text-yellow-600 mr-2">•</span>
            <span>Gold typically offers stability and acts as a hedge against inflation</span>
          </li>
          <li className="flex items-start">
            <span className="text-gray-600 mr-2">•</span>
            <span>Silver has industrial demand drivers and higher volatility</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <span>Cash reserves provide liquidity for opportunities and emergencies</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Diversification helps manage risk across different asset types</span>
          </li>
        </ul>
      </Card>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          This is a general recommendation tool. Please consult with a financial advisor for personalized investment advice. Past performance does not guarantee future results.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => onNavigate('market')}
          variant="primary"
          size="lg"
          fullWidth
          icon={DollarSign}
        >
          Start Investing
        </Button>
        <Button onClick={onBack} variant="outline" size="lg" fullWidth>
          Back to Wallet
        </Button>
      </div>
    </div>
  );
};

const AllocationBar = ({
  label,
  percentage,
  color,
  icon,
}: {
  label: string;
  percentage: number;
  color: string;
  icon: string;
}) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium flex items-center">
        <span className="mr-2">{icon}</span>
        {label}
      </span>
      <span className="text-sm font-bold">{percentage}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
      <div
        className={`h-full ${color} flex items-center justify-end pr-2 transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      >
        {percentage > 15 && <span className="text-xs font-semibold text-white">{percentage}%</span>}
      </div>
    </div>
  </div>
);
