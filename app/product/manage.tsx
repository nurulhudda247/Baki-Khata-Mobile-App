import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, Platform, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getProductsByShop, deleteProduct, Product } from '../../database/products';
import { ProductCard } from '../../components/ProductCard';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  headerTitle: { fontSize: sfs(20), fontWeight: 'bold', flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 120 },
  deleteAction: { justifyContent: 'center', alignItems: 'center', width: 80, height: '85%', borderRadius: 20, marginLeft: 10 },
  deleteActionText: { color: 'white', fontSize: sfs(16), fontWeight: 'bold', marginTop: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyText: { textAlign: 'center', fontSize: sfs(16), paddingHorizontal: 40, lineHeight: sfs(24) },
  fab: { position: 'absolute', right: 24, bottom: 40, width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
});

export default function ProductManage() {
  const { shopId } = useLocalSearchParams();
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef<{[key: string]: Swipeable | null}>({});

  // Confirm Modal State
  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{id: number, name: string} | null>(null);

  const fetchProducts = async () => {
    try {
      const data = await getProductsByShop(parseInt(shopId as string));
      setProducts(data);
    } catch (e) { console.error('Failed to fetch products', e); }
  };

  useFocusEffect(useCallback(() => { fetchProducts(); }, [shopId]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete.id);
        setConfirmVisible(false);
        setSuccessVisible(true);
        setProductToDelete(null);
        fetchProducts();
      } catch (e) {
        console.error('Delete failed', e);
        Alert.alert(
          t('common.error'),
          t('product.cannotDelete')
        );
        setConfirmVisible(false);
      }
    }
  };

  const closeSwipeable = useCallback((id: number) => {
    if (swipeableRefs.current[id]) {
      swipeableRefs.current[id]?.close();
    }
  }, []);

  const renderRightActions = useCallback((id: number, name: string) => (
    <RectButton 
      style={[styles.deleteAction, { backgroundColor: theme.colors.danger }]}
      onPress={() => {
        closeSwipeable(id);
        setProductToDelete({ id, name });
        setConfirmVisible(true);
      }}
    >
      <Ionicons name="trash-outline" size={sfs(24)} color="white" />
      <Text style={styles.deleteActionText}>{t('common.delete')}</Text>
    </RectButton>
  ), [closeSwipeable, theme.colors.danger, sfs, t]);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.colors.surface }]} onPress={() => router.back()}><Ionicons name="arrow-back" size={sfs(24)} color={theme.colors.textPrimary} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>{t('shop.manageProducts')}</Text>
        </View>
      </View>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Swipeable 
            ref={ref => (swipeableRefs.current[item.id] = ref)}
            renderRightActions={() => renderRightActions(item.id, item.name)} 
            overshootRight={false}
          >
            <ProductCard 
              product={item} 
              onEdit={() => router.push({ pathname: '/product/add', params: { shopId, productId: item.id } })}
            />
          </Swipeable>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.colors.surface }]}><Ionicons name="cube-outline" size={sfs(24)} color={theme.colors.textMuted} /></View>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('product.noProducts')}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => router.push({ pathname: '/product/add', params: { shopId } })}><Ionicons name="add" size={sfs(24)} color="white" /></TouchableOpacity>

      {/* CONFIRMATION MODAL */}
      <ConfirmModal 
        visible={isConfirmVisible}
        title={t('common.delete')}
        message={t('product.deleteConfirm', { name: productToDelete?.name })}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />

      <ConfirmModal
        visible={isSuccessVisible}
        title={t('common.success')}
        message={t('product.productDeleted')}
        type="success"
        showCancel={false}
        confirmText={t('common.ok')}
        onConfirm={() => setSuccessVisible(false)}
      />
    </SafeAreaView>
  );
}


