import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, RefreshControl, Platform, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { getAllShopkeeperProducts, deleteProduct, Product } from '../../database/products';
import { getShops } from '../../database/shops';
import { ProductCard } from '../../components/ProductCard';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

import { Theme } from '../../constants/darkTheme';

const getStyles = (theme: Theme, sfs: (s: number) => number) => StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  rightActions: { width: 80, marginLeft: 10 },
  actionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  actionText: { color: theme.colors.white, fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default function ShopkeeperProducts() {
  const { theme, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);

  // Modal states
  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchData = async () => {
    try {
      const { getPrimaryShop } = await import('../../database/shops');
      const [p, shop] = await Promise.all([
        getAllShopkeeperProducts(),
        getPrimaryShop('business')
      ]);
      setProducts(p);
      if (shop) setShopId(shop.id);
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const closeSwipeable = (id: string) => {
    if (swipeableRefs.current[id]) {
      swipeableRefs.current[id]?.close();
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      setConfirmVisible(false);
      setProductToDelete(null);
      fetchData();
    } catch (e: any) {
      setConfirmVisible(false);
      Alert.alert(t('common.error'), e.message || t('product.saveError'));
    }
  };

  const renderRightActions = (item: Product) => (
    <View style={styles.rightActions}>
      <RectButton
        style={[styles.actionBtn, { backgroundColor: theme.colors.danger }]}
        onPress={() => {
          closeSwipeable(item.id);
          setProductToDelete(item);
          setConfirmVisible(true);
        }}
      >
        <Ionicons name="trash-outline" size={sfs(24)} color={theme.colors.white} />
        <Text style={styles.actionText}>{t('common.delete')}</Text>
      </RectButton>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={sfs(20)} color={theme.colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            placeholder={t('common.search') || 'Search products...'}
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlashList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            <Swipeable
              ref={ref => (swipeableRefs.current[item.id] = ref)}
              renderRightActions={() => renderRightActions(item)}
              overshootRight={false}
            >
              <ProductCard 
                product={item} 
                onEdit={() => router.push({ pathname: '/product/add', params: { shopId, productId: item.id } })} 
              />
            </Swipeable>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={sfs(48)} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textMuted, marginTop: 12 }}>{t('product.noProducts')}</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 20 }]}
        onPress={() => router.push({ pathname: '/product/add', params: { shopId } })}
      >
        <Ionicons name="add" size={sfs(32)} color={theme.colors.white} />
      </TouchableOpacity>

      <ConfirmModal
        visible={isConfirmVisible}
        title={t('common.delete')}
        message={t('product.deleteConfirm', { name: productToDelete?.name })}
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

