import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Text, StatusBar, Image } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { createCustomer } from '../../database/customers';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAllCustomersWithBalance } from '../../database/customers';

import { Theme } from '../../constants/darkTheme';

const getStyles = (theme: Theme, sfs: (s: number) => number) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 24,
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
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  headerTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  imageSection: { alignItems: 'center', marginBottom: 32 },
  imageHint: { marginTop: 16, fontSize: sfs(14), fontWeight: '600', opacity: 0.7 },
  avatarWrapper: {
    padding: 8,
    borderRadius: 75,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  avatarContainer: { 
    position: 'relative',
    borderWidth: 4,
    borderRadius: 65,
  },
  cameraIcon: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtn: { marginTop: 12, height: 56, borderRadius: 16 },
});

export default function AddCustomer() {
  const { shopId } = useLocalSearchParams();
  const { theme, mode, sfs } = useTheme();
  const { showToast } = useToast();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const { isGuest } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast(t('settings.cameraPermission'), 'warning');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
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

      setImageUri(uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast(t('customer.nameRequired'), 'error');
      return;
    }

    if (isGuest) {
      try {
        const customers = await getAllCustomersWithBalance();
        if (customers.length >= 5) {
          Alert.alert(
            t('auth.customerLimitReached'),
            t('auth.customerLimitMsg'),
            [
              { text: t('common.skip'), style: 'cancel' },
              { text: t('common.login'), onPress: () => router.push('/(auth)/login') }
            ]
          );
          return;
        }
      } catch (e) {
        console.error('Limit check failed', e);
      }
    }

    setLoading(true);
    let targetShopId = shopId as string;
    
    if (!targetShopId) {
      try {
        const { getPrimaryShop } = await import('../../database/shops');
        const shop = await getPrimaryShop('business');
        if (shop) {
          targetShopId = shop.id;
        }
      } catch (e) {
        console.error('Failed to fetch primary shop', e);
      }
    }

    if (!targetShopId) {
      showToast(t('common.error'), 'error');
      setLoading(false);
      return;
    }

    try {
      await createCustomer(targetShopId, name.trim(), phone.trim(), imageUri);
      showToast(t('common.success'), 'success');
      router.back();
    } catch (e) {
      console.error('Failed to save customer', e);
      showToast(t('customer.saveError'), 'error');
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{t('customer.addCustomer')}</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
              <View style={[styles.avatarContainer, { borderColor: theme.colors.primary + '30' }]}>
                <Avatar name={name || 'Customer'} uri={imageUri} size={sfs(120)} />
                <View style={[styles.cameraIcon, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
                  <Ionicons name="camera" size={sfs(20)} color={theme.colors.white} />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={[styles.imageHint, { color: theme.colors.textSecondary }]}>{t('customer.addPhoto')}</Text>
          </View>

          <FloatingLabelInput
            label={t('customer.name')}
            value={name}
            onChangeText={setName}
          />
          <FloatingLabelInput
            label={t('customer.phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Button 
            title={t('common.save')}
            onPress={handleSave}
            loading={loading}
            style={styles.saveBtn}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}


