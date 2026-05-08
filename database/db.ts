import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCHEMA } from './schema';

let db: any = null;
let SQLite: any = null;

const getSQLite = () => {
  if (!SQLite && Platform.OS !== 'web') {
    SQLite = require('expo-sqlite');
  }
  return SQLite;
};

export const getDb = async () => {
  if (Platform.OS === 'web') return null;
  if (db) return db;
  const sql = getSQLite();
  if (!sql) return null;
  db = await sql.openDatabaseAsync('bakikhata.db');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA synchronous = NORMAL;');
  return db;
};

export const initDb = async () => {
  if (Platform.OS === 'web') {
    console.log('Running on Web: Skipping SQLite initialization');
    return;
  }
  const database = await getDb();
  if (database) {
    await database.execAsync(SCHEMA);

    // Migration: Add category to products if it doesn't exist
    try {
      await database.execAsync('ALTER TABLE products ADD COLUMN category TEXT DEFAULT "Other"');
    } catch (e) {
      // Column might already exist
    }

    console.log('Database initialized successfully');
  }
};

// --- WEB MOCK LOGIC ---
const WEB_STORAGE_KEY = 'bakikhata_web_db_v2';
const getWebData = async () => {
  const data = await AsyncStorage.getItem(WEB_STORAGE_KEY);
  return data ? JSON.parse(data) : {
    user_profile: [],
    shops: [],
    customers: [],
    products: [],
    transactions: [],
    payments: []
  };
};

const saveWebData = async (data: any) => {
  await AsyncStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(data));
};

export const queryAll = async <T>(sql: string, params: any[] = []): Promise<T[]> => {
  if (Platform.OS === 'web') {
    const data = await getWebData();
    const s = sql.toLowerCase();

    if (s.includes('from shops')) {
      const shops = data.shops.map((shop: any) => {
        const shopCustomers = data.customers.filter((c: any) => String(c.shop_id) === String(shop.id));
        let total_baki = 0;
        shopCustomers.forEach((customer: any) => {
          const trans = data.transactions.filter((t: any) => String(t.customer_id) === String(customer.id));
          const pay = data.payments.filter((p: any) => String(p.customer_id) === String(customer.id));
          total_baki += trans.reduce((sum: number, t: any) => sum + t.total_amount, 0);
          total_baki -= pay.reduce((sum: number, p: any) => sum + p.amount, 0);
        });
        return { ...shop, total_baki };
      });
      return shops.sort((a: any, b: any) => a.name.localeCompare(b.name)) as T[];
    }
    if (s.includes('from products')) {
      const shopId = params[0];
      return data.products.filter((p: any) => String(p.shop_id) === String(shopId)) as T[];
    }
    if (s.includes('from payments')) {
      const shopId = params[0];
      const shopCustomers = data.customers.filter((c: any) => String(c.shop_id) === String(shopId));
      return data.payments.filter((p: any) => shopCustomers.some((c: any) => String(c.id) === String(p.customer_id))) as T[];
    }
    if (s.includes('from transactions')) {
      if (s.includes('join products')) {
        const shopId = params[0];
        return data.transactions
          .filter((t: any) => {
            const p = data.products.find((prod: any) => String(prod.id) === String(t.product_id));
            return p && String(p.shop_id) === String(shopId);
          })
          .map((t: any) => {
            const p = data.products.find((prod: any) => String(prod.id) === String(t.product_id));
            return { ...t, product_name: p?.name, unit: p?.unit, category: p?.category };
          }) as T[];
      }
      return data.transactions.filter((t: any) => String(t.customer_id) === String(params[0])) as T[];
    }
    return [] as T[];
  }
  const database = await getDb();
  if (!database) return [];
  return await database.getAllAsync(sql, params);
};

export const queryFirst = async <T>(sql: string, params: any[] = []): Promise<T | null> => {
  if (Platform.OS === 'web') {
    const data = await getWebData();
    const s = sql.toLowerCase();
    if (s.includes('from user_profile')) return data.user_profile[0] || null;
    if (s.includes('sum(t.total_amount)') && s.includes('c.shop_id = ?')) {
      const shopId = params[0];
      const shopCustomers = data.customers.filter((c: any) => String(c.shop_id) === String(shopId));
      let total = 0;
      shopCustomers.forEach((customer: any) => {
        const trans = data.transactions.filter((t: any) => String(t.customer_id) === String(customer.id));
        const pay = data.payments.filter((p: any) => String(p.customer_id) === String(customer.id));
        total += trans.reduce((sum: number, t: any) => sum + t.total_amount, 0);
        total -= pay.reduce((sum: number, p: any) => sum + p.amount, 0);
      });
      return { total } as T;
    }

    if (s.includes('from shops where id = ?')) {
      const shop = data.shops.find((sh: any) => String(sh.id) === String(params[0]));
      if (!shop) return null;
      const shopCustomers = data.customers.filter((c: any) => String(c.shop_id) === String(shop.id));
      let total_baki = 0;
      shopCustomers.forEach((customer: any) => {
        const trans = data.transactions.filter((t: any) => String(t.customer_id) === String(customer.id));
        const pay = data.payments.filter((p: any) => String(p.customer_id) === String(customer.id));
        total_baki += trans.reduce((sum: number, t: any) => sum + t.total_amount, 0);
        total_baki -= pay.reduce((sum: number, p: any) => sum + p.amount, 0);
      });
      return { ...shop, total_baki } as T;
    }
    if (s.includes('from products where id = ?')) {
      return data.products.find((p: any) => String(p.id) === String(params[0])) || null;
    }
    if (s.includes('from customers') && s.includes('name = ?')) {
      return data.customers.find((c: any) => String(c.shop_id) === String(params[0]) && c.name === params[1]) || null;
    }
    if (s.includes('sum(amount) as total from payments') && s.includes('payment_date like ?')) {
      const monthPrefix = params[0].replace('%', '');
      const total = data.payments
        .filter((p: any) => p.payment_date && p.payment_date.startsWith(monthPrefix))
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      return { total } as T;
    }
    return null;
  }
  const database = await getDb();
  if (!database) return null;
  return await database.getFirstAsync(sql, params);
};

export const execute = async (sql: string, params: any[] = []) => {
  if (Platform.OS === 'web') {
    const data = await getWebData();
    const s = sql.toLowerCase();
    if (s.includes('insert or replace into user_profile')) {
      data.user_profile = [{ id: 1, name: params[0], language: params[1], theme: params[2] }];
    } else if (s.includes('update user_profile')) {
      if (data.user_profile.length > 0) {
        data.user_profile[0].name = params[0];
        if (params.length > 1) data.user_profile[0].image_uri = params[1];
      } else {
        data.user_profile = [{ id: 1, name: params[0], image_uri: params[1] || '', language: 'en', theme: 'dark' }];
      }
    } else if (s.includes('insert into shops')) {
      data.shops.push({ id: Date.now(), name: params[0], address: params[1], phone: params[2], image_uri: params[3] || '' });
    } else if (s.includes('update shops')) {
      const idx = data.shops.findIndex((sh: any) => String(sh.id) === String(params[4]));
      if (idx !== -1) {
        data.shops[idx] = { ...data.shops[idx], name: params[0], address: params[1], phone: params[2], image_uri: params[3] };
      }
    } else if (s.includes('insert into customers')) {
      data.customers.push({ id: Date.now(), shop_id: params[0], name: params[1] });
    } else if (s.includes('insert into products')) {
      data.products.push({ id: Date.now(), shop_id: params[0], name: params[1], price: params[2], unit: params[3], category: params[4] || 'Other' });
    } else if (s.includes('update products')) {
      const idx = data.products.findIndex((p: any) => String(p.id) === String(params[4]));
      if (idx !== -1) data.products[idx] = { ...data.products[idx], name: params[0], price: params[1], unit: params[2], category: params[3] };
    } else if (s.includes('insert into transactions')) {
      data.transactions.push({ id: Date.now(), customer_id: params[0], product_id: params[1], quantity: params[2], unit_price: params[3], total_amount: params[4], transaction_date: params[5], created_at: new Date().toISOString(), note: params[6] });
    } else if (s.includes('insert into payments')) {
      data.payments.push({ id: Date.now(), customer_id: params[0], amount: params[1], payment_date: params[2], note: params[3], created_at: new Date().toISOString() });
    } else if (s.includes('delete from')) {
      if (s.includes('from shops')) {
        data.shops = data.shops.filter((item: any) => String(item.id) !== String(params[0]));
        // Simple cascade simulation
        const shopCustomers = data.customers.filter((c: any) => String(c.shop_id) === String(params[0]));
        const customerIds = shopCustomers.map((c: any) => String(c.id));
        data.customers = data.customers.filter((c: any) => String(c.shop_id) !== String(params[0]));
        data.products = data.products.filter((p: any) => String(p.shop_id) !== String(params[0]));
        data.transactions = data.transactions.filter((t: any) => !customerIds.includes(String(t.customer_id)));
        data.payments = data.payments.filter((p: any) => !customerIds.includes(String(p.customer_id)));
      } else if (s.includes('from products')) {
        data.products = data.products.filter((item: any) => String(item.id) !== String(params[0]));
      } else if (s.includes('from customers')) {
        data.customers = data.customers.filter((item: any) => String(item.id) !== String(params[0]));
        data.transactions = data.transactions.filter((t: any) => String(t.customer_id) !== String(params[0]));
        data.payments = data.payments.filter((p: any) => String(p.customer_id) !== String(params[0]));
      } else if (s.includes('from transactions')) {
        data.transactions = data.transactions.filter((item: any) => String(item.id) !== String(params[0]));
      } else if (s.includes('from payments')) {
        data.payments = data.payments.filter((item: any) => String(item.id) !== String(params[0]));
      }
    }
    await saveWebData(data);
    return { lastInsertRowId: Date.now(), changes: 1 };
  }
  const database = await getDb();
  if (!database) return;
  return await database.runAsync(sql, params);
};
