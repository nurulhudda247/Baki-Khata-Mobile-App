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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { migrateGuestData, deleteUserData, setCurrentUserId } from '../../database/db';
import { syncData } from '../../utils/sync';
import { Alert } from 'react-native';

// Configure native Google Sign-In once
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

const { height } = Dimensions.get('window');

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
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
  welcomeText: {
    fontFamily: 'Inter_700Bold',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 22,
    zIndex: 2,
  },
  showText: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: 4,
  },
  forgotText: {
    fontFamily: 'Inter_600SemiBold',
  },
  button: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonText: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
  },
  link: {
    fontFamily: 'Inter_700Bold',
  },
  guestButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  guestButtonText: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  eyeBtn: {
    padding: 8,
  },
  eyeText: {
    fontFamily: 'Inter_700Bold',
  },
  googleButton: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  guestDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontFamily: 'Inter_600SemiBold',
    fontSize: sfs(14),
    textTransform: 'uppercase',
  },
});

export default function LoginScreen() {
  const { theme, sfs, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme, sfs);
  const { continueAsGuest, signInWithGoogle } = useAuth();
  const { refreshUserProfile } = useAppContext();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const { isGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Native Google Sign-In using Google Play Services (no browser, no redirect URI)
  const signInWithGoogleNative = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (idToken) {
        await handleGoogleSignIn(idToken);
      } else {
        showToast('Google Sign-In failed: no token', 'error');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled, no action needed
      } else if (error.code === statusCodes.IN_PROGRESS) {
        showToast('Sign-In already in progress', 'error');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showToast('Google Play Services not available', 'error');
      } else {
        console.error('Google Sign-In error', error);
        showToast('Google Sign-In failed', 'error');
      }
    }
  };

  async function handleGoogleSignIn(idToken: string) {
    setLoading(true);
    try {
      await signInWithGoogle(idToken);
      await refreshUserProfile();
      
      if (isGuest) {
        Alert.alert(
          t('auth.guestDataSync', 'Sync Offline Data?'),
          t('auth.guestDataSyncMsg', 'You have offline guest data. Do you want to merge it with your account?'),
          [
            {
              text: t('common.discard', 'Discard'),
              style: 'destructive',
              onPress: async () => {
                await deleteUserData('guest');
                await syncData();
                await refreshUserProfile();
                showToast('Welcome!', 'success');
              }
            },
            {
              text: t('common.merge', 'Merge'),
              onPress: async () => {
                if (auth.currentUser) {
                  await migrateGuestData(auth.currentUser.uid);
                  await syncData();
                  await refreshUserProfile();
                  showToast('Welcome! Data synced.', 'success');
                }
              }
            }
          ]
        );
      } else {
        await syncData();
        await refreshUserProfile();
        showToast('Welcome!', 'success');
      }
    } catch (error: any) {
      showToast('Google Sign-In failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail() {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUserId(userCredential.user.uid);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (isGuest) {
        Alert.alert(
          t('auth.guestDataSync', 'Sync Offline Data?'),
          t('auth.guestDataSyncMsg', 'You have offline guest data. Do you want to merge it with your account?'),
          [
            {
              text: t('common.discard', 'Discard'),
              style: 'destructive',
              onPress: async () => {
                await deleteUserData('guest');
                await syncData();
                await refreshUserProfile();
                showToast('Welcome back!', 'success');
              }
            },
            {
              text: t('common.merge', 'Merge'),
              onPress: async () => {
                await migrateGuestData(userCredential.user.uid);
                await syncData();
                await refreshUserProfile();
                showToast('Welcome back! Data synced.', 'success');
              }
            }
          ]
        );
      } else {
        await syncData();
        await refreshUserProfile();
        showToast('Welcome back!', 'success');
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let message = error.message || 'An error occurred';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        message = t('auth.userNotFound', 'Invalid email or password.');
      } else if (error.code === 'auth/wrong-password') {
        message = t('auth.wrongPassword', 'Invalid email or password.');
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

      {/* Fixed Header Section (Background) */}
      <View style={[styles.headerSection, { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: theme.colors.primary, paddingTop: insets.top + 20, paddingBottom: 100, zIndex: 0 }]}>
        <Animated.View 
          entering={FadeInUp.delay(200).duration(800)}
          style={styles.logoContainer}
        >
          <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={styles.logo}
            tintColor="#FFF"
          />
        </Animated.View>
        <Animated.View 
          entering={FadeInUp.delay(300).duration(800)}
          style={styles.headerTextContainer}
        >
          <Text style={[styles.headerTitle, { fontSize: sfs(36) }]}>Baki Khata</Text>
          <Text style={[styles.headerSubtitle, { fontSize: sfs(16), marginBottom: 12 }]}>{t('auth.ledgerManager')}</Text>
        </Animated.View>
      </View>

      <ScrollView 
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {/* Spacer to push the form down initially so the header is visible */}
        <View style={{ height: 240 }} />

        {/* Form Section */}
        <View style={[
          styles.formSection, 
          { 
            backgroundColor: theme.colors.background, 
            borderTopLeftRadius: 40, 
            borderTopRightRadius: 40,
            zIndex: 1,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.1,
            shadowRadius: 15,
            minHeight: 600, // Ensure it covers the header when scrolled
          }
        ]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.formContainer}
          >
            <Animated.View entering={FadeInDown.delay(400).duration(800)}>
              <Text style={[styles.welcomeText, { color: theme.colors.textPrimary, fontSize: sfs(24) }]}>
                {t('auth.signIn')}
              </Text>

              <FloatingLabelInput
                label={t('auth.email')}
                value={email}
                onChangeText={(text) => {
                  const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
                  if (text && !reg.test(text)) {
                    setEmailError(t('auth.invalidEmail'));
                  } else {
                    setEmailError('');
                  }
                  setEmail(text);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                error={emailError}
              />

              <FloatingLabelInput
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Text style={[styles.eyeText, { color: theme.colors.primary, fontSize: sfs(12) }]}>
                      {showPassword ? t('auth.hide') : t('auth.show')}
                    </Text>
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotPassword}
              >
                <Text style={[styles.forgotText, { color: theme.colors.primary, fontSize: sfs(14) }]}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={signInWithEmail}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.buttonText, { fontSize: sfs(17) }]}>{t('auth.signIn')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.orDivider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, { borderColor: theme.colors.border }]}
                onPress={signInWithGoogleNative}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                  style={styles.googleIcon}
                  contentFit="contain"
                  transition={200}
                />
                <Text style={[styles.googleButtonText, { color: theme.colors.textPrimary, fontSize: sfs(16) }]}>
                  {t('auth.continueWithGoogle')}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontSize: sfs(15) }]}>
                  {t('auth.dontHaveAccount')}{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Text style={[styles.link, { color: theme.colors.primary, fontSize: sfs(15) }]}>
                    {t('auth.signUp')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.guestDivider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              </View>

              <TouchableOpacity
                onPress={async () => {
                  await continueAsGuest();
                  await refreshUserProfile();
                  router.replace('/');
                }}
                activeOpacity={0.7}
                style={[styles.guestButton, { borderColor: theme.colors.border }]}
              >
                <Text style={[styles.guestButtonText, { color: theme.colors.textPrimary, fontSize: sfs(16) }]}>
                  {t('auth.guestExplorer')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </View>
  );
}
