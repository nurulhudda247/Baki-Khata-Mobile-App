import React, { useState, useEffect } from 'react';
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../utils/firebase';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppContext } from '../../context/AppContext';
import { createShop } from '../../database/shops';
import { migrateGuestData, deleteUserData, setCurrentUserId } from '../../database/db';
import { syncData } from '../../utils/sync';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';

// Configure native Google Sign-In once
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

const { height } = Dimensions.get('window');

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
    color: theme.colors.white + 'CC', // 0.8 opacity
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
  roleContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  roleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: sfs(14),
  },
  eyeBtn: {
    padding: 4,
  },
  eyeText: {
    fontFamily: 'Inter_700Bold',
  },
  button: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
    shadowColor: theme.colors.black,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
  },
  link: {
    fontFamily: 'Inter_700Bold',
  },
  googleButton: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
    marginVertical: 24,
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

export default function RegisterScreen() {
  const { theme, sfs, mode } = useTheme();
  const styles = getStyles(theme, sfs);
  const { updateProfile, refreshUserProfile } = useAppContext();
  const { isGuest, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'shopkeeper' | 'personal'>('personal');
  const [loading, setLoading] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Native Google Sign-In using Google Play Services (no browser, no redirect URI)
  const signInWithGoogleNative = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Force account picker by signing out first (local sign-out only)
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore errors if already signed out
      }
      
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (idToken) {
        await handleGoogleSignIn(idToken);
      } else {
        showToast(t('common.googleTokenError'), 'error');
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
        showToast(t('common.googleTokenError'), 'error');
      }
    }
  };

  async function handleGoogleSignIn(idToken: string) {
    const wasGuest = isGuest;
    setLoading(true);
    try {
      await signInWithGoogle(idToken, role);
      if (role === 'shopkeeper' && shopName) await createShop(shopName, '', '', '', 'business');
      await refreshUserProfile();
      
      if (wasGuest) {
        Alert.alert(
          t('auth.guestDataSync'),
          t('auth.guestDataSyncMsg'),
          [
            {
              text: t('common.discard'),
              style: 'destructive',
              onPress: async () => {
                await deleteUserData('guest');
                await syncData();
                await refreshUserProfile();
                showToast(t('common.registrationSuccess'), 'success');
                router.replace('/');
              }
            },
            {
              text: t('common.merge'),
              onPress: async () => {
                if (auth.currentUser) {
                  await migrateGuestData(auth.currentUser.uid);
                  await syncData();
                  await refreshUserProfile();
                  showToast(t('common.registrationSuccess'), 'success');
                  router.replace('/');
                }
              }
            }
          ]
        );
      } else {
        await syncData();
        await refreshUserProfile();
        showToast(t('common.registrationSuccess'), 'success');
        router.replace('/');
      }
    } catch (error: any) {
      showToast(t('common.googleTokenError'), 'error');
    } finally {
      setLoading(false);
    }
  }

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

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError(t('auth.passwordsNotMatch'));
    } else {
      setPasswordError('');
    }
  }, [password, confirmPassword]);

  const handleRoleSwitch = (newRole: 'shopkeeper' | 'personal') => {
    if (newRole !== role) {
      setRole(newRole);
      // Reset all fields
      setEmail('');
      setName('');
      setShopName('');
      setPassword('');
      setConfirmPassword('');
      setEmailError('');
      setPasswordError('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  async function signUpWithEmail() {
    if (!email || !password || !confirmPassword || !name) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(t('common.fillAllFields'), 'error');
      return;
    }

    if (emailError || passwordError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(t('common.fixErrors'), 'error');
      return;
    }

    if (role === 'shopkeeper' && !shopName) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(t('common.enterShopName'), 'error');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!auth) {
      showToast('Firebase is not connected. Please check your configuration.', 'error');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      setCurrentUserId(firebaseUser.uid);
      
      // Save role to Firestore
      if (db) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          role: role,
          name: name,
          email: email,
          createdAt: new Date().toISOString()
        });
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isGuest && firebaseUser) {
        await migrateGuestData(firebaseUser.uid);
      }
      await updateProfile(name, '');
      if (role === 'shopkeeper') await createShop(shopName, '', '', '', 'business');
      await syncData();
      await refreshUserProfile();
      showToast(t('common.registrationSuccess'), 'success');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let message = error.message || 'An error occurred';
      if (error.code === 'auth/email-already-in-use') {
        message = t('auth.emailInUse', 'This email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        message = t('auth.weakPassword', 'Password is too weak.');
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
            <Text style={[styles.headerTitle, { fontSize: sfs(32) }]}>{t('auth.createAccount')}</Text>
            <Text style={[styles.headerSubtitle, { fontSize: sfs(15) }]}>{t('auth.joinCommunitySub')}</Text>
          </Animated.View>
        </View>

        <View style={[styles.formSection, { backgroundColor: theme.colors.background }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.formContainer}
          >
            <Animated.View layout={Layout.springify()} entering={FadeInDown.delay(300).duration(800)}>
              <View style={[styles.roleContainer, { backgroundColor: isDark ? theme.colors.white + '0D' : theme.colors.black + '08' }]}>
                <TouchableOpacity 
                  onPress={() => handleRoleSwitch('personal')}
                  style={[styles.roleBtn, role === 'personal' && { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.roleText, { color: role === 'personal' ? theme.colors.white : theme.colors.textSecondary }]}>
                    {t('settings.rolePersonal')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleRoleSwitch('shopkeeper')}
                  style={[styles.roleBtn, role === 'shopkeeper' && { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.roleText, { color: role === 'shopkeeper' ? theme.colors.white : theme.colors.textSecondary }]}>
                    {t('settings.roleShopkeeper')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Animated.View layout={Layout.springify()}>
                <FloatingLabelInput
                  label={t('auth.fullName')}
                  value={name}
                  onChangeText={setName}
                />
              </Animated.View>

              <Animated.View layout={Layout.springify()}>
                <FloatingLabelInput
                  label={t('auth.email')}
                  value={email}
                  onChangeText={validateEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={emailError}
                />
              </Animated.View>

              {role === 'shopkeeper' && (
                <Animated.View entering={FadeInDown.duration(400)} exiting={FadeOutUp.duration(300)} layout={Layout.springify()}>
                  <FloatingLabelInput
                    label={t('auth.shopName')}
                    value={shopName}
                    onChangeText={setShopName}
                  />
                </Animated.View>
              )}

              <Animated.View layout={Layout.springify()}>
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
              </Animated.View>

              {password.length > 0 && (
                <Animated.View entering={FadeInDown.duration(400)} exiting={FadeOutUp.duration(300)} layout={Layout.springify()}>
                  <FloatingLabelInput
                    label={t('auth.confirmPassword')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    error={passwordError}
                    rightElement={
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                        <Text style={[styles.eyeText, { color: theme.colors.primary, fontSize: sfs(12) }]}>
                          {showConfirmPassword ? t('auth.hide') : t('auth.show')}
                        </Text>
                      </TouchableOpacity>
                    }
                  />
                </Animated.View>
              )}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={signUpWithEmail}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={theme.colors.white} /> : <Text style={[styles.buttonText, { fontSize: sfs(17) }]}>{t('auth.registerNow')}</Text>}
              </TouchableOpacity>

              <View style={styles.orDivider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>{t('common.or')}</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, { borderColor: theme.colors.border }]}
                onPress={signInWithGoogleNative}
                activeOpacity={0.7}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <>
                    <Image 
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                      style={styles.googleIcon} 
                      contentFit="contain"
                      transition={200}
                    />
                    <Text style={[styles.googleButtonText, { color: theme.colors.textPrimary, fontSize: sfs(16) }]}>
                      {t('auth.continueWithGoogle')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontSize: sfs(15) }]}>
                  {t('auth.haveAccount')}{' '}
                </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                  <Text style={[styles.link, { color: theme.colors.primary, fontSize: sfs(15) }]}>
                    {t('auth.signIn')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </View>
  );
}
