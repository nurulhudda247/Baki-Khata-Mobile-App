import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { initDb, queryFirst, execute, generateUUID, getCurrentUserId } from '../database/db';
import { syncData } from '../utils/sync';
import { useAuth } from './AuthContext';

interface UserProfile {
  id: string;
  name: string;
  image_uri?: string;
  language: string;
  theme: string;
  has_seen_tutorial?: number;
}

interface AppContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  refreshUserProfile: () => Promise<void>;
  updateProfile: (name: string, imageUri?: string, explicitRole?: string) => Promise<void>;
  updateSettings: (settings: { theme?: string; language?: string }) => Promise<void>;
  completeTutorial: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isGuest, activeProfile } = useAuth();
  const currentRole = activeProfile || 'personal';
  const appState = useRef(AppState.currentState);

  const refreshUserProfile = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;
      
      // Isolated Fetch: Always include role/activeProfile in query
      const profile = await queryFirst<UserProfile>(
        'SELECT * FROM user_profile WHERE user_id = ? AND role = ?', 
        [userId, currentRole]
      );
      
      if (profile) {
        setUserProfile(profile);
      } else {
        // Check if they've seen the tutorial in ANY other role first
        const globalStatus = await queryFirst<{ has_seen_tutorial: number }>(
          'SELECT MAX(has_seen_tutorial) as seen FROM user_profile WHERE user_id = ?',
          [userId]
        );
        const hasSeen = globalStatus?.seen || 0;

        // Fallback: If no isolated profile exists, create a default one
        const id = generateUUID();
        const defaultName = user?.displayName || (currentRole === 'shopkeeper' ? 'Merchant' : 'User');
        await execute(
          'INSERT INTO user_profile (id, user_id, role, name, image_uri, has_seen_tutorial, is_dirty) VALUES (?, ?, ?, ?, ?, ?, 1)', 
          [id, userId, currentRole, defaultName, user?.photoURL || '', hasSeen]
        );
        const newProfile = await queryFirst<UserProfile>(
          'SELECT * FROM user_profile WHERE user_id = ? AND role = ?', 
          [userId, currentRole]
        );
        setUserProfile(newProfile);
      }
    } catch (e) {
      console.error('Failed to fetch user profile', e);
    }
  };

  const updateProfile = async (name: string, imageUri?: string, explicitRole?: string) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('UpdateProfile: No User ID found');
        return;
      }

      const roleToUpdate = explicitRole || currentRole;
      console.log(`Updating profile for user: ${userId}, role: ${roleToUpdate}`);

      // Check if profile exists first to avoid conflict on INSERT after failed UPDATE
      const existing = await queryFirst(
        'SELECT id FROM user_profile WHERE user_id = ? AND role = ?',
        [userId, roleToUpdate]
      );

      if (existing) {
        await execute(
          'UPDATE user_profile SET name = ?, image_uri = ?, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND role = ?',
          [name, imageUri || '', userId, roleToUpdate]
        );
      } else {
        // Check if they've seen the tutorial in ANY other role first
        const globalStatus = await queryFirst<{ has_seen_tutorial: number }>(
          'SELECT MAX(has_seen_tutorial) as seen FROM user_profile WHERE user_id = ?',
          [userId]
        );
        const hasSeen = globalStatus?.seen || 0;

        const id = generateUUID();
        await execute(
          'INSERT INTO user_profile (id, user_id, role, name, image_uri, has_seen_tutorial, is_dirty) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [id, userId, roleToUpdate, name, imageUri || '', hasSeen]
        );
      }
      
      await refreshUserProfile();
      syncData(); // Trigger background sync
      console.log('Profile updated successfully');
    } catch (e) {
      console.error('CRITICAL: Failed to update profile:', e);
      throw e;
    }
  };

  const updateSettings = async (settings: { theme?: string; language?: string }) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const fields = [];
      const values = [];

      if (settings.theme) {
        fields.push('theme = ?');
        values.push(settings.theme);
      }
      if (settings.language) {
        fields.push('language = ?');
        values.push(settings.language);
      }

      if (fields.length === 0) return;

      await execute(
        `UPDATE user_profile SET ${fields.join(', ')}, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND role = ?`,
        [...values, userId, currentRole]
      );
      await refreshUserProfile();
      syncData(); // Trigger background sync
    } catch (e) {
      console.error('Failed to update settings in DB', e);
    }
  };

  const completeTutorial = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;
      
      // Mark seen for ALL roles of this user to prevent seeing it again when switching profiles
      await execute(
        'UPDATE user_profile SET has_seen_tutorial = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', 
        [userId]
      );
      await refreshUserProfile();
      syncData(); // Trigger background sync
    } catch (e) {
      console.error('Failed to complete tutorial', e);
      throw e;
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        await initDb();
        await refreshUserProfile();
      } catch (e) {
        console.error('Initialization error', e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Listen to auth state changes AND activeProfile switches to fetch correct profile data
  useEffect(() => {
    if (user && !isGuest) {
      const loadUserData = async () => {
        await refreshUserProfile();
        await syncData();
        await refreshUserProfile();
      };
      loadUserData();
    } else if (!user && isGuest) {
      refreshUserProfile();
    } else if (!user && !isGuest) {
      setUserProfile(null);
    }
  }, [user, isGuest, activeProfile]);

  // Periodic and Background Sync Logic
  useEffect(() => {
    if (!user || isGuest) return;

    // 1. Sync on foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground, triggering sync...');
        syncData();
      }
      appState.current = nextAppState;
    });

    // 2. Periodic sync every 24 hours
    const syncInterval = setInterval(() => {
      console.log('Triggering periodic sync...');
      syncData();
    }, 24 * 60 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(syncInterval);
    };
  }, [user, isGuest]);

  return (
    <AppContext.Provider value={{ userProfile, isLoading, setUserProfile, refreshUserProfile, updateProfile, updateSettings, completeTutorial }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
