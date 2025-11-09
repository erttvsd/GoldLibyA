import { supabase } from '../lib/supabase';
import { NewsArticle, USDRate, LocalGoldPrice, GlobalGoldPrice } from '../types';

export const newsService = {
  async getNews(category?: string, limit = 50): Promise<NewsArticle[]> {
    let query = supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getArticleById(id: string): Promise<NewsArticle | null> {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getMarketNews(limit = 10): Promise<NewsArticle[]> {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getUSDRates(): Promise<USDRate[]> {
    const { data, error } = await supabase
      .from('usd_rates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getLocalGoldPrices(): Promise<LocalGoldPrice[]> {
    const { data, error } = await supabase
      .from('local_gold_prices')
      .select('*')
      .order('karat', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getGlobalGoldPrices(): Promise<GlobalGoldPrice[]> {
    const { data, error } = await supabase
      .from('global_gold_prices')
      .select('*')
      .order('market', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
