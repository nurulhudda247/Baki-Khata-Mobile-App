import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Platform, Alert, Linking, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { Shop, getShops, deleteShop } from '../database/shops';
import { getMarketStats } from '../database/stats';
import { ShopCard } from '../components/ShopCard';
import { GuestBanner } from '../components/ui/GuestBanner';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useAuth } from '../context/AuthContext';

import { Theme } from '../constants/darkTheme';

const getStyles = (theme: Theme, sfs: (s: number) => number, insets: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: sfs(16) },
  userName: { fontSize: sfs(24), fontWeight: 'bold' },
  profileBtn: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: sfs(16) },
  sectionTitle: { fontSize: sfs(20), fontWeight: 'bold', marginBottom: 16 },
  listContent: { paddingBottom: 100 },
  swipeWrapper: { paddingHorizontal: 24, marginBottom: 16 },
  leftActionsContainer: { flexDirection: 'column', width: 90, height: '100%', marginRight: 10, gap: 4 },
  swipeActionBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  swipeActionText: { color: theme.colors.white, fontSize: sfs(10), fontWeight: 'bold', marginTop: 2 },
  deleteAction: { justifyContent: 'center', alignItems: 'center', width: 90, height: '100%', borderRadius: 24, marginLeft: 10 },
  deleteActionText: { color: theme.colors.white, fontSize: sfs(12), fontWeight: 'bold', marginTop: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: sfs(16), textAlign: 'center', marginBottom: 24, paddingHorizontal: 40, lineHeight: sfs(24) },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: theme.colors.white, fontWeight: 'bold', fontSize: sfs(16) },
  fab: { position: 'absolute', right: 24, bottom: 40, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  contentPadding: { paddingHorizontal: 24, paddingTop: 10 },
  heroCard: { marginHorizontal: 24, padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, elevation: 8, shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  heroAmount: { color: theme.colors.white, fontWeight: 'bold' },
  heroIconContainer: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 20 },
});

export default function PersonalDashboard() {
  const insets = useSafeAreaInsets();
  const { theme, sfs, mode } = useTheme();
  const styles = useMemo(() => getStyles(theme, sfs, insets), [theme, sfs, insets]);
  const { userProfile } = useAppContext();
  const { user, isGuest } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState({ totalMarketDue: 0, todayCollection: 0, todayDue: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [isRestrictedVisible, setRestrictedVisible] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<{ id: string, name: string, baki: number } | null>(null);

  const fetchDashboardData = async () => {
    try {
      const shopData = await getShops('personal');
      const statsData = await getMarketStats('personal');
      setShops(shopData);
      setStats(statsData);
    } catch (e) { console.error('Failed to fetch dashboard data', e); }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, [userProfile]));

  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return shops;
    return shops.filter(shop => shop.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, shops]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleConfirmDelete = async () => {
    if (shopToDelete) {
      try {
        await deleteShop(shopToDelete.id);
        setConfirmVisible(false);
        setSuccessVisible(true);
        setShopToDelete(null);
        fetchDashboardData();
      } catch (e) {
        console.error('Delete failed', e);
        setConfirmVisible(false);
      }
    }
  };

  const closeSwipeable = (id: string) => {
    swipeableRefs.current[id]?.close();
  };

  const renderRightActions = (item: Shop) => (
    <RectButton
      style={[styles.deleteAction, { backgroundColor: theme.colors.danger }]}
      onPress={() => {
        closeSwipeable(item.id);
        setShopToDelete({ id: item.id, name: item.name, baki: item.total_baki || 0 });
        if (Math.abs(item.total_baki || 0) > 0.01) {
          setRestrictedVisible(true);
        } else {
          setConfirmVisible(true);
        }
      }}
    >
      <Ionicons name="trash-outline" size={sfs(28)} color={theme.colors.white} />
      <Text style={styles.deleteActionText}>{t('common.delete')}</Text>
    </RectButton>
  );

  const renderLeftActions = (item: Shop) => {
    if (!item.phone) return null;
    return (
      <View style={[styles.leftActionsContainer, { paddingVertical: 2 }]}>
        <RectButton
          style={[styles.swipeActionBtn, { backgroundColor: theme.colors.success }]}
          onPress={() => {
            closeSwipeable(item.id);
            Linking.openURL(`tel:${item.phone}`);
          }}
        >
          <Ionicons name="call" size={sfs(20)} color={theme.colors.white} />
          <Text style={styles.swipeActionText}>{t('common.call')}</Text>
        </RectButton>
        <RectButton
          style={[styles.swipeActionBtn, { backgroundColor: '#25D366' }]}
          onPress={() => {
            closeSwipeable(item.id);
            if (isGuest) {
              Alert.alert(t('auth.loginRequired'), t('auth.loginRequiredMsg'), [
                { text: t('common.skip'), style: 'cancel' },
                { text: t('common.login'), onPress: () => router.push('/(auth)/login') }
              ]);
              return;
            }
            const phone = (item.phone || '').replace(/[^0-9]/g, '');
            Linking.openURL(`whatsapp://send?phone=${phone}`);
          }}
        >
          <Ionicons name="logo-whatsapp" size={sfs(20)} color={theme.colors.white} />
          <Text style={styles.swipeActionText}>{t('common.whatsapp', { defaultValue: 'WhatsApp' })}</Text>
        </RectButton>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>{t('home.hello')},</Text>
          <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>{userProfile?.name || user?.displayName || t('settings.user')}</Text>
        </View>
        <TouchableOpacity style={[styles.profileBtn, { backgroundColor: theme.colors.surface }]} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={sfs(24)} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <GuestBanner />

      <FlashList
        data={filteredShops}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        ListHeaderComponent={
          <View>
            {/* HERO SECTION - TOTAL DUE */}
            {shops.length > 0 && (
              <LinearGradient
                colors={mode === 'dark' ? ['#4834D4', '#686DE0'] : [theme.colors.primary, '#8E7CFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View>
                  <Text style={styles.heroLabel}>{t('shop.totalDue')}</Text>
                  <Text style={[styles.heroAmount, { fontSize: sfs(32) }]}>৳{stats.totalMarketDue.toLocaleString()}</Text>
                </View>
                <View style={styles.heroIconContainer}>
                  <Ionicons name="wallet-outline" size={sfs(40)} color="rgba(255,255,255,0.4)" />
                </View>
              </LinearGradient>
            )}

            <View style={styles.contentPadding}>
              <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: isSearchFocused ? theme.colors.primary : theme.colors.border }]}>
                <Ionicons name="search" size={sfs(24)} color={isSearchFocused ? theme.colors.primary : theme.colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                  placeholder={t('common.searchShop')}
                  placeholderTextColor={theme.colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{t('home.myLedger')}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.swipeWrapper}>
            <Swipeable
              ref={ref => (swipeableRefs.current[item.id] = ref)}
              renderLeftActions={() => renderLeftActions(item)}
              renderRightActions={() => renderRightActions(item)}
            >
              <ShopCard shop={item} onPress={() => router.push(`/shop/${item.id}`)} />
            </Swipeable>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
              <Ionicons name="book-outline" size={sfs(48)} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>{t('home.emptyLedger')}</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push('/shop/add?type=personal')}
            >
              <Text style={styles.emptyBtnText}>{t('home.addShop')}</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/shop/add?type=personal')}
      >
        <Ionicons name="add" size={sfs(32)} color={theme.colors.white} />
      </TouchableOpacity>

      <ConfirmModal
        visible={isConfirmVisible}
        title={t('common.delete')}
        message={t('home.deleteShopConfirm', { name: shopToDelete?.name })}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />

      <ConfirmModal
        visible={isRestrictedVisible}
        title={t('home.cannotDeleteShop')}
        message={t('home.cannotDeleteShopMsg', { amount: shopToDelete?.baki })}
        type="warning"
        confirmText={t('common.gotIt')}
        onConfirm={() => setRestrictedVisible(false)}
      />

      <ConfirmModal
        visible={isSuccessVisible}
        title={t('common.success')}
        message={t('home.shopDeleted')}
        type="success"
        confirmText={t('common.ok')}
        onConfirm={() => setSuccessVisible(false)}
      />
    </SafeAreaView>
  );
}
