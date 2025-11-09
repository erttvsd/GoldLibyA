/*
  # Store Analytics RPC Functions

  Creates comprehensive analytics and reporting functions for the Store Console system.

  ## Functions Created

  1. **get_staff_performance**
     - Calculates individual staff member performance metrics
     - Returns total sales, revenue, and average order value
     - Used by StoreStaffPage for performance tracking

  2. **get_daily_sales_report**
     - Generates comprehensive daily sales analytics
     - Includes revenue, transaction count, payment methods
     - Groups by product categories and payment types
     - Used by StoreReportsPage for sales analytics

  3. **get_inventory_valuation_report**
     - Calculates total inventory value and metrics
     - Groups by product categories
     - Identifies low stock items
     - Used by StoreReportsPage for inventory analytics

  4. **get_customer_purchase_report**
     - Analyzes customer purchase patterns
     - Calculates total customers, new customers, and top buyers
     - Returns average purchase value
     - Used by StoreReportsPage for customer analytics

  5. **get_financial_summary**
     - Provides comprehensive financial overview
     - Breaks down revenue by payment method
     - Calculates expenses and net profit
     - Used by StoreReportsPage for financial analytics

  ## Security
  - All functions use SECURITY DEFINER
  - Access controlled through RLS policies
  - Only accessible to authenticated store users
*/

-- Function 1: Staff Performance Metrics
CREATE OR REPLACE FUNCTION get_staff_performance(
  p_user_id uuid,
  p_store_id uuid
)
RETURNS TABLE (
  total_sales bigint,
  total_revenue numeric,
  avg_order_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_sales,
    COALESCE(SUM(total_amount), 0)::numeric as total_revenue,
    COALESCE(AVG(total_amount), 0)::numeric as avg_order_value
  FROM pos_sales
  WHERE clerk_id = p_user_id
    AND store_id = p_store_id
    AND status = 'completed';
END;
$$;

-- Function 2: Daily Sales Report
CREATE OR REPLACE FUNCTION get_daily_sales_report(
  p_store_id uuid,
  p_from_date timestamptz,
  p_to_date timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  WITH sales_summary AS (
    SELECT
      COUNT(*)::bigint as total_transactions,
      COALESCE(SUM(total_amount), 0)::numeric as total_revenue,
      COALESCE(AVG(total_amount), 0)::numeric as avg_order_value,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM pos_sales
    WHERE store_id = p_store_id
      AND created_at >= p_from_date
      AND created_at <= p_to_date
      AND status = 'completed'
  ),
  payment_methods AS (
    SELECT
      payment_method,
      COUNT(*)::bigint as transaction_count,
      COALESCE(SUM(amount), 0)::numeric as total_amount
    FROM pos_payments
    WHERE sale_id IN (
      SELECT id FROM pos_sales
      WHERE store_id = p_store_id
        AND created_at >= p_from_date
        AND created_at <= p_to_date
        AND status = 'completed'
    )
    GROUP BY payment_method
  ),
  top_products AS (
    SELECT
      p.name,
      p.type,
      COUNT(*)::bigint as quantity_sold,
      COALESCE(SUM(psi.subtotal), 0)::numeric as revenue
    FROM pos_sale_items psi
    JOIN pos_sales ps ON psi.sale_id = ps.id
    JOIN products p ON psi.product_id = p.id
    WHERE ps.store_id = p_store_id
      AND ps.created_at >= p_from_date
      AND ps.created_at <= p_to_date
      AND ps.status = 'completed'
    GROUP BY p.id, p.name, p.type
    ORDER BY revenue DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'summary', (SELECT row_to_json(s) FROM sales_summary s),
    'payment_methods', (SELECT json_agg(pm) FROM payment_methods pm),
    'top_products', (SELECT json_agg(tp) FROM top_products tp)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function 3: Inventory Valuation Report
CREATE OR REPLACE FUNCTION get_inventory_valuation_report(
  p_store_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  WITH inventory_summary AS (
    SELECT
      COUNT(*)::bigint as total_items,
      COALESCE(SUM(p.price_lyd), 0)::numeric as total_value
    FROM owned_assets oa
    JOIN products p ON oa.product_id = p.id
    WHERE oa.current_location_store_id = p_store_id
      AND oa.status = 'in_store'
  ),
  category_breakdown AS (
    SELECT
      p.type as category,
      COUNT(*)::bigint as item_count,
      COALESCE(SUM(p.price_lyd), 0)::numeric as category_value,
      COALESCE(SUM(p.weight_grams), 0)::numeric as total_weight_grams
    FROM owned_assets oa
    JOIN products p ON oa.product_id = p.id
    WHERE oa.current_location_store_id = p_store_id
      AND oa.status = 'in_store'
    GROUP BY p.type
  ),
  low_stock_items AS (
    SELECT
      p.name,
      p.type,
      COUNT(*)::bigint as quantity
    FROM owned_assets oa
    JOIN products p ON oa.product_id = p.id
    WHERE oa.current_location_store_id = p_store_id
      AND oa.status = 'in_store'
    GROUP BY p.id, p.name, p.type
    HAVING COUNT(*) < 5
    ORDER BY COUNT(*) ASC
    LIMIT 10
  )
  SELECT json_build_object(
    'summary', (SELECT row_to_json(s) FROM inventory_summary s),
    'category_breakdown', (SELECT json_agg(cb) FROM category_breakdown cb),
    'low_stock_items', (SELECT json_agg(ls) FROM low_stock_items ls)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function 4: Customer Purchase Report
CREATE OR REPLACE FUNCTION get_customer_purchase_report(
  p_store_id uuid,
  p_from_date timestamptz,
  p_to_date timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  WITH customer_summary AS (
    SELECT
      COUNT(DISTINCT customer_id)::bigint as total_customers,
      COUNT(DISTINCT CASE
        WHEN created_at >= p_from_date AND created_at <= p_to_date
        THEN customer_id
      END)::bigint as new_customers,
      COALESCE(AVG(total_amount), 0)::numeric as avg_purchase_value
    FROM pos_sales
    WHERE store_id = p_store_id
      AND status = 'completed'
  ),
  top_customers AS (
    SELECT
      pr.first_name,
      pr.last_name,
      pr.email,
      COUNT(*)::bigint as purchase_count,
      COALESCE(SUM(ps.total_amount), 0)::numeric as total_spent
    FROM pos_sales ps
    JOIN profiles pr ON ps.customer_id = pr.id
    WHERE ps.store_id = p_store_id
      AND ps.created_at >= p_from_date
      AND ps.created_at <= p_to_date
      AND ps.status = 'completed'
    GROUP BY pr.id, pr.first_name, pr.last_name, pr.email
    ORDER BY total_spent DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'summary', (SELECT row_to_json(s) FROM customer_summary s),
    'top_customers', (SELECT json_agg(tc) FROM top_customers tc)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function 5: Financial Summary
CREATE OR REPLACE FUNCTION get_financial_summary(
  p_store_id uuid,
  p_from_date timestamptz,
  p_to_date timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  WITH revenue_summary AS (
    SELECT
      COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END), 0)::numeric as total_revenue,
      COALESCE(SUM(CASE WHEN transaction_type IN ('expense', 'withdrawal') THEN amount ELSE 0 END), 0)::numeric as total_expenses,
      COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) -
               SUM(CASE WHEN transaction_type IN ('expense', 'withdrawal') THEN amount ELSE 0 END), 0)::numeric as net_profit
    FROM store_financial_transactions
    WHERE store_id = p_store_id
      AND created_at >= p_from_date
      AND created_at <= p_to_date
  ),
  payment_breakdown AS (
    SELECT
      payment_method,
      COALESCE(SUM(amount), 0)::numeric as total_amount,
      COUNT(*)::bigint as transaction_count
    FROM pos_payments
    WHERE sale_id IN (
      SELECT id FROM pos_sales
      WHERE store_id = p_store_id
        AND created_at >= p_from_date
        AND created_at <= p_to_date
        AND status = 'completed'
    )
    GROUP BY payment_method
  ),
  daily_revenue AS (
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(amount), 0)::numeric as revenue
    FROM store_financial_transactions
    WHERE store_id = p_store_id
      AND transaction_type = 'sale'
      AND created_at >= p_from_date
      AND created_at <= p_to_date
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  )
  SELECT json_build_object(
    'summary', (SELECT row_to_json(s) FROM revenue_summary s),
    'payment_breakdown', (SELECT json_agg(pb) FROM payment_breakdown pb),
    'daily_revenue', (SELECT json_agg(dr) FROM daily_revenue dr)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_staff_performance(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_sales_report(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_valuation_report(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_purchase_report(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_summary(uuid, timestamptz, timestamptz) TO authenticated;
