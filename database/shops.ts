import { queryAll, queryFirst, execute } from './db';

export interface Shop {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  image_uri?: string;
  created_at: string;
  total_baki?: number;
}

export const getShops = async (): Promise<Shop[]> => {
  const query = `
    SELECT s.*, 
    (
      (SELECT IFNULL(SUM(t.total_amount), 0) FROM transactions t 
       JOIN customers c ON t.customer_id = c.id 
       WHERE c.shop_id = s.id) -
      (SELECT IFNULL(SUM(p.amount), 0) FROM payments p 
       JOIN customers c ON p.customer_id = c.id 
       WHERE c.shop_id = s.id)
    ) as total_baki
    FROM shops s
    ORDER BY s.name ASC
  `;
  return await queryAll<Shop>(query);
};

export const getShopById = async (id: number): Promise<Shop | null> => {
  const shop = await queryFirst<Shop>('SELECT * FROM shops WHERE id = ?', [id]);
  if (!shop) return null;

  const query = `
    SELECT (
      (SELECT IFNULL(SUM(t.total_amount), 0) FROM transactions t JOIN customers c ON t.customer_id = c.id WHERE c.shop_id = ?) -
      (SELECT IFNULL(SUM(p.amount), 0) FROM payments p JOIN customers c ON p.customer_id = c.id WHERE c.shop_id = ?)
    ) as total
  `;
  const result = await queryFirst<{ total: number }>(query, [id, id]);

  return { ...shop, total_baki: result?.total || 0 };
};

export const createShop = async (name: string, address: string = '', phone: string = '', image_uri: string = '') => {
  return await execute(
    'INSERT INTO shops (name, address, phone, image_uri) VALUES (?, ?, ?, ?)',
    [name, address, phone, image_uri]
  );
};

export const updateShop = async (id: number, name: string, address: string, phone: string, image_uri: string = '') => {
  return await execute(
    'UPDATE shops SET name = ?, address = ?, phone = ?, image_uri = ? WHERE id = ?',
    [name, address, phone, image_uri, id]
  );
};

export const deleteShop = async (id: number) => {
  // First delete transactions and payments for all customers of this shop
  // This avoids the FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT constraint
  await execute('DELETE FROM transactions WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ?)', [id]);
  await execute('DELETE FROM payments WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ?)', [id]);
  
  // Customers and Products will be deleted by CASCADE if defined, 
  // but since we are doing it manually to be safe against RESTRICT issues:
  await execute('DELETE FROM products WHERE shop_id = ?', [id]);
  await execute('DELETE FROM customers WHERE shop_id = ?', [id]);

  return await execute('DELETE FROM shops WHERE id = ?', [id]);
};
