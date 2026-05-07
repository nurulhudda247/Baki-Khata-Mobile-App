import { queryAll, execute } from './db';
import { getCurrentTimestampBD } from '../utils/dateUtils';

export interface Payment {
  id: number;
  customer_id: number;
  amount: number;
  payment_date: string;
  note?: string;
  created_at: string;
}

export const getPaymentsByShopId = async (shopId: number): Promise<Payment[]> => {
  const query = `
    SELECT p.*
    FROM payments p
    JOIN customers c ON p.customer_id = c.id
    WHERE c.shop_id = ?
    ORDER BY p.created_at DESC
  `;
  return await queryAll<Payment>(query, [shopId]);
};

export const createPayment = async (
  customerId: number,
  amount: number,
  date: string,
  note: string = ''
) => {
  return await execute(
    'INSERT INTO payments (customer_id, amount, payment_date, note, created_at) VALUES (?, ?, ?, ?, ?)',
    [customerId, amount, date, note, getCurrentTimestampBD()]
  );
};
export const getPaymentsByCustomer = async (customerId: number): Promise<Payment[]> => {
  const query = `
    SELECT * FROM payments 
    WHERE customer_id = ?
    ORDER BY payment_date DESC, created_at DESC
  `;
  return await queryAll<Payment>(query, [customerId]);
};

export const getCustomerBalance = async (customerId: number) => {
  const transQuery = 'SELECT SUM(total_amount) as total FROM transactions WHERE customer_id = ?';
  const payQuery = 'SELECT SUM(amount) as total FROM payments WHERE customer_id = ?';
  
  const trans = await queryAll<{total: number}>(transQuery, [customerId]);
  const pay = await queryAll<{total: number}>(payQuery, [customerId]);
  
  const totalBaki = trans[0]?.total || 0;
  const totalPaid = pay[0]?.total || 0;
  
  return {
    totalBaki,
    totalPaid,
    netDue: totalBaki - totalPaid
  };
};
