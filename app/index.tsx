import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Platform, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { Shop, getShops, deleteShop } from '../database/shops';
import { ShopCard } from '../components/ShopCard';
import { queryFirst } from '../database/db';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { getCurrentDateBD } from '../utils/dateUtils';

const getStyles = (theme: any, sfs: any, insets: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Math.max(insets.top, 20), paddingBottom: 16 },
  greeting: { fontSize: sfs(16) },
  userName: { fontSize: sfs(24), fontWeight: 'bold' },
  profileBtn: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  contentPadding: { paddingHorizontal: 24 },
  statsCard: { borderRadius: 24, padding: 24, marginBottom: 24, marginTop: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsItem: { flex: 1, alignItems: 'center' },
  statsDivider: { width: 1, height: 40, marginHorizontal: 12 },
  statsLabel: { fontSize: sfs(12), fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  statsValue: { fontSize: sfs(18), fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: sfs(16) },
  sectionTitle: { fontSize: sfs(20), fontWeight: 'bold', marginBottom: 16 },
  listContent: { paddingBottom: 100 },
  swipeWrapper: { paddingHorizontal: 24 },
  deleteAction: { justifyContent: 'center', alignItems: 'center', width: 90, height: '83%', borderRadius: 24, marginLeft: 10 },
  deleteActionText: { color: 'white', fontSize: sfs(12), fontWeight: 'bold', marginTop: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: sfs(16), textAlign: 'center', marginBottom: 24, paddingHorizontal: 40, lineHeight: sfs(24) },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: 'white', fontWeight: 'bold', fontSize: sfs(16) },
  fab: { position: 'absolute', right: 24, bottom: 40, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});

export default function Home() {
  const insets = useSafeAreaInsets();
  const { theme, mode, sfs } = useTheme();
  const styles = useMemo(() => getStyles(theme, sfs, insets), [theme, sfs, insets]);
  const { userProfile, isLoading } = useAppContext();
  const { t } = useTranslation();
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  // Confirm Modal State
  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [isRestrictedVisible, setRestrictedVisible] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<{ id: number, name: string, baki: number } | null>(null);

  const fetchShops = async () => {
    try {
      const data = await getShops();
      setShops(data);
    } catch (e) { console.error('Failed to fetch shops', e); }
  };

  useFocusEffect(useCallback(() => { fetchShops(); }, []));

  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return shops;
    return shops.filter(shop => shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || (shop.address && shop.address.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [searchQuery, shops]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShops();
    setRefreshing(false);
  };

  const handleConfirmDelete = async () => {
    if (shopToDelete) {
      try {
        await deleteShop(shopToDelete.id);
        setConfirmVisible(false);
        setSuccessVisible(true);
        setShopToDelete(null);
        fetchShops();
      } catch (e) {
        console.error('Delete failed', e);
        Alert.alert(t('common.error'), 'Failed to delete shop. Please try again.');
        setConfirmVisible(false);
      }
    }
  };

  const closeSwipeable = useCallback((id: number) => {
    if (swipeableRefs.current[id]) {
      swipeableRefs.current[id]?.close();
    }
  }, []);

  const renderRightActions = useCallback((item: Shop) => (
    <RectButton
      style={[styles.deleteAction, { backgroundColor: theme.colors.danger }]}
      onPress={() => {
        closeSwipeable(item.id);
        setShopToDelete({ id: item.id, name: item.name, baki: item.total_baki || 0 });
        const balance = item.total_baki || 0;
        if (Math.abs(balance) > 0.01) {
          setRestrictedVisible(true);
          return;
        }
        setConfirmVisible(true);
      }}
    >
      <Ionicons name="trash-outline" size={sfs(28)} color="white" />
      <Text style={styles.deleteActionText}>{t('common.delete')}</Text>
    </RectButton>
  ), [closeSwipeable, theme.colors.danger, sfs, t]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.surfaceElevated }]}>
        <Ionicons name="journal-outline" size={sfs(24)} color={theme.colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
        {searchQuery ? t('common.noData') : t('home.emptyLedger')}
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]} 
          onPress={() => router.push('/shop/add')}
        >
          <Text style={styles.emptyBtnText}>{t('home.addShop')}</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [searchQuery, theme.colors.surfaceElevated, theme.colors.textMuted, theme.colors.textPrimary, theme.colors.primary, sfs, t, router]);

  if (!isLoading && !userProfile) return <Redirect href="/onboarding" />;
  if (userProfile && userProfile.has_seen_tutorial === 0) return <Redirect href="/tutorial" />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary, fontSize: sfs(16) }]}>{t('home.hello')},</Text>
          <Text style={[styles.userName, { color: theme.colors.textPrimary, fontSize: sfs(24) }]}>{userProfile?.name || 'User'}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.profileBtn, { backgroundColor: theme.colors.surface }]} 
          onPress={() => router.push('/settings')}
          accessibilityLabel={t('settings.title')}
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={sfs(24)} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredShops}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.contentPadding}>
            <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: isSearchFocused ? theme.colors.primary : theme.colors.border }]}>
              <Ionicons name="search" size={sfs(24)} color={isSearchFocused ? theme.colors.primary : theme.colors.textMuted} />
              <TextInput 
                style={[styles.searchInput, { color: theme.colors.textPrimary }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} 
                placeholder={t('common.searchShop')} 
                placeholderTextColor={theme.colors.textMuted} 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                onFocus={() => setIsSearchFocused(true)} 
                onBlur={() => setIsSearchFocused(false)} 
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={sfs(24)} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: sfs(20) }]}>{t('home.myLedger')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.swipeWrapper}>
            <Swipeable
              ref={ref => (swipeableRefs.current[item.id] = ref)}
              renderRightActions={() => renderRightActions(item)}
              overshootRight={false}
            >
              <ShopCard shop={item} onPress={() => router.push(`/shop/${item.id}`)} />
            </Swipeable>
          </View>
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 24 }]} 
        onPress={() => router.push('/shop/add')}
        accessibilityLabel={t('home.addShop')}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={sfs(24)} color="white" />
      </TouchableOpacity>


      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        visible={isConfirmVisible}
        title={t('common.delete')}
        message={t('home.deleteShopConfirm', { name: shopToDelete?.name })}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />

      {/* RESTRICTION MODAL */}
      <ConfirmModal
        visible={isRestrictedVisible}
        title={t('home.cannotDeleteShop')}
        message={t('home.cannotDeleteShopMsg', { amount: shopToDelete?.baki })}
        type="warning"
        showCancel={false}
        confirmText={t('common.gotIt')}
        onConfirm={() => setRestrictedVisible(false)}
      />

      {/* SUCCESS MODAL */}
      <ConfirmModal
        visible={isSuccessVisible}
        title={t('common.success')}
        message={t('home.shopDeleted')}
        type="success"
        showCancel={false}
        confirmText="OK"
        onConfirm={() => setSuccessVisible(false)}
      />
    </View>
  );
}


