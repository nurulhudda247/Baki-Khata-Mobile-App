import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme } from '../constants/darkTheme';
import { lightTheme } from '../constants/lightTheme';
import { Theme } from '../constants/darkTheme';
import { useAppContext } from './AppContext';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  fontSizeMultiplier: number;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setFontSizeMultiplier: (multiplier: number) => void;
  sfs: (size: number) => number; // Scaled Font Size helper
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(systemColorScheme === 'light' ? 'light' : 'dark');
  const [fontSizeMultiplier, setFontSizeMultiplierState] = useState<number>(0.85);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setModeState(savedTheme);
      }
      
      const savedFontSize = await AsyncStorage.getItem('fontSizeMultiplier');
      if (savedFontSize) {
        setFontSizeMultiplierState(parseFloat(savedFontSize));
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const { updateSettings } = useAppContext();

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem('themeMode', newMode);
      await updateSettings({ theme: newMode });
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const setFontSizeMultiplier = async (multiplier: number) => {
    setFontSizeMultiplierState(multiplier);
    try {
      await AsyncStorage.setItem('fontSizeMultiplier', multiplier.toString());
    } catch (e) {
      console.error('Failed to save font size', e);
    }
  };

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  const sfs = (size: number) => Math.round(size * fontSizeMultiplier);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      mode, 
      fontSizeMultiplier, 
      setMode, 
      toggleTheme, 
      setFontSizeMultiplier,
      sfs
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
