import React, { createContext, useContext, useState, useEffect } from 'react';
import { initDb, queryFirst, execute, generateUUID, getCurrentUserId } from '../database/db';
import { syncData } from '../utils/sync';
import { useAuth } from './AuthContext';

interface UserProfile {
  id: string;
  name: string;
  phone?: string;
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
  updateProfile: (name: string, imageUri?: string) => Promise<void>;
  completeTutorial: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isGuest } = useAuth();

  const refreshUserProfile = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;
      const profile = await queryFirst<UserProfile>('SELECT * FROM user_profile WHERE user_id = ?', [userId]);
      setUserProfile(profile);
    } catch (e) {
      console.error('Failed to fetch user profile', e);
    }
  };

  const updateProfile = async (name: string, imageUri?: string) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const profile = await queryFirst<UserProfile>('SELECT * FROM user_profile WHERE user_id = ?', [userId]);
      
      if (profile) {
        if (imageUri !== undefined) {
          await execute('UPDATE user_profile SET name = ?, image_uri = ?, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [name, imageUri, userId]);
        } else {
          await execute('UPDATE user_profile SET name = ?, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [name, userId]);
        }
      } else {
        const id = generateUUID();
        await execute('INSERT INTO user_profile (id, user_id, name, image_uri, has_seen_tutorial, is_dirty) VALUES (?, ?, ?, ?, 1, 1)', [id, userId, name, imageUri || '']);
      }
      await refreshUserProfile();
    } catch (e) {
      console.error('Failed to update profile', e);
      throw e;
    }
  };

  const completeTutorial = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;
      await execute('UPDATE user_profile SET has_seen_tutorial = 1, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [userId]);
      await refreshUserProfile();
    } catch (e) {
      console.error('Failed to complete tutorial', e);
      throw e;
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        await initDb();
        // Initial refresh in case we are in guest mode or have local state
        await refreshUserProfile();
      } catch (e) {
        console.error('Initialization error', e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Listen to auth state changes to fetch user profile and sync data automatically
  useEffect(() => {
    if (user && !isGuest) {
      const loadUserData = async () => {
        await refreshUserProfile();
        await syncData();
        await refreshUserProfile(); // Refresh again after sync in case profile was updated
      };
      loadUserData();
    } else if (!user && isGuest) {
      refreshUserProfile();
    } else if (!user && !isGuest) {
      setUserProfile(null);
    }
  }, [user, isGuest]);

  return (
    <AppContext.Provider value={{ userProfile, isLoading, setUserProfile, refreshUserProfile, updateProfile, completeTutorial }}>
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
