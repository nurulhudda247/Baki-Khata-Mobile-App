import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getShops, updateShop, Shop } from '../../database/shops';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAppContext } from '../../context/AppContext';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { Theme } from '../../constants/darkTheme';

const getStyles = (theme: Theme, sfs: (s: number) => number) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  imageSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative' },
  avatarBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  imageHint: { marginTop: 12, fontSize: 14, fontWeight: '600' },
});

export default function ShopSettings() {
  const { theme, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { updateProfile } = useAppContext();
  const router = useRouter();

  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const shops = await getShops();
        if (shops.length > 0) {
          const s = shops[0];
          setShop(s);
          setName(s.name);
          setAddress(s.address || '');
          setPhone(s.phone || '');
          setImageUri(s.image_uri || null);
        }
      } catch (e) {
        console.error('Failed to fetch shop', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShop();
  }, []);

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
      Alert.alert(t('common.error'), t('shop.nameRequired'));
      return;
    }
    if (!shop) return;

    try {
      const trimmedName = name.trim();
      await updateShop(shop.id, trimmedName, address.trim(), phone.trim(), imageUri || '');
      await updateProfile(trimmedName, imageUri || '');
      showToast(t('shop.shopUpdated'), 'success');
      router.back();
    } catch (e) {
      console.error('Update failed', e);
      showToast(t('common.error'), 'error');
    }
  };

  if (isLoading) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ 
        title: t('shop.details'),
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarContainer}>
            <View style={[styles.avatarBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person-outline" size={sfs(40)} color={theme.colors.textMuted} />
              )}
            </View>
            <View style={[styles.cameraIcon, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
              <Ionicons name="camera" size={sfs(14)} color={theme.colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.imageHint, { color: theme.colors.textSecondary }]}>{t('customer.addPhoto')}</Text>
        </View>

        <FloatingLabelInput
          label={t('shop.shopName')}
          value={name}
          onChangeText={setName}
        />

        <FloatingLabelInput
          label={t('shop.address')}
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <FloatingLabelInput
          label={t('shop.phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Button title={t('common.save')} onPress={handleSave} style={{ marginTop: 20 }} />
      </ScrollView>
    </View>
  );
}

