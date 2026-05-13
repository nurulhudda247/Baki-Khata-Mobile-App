import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Text, SafeAreaView, StatusBar, Image } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { createShop, updateShop, getShopById } from '../../database/shops';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: { fontSize: sfs(20), fontWeight: 'bold', flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  imageSection: { alignItems: 'center', marginBottom: 40 },
  imageWrapper: { width: 120, height: 120, position: 'relative' },
  imageBox: { width: '100%', height: '100%', borderRadius: 16, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: sfs(16), fontWeight: '600', marginTop: 8, textAlign: 'center' },
  editBadge: { position: 'absolute', bottom: -6, right: -6, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white', zIndex: 10 },
  removeBtn: { marginTop: 16 },
  formSection: { marginTop: 8 },
  saveBtn: { marginTop: 32, height: 56 },
});

export default function AddShop() {
  const { id } = useLocalSearchParams();
  const { theme, mode, sfs } = useTheme();
  const { showToast } = useToast();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      loadShop();
    }
  }, [id]);

  const loadShop = async () => {
    try {
      const shop = await getShopById(id as string);
      if (shop) {
        setName(shop.name);
        setAddress(shop.address || '');
        setPhone(shop.phone || '');
        setImageUri(shop.image_uri || null);
      }
    } catch (e) {
      console.error('Failed to load shop', e);
    }
  };

  const pickImage = async () => {
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
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast(t('shop.nameRequired'), 'warning');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateShop(id as string, name.trim(), address.trim(), phone.trim(), imageUri || '');
      } else {
        await createShop(name.trim(), address.trim(), phone.trim(), imageUri || '');
      }
      showToast(isEditing ? t('shopAdd.shopUpdated') : t('shopAdd.shopAdded'), 'success');
      router.back();
    } catch (e) {
      console.error('Failed to save shop', e);
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: theme.colors.surface }]} 
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={sfs(24)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {isEditing ? t('shopAdd.editShop') : t('shopAdd.addShop')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* IMPROVED ROUNDED IMAGE PICKER */}
          <View style={styles.imageSection}>
            <TouchableOpacity 
              style={styles.imageWrapper}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <View style={[styles.imageBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={sfs(24)} color={theme.colors.textMuted} />
                    <Text style={[styles.placeholderText, { color: theme.colors.textMuted }]}>{t('shop.addPhoto')}</Text>
                  </View>
                )}
              </View>
              
              <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="pencil" size={sfs(24)} color="white" />
              </View>
            </TouchableOpacity>
            
            {imageUri && (
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeBtn}>
                <Text style={{ color: theme.colors.danger, fontWeight: '600', fontSize: sfs(14) }}>{t('shop.removePhoto')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formSection}>
            <Input
              label={t('shop.shopName')}
              placeholder={t('shopAdd.namePlaceholder')}
              value={name}
              onChangeText={setName}
            />
            <Input
              label={t('shop.address')}
              placeholder={t('shop.address')}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
            <Input
              label={t('shop.phone')}
              placeholder={t('shop.phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Button 
            title={t('common.save')}
            onPress={handleSave}
            loading={loading}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>


    </SafeAreaView>
  );
}


