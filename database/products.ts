import { queryAll, queryFirst, execute, generateUUID, getCurrentUserId } from './db';

export interface Product {
  id: string;
  shop_id: string;
  user_id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  created_at: string;
}

export const getProductsByShop = async (shopId: string): Promise<Product[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  return await queryAll<Product>(
    'SELECT * FROM products WHERE shop_id = ? AND user_id = ? AND is_deleted = 0 ORDER BY category ASC, name ASC',
    [shopId, userId]
  );
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return await queryFirst<Product>('SELECT * FROM products WHERE id = ? AND user_id = ? AND is_deleted = 0', [id, userId]);
};

export const createProduct = async (shopId: string, name: string, price: number, unit: string = 'piece', category: string = 'Other') => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  const id = generateUUID();
  return await execute(
    'INSERT INTO products (id, shop_id, user_id, name, price, unit, category, is_dirty) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [id, shopId, userId, name, price, unit, category]
  );
};

export const updateProduct = async (id: string, name: string, price: number, unit: string, category: string = 'Other') => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  return await execute(
    'UPDATE products SET name = ?, price = ?, unit = ?, category = ?, updated_at = CURRENT_TIMESTAMP, is_dirty = 1 WHERE id = ? AND user_id = ?',
    [name, price, unit, category, id, userId]
  );
};

export const deleteProduct = async (id: string) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');
  
  const transactions = await queryAll<{id: string}>('SELECT id FROM transactions WHERE product_id = ? AND user_id = ? AND is_deleted = 0 LIMIT 1', [id, userId]);
  if (transactions && transactions.length > 0) {
    throw new Error('This product cannot be deleted because it has transaction history.');
  }
  
  return await execute('UPDATE products SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [id, userId]);
};

export const getAllShopkeeperProducts = async (shopType: 'business' | 'personal' = 'business'): Promise<Product[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  return await queryAll<Product>(
    `SELECT p.* FROM products p 
     JOIN shops s ON p.shop_id = s.id 
     WHERE p.user_id = ? AND s.type = ? AND p.is_deleted = 0 AND s.is_deleted = 0 
     ORDER BY p.category ASC, p.name ASC`,
    [userId, shopType]
  );
};
