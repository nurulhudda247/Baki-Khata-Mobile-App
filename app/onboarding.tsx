import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { execute } from '../database/db';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: sfs(24), fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: sfs(16), textAlign: 'center',
    lineHeight: sfs(22),
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: sfs(16), fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: sfs(16), borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  startBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    color: 'white',
    fontSize: sfs(16), fontWeight: 'bold',
  },
});

export default function Onboarding() {
  const { theme, mode, setMode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { language, setLanguage } = useLanguage();
  const { refreshUserProfile } = useAppContext();
  const { t } = useTranslation();
  
  const [name, setName] = useState('');

  const handleStart = async () => {
    if (!name.trim()) return;

    try {
      await execute(
        'INSERT OR REPLACE INTO user_profile (id, name, language, theme) VALUES (1, ?, ?, ?)',
        [name.trim(), language, mode]
      );
      await refreshUserProfile();
      router.replace('/tutorial');
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={require('../assets/icon.png')} 
            style={styles.logo}
          />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t('onboarding.welcome')}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('onboarding.welcomeSub')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>{t('onboarding.enterName')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface, 
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border
            }]}
            placeholder={t('onboarding.namePlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>{t('onboarding.selectLanguage')}</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.toggleBtn, { 
                backgroundColor: language === 'bn' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border
              }]}
              onPress={() => setLanguage('bn')}
            >
              <Text style={{ color: language === 'bn' ? 'white' : theme.colors.textPrimary, fontSize: sfs(16) }}>বাংলা</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, { 
                backgroundColor: language === 'en' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border
              }]}
              onPress={() => setLanguage('en')}
            >
              <Text style={{ color: language === 'en' ? 'white' : theme.colors.textPrimary, fontSize: sfs(16) }}>English</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>{t('onboarding.selectTheme')}</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.toggleBtn, { 
                backgroundColor: mode === 'dark' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border
              }]}
              onPress={() => setMode('dark')}
            >
              <Ionicons name="moon" size={sfs(24)} color={mode === 'dark' ? 'white' : theme.colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={{ color: mode === 'dark' ? 'white' : theme.colors.textPrimary, fontSize: sfs(16) }}>{t('onboarding.dark')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, { 
                backgroundColor: mode === 'light' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border
              }]}
              onPress={() => setMode('light')}
            >
              <Ionicons name="sunny" size={sfs(24)} color={mode === 'light' ? 'white' : theme.colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={{ color: mode === 'light' ? 'white' : theme.colors.textPrimary, fontSize: sfs(16) }}>{t('onboarding.light')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.startBtn, { backgroundColor: theme.colors.primary, opacity: name.trim() ? 1 : 0.5 }]}
          disabled={!name.trim()}
          onPress={handleStart}
        >
          <Text style={styles.startBtnText}>{t('onboarding.getStarted')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


