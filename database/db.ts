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
      } catch (e) {}
    }

    try {
      await database.execAsync(`ALTER TABLE shops ADD COLUMN type TEXT DEFAULT 'personal';`);
    } catch (e) {}

    try {
      await database.execAsync(`ALTER TABLE shops ADD COLUMN phone TEXT;`);
    } catch (e) {}

    try {
      await database.execAsync(`ALTER TABLE shops ADD COLUMN address TEXT;`);
    } catch (e) {}

    try { await database.execAsync(`ALTER TABLE user_profile ADD COLUMN role TEXT DEFAULT 'personal';`); } catch (e) {}
    
    // Data Cleanup: Ensure we don't have multiple rows for the same user/role due to previous bugs
    try {
      await database.execAsync(`
        DELETE FROM user_profile 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM user_profile 
          GROUP BY user_id, IFNULL(role, 'personal')
        );
      `);
      // Update any remaining NULL roles to 'personal'
      await database.execAsync(`UPDATE user_profile SET role = 'personal' WHERE role IS NULL;`);
    } catch (e) {
      console.error('Data cleanup failed', e);
    }

    try { await database.execAsync(`ALTER TABLE transactions ADD COLUMN edit_history TEXT;`); } catch (e) {}
    try { await database.execAsync(`ALTER TABLE payments ADD COLUMN edit_history TEXT;`); } catch (e) {}

    try { await database.execAsync(`ALTER TABLE user_profile ADD COLUMN is_deleted INTEGER DEFAULT 0;`); } catch (e) {}
    try { await database.execAsync(`ALTER TABLE user_profile ADD COLUMN is_dirty INTEGER DEFAULT 0;`); } catch (e) {}
    try { await database.execAsync(`ALTER TABLE user_profile ADD COLUMN language TEXT DEFAULT 'en';`); } catch (e) {}
    try { await database.execAsync(`ALTER TABLE user_profile ADD COLUMN theme TEXT DEFAULT 'dark';`); } catch (e) {}

    try {
      await database.execAsync(`ALTER TABLE customers ADD COLUMN is_starred INTEGER DEFAULT 0;`);
    } catch (e) {}

    console.log('Database initialized successfully');
  }
};

// --- DATABASE HELPERS ---

export const queryAll = async <T>(sql: string, params: any[] = []): Promise<T[]> => {
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

export const getPendingSyncCount = async (): Promise<number> => {
  const userId = getCurrentUserId();
  if (!userId || userId === 'guest') return 0;
  
  try {
    const result = await queryFirst<{ total: number }>(`
      SELECT (
        (SELECT COUNT(*) FROM shops WHERE is_dirty = 1 AND user_id = ?) +
        (SELECT COUNT(*) FROM customers WHERE is_dirty = 1 AND user_id = ?) +
        (SELECT COUNT(*) FROM products WHERE is_dirty = 1 AND user_id = ?) +
        (SELECT COUNT(*) FROM transactions WHERE is_dirty = 1 AND user_id = ?) +
        (SELECT COUNT(*) FROM payments WHERE is_dirty = 1 AND user_id = ?) +
        (SELECT COUNT(*) FROM user_profile WHERE is_dirty = 1 AND user_id = ?)
      ) as total
    `, [userId, userId, userId, userId, userId, userId]);
    
    return result?.total || 0;
  } catch (e) {
    console.error('Failed to get sync count', e);
    return 0;
  }
};
