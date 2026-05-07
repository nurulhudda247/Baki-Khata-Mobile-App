import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform, StatusBar, TextInput, Modal, Linking, TouchableWithoutFeedback, Image } from 'react-native';
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
  inputLabel: { fontSize: sfs(12), marginBottom: 8, fontWeight: '600' },
  modalInput: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: sfs(16) },
  modalIndicator: { width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'center', borderRadius: 2, marginBottom: 16 },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'transparent', marginBottom: 12 },
  langText: { fontSize: sfs(16) },
  fontSizeContainer: { flexDirection: 'row', borderRadius: 20, padding: 4, justifyContent: 'space-between' },
  fontSizeOption: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, gap: 4 },
  fontSizeLabel: { fontSize: sfs(12), fontWeight: 'bold' },
});

export default function Settings() {
  const { theme, mode, toggleTheme, fontSizeMultiplier, setFontSizeMultiplier, sfs } = useTheme();
  const { showToast } = useToast();
  const styles = getStyles(theme, sfs);
  const { language, setLanguage } = useLanguage();
  const { userProfile, updateProfile } = useAppContext();
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
  const [isClearing, setIsClearing] = useState(false);

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

  const SettingItem = useCallback(({ icon, label, value, onPress, rightElement, disabled }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: theme.colors.surface, opacity: disabled ? 0.5 : 1 }]} 
      onPress={onPress} 
      disabled={disabled || !onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
          <Ionicons name={icon} size={sfs(24)} color={theme.colors.primary} />
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
        <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          {userProfile?.image_uri ? (
            <Image source={{ uri: userProfile.image_uri }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>{userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.textPrimary, fontSize: sfs(20) }]}>{userProfile?.name || 'User'}</Text>
            <TouchableOpacity onPress={() => { setNewName(userProfile?.name || ''); setNewImageUri(userProfile?.image_uri || null); setProfileModalVisible(true); }}>
              <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: sfs(14) }}>{t('settings.editProfile')}</Text>
            </TouchableOpacity>
          </View>
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
                  size={item.size} 
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
            icon="trash-outline" 
            label={t('settings.clearCache')} 
            value={t('settings.cleanSpace')} 
            onPress={() => setClearCacheVisible(true)} 
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('settings.developerCredits')}</Text>
          <SettingItem 
            icon="rocket-outline" 
            label={t('settings.upcomingUpdates')} 
            value={t('settings.viewRoadmap')} 
            onPress={() => router.push('/upcoming')} 
          />
          <SettingItem icon="code-slash-outline" label={t('settings.developedBy')} value="Nurul Hudda" onPress={() => Linking.openURL('https://t.me/nurulhudda247')} />
          <SettingItem icon="logo-github" label={t('settings.github')} value="nurulhudda247" onPress={() => Linking.openURL('https://github.com/nurulhudda247')} />
        </View>
        <View style={styles.footer}><Text style={[styles.footerText, { color: theme.colors.textMuted }]}>{t('settings.appFooter')}</Text></View>
      </ScrollView>

      {/* PROFILE EDIT MODAL */}
      <Modal visible={isProfileModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProfileModalVisible(false)}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalIndicator} />
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
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>


      {/* CONFIRM REMOVE PHOTO */}
      <ConfirmModal 
        visible={isConfirmRemoveVisible}
        title={t('settings.removePhotoTitle')}
        message={t('settings.removePhotoMsg')}
        onConfirm={handleRemovePhotoConfirm}
        onCancel={() => setConfirmRemoveVisible(false)}
      />

      {/* LANGUAGE MODAL */}
      <Modal visible={isLanguageModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLanguageModalVisible(false)}>
          <TouchableWithoutFeedback><View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}><View style={styles.modalIndicator} /><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('settings.selectLanguage')}</Text><TouchableOpacity onPress={() => setLanguageModalVisible(false)}><Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} /></TouchableOpacity></View><TouchableOpacity style={[styles.langOption, language === 'en' && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]} onPress={() => { setLanguage('en'); setLanguageModalVisible(false); }}><Text style={[styles.langText, { color: theme.colors.textPrimary }, language === 'en' && { color: theme.colors.primary, fontWeight: 'bold' }]}>{t('settings.english')}</Text>{language === 'en' && <Ionicons name="checkmark-circle" size={sfs(24)} color={theme.colors.primary} />}</TouchableOpacity><TouchableOpacity style={[styles.langOption, language === 'bn' && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]} onPress={() => { setLanguage('bn'); setLanguageModalVisible(false); }}><Text style={[styles.langText, { color: theme.colors.textPrimary }, language === 'bn' && { color: theme.colors.primary, fontWeight: 'bold' }]}>{t('settings.bengali')}</Text>{language === 'bn' && <Ionicons name="checkmark-circle" size={sfs(24)} color={theme.colors.primary} />}</TouchableOpacity></View></TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

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
    </View>
  );
}


