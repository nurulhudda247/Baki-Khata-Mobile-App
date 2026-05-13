import { queryAll, queryFirst, execute, generateUUID, getCurrentUserId } from './db';
import { getCurrentTimestampBD } from '../utils/dateUtils';

export interface Payment {
  id: string;
  customer_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  note?: string;
  created_at: string;
  edit_history?: string;
}

export const getPaymentById = async (id: string): Promise<Payment | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return await queryFirst<Payment>('SELECT * FROM payments WHERE id = ? AND user_id = ?', [id, userId]);
};

export const getPaymentsByShopId = async (shopId: string, limit: number = 50, offset: number = 0): Promise<Payment[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const query = `
    SELECT p.*
    FROM payments p
    JOIN customers c ON p.customer_id = c.id
    WHERE c.shop_id = ? AND p.user_id = ? AND p.is_deleted = 0
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  return await queryAll<Payment>(query, [shopId, userId, limit, offset]);
};

export const createPayment = async (
  customerId: string,
  amount: number,
  date: string,
  note: string = ''
) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  const id = generateUUID();
  return await execute(
    'INSERT INTO payments (id, customer_id, user_id, amount, payment_date, note, created_at, is_dirty) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [id, customerId, userId, amount, date, note, getCurrentTimestampBD()]
  );
};

export const getPaymentsByCustomer = async (customerId: string, limit: number = 50, offset: number = 0): Promise<Payment[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const query = `
    SELECT * FROM payments 
    WHERE customer_id = ? AND user_id = ? AND is_deleted = 0
    ORDER BY payment_date DESC, created_at DESC
    LIMIT ? OFFSET ?
  `;
  return await queryAll<Payment>(query, [customerId, userId, limit, offset]);
};

export const getCustomerBalance = async (customerId: string) => {
  const userId = getCurrentUserId();
  if (!userId) return { totalBaki: 0, totalPaid: 0, netDue: 0 };

  const transQuery = 'SELECT SUM(total_amount) as total FROM transactions WHERE customer_id = ? AND user_id = ? AND is_deleted = 0';
  const payQuery = 'SELECT SUM(amount) as total FROM payments WHERE customer_id = ? AND user_id = ? AND is_deleted = 0';
  
  const trans = await queryAll<{total: number}>(transQuery, [customerId, userId]);
  const pay = await queryAll<{total: number}>(payQuery, [customerId, userId]);
  
  const totalBaki = trans[0]?.total || 0;
  const totalPaid = pay[0]?.total || 0;
  
  return {
    totalBaki,
    totalPaid,
    netDue: totalBaki - totalPaid
  };
};

export const updatePayment = async (
  id: string,
  newAmount: number,
  newNote: string
) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  const oldPay = await getPaymentById(id);
  if (!oldPay) throw new Error('Payment not found');

  let editHistory = [];
  if (oldPay.edit_history) {
    try {
      editHistory = JSON.parse(oldPay.edit_history);
    } catch(e) {}
  }

  editHistory.push({
    changed_at: getCurrentTimestampBD(),
    old_amount: oldPay.amount,
    new_amount: newAmount,
    old_note: oldPay.note || ''
  });

  return await execute(
    'UPDATE payments SET amount = ?, note = ?, edit_history = ?, updated_at = CURRENT_TIMESTAMP, is_dirty = 1 WHERE id = ? AND user_id = ?',
    [newAmount, newNote, JSON.stringify(editHistory), id, userId]
  );
};

export const deletePayment = async (id: string) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');
  return await execute('UPDATE payments SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [id, userId]);
};
