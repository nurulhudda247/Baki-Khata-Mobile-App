import React, { createContext, useContext, useState, useEffect } from 'react';
import { initDb, queryFirst, execute } from '../database/db';

interface UserProfile {
  id: number;
  name: string;
  phone?: string;
  image_uri?: string;
  language: string;
  theme: string;
}

interface AppContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  refreshUserProfile: () => Promise<void>;
  updateProfile: (name: string, imageUri?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserProfile = async () => {
    try {
      const profile = await queryFirst<UserProfile>('SELECT * FROM user_profile WHERE id = 1');
      setUserProfile(profile);
    } catch (e) {
      console.error('Failed to fetch user profile', e);
    }
  };

  const updateProfile = async (name: string, imageUri?: string) => {
    try {
      if (imageUri !== undefined) {
        await execute('UPDATE user_profile SET name = ?, image_uri = ? WHERE id = 1', [name, imageUri]);
      } else {
        await execute('UPDATE user_profile SET name = ? WHERE id = 1', [name]);
      }
      await refreshUserProfile();
    } catch (e) {
      console.error('Failed to update profile', e);
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

  return (
    <AppContext.Provider value={{ userProfile, isLoading, setUserProfile, refreshUserProfile, updateProfile }}>
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
