import { collection, doc, setDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { getDb, queryAll, execute, markSynced, getCurrentUserId } from '../database/db';
import { parseDatabaseTimestamp } from './dateUtils';

const TABLES = ['user_profile', 'shops', 'customers', 'products', 'transactions', 'payments'];

let isSyncingInProgress = false;

export const syncData = async () => {
  if (isSyncingInProgress) {
    console.log('Skipping sync: Sync already in progress.');
    return;
  }

  const userId = getCurrentUserId();
  if (!userId || userId === 'guest') {
    console.log('Skipping sync: No user or Guest mode active.');
    return;
  }

  isSyncingInProgress = true;
  console.log('Starting sync for user:', userId);

  try {
    // 1. PUSH local changes to Firestore
    for (const table of TABLES) {
      const dirtyRows = await queryAll<any>(`SELECT * FROM ${table} WHERE is_dirty = 1 AND user_id = ?`, [userId]);
      
      for (const row of dirtyRows) {
        // Prepare data for Firestore (remove is_dirty column)
        const { is_dirty, ...firestoreRow } = row;
        
        try {
          // Use id as the document ID for consistent syncing
          const docRef = doc(db, table, String(row.id));
          await setDoc(docRef, firestoreRow, { merge: true });
          await markSynced(table, row.id);
        } catch (error) {
          console.error(`Error pushing ${table} row ${row.id}:`, error);
        }
      }
    }

    // 2. PULL changes from Firestore
    for (const table of TABLES) {
      // Get the latest updated_at from local
      const localLatest = await queryAll<{updated_at: string}>(
        `SELECT updated_at FROM ${table} WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      );
      
      // We fetch all rows for the user to avoid requiring custom composite indexes in Firestore.
      // Firestore requires manual composite index creation for combining equality (user_id) with inequality (updated_at).
      let q = query(collection(db, table), where('user_id', '==', userId));

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const database = await getDb();
        if (!database) continue; // Skip if DB not available (e.g., web)
        for (const docSnap of querySnapshot.docs) {
          const remoteRow = docSnap.data();
          
          // Conflict Resolution
          const localRow = await database.getFirstAsync<{is_dirty: number, updated_at: string}>(
            `SELECT is_dirty, updated_at FROM ${table} WHERE id = ?`,
            [remoteRow.id]
          );

          if (localRow && localRow.is_dirty === 1) {
            if (parseDatabaseTimestamp(localRow.updated_at).getTime() >= parseDatabaseTimestamp(remoteRow.updated_at).getTime()) {
              console.log(`Conflict: Keeping newer local changes for ${table} row ${remoteRow.id}`);
              continue;
            }
          }

          // Construct INSERT/REPLACE statement dynamically
          const columns = Object.keys(remoteRow);
          const placeholders = columns.map(() => '?').join(', ');
          const values = Object.values(remoteRow);
          
          await database.runAsync(
            `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
        }
      }
    }

    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    isSyncingInProgress = false;
  }
};
