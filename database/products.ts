import { queryAll, queryFirst, execute } from './db';

export interface Product {
  id: number;
  shop_id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  created_at: string;
}

export const getProductsByShop = async (shopId: number): Promise<Product[]> => {
  return await queryAll<Product>(
    'SELECT * FROM products WHERE shop_id = ? ORDER BY category ASC, name ASC',
    [shopId]
  );
};

export const getProductById = async (id: number): Promise<Product | null> => {
  return await queryFirst<Product>('SELECT * FROM products WHERE id = ?', [id]);
};

export const createProduct = async (shopId: number, name: string, price: number, unit: string = 'piece', category: string = 'Other') => {
  return await execute(
    'INSERT INTO products (shop_id, name, price, unit, category) VALUES (?, ?, ?, ?, ?)',
    [shopId, name, price, unit, category]
  );
};

export const updateProduct = async (id: number, name: string, price: number, unit: string, category: string = 'Other') => {
  return await execute(
    'UPDATE products SET name = ?, price = ?, unit = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, price, unit, category, id]
  );
};

export const deleteProduct = async (id: number) => {
  return await execute('DELETE FROM products WHERE id = ?', [id]);
};
