import { queryAll, queryFirst, execute, generateUUID, getCurrentUserId } from './db';
import { getCurrentTimestampBD } from '../utils/dateUtils';

export interface Transaction {
  id: string;
  customer_id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  transaction_date: string;
  created_at: string;
  note?: string;
  product_name?: string; // From join
  unit?: string; // From join
  category?: string; // From join
  edit_history?: string;
}

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return await queryFirst<Transaction>('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
};

export const getTransactionsByShopId = async (shopId: string, limit: number = 50, offset: number = 0): Promise<any[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const query = `
    WITH Calc AS (
      SELECT 
        t.*, 
        p.name as product_name, 
        p.unit, 
        p.category,
        (
          SELECT IFNULL(SUM(pay.amount), 0) 
          FROM payments pay 
          WHERE pay.customer_id = t.customer_id AND pay.is_deleted = 0 AND pay.user_id = t.user_id
        ) as customer_total_payments,
        SUM(t.total_amount) OVER (PARTITION BY t.customer_id ORDER BY t.created_at ASC, t.id ASC) as running_total_inclusive
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN customers c ON t.customer_id = c.id
      WHERE c.shop_id = ? AND t.user_id = ? AND t.is_deleted = 0
    )
    SELECT *,
      MIN(total_amount, MAX(0, customer_total_payments - (running_total_inclusive - total_amount))) as paidAmount,
      CASE WHEN MIN(total_amount, MAX(0, customer_total_payments - (running_total_inclusive - total_amount))) >= total_amount THEN 1 ELSE 0 END as isSettled
    FROM Calc
    ORDER BY isSettled ASC, created_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = await queryAll<any>(query, [shopId, userId, limit, offset]);
  return rows.map(r => ({
    ...r,
    isSettled: r.isSettled === 1,
    remainingAmount: r.total_amount - r.paidAmount
  }));
};

export const createTransaction = async (
  customerId: string,
  productId: string,
  quantity: number,
  unitPrice: number,
  totalAmount: number,
  date: string,
  note: string = ''
) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  const id = generateUUID();
  return await execute(
    'INSERT INTO transactions (id, customer_id, product_id, user_id, quantity, unit_price, total_amount, transaction_date, note, created_at, is_dirty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
    [id, customerId, productId, userId, quantity, unitPrice, totalAmount, date, note, getCurrentTimestampBD()]
  );
};

export const getTransactionsByCustomer = async (customerId: string, limit: number = 50, offset: number = 0): Promise<any[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const query = `
    WITH Calc AS (
      SELECT 
        t.*, 
        p.name as product_name, 
        p.unit, 
        p.category,
        (
          SELECT IFNULL(SUM(pay.amount), 0) 
          FROM payments pay 
          WHERE pay.customer_id = t.customer_id AND pay.is_deleted = 0 AND pay.user_id = t.user_id
        ) as customer_total_payments,
        SUM(t.total_amount) OVER (PARTITION BY t.customer_id ORDER BY t.created_at ASC, t.id ASC) as running_total_inclusive
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.customer_id = ? AND t.user_id = ? AND t.is_deleted = 0
    )
    SELECT *,
      MIN(total_amount, MAX(0, customer_total_payments - (running_total_inclusive - total_amount))) as paidAmount,
      CASE WHEN MIN(total_amount, MAX(0, customer_total_payments - (running_total_inclusive - total_amount))) >= total_amount THEN 1 ELSE 0 END as isSettled
    FROM Calc
    ORDER BY isSettled ASC, created_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = await queryAll<any>(query, [customerId, userId, limit, offset]);
  return rows.map(r => ({
    ...r,
    isSettled: r.isSettled === 1,
    remainingAmount: r.total_amount - r.paidAmount
  }));
};

export const updateTransaction = async (
  id: string,
  newQuantity: number,
  newTotalAmount: number,
  newNote: string
) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  const oldTx = await getTransactionById(id);
  if (!oldTx) throw new Error('Transaction not found');

  let editHistory = [];
  if (oldTx.edit_history) {
    try {
      editHistory = JSON.parse(oldTx.edit_history);
    } catch(e) {}
  }

  editHistory.push({
    changed_at: getCurrentTimestampBD(),
    old_quantity: oldTx.quantity,
    new_quantity: newQuantity,
    old_total: oldTx.total_amount,
    new_total: newTotalAmount,
    old_note: oldTx.note || ''
  });

  return await execute(
    'UPDATE transactions SET quantity = ?, total_amount = ?, note = ?, edit_history = ?, updated_at = CURRENT_TIMESTAMP, is_dirty = 1 WHERE id = ? AND user_id = ?',
    [newQuantity, newTotalAmount, newNote, JSON.stringify(editHistory), id, userId]
  );
};

export const deleteTransaction = async (id: string) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');
  return await execute('UPDATE transactions SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [id, userId]);
};
