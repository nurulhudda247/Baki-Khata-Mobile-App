import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Theme } from '../../constants/darkTheme';

const getStyles = (theme: Theme, sfs: (s: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    height: height * 0.25,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    color: theme.colors.white,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  formSection: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  button: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: theme.colors.white,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});

export default function ForgotPasswordScreen() {
  const { theme, sfs, mode } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (text: string) => {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    if (!text) {
      setEmailError('');
    } else if (reg.test(text) === false) {
      setEmailError(t('auth.invalidEmail'));
    } else {
      setEmailError('');
    }
    setEmail(text);
  };

  async function handleResetPassword() {
    if (!email) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(t('common.enterEmail'), 'error');
      return;
    }

    if (emailError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(t('common.enterValidEmail'), 'error');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await sendPasswordResetEmail(auth, email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t('common.resetLinkSent'), 'success');
      router.back();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let message = error.message || 'An error occurred';
      if (error.code === 'auth/user-not-found') {
        message = t('auth.userNotFound', 'User not found.');
      } else {
        // Clean up Firebase specific formatting
        message = message.replace(/^Firebase:\s*/i, '');
        message = message.replace(/Error\s*\([^)]+\)\.?\s*/i, '').trim();
        message = message.replace(/\([^)]+\)\.?\s*/i, '').trim();
      }
      showToast(message, 'error');
      setLoading(false);
    }
  }

  const isDark = mode === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.headerSection, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color={theme.colors.white} />
          </TouchableOpacity>
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <Text style={[styles.headerTitle, { fontSize: sfs(32) }]}>{t('auth.forgotPassword')}</Text>
            <Text style={[styles.headerSubtitle, { fontSize: sfs(15) }]}>{t('auth.enterEmailReset')}</Text>
          </Animated.View>
        </View>

        <View style={[styles.formSection, { backgroundColor: theme.colors.background }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.formContainer}
          >
            <Animated.View entering={FadeInDown.delay(300).duration(800)}>
              <FloatingLabelInput
                label={t('auth.email')}
                value={email}
                onChangeText={validateEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                error={emailError}
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleResetPassword}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={[styles.buttonText, { fontSize: sfs(16) }]}>{t('auth.resetLink')}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </View>
  );
}
