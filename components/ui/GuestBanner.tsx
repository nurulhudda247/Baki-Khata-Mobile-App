import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export const GuestBanner = () => {
  const { theme, sfs } = useTheme();
  const { t } = useTranslation();
  const { isGuest } = useAuth();
  const router = useRouter();

  if (!isGuest) return null;

  return (
    <TouchableOpacity 
      style={[styles.guestBanner, { backgroundColor: theme.colors.primary }]}
      onPress={() => router.replace('/(auth)/login')}
      activeOpacity={0.9}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.guestBannerTitle, { fontSize: sfs(16) }]}>{t('auth.guestDataSync')}</Text>
        <Text style={[styles.guestBannerSubtitle, { fontSize: sfs(12) }]}>{t('auth.joinCommunitySub')}</Text>
      </View>
      <View style={styles.syncBtn}>
        <Text style={[styles.syncBtnText, { color: theme.colors.primary, fontSize: sfs(13) }]}>{t('auth.signUp')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  guestBanner: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  guestBannerTitle: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
  },
  guestBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  syncBtnText: {
    fontFamily: 'Inter_700Bold',
  },
});
