import { queryAll, queryFirst, execute, generateUUID, getCurrentUserId } from './db';

export interface Shop {
  id: string;
  user_id: string;
  name: string;
  address?: string;
  phone?: string;
  image_uri?: string;
  created_at: string;
  total_baki?: number;
}

export const getShops = async (): Promise<Shop[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const query = `
    SELECT s.*, 
    (
      (SELECT IFNULL(SUM(t.total_amount), 0) FROM transactions t 
       JOIN customers c ON t.customer_id = c.id 
       WHERE c.shop_id = s.id AND t.is_deleted = 0 AND c.is_deleted = 0) -
      (SELECT IFNULL(SUM(p.amount), 0) FROM payments p 
       JOIN customers c ON p.customer_id = c.id 
       WHERE c.shop_id = s.id AND p.is_deleted = 0 AND c.is_deleted = 0)
    ) as total_baki
    FROM shops s
    WHERE s.user_id = ? AND s.is_deleted = 0
    ORDER BY s.name ASC
  `;
  return await queryAll<Shop>(query, [userId]);
};

export const getShopById = async (id: string): Promise<Shop | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const shop = await queryFirst<Shop>('SELECT * FROM shops WHERE id = ? AND user_id = ? AND is_deleted = 0', [id, userId]);
  if (!shop) return null;

  const query = `
    SELECT (
      (SELECT IFNULL(SUM(t.total_amount), 0) FROM transactions t JOIN customers c ON t.customer_id = c.id WHERE c.shop_id = ? AND t.is_deleted = 0 AND c.is_deleted = 0) -
      (SELECT IFNULL(SUM(p.amount), 0) FROM payments p JOIN customers c ON p.customer_id = c.id WHERE c.shop_id = ? AND p.is_deleted = 0 AND c.is_deleted = 0)
    ) as total
  `;
  const result = await queryFirst<{ total: number }>(query, [id, id]);

  return { ...shop, total_baki: result?.total || 0 };
};

export const createShop = async (name: string, address: string = '', phone: string = '', image_uri: string = '') => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  const id = generateUUID();
  return await execute(
    'INSERT INTO shops (id, user_id, name, address, phone, image_uri, is_dirty) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [id, userId, name, address, phone, image_uri]
  );
};

export const updateShop = async (id: string, name: string, address: string, phone: string, image_uri: string = '') => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  return await execute(
    'UPDATE shops SET name = ?, address = ?, phone = ?, image_uri = ?, updated_at = CURRENT_TIMESTAMP, is_dirty = 1 WHERE id = ? AND user_id = ?',
    [name, address, phone, image_uri, id, userId]
  );
};

export const deleteShop = async (id: string) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  // Soft delete all nested entities explicitly so they sync as deleted
  await execute('UPDATE transactions SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ? AND user_id = ?)', [id, userId]);
  await execute('UPDATE payments SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ? AND user_id = ?)', [id, userId]);
  await execute('UPDATE products SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE shop_id = ? AND user_id = ?', [id, userId]);
  await execute('UPDATE customers SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE shop_id = ? AND user_id = ?', [id, userId]);

  return await execute('UPDATE shops SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [id, userId]);
};
