import { supabase } from '../lib/supabase';

export const reportsService = {
  getDailySalesReport: async (storeId: string, fromDate: string, toDate: string) => {
    return supabase.rpc('get_daily_sales_report', {
      p_store_id: storeId,
      p_from_date: fromDate,
      p_to_date: toDate,
    });
  },

  getInventoryValuationReport: async (storeId: string) => {
    return supabase.rpc('get_inventory_valuation_report', {
      p_store_id: storeId,
    });
  },

  getCustomerPurchaseReport: async (storeId: string, fromDate: string, toDate: string) => {
    return supabase.rpc('get_customer_purchase_report', {
      p_store_id: storeId,
      p_from_date: fromDate,
      p_to_date: toDate,
    });
  },

  getFinancialSummary: async (storeId: string, fromDate: string, toDate: string) => {
    return supabase.rpc('get_financial_summary', {
      p_store_id: storeId,
      p_from_date: fromDate,
      p_to_date: toDate,
    });
  },
};
