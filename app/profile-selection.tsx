import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, BackHandler, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '../context/ToastContext';

const getStyles = (theme: Theme, sfs: (s: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    lineHeight: 20,
  }
});

import { Theme } from './constants/darkTheme';

export default function ProfileSelection() {
  const { theme, sfs, mode } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const { setActiveProfile, user, isGuest, activeProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const onBackPress = () => {
      if (isGuest && !activeProfile) {
        return true; // Disable back button for guests without profile
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [isGuest, activeProfile]);

  React.useEffect(() => {
    if (isGuest && activeProfile) {
      // Show explanation why they are being redirected
      Alert.alert(
        t('auth.guestProfileLocked'),
        t('auth.guestProfileLockedMsg'),
        [{ 
          text: t('common.ok'), 
          onPress: () => router.replace(activeProfile === 'shopkeeper' ? '/(shopkeeper)' : '/personal-dashboard') 
        }]
      );
    }
  }, [isGuest, activeProfile]);

  const handleSelect = async (profile: 'shopkeeper' | 'personal') => {
    if (isGuest && activeProfile && activeProfile !== profile) {
      Alert.alert(
        t('auth.guestProfileLocked'),
        t('auth.guestProfileLockedMsg'),
        [{ 
          text: t('common.ok'), 
          onPress: () => router.replace(activeProfile === 'shopkeeper' ? '/(shopkeeper)' : '/personal-dashboard') 
        }]
      );
      return;
    }

    await setActiveProfile(profile);
    if (profile === 'shopkeeper') {
      router.replace('/(shopkeeper)');
    } else {
      router.replace('/personal-dashboard');
    }
  };

  const isDark = mode === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: sfs(28) }]}>
            {t('auth.chooseProfile') || 'Choose Profile'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: sfs(16) }]}>
            {t('auth.profileSelectionDesc') || 'Select which account you want to access today'}
          </Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {/* BUSINESS PROFILE */}
          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleSelect('shopkeeper')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#4834D4', '#686DE0']}
                style={styles.iconContainer}
              >
                <Ionicons name="business" size={sfs(32)} color={theme.colors.white} />
              </LinearGradient>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, fontSize: sfs(18) }]}>
                  {t('auth.businessManager')}
                </Text>
                <Text style={[styles.cardDesc, { color: theme.colors.textMuted, fontSize: sfs(14) }]}>
                  {t('auth.businessProfileDesc') || 'Manage shop, customers and inventory'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={sfs(24)} color={theme.colors.border} />
            </TouchableOpacity>
          </Animated.View>

          {/* PERSONAL PROFILE */}
          <Animated.View entering={FadeInDown.delay(600).duration(800)}>
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleSelect('personal')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6C5CE7', '#A29BFE']}
                style={styles.iconContainer}
              >
                <Ionicons name="person" size={sfs(32)} color={theme.colors.white} />
              </LinearGradient>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, fontSize: sfs(18) }]}>
                  {t('auth.personalLedger')}
                </Text>
                <Text style={[styles.cardDesc, { color: theme.colors.textMuted, fontSize: sfs(14) }]}>
                  {t('auth.personalProfileDesc') || 'Track your own expenses and dues'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={sfs(24)} color={theme.colors.border} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

