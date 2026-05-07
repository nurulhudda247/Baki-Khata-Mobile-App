import { queryAll, queryFirst, execute } from './db';

export interface Customer {
  id: number;
  shop_id: number;
  name: string;
  phone?: string;
  image_uri?: string;
  total_baki?: number;
  created_at: string;
}

export const getCustomersByShop = async (shopId: number): Promise<Customer[]> => {
  return await queryAll<Customer>(
    'SELECT * FROM customers WHERE shop_id = ? ORDER BY name ASC',
    [shopId]
  );
};

export const getCustomerById = async (id: number): Promise<Customer | null> => {
  return await queryFirst<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
};

export const createCustomer = async (shopId: number, name: string, phone?: string, imageUri?: string) => {
  return await execute(
    'INSERT INTO customers (shop_id, name, phone, image_uri) VALUES (?, ?, ?, ?)',
    [shopId, name, phone, imageUri]
  );
};

export const updateCustomer = async (id: number, name: string, phone?: string, imageUri?: string) => {
  return await execute(
    'UPDATE customers SET name = ?, phone = ?, image_uri = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, phone, imageUri, id]
  );
};

export const deleteCustomer = async (id: number) => {
  return await execute('DELETE FROM customers WHERE id = ?', [id]);
};

export const getSelfCustomerByShop = async (shopId: number): Promise<Customer | null> => {
  let customer = await queryFirst<Customer>(
    "SELECT * FROM customers WHERE shop_id = ? AND name = ?",
    [shopId, 'Self']
  );
  
  if (!customer) {
    await execute(
      "INSERT INTO customers (shop_id, name) VALUES (?, ?)",
      [shopId, 'Self']
    );
    customer = await queryFirst<Customer>(
      "SELECT * FROM customers WHERE shop_id = ? AND name = ?",
      [shopId, 'Self']
    );
  }
  
  return customer;
};
