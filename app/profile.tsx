import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import * as ImagePicker from 'expo-image-picker';

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  profileHeader: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: sfs(12), marginBottom: 8, fontWeight: '700', color: theme.colors.textSecondary, opacity: 0.9 },
  input: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: sfs(16) },
  imagePickerBtn: { alignSelf: 'center' },
  imagePickerWrapper: { borderRadius: 60, overflow: 'hidden', borderWidth: 1 },
  imagePickerIcon: { position: 'absolute', bottom: 0, right: 0, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
});

export default function ProfileScreen() {
  const { theme, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { userProfile, updateProfile } = useAppContext();
  const { user, isGuest } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState(userProfile?.name || user?.displayName || '');
  const [newImageUri, setNewImageUri] = useState<string | null>(userProfile?.image_uri || user?.photoURL || null);
  const [hasChanged, setHasChanged] = useState(false);
  const [showAccountRequired, setShowAccountRequired] = useState(false);

  // Sync state when userProfile loads or changes
  React.useEffect(() => {
    if (userProfile?.name) setNewName(userProfile.name);
    else if (user?.displayName) setNewName(user.displayName);
    
    if (userProfile?.image_uri) setNewImageUri(userProfile.image_uri);
    else if (user?.photoURL) setNewImageUri(user.photoURL);
  }, [userProfile, user]);

  const handleNameChange = (text: string) => {
    setNewName(text);
    setHasChanged(true);
  };

  const handlePickImage = async () => {
    if (isGuest || !user) {
      setShowAccountRequired(true);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('shop.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setNewImageUri(result.assets[0].uri);
      setHasChanged(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await updateProfile(newName.trim(), newImageUri || '');
      showToast(t('settings.profileUpdated'), 'success');
      // Delay to allow state to settle before navigating back
      setTimeout(() => router.back(), 300);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('auth.failedUpdateProfile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{
        title: t('auth.editProfile'),
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: sfs(18) },
        headerShadowVisible: false
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
            <View style={[styles.imagePickerWrapper, { borderColor: theme.colors.border, width: 120, height: 120 }]}>
              {newImageUri ? (
                <Image source={{ uri: newImageUri }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface }}>
                  <Ionicons name="camera-outline" size={sfs(40)} color={theme.colors.textMuted} />
                </View>
              )}
            </View>
            <View style={[styles.imagePickerIcon, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background, width: 36, height: 36, bottom: 4, right: 4 }]}>
              <Ionicons name="pencil" size={sfs(18)} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {(!isGuest && user) ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.fullName').toUpperCase()}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                value={newName}
                onChangeText={handleNameChange}
                placeholder={t('onboarding.namePlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.email').toUpperCase()}</Text>
              <View style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, justifyContent: 'center', opacity: 0.7 }]}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(16) }}>
                  {user?.email || 'Guest User'}
                </Text>
              </View>
              <Text style={{ fontSize: sfs(12), color: theme.colors.textMuted, marginTop: 8, marginLeft: 4 }}>
                {t('auth.emailLockedDesc') || 'Email cannot be changed'}
              </Text>
            </View>

            <View style={{ marginTop: 24 }}>
              <Button
                title={loading ? t('auth.saving') : t('auth.saveChanges')}
                onPress={handleSaveProfile}
                disabled={loading || !newName.trim() || !hasChanged}
              />
            </View>
          </>
        ) : (
          <View style={{ marginTop: 24 }}>
            <Button
              title={t('auth.signIn', 'Sign In / Create Account')}
              onPress={() => router.push('/(auth)/login')}
            />
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={showAccountRequired}
        title={t('auth.accountRequiredTitle', 'Account Required')}
        message={t('auth.accountRequiredDesc', 'Please create an account or sign in to edit your profile.')}
        onConfirm={() => {
          setShowAccountRequired(false);
          router.push('/(auth)/login');
        }}
        onCancel={() => setShowAccountRequired(false)}
        confirmText={t('auth.signIn', 'Sign In')}
        icon="person-circle-outline"
        type="info"
      />
    </View>
  );
}

