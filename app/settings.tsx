import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform, StatusBar, TextInput, Modal, Linking, TouchableWithoutFeedback, Image, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../context/AuthContext';
import { syncData } from '../utils/sync';
import { BottomModal } from '../components/ui/BottomModal';

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  headerSubtitle: { fontSize: sfs(20), marginTop: 2 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 32 },
  profileAvatar: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  avatarText: { color: 'white', fontSize: sfs(16), fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: sfs(18), fontWeight: 'bold', marginBottom: 2 },
  section: { marginBottom: 32 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 4, marginBottom: 16 },
  sectionTitle: { fontSize: sfs(20), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  upcomingBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  upcomingText: { fontSize: sfs(16), fontWeight: 'bold', textTransform: 'uppercase' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingLabel: { fontSize: sfs(12), fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center' },
  settingValue: { fontSize: sfs(16), marginRight: 8 },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: sfs(16), fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  modalImageSection: { alignItems: 'center', marginBottom: 24 },
  modalImageWrapper: { width: 100, height: 100, position: 'relative' },
  modalImageBox: { width: '100%', height: '100%', borderRadius: 16, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  modalPreviewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  editIconBadge: { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white', zIndex: 10 },
  removePhotoBtn: { paddingVertical: 4 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: sfs(12), marginBottom: 8, fontWeight: '700', color: theme.colors.textSecondary, opacity: 0.9 },
  modalInput: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: sfs(16) },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.colors.border, alignSelf: 'center', borderRadius: 2, marginBottom: 16 },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'transparent', marginBottom: 12 },
  langText: { fontSize: sfs(16) },
  fontSizeContainer: { flexDirection: 'row', borderRadius: 20, padding: 4, justifyContent: 'space-between' },
  fontSizeOption: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, gap: 4 },
  fontSizeLabel: { fontSize: sfs(12), fontWeight: 'bold' },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountCardBody: {
    flex: 1,
  },
  accountCardTitle: {
    fontSize: sfs(16),
    fontWeight: '700',
    marginBottom: 2,
  },
  accountCardSub: {
    fontSize: sfs(13),
    opacity: 0.8,
  },
});

export default function Settings() {
  const { theme, mode, toggleTheme, fontSizeMultiplier, setFontSizeMultiplier, sfs } = useTheme();
  const { showToast } = useToast();
  const styles = getStyles(theme, sfs);
  const { language, setLanguage } = useLanguage();
  const { userProfile, updateProfile } = useAppContext();
  const { user, isGuest, signOut, deleteAccount, reauthenticateAndDelete } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isConfirmRemoveVisible, setConfirmRemoveVisible] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);

  const [newName, setNewName] = useState(userProfile?.name || '');
  const [newImageUri, setNewImageUri] = useState<string | null>(userProfile?.image_uri || null);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isClearCacheVisible, setClearCacheVisible] = useState(false);
  const [isLogoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const isPasswordProvider = user?.providerData.some((p: any) => p.providerId === 'password');

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('settings.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) { setNewImageUri(result.assets[0].uri); }
  };

  const handleSaveProfile = async () => {
    if (!newName.trim()) return;
    try {
      await updateProfile(newName.trim(), newImageUri || '');
      setProfileModalVisible(false);
      setSuccessVisible(true);
    } catch (e) { Alert.alert(t('common.error'), t('common.error')); }
  };

  const handleRemovePhotoConfirm = () => {
    setNewImageUri(null);
    setConfirmRemoveVisible(false);
  };



  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      if (FileSystem.cacheDirectory) {
        const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
        for (const file of files) {
          try {
            await FileSystem.deleteAsync(FileSystem.cacheDirectory + file, { idempotent: true });
          } catch (e) {
            console.warn('Failed to delete cache file:', file);
          }
        }
      }
      setClearCacheVisible(false);
      showToast(t('settings.cacheCleared'), 'success');
    } catch (e) {
      console.error('Failed to clear cache', e);
      showToast(t('settings.cacheError'), 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSyncData = async () => {
    if (isGuest) {
      Alert.alert(t('auth.loginRequired'), t('auth.loginRequiredMsg'));
      return;
    }
    setIsSyncing(true);
    try {
      await syncData();
      showToast(t('auth.syncSuccess'), 'success');
    } catch (e) {
      showToast(t('auth.syncError'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const SettingItem = useCallback(({ icon, label, value, onPress, rightElement, disabled, iconColor, iconBg }: any) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.surface, opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg || theme.colors.primary + '15' }]}>
          <Ionicons name={icon} size={sfs(24)} color={iconColor || theme.colors.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary, fontSize: sfs(16) }]}>{label}</Text>
      </View>
      {rightElement ? rightElement : (
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, { color: theme.colors.textSecondary, fontSize: sfs(14) }]}>{value}</Text>
          <Ionicons name="chevron-forward" size={sfs(24)} color={theme.colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  ), [theme.colors.surface, theme.colors.primary, theme.colors.textPrimary, theme.colors.textSecondary, theme.colors.textMuted, sfs]);

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
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontSize: sfs(28) }]}>{t('settings.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary, fontSize: sfs(14) }]}>{t('settings.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('auth.accountManagement').toUpperCase()}</Text>
          <SettingItem
            icon="person-outline"
            label={t('auth.profile')}
            value={userProfile?.name || t('auth.editProfile')}
            onPress={() => router.push('/profile')}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('settings.preferences')}</Text>
          <SettingItem icon="moon-outline" label={t('settings.darkMode')} rightElement={<Switch value={mode === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: theme.colors.primary }} thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'} />} />
          <SettingItem icon="language-outline" label={t('settings.language')} value={language === 'en' ? t('settings.english') : t('settings.bengali')} onPress={() => setLanguageModalVisible(true)} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('settings.fontSize')}</Text>
          <View style={[styles.fontSizeContainer, { backgroundColor: theme.colors.surface }]}>
            {[
              { label: t('settings.fontSizeSmall'), multiplier: 0.75, icon: 'text-outline', size: 14 },
              { label: t('settings.fontSizeNormal'), multiplier: 0.85, icon: 'text', size: 18 },
              { label: t('settings.fontSizeLarge'), multiplier: 1.0, icon: 'text', size: 22 },
            ].map((item) => (
              <TouchableOpacity
                key={item.multiplier}
                style={[
                  styles.fontSizeOption,
                  Math.abs(fontSizeMultiplier - item.multiplier) < 0.01 && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setFontSizeMultiplier(item.multiplier)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={sfs(item.size)}
                  color={Math.abs(fontSizeMultiplier - item.multiplier) < 0.01 ? 'white' : theme.colors.textPrimary}
                />
                <Text style={[
                  styles.fontSizeLabel,
                  { color: Math.abs(fontSizeMultiplier - item.multiplier) < 0.01 ? 'white' : theme.colors.textSecondary }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('settings.dataManagement')}</Text>
          <SettingItem
            icon="sync-outline"
            label={isSyncing ? t('auth.syncing') : t('auth.cloudSync')}
            value={t('auth.syncDesc')}
            onPress={handleSyncData}
            disabled={isSyncing}
            rightElement={isSyncing ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
          />
          <SettingItem
            icon="trash-outline"
            label={t('settings.clearCache')}
            value={t('settings.cleanSpace')}
            onPress={() => setClearCacheVisible(true)}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('settings.developerCredits')}</Text>
          <SettingItem
            icon="school-outline"
            label={t('settings.startTutorial')}
            value={t('settings.restartTutorialDesc')}
            onPress={() => router.push('/tutorial')}
          />
          <SettingItem
            icon="rocket-outline"
            label={t('settings.upcomingUpdates')}
            value={t('settings.viewRoadmap')}
            onPress={() => router.push('/upcoming')}
          />
          <SettingItem icon="code-slash-outline" label={t('settings.developedBy')} value="Nurul Hudda" onPress={() => Linking.openURL('https://t.me/nurulhudda247')} />
          <SettingItem icon="logo-github" label={t('settings.github')} value="nurulhudda247" onPress={() => Linking.openURL('https://github.com/nurulhudda247')} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('auth.accountManagement').toUpperCase()}</Text>

          <TouchableOpacity
            style={[styles.accountCard, { backgroundColor: theme.colors.surface, opacity: isGuest ? 0.5 : 1 }]}
            onPress={() => setLogoutConfirmVisible(true)}
            activeOpacity={0.7}
            disabled={isGuest}
          >
            <View style={[styles.accountIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="log-out" size={sfs(24)} color={theme.colors.primary} />
            </View>
            <View style={styles.accountCardBody}>
              <Text style={[styles.accountCardTitle, { color: theme.colors.textPrimary, fontSize: sfs(16) }]}>{t('auth.logout')}</Text>
              <Text style={[styles.accountCardSub, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('auth.logoutSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={sfs(20)} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accountCard, { backgroundColor: theme.colors.danger + '08', borderColor: theme.colors.danger + '20', borderWidth: 1, opacity: isGuest ? 0.5 : 1 }]}
            onPress={() => setDeleteConfirmVisible(true)}
            activeOpacity={0.7}
            disabled={isGuest}
          >
            <View style={[styles.accountIconContainer, { backgroundColor: theme.colors.danger + '15' }]}>
              <Ionicons name="trash-sharp" size={sfs(24)} color={theme.colors.danger} />
            </View>
            <View style={styles.accountCardBody}>
              <Text style={[styles.accountCardTitle, { color: theme.colors.danger, fontSize: sfs(16) }]}>{t('auth.deleteAccount')}</Text>
              <Text style={[styles.accountCardSub, { color: theme.colors.danger + '80', fontSize: sfs(13) }]}>{t('auth.deleteAccountSub')}</Text>
            </View>
            <Ionicons name="warning-outline" size={sfs(20)} color={theme.colors.danger + '60'} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}><Text style={[styles.footerText, { color: theme.colors.textMuted }]}>{t('settings.appFooter', { version: Constants.expoConfig?.version || '1.2.0' })}</Text></View>
      </ScrollView>

      {/* PROFILE EDIT MODAL */}
      <BottomModal visible={isProfileModalVisible} onClose={() => setProfileModalVisible(false)}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('settings.editProfile')}</Text>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                  <Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalImageSection}>
                <TouchableOpacity style={styles.modalImageWrapper} onPress={handlePickImage} activeOpacity={0.8}>
                  <View style={[styles.modalImageBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    {newImageUri ? (
                      <Image source={{ uri: newImageUri }} style={styles.modalPreviewImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera-outline" size={sfs(24)} color={theme.colors.textMuted} />
                      </View>
                    )}
                  </View>
                  <View style={[styles.editIconBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
                    <Ionicons name="pencil" size={sfs(24)} color="white" />
                  </View>
                </TouchableOpacity>
                {newImageUri && (
                  <TouchableOpacity onPress={() => setConfirmRemoveVisible(true)} style={styles.removePhotoBtn}>
                    <Text style={{ color: theme.colors.danger, fontWeight: '600', marginTop: 12 }}>{t('shop.removePhoto')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('settings.yourName')}</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.textPrimary,
                      borderColor: isNameFocused ? theme.colors.primary : theme.colors.border
                    },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                  ]}
                  value={newName}
                  onChangeText={setNewName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                />
              </View>
              <Button title={t('common.save')} onPress={handleSaveProfile} />
      </BottomModal>


      {/* CONFIRM REMOVE PHOTO */}
      <ConfirmModal
        visible={isConfirmRemoveVisible}
        title={t('settings.removePhotoTitle')}
        message={t('settings.removePhotoMsg')}
        onConfirm={handleRemovePhotoConfirm}
        onCancel={() => setConfirmRemoveVisible(false)}
      />

      {/* LANGUAGE MODAL */}
      <BottomModal visible={isLanguageModalVisible} onClose={() => setLanguageModalVisible(false)}>
        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('settings.selectLanguage')}</Text><TouchableOpacity onPress={() => setLanguageModalVisible(false)}><Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} /></TouchableOpacity></View><TouchableOpacity style={[styles.langOption, language === 'en' && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]} onPress={() => { setLanguage('en'); setLanguageModalVisible(false); }}><Text style={[styles.langText, { color: theme.colors.textPrimary }, language === 'en' && { color: theme.colors.primary, fontWeight: 'bold' }]}>{t('settings.english')}</Text>{language === 'en' && <Ionicons name="checkmark-circle" size={sfs(24)} color={theme.colors.primary} />}</TouchableOpacity><TouchableOpacity style={[styles.langOption, language === 'bn' && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]} onPress={() => { setLanguage('bn'); setLanguageModalVisible(false); }}><Text style={[styles.langText, { color: theme.colors.textPrimary }, language === 'bn' && { color: theme.colors.primary, fontWeight: 'bold' }]}>{t('settings.bengali')}</Text>{language === 'bn' && <Ionicons name="checkmark-circle" size={sfs(24)} color={theme.colors.primary} />}</TouchableOpacity>
      </BottomModal>

      <ConfirmModal
        visible={isSuccessVisible}
        title={t('common.success')}
        message={t('settings.profileUpdated')}
        type="success"
        showCancel={false}
        confirmText="OK"
        onConfirm={() => setSuccessVisible(false)}
      />

      <ConfirmModal
        visible={isClearCacheVisible}
        title={t('settings.clearCacheTitle')}
        message={t('settings.clearCacheMsg')}
        confirmText={isClearing ? t('common.loading') : t('settings.clearNow')}
        onConfirm={handleClearCache}
        onCancel={() => setClearCacheVisible(false)}
        type="warning"
      />

      <ConfirmModal
        visible={isLogoutConfirmVisible}
        title={t('auth.logout')}
        message={t('auth.logoutMsg')}
        confirmText={t('auth.logout')}
        onConfirm={async () => { setLogoutConfirmVisible(false); await signOut(); router.replace('/(auth)/login'); }}
        onCancel={() => setLogoutConfirmVisible(false)}
        type="danger"
        icon="log-out-outline"
      />

      <BottomModal visible={isDeleteConfirmVisible} onClose={() => { setDeleteConfirmVisible(false); setDeletePassword(''); }}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.danger }]}>{t('auth.deleteAccount')}</Text>
          <TouchableOpacity onPress={() => { setDeleteConfirmVisible(false); setDeletePassword(''); }}>
            <Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.danger + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="warning-outline" size={32} color={theme.colors.danger} />
            </View>
            <Text style={{ color: theme.colors.textPrimary, fontSize: sfs(16), textAlign: 'center', lineHeight: 24 }}>
              {t('auth.deleteAccountMsg', 'This action cannot be undone. All your data will be permanently deleted.')}
            </Text>
          </View>

          {isPasswordProvider && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(14), marginBottom: 8 }}>{t('auth.password')}</Text>
              <TextInput
                style={{ height: 56, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 16, color: theme.colors.textPrimary, fontSize: sfs(16), backgroundColor: theme.colors.background }}
                placeholder={t('auth.enterPassword', 'Enter your password')}
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
              />
            </View>
          )}

          <Button 
            title={isDeleteLoading ? t('common.loading', 'Loading...') : t('common.delete', 'Delete')} 
            onPress={async () => {
              if (isPasswordProvider && !deletePassword) {
                showToast(t('auth.passwordRequired', 'Please enter your password'), 'warning');
                return;
              }
              setIsDeleteLoading(true);
              try {
                await reauthenticateAndDelete(deletePassword);
                setDeleteConfirmVisible(false);
                showToast(t('auth.accountDeleted', 'Account deleted'), 'success');
                router.replace('/(auth)/register');
              } catch (e: any) {
                console.error(e);
                if (e?.code === 'auth/wrong-password') {
                  showToast(t('auth.wrongPassword', 'Incorrect password'), 'error');
                } else if (e?.code === 'auth/requires-recent-login') {
                  showToast(t('auth.requiresRecentLogin', 'Please log out and log back in to delete your account.'), 'error');
                } else if (e?.message === 'Google reauthentication failed') {
                  showToast(t('auth.reauthFailed', 'Google authentication failed or was cancelled'), 'error');
                } else {
                  showToast(t('common.error'), 'error');
                }
              } finally {
                setIsDeleteLoading(false);
              }
            }} 
            variant="danger"
            disabled={isDeleteLoading}
          />
        </View>
      </BottomModal>

    </View>
  );
}


