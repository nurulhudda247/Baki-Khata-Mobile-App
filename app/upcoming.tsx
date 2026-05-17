import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  sectionTitle: {
    fontSize: sfs(16), fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
    marginLeft: 4,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: sfs(20), fontWeight: 'bold', marginBottom: 4 },
  featureDesc: { fontSize: sfs(16), lineHeight: sfs(24) },
  requestBox: {
    marginTop: 24,
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
  },
  requestTitle: { fontSize: sfs(20), fontWeight: 'bold', marginBottom: 8 },
  requestSubtitle: { fontSize: sfs(16), marginBottom: 24, lineHeight: sfs(24) },
});

export default function UpcomingFeatures() {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const UPCOMING_FEATURES = [
    { id: 1, title: t('upcoming.features.unifiedSync.title'), description: t('upcoming.features.unifiedSync.desc'), icon: 'sync-circle' },
    { id: 2, title: t('upcoming.features.reminders.title'), description: t('upcoming.features.reminders.desc'), icon: 'notifications-circle' },
    { id: 3, title: t('upcoming.features.multiShop.title'), description: t('upcoming.features.multiShop.desc'), icon: 'business-outline' },
  ];

  const handleRequestFeature = () => {
    const email = 'nurulhudda247@gmail.com';
    const subject = 'Baki Khata: Feature Request';
    const body = 'Hi Developer,\n\nI have a suggestion for a new feature:\n\n';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: theme.colors.surface }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={sfs(24)} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{t('upcoming.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{t('upcoming.subtitle')}</Text>
        
        {UPCOMING_FEATURES.map((feature) => (
          <View key={feature.id} style={[styles.featureCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name={feature.icon as any} size={sfs(24)} color={theme.colors.primary} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>{feature.title}</Text>
              <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>{feature.description}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.requestBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={[styles.iconContainer, { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.primary + '15', marginRight: 12 }]}>
              <Ionicons name="logo-github" size={sfs(24)} color={theme.colors.primary} />
            </View>
            <Text style={[styles.requestTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>{t('upcoming.downloadVersions')}</Text>
          </View>
          <Text style={[styles.requestSubtitle, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
            {t('upcoming.downloadDesc')}
          </Text>
          <Button 
            title={t('upcoming.downloadVersions')} 
            onPress={() => Linking.openURL('https://github.com/nurulhudda247/Baki-Khata-Mobile-App/releases')}
          />
        </View>

        <View style={[styles.requestBox, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
          <Text style={[styles.requestTitle, { color: theme.colors.primary }]}>{t('upcoming.requestTitle')}</Text>
          <Text style={[styles.requestSubtitle, { color: theme.colors.textSecondary }]}>
            {t('upcoming.requestSubtitle')}
          </Text>
          <Button 
            title={t('upcoming.submitRequest')} 
            onPress={handleRequestFeature}
            variant="outline"
          />
        </View>
      </ScrollView>
    </View>
  );
}
