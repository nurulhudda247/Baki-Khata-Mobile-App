import { queryAll, execute } from './db';
import { getCurrentTimestampBD } from '../utils/dateUtils';

export interface Transaction {
  id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  transaction_date: string;
  created_at: string;
  note?: string;
  product_name?: string; // From join
  unit?: string; // From join
  category?: string; // From join
}

export const getTransactionsByShopId = async (shopId: number): Promise<Transaction[]> => {
  const query = `
    SELECT t.*, p.name as product_name, p.unit, p.category
    FROM transactions t
    JOIN products p ON t.product_id = p.id
    JOIN customers c ON t.customer_id = c.id
    WHERE c.shop_id = ?
    ORDER BY t.created_at DESC
  `;
  return await queryAll<Transaction>(query, [shopId]);
};

export const createTransaction = async (
  customerId: number,
  productId: number,
  quantity: number,
  unitPrice: number,
  totalAmount: number,
  date: string,
  note: string = ''
) => {
  return await execute(
    'INSERT INTO transactions (customer_id, product_id, quantity, unit_price, total_amount, transaction_date, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [customerId, productId, quantity, unitPrice, totalAmount, date, note, getCurrentTimestampBD()]
  );
};
export const getTransactionsByCustomer = async (customerId: number): Promise<Transaction[]> => {
  const query = `
    SELECT t.*, p.name as product_name, p.unit, p.category
    FROM transactions t
    JOIN products p ON t.product_id = p.id
    WHERE t.customer_id = ?
    ORDER BY t.transaction_date DESC, t.created_at DESC
  `;
  return await queryAll<Transaction>(query, [customerId]);
};
