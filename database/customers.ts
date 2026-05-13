import { queryAll, queryFirst, execute, generateUUID, getCurrentUserId } from './db';

export interface Customer {
  id: string;
  shop_id: string;
  user_id: string;
  name: string;
  phone?: string;
  image_uri?: string;
  total_baki?: number;
  created_at: string;
}

export const getCustomersByShop = async (shopId: string): Promise<Customer[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  return await queryAll<Customer>(
    'SELECT * FROM customers WHERE shop_id = ? AND user_id = ? AND is_deleted = 0 ORDER BY name ASC',
    [shopId, userId]
  );
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return await queryFirst<Customer>('SELECT * FROM customers WHERE id = ? AND user_id = ? AND is_deleted = 0', [id, userId]);
};

export const createCustomer = async (shopId: string, name: string, phone?: string, imageUri?: string) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');
  
  const id = generateUUID();
  return await execute(
    'INSERT INTO customers (id, shop_id, user_id, name, phone, image_uri, is_dirty) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [id, shopId, userId, name, phone, imageUri]
  );
};

export const updateCustomer = async (id: string, name: string, phone?: string, imageUri?: string) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');

  return await execute(
    'UPDATE customers SET name = ?, phone = ?, image_uri = ?, updated_at = CURRENT_TIMESTAMP, is_dirty = 1 WHERE id = ? AND user_id = ?',
    [name, phone, imageUri, id, userId]
  );
};

export const deleteCustomer = async (id: string) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('No user logged in');
  
  const { getCustomerBalance } = require('./payments');
  const balance = await getCustomerBalance(id);
  if (balance.netDue > 0) {
    throw new Error(`Customer has a remaining balance of ${balance.netDue}`);
  }

  await execute('UPDATE transactions SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND user_id = ?', [id, userId]);
  await execute('UPDATE payments SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND user_id = ?', [id, userId]);
  return await execute('UPDATE customers SET is_deleted = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [id, userId]);
};

export const getSelfCustomerByShop = async (shopId: string): Promise<Customer | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;

  let customer = await queryFirst<Customer>(
    "SELECT * FROM customers WHERE shop_id = ? AND name = ? AND user_id = ? AND is_deleted = 0",
    [shopId, 'Self', userId]
  );
  
  if (!customer) {
    const id = generateUUID();
    await execute(
      "INSERT INTO customers (id, shop_id, user_id, name, is_dirty) VALUES (?, ?, ?, ?, 1)",
      [id, shopId, userId, 'Self']
    );
    customer = await queryFirst<Customer>(
      "SELECT * FROM customers WHERE shop_id = ? AND name = ? AND user_id = ? AND is_deleted = 0",
      [shopId, 'Self', userId]
    );
  }
  
  return customer;
};
