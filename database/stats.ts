import { queryFirst, queryAll, getCurrentUserId } from './db';
import { getCurrentDateBD } from '../utils/dateUtils';

export interface ShopkeeperStats {
  totalMarketDue: number;
  todayCollection: number;
  todayDue: number;
  activeCustomers: number;
}

export const getMarketStats = async (shopType: 'business' | 'personal' = 'business'): Promise<ShopkeeperStats> => {
  const userId = getCurrentUserId();
  if (!userId) return { totalMarketDue: 0, todayCollection: 0, todayDue: 0, activeCustomers: 0 };

  // 1. Total Market Due
  const dueQuery = `
    SELECT (
      (SELECT IFNULL(SUM(t.total_amount), 0) FROM transactions t 
       JOIN customers c ON t.customer_id = c.id 
       JOIN shops s ON c.shop_id = s.id
       WHERE t.user_id = ? AND t.is_deleted = 0 AND s.type = ?) -
      (SELECT IFNULL(SUM(p.amount), 0) FROM payments p 
       JOIN customers c ON p.customer_id = c.id 
       JOIN shops s ON c.shop_id = s.id
       WHERE p.user_id = ? AND p.is_deleted = 0 AND s.type = ?)
    ) as total_due
  `;
  const dueResult = await queryFirst<{ total_due: number }>(dueQuery, [userId, shopType, userId, shopType]);

  // 2. Today's Collection
  const today = getCurrentDateBD(); 
  const collectionQuery = `
    SELECT IFNULL(SUM(p.amount), 0) as today_collection 
    FROM payments p
    JOIN customers c ON p.customer_id = c.id
    JOIN shops s ON c.shop_id = s.id
    WHERE p.user_id = ? AND p.payment_date = ? AND p.is_deleted = 0 AND s.type = ?
  `;
  const collectionResult = await queryFirst<{ today_collection: number }>(collectionQuery, [userId, today, shopType]);

  // 3. Today's Due (New Transactions)
  const todayDueQuery = `
    SELECT IFNULL(SUM(t.total_amount), 0) as today_due 
    FROM transactions t
    JOIN customers c ON t.customer_id = c.id
    JOIN shops s ON c.shop_id = s.id
    WHERE t.user_id = ? AND t.transaction_date = ? AND t.is_deleted = 0 AND s.type = ?
  `;
  const todayDueResult = await queryFirst<{ today_due: number }>(todayDueQuery, [userId, today, shopType]);

  // 4. Active Customers
  const activeCustomersQuery = `
    SELECT COUNT(*) as active_count FROM (
      SELECT c.id FROM customers c
      JOIN shops s ON c.shop_id = s.id
      LEFT JOIN transactions t ON c.id = t.customer_id AND t.is_deleted = 0
      LEFT JOIN payments p ON c.id = p.customer_id AND p.is_deleted = 0
      WHERE c.user_id = ? AND c.is_deleted = 0 AND s.type = ?
      GROUP BY c.id
      HAVING (IFNULL(SUM(t.total_amount), 0) - IFNULL(SUM(p.amount), 0)) != 0
    ) as active_sub
  `;
  const activeResult = await queryFirst<{ active_count: number }>(activeCustomersQuery, [userId, shopType]);

  return {
    totalMarketDue: dueResult?.total_due || 0,
    todayCollection: collectionResult?.today_collection || 0,
    todayDue: todayDueResult?.today_due || 0,
    activeCustomers: activeResult?.active_count || 0
  };
};
