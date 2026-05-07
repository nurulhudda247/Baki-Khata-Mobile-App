import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Text, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { createCustomer } from '../../database/customers';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  headerTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  imageSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative' },
  cameraIcon: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  imageHint: { marginTop: 12, fontSize: sfs(16), fontWeight: '500' },
  saveBtn: { marginTop: 20 },
});

export default function AddCustomer() {
  const { shopId } = useLocalSearchParams();
  const { theme, mode, sfs } = useTheme();
  const { showToast } = useToast();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
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
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast(t('customer.nameRequired'), 'error');
      return;
    }

    if (!shopId) {
      showToast(t('common.error'), 'error');
      return;
    }

    setLoading(true);
    try {
      await createCustomer(parseInt(shopId as string), name.trim(), phone.trim(), imageUri);
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
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <View style={styles.avatarContainer}>
                <Avatar name={name || 'New Customer'} uri={imageUri} size={sfs(24)} />
                <View style={[styles.cameraIcon, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
                  <Ionicons name="camera" size={sfs(24)} color="white" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={[styles.imageHint, { color: theme.colors.textSecondary }]}>{t('customer.addPhoto')}</Text>
          </View>

          <Input
            label={t('customer.name')}
            placeholder={t('customer.name')}
            value={name}
            onChangeText={setName}
          />
          <Input
            label={t('customer.phone')}
            placeholder={t('customer.phone')}
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


