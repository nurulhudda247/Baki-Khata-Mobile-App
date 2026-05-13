import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { SCHEMA } from './schema';

let db: SQLite.SQLiteDatabase | null = null;
let currentUserId: string | null = null;

export const setCurrentUserId = (id: string | null) => {
  currentUserId = id;
};

export const getCurrentUserId = () => currentUserId;

// No longer using dynamic require for SQLite

export const generateUUID = () => {
  return Crypto.randomUUID();
};

export const getDb = async () => {
  if (Platform.OS === 'web') return null;
  if (db) return db;
  
  try {
    db = await SQLite.openDatabaseAsync('bakikhata_v2.db'); // New version for UUID schema
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA synchronous = NORMAL;');
    return db;
  } catch (e) {
    console.error('Failed to open database', e);
    return null;
  }
};

export const initDb = async () => {
  if (Platform.OS === 'web') {
    console.log('Running on Web: Skipping SQLite initialization');
    return;
  }
  const database = await getDb();
  if (database) {
    await database.execAsync(SCHEMA);

    // --- Migrations: Safely add new columns to existing databases ---
    try {
      await database.execAsync(`ALTER TABLE user_profile ADD COLUMN has_seen_tutorial INTEGER DEFAULT 0;`);
    } catch (e) {}

    const tablesToMigrate = ['shops', 'customers', 'products', 'transactions', 'payments'];
    for (const table of tablesToMigrate) {
      try {
        await database.execAsync(`ALTER TABLE ${table} ADD COLUMN is_deleted INTEGER DEFAULT 0;`);
      } catch (e) {
        // Column already exists — safe to ignore
      }
    }

    try { await database.execAsync(`ALTER TABLE transactions ADD COLUMN edit_history TEXT;`); } catch (e) {}
    try { await database.execAsync(`ALTER TABLE payments ADD COLUMN edit_history TEXT;`); } catch (e) {}

    console.log('Database initialized successfully');
  }
};

// --- WEB MOCK LOGIC ---
const WEB_STORAGE_KEY = 'bakikhata_web_db_v3';
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
    // ... other web mocks would need updating too, but focusing on Native for now
    return [] as T[];
  }
  const database = await getDb();
  if (!database) return [];
  return await database.getAllAsync(sql, params);
};

export const queryFirst = async <T>(sql: string, params: any[] = []): Promise<T | null> => {
  const database = await getDb();
  if (!database) return null;
  return await database.getFirstAsync(sql, params);
};

export const execute = async (sql: string, params: any[] = []) => {
  const database = await getDb();
  if (!database) return;
  
  return await database.runAsync(sql, params);
};

export const markSynced = async (table: string, id: string) => {
  const database = await getDb();
  if (!database) return;
  await database.runAsync(`UPDATE ${table} SET is_dirty = 0 WHERE id = ?`, [id]);
};

export const deleteUserData = async (userId: string) => {
  const database = await getDb();
  if (!database) return;
  const tables = ['shops', 'customers', 'products', 'transactions', 'payments', 'user_profile'];
  
  for (const table of tables) {
    await database.runAsync(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
  }
};

export const migrateGuestData = async (newUserId: string) => {
  const database = await getDb();
  if (!database) return;
  
  const tables = ['shops', 'customers', 'products', 'transactions', 'payments', 'user_profile'];
  
  for (const table of tables) {
    try {
      if (table === 'user_profile') {
        // We never migrate the guest user_profile to prevent it from overwriting a returning user's real profile during sync.
        // For new registrations, a new profile is created right after. For logins, the real profile is pulled during sync.
        await database.runAsync(`DELETE FROM user_profile WHERE user_id = 'guest'`);
        continue;
      }
      
      // Update all rows with user_id = 'guest' to the new user ID
      // Also set is_dirty = 1 so the sync engine picks them up
      await database.runAsync(
        `UPDATE ${table} SET user_id = ?, is_dirty = 1 WHERE user_id = 'guest'`, 
        [newUserId]
      );
    } catch (e) {
      console.error(`Error migrating table ${table}:`, e);
    }
  }
  
  // Also update AsyncStorage guest status
  await AsyncStorage.removeItem('isGuest');
  console.log('Guest data migrated to user:', newUserId);
};
