import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Newspaper as NewsIcon } from 'lucide-react';
import { newsService } from '../services/news.service';
import { Card } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';
import { USDRate, LocalGoldPrice, GlobalGoldPrice, NewsArticle } from '../types';

export const NewsPage = () => {
  const [usdRates, setUsdRates] = useState<USDRate[]>([]);
  const [localPrices, setLocalPrices] = useState<LocalGoldPrice[]>([]);
  const [globalPrices, setGlobalPrices] = useState<GlobalGoldPrice[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ratesData, localData, globalData, newsData] = await Promise.all([
        newsService.getUSDRates(),
        newsService.getLocalGoldPrices(),
        newsService.getGlobalGoldPrices(),
        newsService.getMarketNews(),
      ]);

      setUsdRates(ratesData);
      setLocalPrices(localData);
      setGlobalPrices(globalData);
      setNews(newsData);
    } catch (error) {
      console.error('Failed to load news data:', error);
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

  const parallelRate = usdRates.find((r) => r.rate_type === 'parallel');
  const officialRate = usdRates.find((r) => r.rate_type === 'official');
  const difference = parallelRate && officialRate ? parallelRate.rate_lyd - officialRate.rate_lyd : 0;
  const diffPercent =
    parallelRate && officialRate ? ((difference / officialRate.rate_lyd) * 100).toFixed(2) : '0';

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <h1 className="text-center text-2xl font-bold">Market News</h1>

      <div>
        <h2 className="text-lg font-bold mb-3">USD Exchange Rates</h2>
        <Card>
          <div className="space-y-4">
            {parallelRate && (
              <RateRow
                label="Parallel Market"
                rate={parallelRate.rate_lyd}
                change={parallelRate.change_percent}
                isPrimary={true}
              />
            )}
            {officialRate && (
              <RateRow
                label="Official Rate"
                rate={officialRate.rate_lyd}
                change={officialRate.change_percent}
                isPrimary={false}
              />
            )}
            {difference !== 0 && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Difference</span>
                  <div className="text-right">
                    <p className="font-bold text-red-600 dark:text-red-400">
                      {difference.toFixed(2)} LYD
                    </p>
                    <p className="text-xs text-gray-500">({diffPercent}% spread)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Local Gold Prices (Libya)</h2>
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Karat</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">LYD/Gram</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {localPrices.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        {price.karat}K
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {price.price_lyd_per_gram.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={price.change_percent} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Global Gold Prices</h2>
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Market</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">USD/Gram</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {globalPrices.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getMarketFlag(price.market)}</span>
                        <span className="font-semibold">{price.market}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      ${price.price_usd_per_gram.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={price.change_percent} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Market Updates</h2>
        <div className="space-y-3">
          {news.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
};

const RateRow = ({
  label,
  rate,
  change,
  isPrimary,
}: {
  label: string;
  rate: number;
  change: number;
  isPrimary: boolean;
}) => {
  const isPositive = change >= 0;
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <DollarSign
          className={`w-5 h-5 ${
            isPrimary ? 'text-yellow-600' : 'text-gray-400 dark:text-gray-500'
          }`}
        />
        <span className={isPrimary ? 'font-bold' : 'text-gray-600 dark:text-gray-400'}>
          {label}
        </span>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold font-mono">{rate.toFixed(2)} LYD</p>
        <div className="flex items-center justify-end space-x-1">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-xs ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

const ChangeIndicator = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <div className="flex items-center justify-end space-x-1">
      {isPositive ? (
        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
      )}
      <span
        className={`text-sm font-semibold ${
          isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {isPositive ? '+' : ''}
        {value.toFixed(2)}%
      </span>
    </div>
  );
};

const NewsCard = ({ article }: { article: NewsArticle }) => {
  const getIcon = () => {
    const iconClass = 'w-8 h-8';
    switch (article.category) {
      case 'market':
        return <TrendingUp className={`${iconClass} text-blue-600`} />;
      case 'gold':
        return <span className="text-3xl">💰</span>;
      case 'currency':
        return <DollarSign className={`${iconClass} text-green-600`} />;
      case 'economy':
        return <span className="text-3xl">📊</span>;
      case 'announcement':
        return <NewsIcon className={`${iconClass} text-yellow-600`} />;
      default:
        return <NewsIcon className={`${iconClass} text-gray-600`} />;
    }
  };

  return (
    <Card className="flex space-x-4" padding="md" hover>
      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {getIcon()}
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{article.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{article.summary}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {formatDate(article.published_at)}
          </span>
          {article.source && (
            <span className="text-xs text-gray-500 dark:text-gray-500">{article.source}</span>
          )}
        </div>
      </div>
    </Card>
  );
};

const getMarketFlag = (market: string): string => {
  const flags: Record<string, string> = {
    Turkey: '🇹🇷',
    UAE: '🇦🇪',
    London: '🇬🇧',
    USA: '🇺🇸',
    Switzerland: '🇨🇭',
  };
  return flags[market] || '🌍';
};
