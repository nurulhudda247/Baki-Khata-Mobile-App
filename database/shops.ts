import { queryAll, queryFirst, execute, generateUUID, getCurrentUserId } from './db';

export interface Shop {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  address?: string;
  image_uri?: string;
  created_at: string;
  total_baki?: number;
  type: 'personal' | 'business';
}

export const getShops = async (type?: 'personal' | 'business'): Promise<Shop[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let query = `
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
  `;
  
  const params: any[] = [userId];
  if (type) {
    query += ` AND s.type = ?`;
    params.push(type);
  }
  
  query += ` ORDER BY s.name ASC`;
  
  return await queryAll<Shop>(query, params);
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

export const createShop = async (name: string, phone: string = '', address: string = '', image_uri: string = '', type: 'personal' | 'business' = 'personal') => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  const id = generateUUID();
  return await execute(
    'INSERT INTO shops (id, user_id, name, phone, address, image_uri, type, is_dirty) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [id, userId, name, phone, address, image_uri, type]
  );
};

export const updateShop = async (id: string, name: string, address: string = '', phone: string = '', image_uri: string = '') => {
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

export const getPrimaryShop = async (type: 'business' | 'personal'): Promise<Shop | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return await queryFirst<Shop>('SELECT * FROM shops WHERE user_id = ? AND type = ? AND is_deleted = 0 ORDER BY created_at ASC LIMIT 1', [userId, type]);
};

export const updateShopProfile = async (shopId: string, newName: string, newImageUri: string) => {
  await execute('UPDATE shops SET name = ?, image_uri = ?, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newName, newImageUri, shopId]);
};
