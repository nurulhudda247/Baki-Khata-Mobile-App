import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { createProduct, updateProduct, getProductById, getAllShopkeeperProducts } from '../../database/products';
import { useAuth } from '../../context/AuthContext';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const CATEGORIES = ['Grocery', 'Medicine', 'Food', 'Cigarette', 'Tea', 'Stationery', 'Electronics', 'Cosmetics', 'Clothing', 'Recharge', 'Other'];

const CATEGORY_ICONS: Record<string, string> = {
  Grocery: 'basket-outline',
  Medicine: 'medical-outline',
  Food: 'fast-food-outline',
  Cigarette: 'flame-outline',
  Tea: 'cafe-outline',
  Stationery: 'pencil-outline',
  Electronics: 'flash-outline',
  Cosmetics: 'sparkles-outline',
  Clothing: 'shirt-outline',
  Recharge: 'phone-portrait-outline',
  Other: 'grid-outline'
};

import { Theme } from '../../constants/darkTheme';

const getStyles = (theme: Theme, sfs: (s: number) => number) => StyleSheet.create({
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
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  headerTitle: { fontSize: sfs(20), fontWeight: 'bold', flex: 1 },
  scrollContent: {
    padding: 24,
    paddingBottom: 60
  },
  label: {
    fontSize: sfs(16), fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
  },
  categoryText: {
    fontSize: sfs(14), fontWeight: '600',
    marginLeft: 8,
  },
  saveBtn: {
    marginTop: 20,
  },
});

export default function AddProduct() {
  const { shopId, productId } = useLocalSearchParams();
  const { theme, mode, sfs } = useTheme();
  const { showToast } = useToast();
  const { isGuest, activeProfile } = useAuth();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('piece');
  const [category, setCategory] = useState('Grocery');
  const [loading, setLoading] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);

  const isEditing = !!productId;

  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const product = await getProductById(productId as string);
      if (product) {
        setName(product.name);
        setPrice(product.price.toString());
        setUnit(product.unit);
        setCategory(product.category || 'Other');
      }
    } catch (e) {
      console.error('Failed to load product', e);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      showToast(t('product.enterDetails'), 'warning');
      return;
    }

    if (!isEditing && isGuest) {
      try {
        const products = await getAllShopkeeperProducts(activeProfile === 'personal' ? 'personal' : 'business');
        if (products.length >= 10) {
          Alert.alert(
            t('auth.productLimitReached'),
            t('auth.productLimitMsg'),
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
    try {
      const priceNum = parseFloat(price);
      if (isEditing) {
        await updateProduct(productId as string, name.trim(), priceNum, unit, category);
      } else {
        await createProduct(shopId as string, name.trim(), priceNum, unit, category);
      }
      showToast(t('common.success'), 'success');
      router.back();
    } catch (e) {
      console.error('Failed to save product', e);
      showToast(t('product.saveError'), 'error');
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
            {isEditing ? t('productAdd.editProduct') : t('productAdd.addProduct')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <FloatingLabelInput
          label={t('productAdd.productName')}
          value={name}
          onChangeText={setName}
        />
        <FloatingLabelInput
          label={t('productAdd.price')}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <FloatingLabelInput
          label={t('productAdd.unit')}
          value={unit}
          onChangeText={setUnit}
        />

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('productAdd.category')}</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                { 
                  backgroundColor: category === cat ? theme.colors.primary : theme.colors.surface,
                  borderColor: category === cat ? theme.colors.primary : theme.colors.border 
                }
              ]}
              onPress={() => setCategory(cat)}
            >
              <Ionicons 
                name={CATEGORY_ICONS[cat] as any} 
                size={sfs(18)} 
                color={category === cat ? theme.colors.white : theme.colors.primary} 
              />
              <Text style={[
                styles.categoryText,
                { color: category === cat ? theme.colors.white : theme.colors.textPrimary }
              ]}>
                {t('categories.' + cat)}
              </Text>
            </TouchableOpacity>
          ))}
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


