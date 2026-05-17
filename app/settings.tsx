import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform, StatusBar, TextInput, Modal, Linking, TouchableWithoutFeedback, ActivityIndicator, Image } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/darkTheme';
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
import { getPrimaryShop, updateShopProfile } from '../database/shops';
import { deleteUserData, getPendingSyncCount } from '../database/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateLabel, formatTimeLabel } from '../utils/dateUtils';

const getStyles = (theme: Theme, sfs: (s: number) => number) => StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  headerSubtitle: { fontSize: sfs(20), marginTop: 2 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 32 },
  profileAvatar: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  avatarText: { color: theme.colors.white, fontSize: sfs(16), fontWeight: 'bold' },
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
  editIconBadge: { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.colors.surface, zIndex: 10 },
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
  accountCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
  accountIconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  accountCardBody: { flex: 1 },
  accountCardTitle: { fontSize: sfs(16), fontWeight: '700', marginBottom: 2 },
  accountCardSub: { fontSize: sfs(13), opacity: 0.8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuText: { fontSize: sfs(16), fontWeight: '600' },
  menuSubtext: { fontSize: sfs(12) },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default function Settings() {
  const { theme, mode, toggleTheme, fontSizeMultiplier, setFontSizeMultiplier, sfs } = useTheme();
  const { showToast } = useToast();
  const styles = getStyles(theme, sfs);
  const { language, setLanguage } = useLanguage();
  const { userProfile, updateProfile } = useAppContext();
  const { user, isGuest, signOut, deleteAccount, deleteActiveProfile, reauthenticateAndDelete, userRole, activeProfile, hasBothRoles } = useAuth();
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
  const [isLogoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isDeleteProfileVisible, setDeleteProfileVisible] = useState(false);
  const [isResetModalVisible, setResetModalVisible] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopId, setShopId] = useState<string | null>(null);
  const [isShopNameFocused, setIsShopNameFocused] = useState(false);
  const [isDeletePasswordFocused, setIsDeletePasswordFocused] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const isShopkeeper = activeProfile === 'shopkeeper';

  useEffect(() => {
    if (isShopkeeper) {
      getPrimaryShop('business').then(shop => {
        if (shop) {
          setShopId(shop.id);
          setShopName(shop.name);
        }
      });
    }
    
    const fetchSyncStatus = async () => {
      const count = await getPendingSyncCount();
      const time = await AsyncStorage.getItem('lastSyncTime');
      setPendingSyncCount(count);
      setLastSyncTime(time);
    };
    fetchSyncStatus();
  }, [isShopkeeper]);

  const isPasswordProvider = user?.providerData.some((p: any) => p.providerId === 'password');


  const handleResetGuestData = async () => {
    try {
      await deleteUserData('guest');
      await signOut();
      showToast(t('settings.resetSuccess'), 'success');
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Reset failed', e);
      showToast(t('common.error'), 'error');
    }
  };

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
    if (!result.canceled) { 
      const asset = result.assets[0];
      const uri = asset.uri;

      // Validate file size
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          const sizeMB = fileInfo.size / (1024 * 1024);
          if (sizeMB > 1) {
            showToast(t('settings.fileTooLarge'), 'warning');
            return;
          }
        }
      } catch (e) {
        console.error('Failed to get file info:', e);
      }

      // Validate file type
      const extension = uri.split('.').pop()?.toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      if (!extension || !validExtensions.includes(extension)) {
        showToast(t('settings.invalidFileType'), 'warning');
        return;
      }

      setNewImageUri(uri); 
    }
  };
  
  useEffect(() => {
    if (isProfileModalVisible) {
      // 1. Calculate the base name (prefer profile name, fallback to google name)
      const currentName = userProfile?.name || '';
      const googleName = (user?.displayName || '').trim();
      const merchantLabel = t('settings.merchant');
      const userLabel = t('settings.user');
      const baseName = (currentName === 'Merchant' || currentName === 'User' || currentName === merchantLabel || currentName === userLabel || !currentName) ? (googleName || currentName) : currentName;
      
      const initialPreset = shopName || ((isShopkeeper && (baseName === googleName || currentName === 'Merchant' || currentName === merchantLabel) && googleName) 
        ? t('settings.userShop', { name: googleName }) 
        : (baseName || (isShopkeeper ? merchantLabel : userLabel)));
        
      setNewName(initialPreset);
      setShopName(initialPreset);
      setNewImageUri(userProfile?.image_uri || null);
    }
  }, [isProfileModalVisible, userProfile, user, isShopkeeper]);


  useEffect(() => {
    if (isProfileModalVisible && isShopkeeper) {
      getPrimaryShop('business').then(shop => {
        if (shop) {
          setShopId(shop.id);
          // If the shop name is generic/missing, we already have the correct preset from above
          // If it's a custom name (different from google name), the preset logic above handles it too 
          // because it will use userProfile.name which is synced with shop.name
        }
      });
    }
  }, [isProfileModalVisible, isShopkeeper]);

  const handleSaveProfile = async () => {
    try {
      const imageToSave = newImageUri === undefined ? (userProfile?.image_uri || '') : (newImageUri || '');
      const currentActiveRole = activeProfile || 'personal';
      
      if (isShopkeeper && shopId) {
        if (!shopName.trim()) {
          showToast(t('shop.nameRequired') || 'Shop name is required', 'warning');
          return;
        }
        await updateShopProfile(shopId, shopName.trim(), imageToSave);
        await updateProfile(shopName.trim(), imageToSave, currentActiveRole);
      } else {
        if (!newName.trim()) return;
        await updateProfile(newName.trim(), imageToSave, currentActiveRole);
      }
      setProfileModalVisible(false);
      setSuccessVisible(true);
    } catch (e: any) { 
      console.error('Failed to save profile:', e);
      Alert.alert(t('common.error'), e.message || t('auth.failedUpdateProfile')); 
    }
  };

  const handleRemovePhotoConfirm = () => {
    setNewImageUri(null);
    setConfirmRemoveVisible(false);
  };



  const handleSyncData = async () => {
    if (isGuest) {
      Alert.alert(t('auth.loginRequiredSync'), t('auth.loginRequiredSyncMsg'));
      return;
    }
    setIsSyncing(true);
    try {
      await syncData();
      showToast(t('auth.syncSuccess'), 'success');
      const count = await getPendingSyncCount();
      const time = await AsyncStorage.getItem('lastSyncTime');
      setPendingSyncCount(count);
      setLastSyncTime(time);
    } catch (e) {
      showToast(t('auth.syncError'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const SettingItem = useCallback(({ icon, label, value, onPress, rightElement, disabled, iconColor, iconBg }: { 
    icon: any, label: string, value?: string, onPress?: () => void, rightElement?: React.ReactNode, disabled?: boolean, iconColor?: string, iconBg?: string 
  }) => (
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
        {/* PROFILE CARD */}
        <TouchableOpacity 
          style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => setProfileModalVisible(true)}
        >
          <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}>
            {userProfile?.image_uri ? (
              <Image source={{ uri: userProfile.image_uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarText}>{(userProfile?.name || 'U').charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>
              {(() => {
                if (isShopkeeper && shopName) return shopName;
                const currentName = userProfile?.name || '';
                const googleName = (user?.displayName || '').trim();
                const merchantLabel = t('settings.merchant');
                const userLabel = t('settings.user');
                const baseName = (currentName === 'Merchant' || currentName === 'User' || currentName === merchantLabel || currentName === userLabel || !currentName) ? (googleName || currentName) : currentName;
                const finalName = baseName || (isShopkeeper ? merchantLabel : userLabel);
                return (isShopkeeper && (baseName === googleName || currentName === 'Merchant' || currentName === merchantLabel) && googleName)
                  ? t('settings.userShop', { name: googleName })
                  : finalName;
              })()}
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(14) }}>{user?.email || t('auth.guestExplorer')}</Text>
          </View>
          <Ionicons name="pencil-outline" size={sfs(20)} color={theme.colors.primary} />
        </TouchableOpacity>



        {/* PREFERENCES SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('settings.preferences').toUpperCase()}</Text>
          <SettingItem 
            icon="moon-outline" 
            label={t('settings.darkMode')} 
            rightElement={<Switch value={mode === 'dark'} onValueChange={toggleTheme} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} thumbColor={Platform.OS === 'ios' ? undefined : (mode === 'dark' ? theme.colors.primary : '#f4f3f4')} />} 
          />
          <SettingItem 
            icon="language-outline" 
            label={t('settings.language')} 
            value={language === 'en' ? t('settings.english') : t('settings.bengali')} 
            onPress={() => setLanguageModalVisible(true)} 
          />
        </View>

        {/* FONT SIZE SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('settings.fontSize').toUpperCase()}</Text>
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
                  color={Math.abs(fontSizeMultiplier - item.multiplier) < 0.01 ? theme.colors.white : theme.colors.textPrimary}
                />
                <Text style={[
                  styles.fontSizeLabel,
                  { color: Math.abs(fontSizeMultiplier - item.multiplier) < 0.01 ? theme.colors.white : theme.colors.textSecondary }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* DATA MANAGEMENT SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('settings.dataManagement').toUpperCase()}</Text>
          {!isGuest && (
            <SettingItem
              icon="sync-outline"
              label={isSyncing ? t('auth.syncing') : t('auth.cloudSync')}
              value={pendingSyncCount > 0 ? t('settings.syncPending', { count: pendingSyncCount }) : (lastSyncTime ? t('settings.lastSynced', { date: formatDateLabel(lastSyncTime.split('T')[0]), time: formatTimeLabel(lastSyncTime) }) : t('auth.syncDesc'))}
              onPress={handleSyncData}
              disabled={isSyncing}
              rightElement={isSyncing ? <ActivityIndicator size="small" color={theme.colors.primary} /> : (pendingSyncCount > 0 ? <View style={{ backgroundColor: theme.colors.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 }}><Text style={{ color: theme.colors.white, fontSize: 10, fontWeight: 'bold' }}>{pendingSyncCount}</Text></View> : null)}
            />
          )}

          <SettingItem
            icon="trash-bin-outline"
            label={t('settings.trashBin')}
            value={t('settings.trashBinDesc')}
            onPress={() => router.push('/trash')}
          />
        </View>

        {/* DEVELOPER CREDITS SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('settings.developerCredits').toUpperCase()}</Text>
          <SettingItem icon="school-outline" label={t('settings.startTutorial')} value={t('settings.restartTutorialDesc')} onPress={() => router.push('/tutorial')} />
          <SettingItem icon="rocket-outline" label={t('settings.upcomingUpdates')} value={t('settings.viewRoadmap')} onPress={() => router.push('/upcoming')} />
          <SettingItem icon="code-slash-outline" label={t('settings.developedBy')} value="Nurul Hudda" onPress={async () => {
            try {
              await Linking.openURL('https://t.me/nurulhudda247');
            } catch (e) {
              showToast('Could not open Telegram', 'error');
            }
          }} />
          <SettingItem icon="logo-github" label={t('settings.github')} value="nurulhudda247" onPress={() => Linking.openURL('https://github.com/nurulhudda247')} />
        </View>

        {/* ACCOUNT MANAGEMENT SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('auth.accountManagement').toUpperCase()}</Text>

          {hasBothRoles && (
            <TouchableOpacity
              style={[styles.accountCard, { backgroundColor: theme.colors.surface, marginBottom: 16 }]}
              onPress={() => router.replace('/profile-selection')}
              activeOpacity={0.7}
            >
              <View style={[styles.accountIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="swap-horizontal" size={sfs(24)} color={theme.colors.primary} />
              </View>
              <View style={styles.accountCardBody}>
                <Text style={[styles.accountCardTitle, { color: theme.colors.textPrimary, fontSize: sfs(16) }]}>{t('auth.switchProfile')}</Text>
                <Text style={[styles.accountCardSub, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>
                  {activeProfile === 'shopkeeper' ? t('auth.switchToPersonalDesc') : t('auth.switchToBusinessDesc')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={sfs(20)} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}

          {isGuest ? (
            <TouchableOpacity
              style={[styles.accountCard, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30', borderWidth: 1 }]}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.7}
            >
              <View style={[styles.accountIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="person-add" size={sfs(24)} color={theme.colors.primary} />
              </View>
              <View style={styles.accountCardBody}>
                <Text style={[styles.accountCardTitle, { color: theme.colors.primary, fontSize: sfs(16) }]}>{t('auth.signUp')}</Text>
                <Text style={[styles.accountCardSub, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('auth.joinCommunitySub')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={sfs(20)} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.accountCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => setLogoutConfirmVisible(true)}
              activeOpacity={0.7}
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
          )}

          {/* DELETE THIS PROFILE — only shown when user has both roles */}
          {hasBothRoles && (
            <TouchableOpacity
              style={[styles.accountCard, { backgroundColor: theme.colors.danger + '08', borderColor: theme.colors.danger + '20', borderWidth: 1 }]}
              onPress={() => setDeleteProfileVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.accountIconContainer, { backgroundColor: theme.colors.danger + '15' }]}>
                <Ionicons name="person-remove-outline" size={sfs(24)} color={theme.colors.danger} />
              </View>
              <View style={styles.accountCardBody}>
                <Text style={[styles.accountCardTitle, { color: theme.colors.danger, fontSize: sfs(16) }]}>
                  {t('auth.deleteThisProfile')}
                </Text>
                <Text style={[styles.accountCardSub, { color: theme.colors.danger + '80', fontSize: sfs(13) }]}>
                  {activeProfile === 'shopkeeper'
                    ? t('auth.deleteShopProfileDesc')
                    : t('auth.deletePersonalProfileDesc')}
                </Text>
              </View>
              <Ionicons name="warning-outline" size={sfs(20)} color={theme.colors.danger + '60'} />
            </TouchableOpacity>
          )}

          {/* DELETE ACCOUNT — full deletion */}
          {!isGuest && (
            <TouchableOpacity
              style={[styles.accountCard, { backgroundColor: theme.colors.danger + '08', borderColor: theme.colors.danger + '20', borderWidth: 1 }]}
              onPress={() => setDeleteConfirmVisible(true)}
              activeOpacity={0.7}
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
          )}

          {/* RESET GUEST DATA */}
          {isGuest && (
            <TouchableOpacity
              style={[styles.accountCard, { backgroundColor: theme.colors.danger + '08', borderColor: theme.colors.danger + '20', borderWidth: 1 }]}
              onPress={() => setResetModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.accountIconContainer, { backgroundColor: theme.colors.danger + '15' }]}>
                <Ionicons name="refresh-circle-outline" size={sfs(24)} color={theme.colors.danger} />
              </View>
              <View style={styles.accountCardBody}>
                <Text style={[styles.accountCardTitle, { color: theme.colors.danger, fontSize: sfs(16) }]}>{t('settings.resetData')}</Text>
                <Text style={[styles.accountCardSub, { color: theme.colors.danger + '80', fontSize: sfs(13) }]}>{t('settings.resetDataSub')}</Text>
              </View>
              <Ionicons name="alert-circle-outline" size={sfs(20)} color={theme.colors.danger + '60'} />
            </TouchableOpacity>
          )}
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
                <TouchableOpacity 
                  style={styles.modalImageWrapper} 
                  onPress={handlePickImage} 
                  activeOpacity={0.8}
                  disabled={isGuest}
                >
                  <View style={[styles.modalImageBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, opacity: isGuest ? 0.5 : 1 }]}>
                    {newImageUri ? (
                       <Image source={{ uri: newImageUri }} style={styles.modalPreviewImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons 
                          name={isGuest ? "person-outline" : "camera-outline"} 
                          size={sfs(24)} 
                          color={theme.colors.textMuted} 
                        />
                      </View>
                    )}
                  </View>
                  {!isGuest && (
                    <View style={[styles.editIconBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
                      <Ionicons name="pencil" size={sfs(14)} color={theme.colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
                {newImageUri && !isGuest && (
                  <TouchableOpacity onPress={() => setConfirmRemoveVisible(true)} style={styles.removePhotoBtn}>
                    <Text style={{ color: theme.colors.danger, fontWeight: '600', marginTop: 12 }}>{t('shop.removePhoto')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {isShopkeeper && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('shop.name')}</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: theme.colors.background,
                        color: isGuest ? theme.colors.textSecondary : theme.colors.textPrimary,
                        borderColor: isGuest ? theme.colors.border : (isShopNameFocused ? theme.colors.primary : theme.colors.border),
                        opacity: isGuest ? 0.6 : 1
                      },
                      Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                    ]}
                    editable={!isGuest}
                    value={shopName}
                    onChangeText={setShopName}
                    onFocus={() => !isGuest && setIsShopNameFocused(true)}
                    onBlur={() => setIsShopNameFocused(false)}
                    placeholder={t('shop.namePlaceholder')}
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
              )}

              {!isShopkeeper && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('settings.yourName')}</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: theme.colors.background,
                        color: isGuest ? theme.colors.textSecondary : theme.colors.textPrimary,
                        borderColor: isGuest ? theme.colors.border : (isNameFocused ? theme.colors.primary : theme.colors.border),
                        opacity: isGuest ? 0.6 : 1
                      },
                      Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                    ]}
                    editable={!isGuest}
                    value={newName}
                    onChangeText={setNewName}
                    onFocus={() => !isGuest && setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    placeholder={t('auth.enterFullName')}
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('auth.email')}</Text>
                <View style={[styles.modalInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, justifyContent: 'center', opacity: 0.6 }]}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(16) }}>{user?.email || t('auth.guestExplorer')}</Text>
                </View>
                <Text style={{ fontSize: sfs(11), color: theme.colors.textMuted, marginTop: 4, marginLeft: 4 }}>{t('auth.emailLockedDesc')}</Text>
              </View>
              {isGuest ? (
                <Button 
                  title={t('auth.signUp')} 
                  onPress={() => {
                    setProfileModalVisible(false);
                    router.push('/(auth)/login');
                  }} 
                />
              ) : (
                <Button title={t('common.save')} onPress={handleSaveProfile} />
              )}
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
              {t('auth.deleteAccountMsg')}
            </Text>
          </View>

          {isPasswordProvider && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(14), marginBottom: 8 }}>{t('auth.password')}</Text>
              <TextInput
                style={{ height: 56, borderWidth: 1, borderColor: isDeletePasswordFocused ? theme.colors.primary : theme.colors.border, borderRadius: 12, paddingHorizontal: 16, color: theme.colors.textPrimary, fontSize: sfs(16), backgroundColor: theme.colors.background }}
                placeholder={t('auth.enterPassword')}
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
                onFocus={() => setIsDeletePasswordFocused(true)}
                onBlur={() => setIsDeletePasswordFocused(false)}
              />
            </View>
          )}

          <Button 
            title={isDeleteLoading ? t('common.loading') : t('common.delete')} 
            onPress={async () => {
              if (isPasswordProvider && !deletePassword) {
                showToast(t('auth.passwordRequired'), 'warning');
                return;
              }
              setIsDeleteLoading(true);
              try {
                await reauthenticateAndDelete(deletePassword);
                setDeleteConfirmVisible(false);
                showToast(t('auth.accountDeleted'), 'success');
                router.replace('/(auth)/register');
              } catch (e: any) {
                console.error(e);
                if (e?.code === 'auth/wrong-password' || e?.message === 'PASSWORD_REQUIRED') {
                  showToast(t('auth.wrongPassword'), 'error');
                } else if (e?.code === 'auth/requires-recent-login') {
                  showToast(t('auth.requiresRecentLogin'), 'error');
                } else if (e?.message === 'GOOGLE_TOKEN_MISSING') {
                  showToast(t('auth.reauthFailed'), 'error');
                } else if (e?.message === 'REAUTH_FAILED') {
                  showToast(t('auth.reauthFailed'), 'error');
                } else {
                  // Show specific error message if available
                  const errorMsg = e?.message || e?.code || t('common.error');
                  showToast(errorMsg, 'error');
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

      {/* DELETE THIS PROFILE MODAL */}
      <ConfirmModal
        visible={isDeleteProfileVisible}
        title={t('auth.deleteThisProfile')}
        message={
          activeProfile === 'shopkeeper'
            ? t('auth.deleteShopProfileMsg')
            : t('auth.deletePersonalProfileMsg')
        }
        confirmText={isDeleteLoading ? t('common.loading') : t('common.delete')}
        onConfirm={async () => {
          setIsDeleteLoading(true);
          try {
            await deleteActiveProfile();
            setDeleteProfileVisible(false);
            showToast(t('auth.profileDeleted'), 'success');
            // Navigate to the remaining role's dashboard
            const remaining = activeProfile === 'shopkeeper' ? 'personal' : 'shopkeeper';
            if (remaining === 'shopkeeper') {
              router.replace('/(shopkeeper)');
            } else {
              router.replace('/personal-dashboard');
            }
          } catch (e: any) {
            showToast(t('common.error'), 'error');
          } finally {
            setIsDeleteLoading(false);
          }
        }}
        onCancel={() => setDeleteProfileVisible(false)}
        type="danger"
        icon="person-remove-outline"
      />

      <ConfirmModal
        visible={isResetModalVisible}
        title={t('settings.resetData')}
        message={t('settings.resetDataSub')}
        confirmText={t('common.delete')}
        onConfirm={handleResetGuestData}
        onCancel={() => setResetModalVisible(false)}
        type="danger"
        icon="trash-outline"
      />

    </View>
  );
}


