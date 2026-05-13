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
import { updatePassword } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
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
  headerTitle: {
    color: '#FFF',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});

export default function ResetPasswordScreen() {
  const { theme, sfs, mode } = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword() {
    if (!password || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Please fill in both fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast('Session expired. Please request another reset link.', 'error');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(currentUser, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Password updated successfully!', 'success');
      router.replace('/');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message, 'error');
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
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <Text style={[styles.headerTitle, { fontSize: sfs(32) }]}>{t('auth.setNewPassword')}</Text>
            <Text style={[styles.headerSubtitle, { fontSize: sfs(15) }]}>{t('auth.enterNewPassword')}</Text>
          </Animated.View>
        </View>

        <View style={[styles.formSection, { backgroundColor: theme.colors.background }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.formContainer}
          >
            <Animated.View entering={FadeInDown.delay(300).duration(800)}>
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

              <FloatingLabelInput
                label={t('auth.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                rightElement={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                    <Text style={[styles.eyeText, { color: theme.colors.primary, fontSize: sfs(12) }]}>
                      {showConfirmPassword ? t('auth.hide') : t('auth.show')}
                    </Text>
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdatePassword}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.buttonText, { fontSize: sfs(16) }]}>{t('auth.updatePassword')}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </View>
  );
}
