import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, RefreshControl, Platform, Linking, Alert, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { getAllCustomersWithBalance, Customer, toggleCustomerStar } from '../../database/customers';
import { getOldestUnpaidTransactionDate } from '../../database/transactions';
import { CustomerCard } from '../../components/CustomerCard';
import { formatDateLabel } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

import { Theme } from '../../constants/darkTheme';

const getStyles = (theme: Theme, sfs: (s: number) => number) => StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  sortBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: { flexDirection: 'row', gap: 10 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontWeight: '600', fontSize: 12 },
  leftActions: { flexDirection: 'row', width: 170, marginRight: 10 },
  rightActions: { flexDirection: 'row', width: 85, marginLeft: 10 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
});

export default function ShopkeeperCustomers() {
  const { theme, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'DUE'>('ALL');
  const [primaryShopId, setPrimaryShopId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortOrder, setSortOrder] = useState<'NAME_ASC' | 'NAME_DESC' | 'DUE_DESC' | 'DUE_ASC' | 'NEWEST' | 'OLDEST'>('NAME_ASC');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      const { getPrimaryShop } = await import('../../database/shops');
      const shop = await getPrimaryShop('business');
      if (shop) setPrimaryShopId(shop.id);

      const data = await getAllCustomersWithBalance();
      setCustomers(data);
    } catch (e) {
      console.error('Failed to fetch customers', e);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  const handleStar = async (customer: Customer) => {
    try {
      const newStatus = !customer.is_starred;
      await toggleCustomerStar(customer.id, newStatus);
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, is_starred: newStatus ? 1 : 0 } : c));
    } catch (e) {
      console.error('Failed to toggle star', e);
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    
    // 1. Filter
    if (filter === 'DUE') {
      result = result.filter(c => (c.total_baki || 0) > 0);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        (c.phone && c.phone.includes(query))
      );
    }

    // 2. Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'NAME_DESC':
          return b.name.localeCompare(a.name);
        case 'DUE_DESC':
          return (b.total_baki || 0) - (a.total_baki || 0);
        case 'DUE_ASC':
          return (a.total_baki || 0) - (b.total_baki || 0);
        case 'NEWEST':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'OLDEST':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [customers, searchQuery, filter, sortOrder]);

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

  const renderLeftActions = (item: Customer) => {
    if (!item.phone) return null;
    return (
      <View style={styles.leftActions}>
        <RectButton
          style={[styles.actionBtn, { backgroundColor: theme.colors.success }]}
          onPress={() => {
            closeSwipeable(item.id);
            Linking.openURL(`tel:${item.phone}`);
          }}
        >
          <Ionicons name="call" size={sfs(24)} color={theme.colors.white} />
          <Text style={styles.actionText}>{t('common.call')}</Text>
        </RectButton>
        <RectButton
          style={[styles.actionBtn, { backgroundColor: '#25D366', marginLeft: 8 }]}
          onPress={async () => {
            closeSwipeable(item.id);
            
            if (isGuest) {
              Alert.alert(
                t('auth.loginRequired'),
                t('auth.loginRequiredMsg'),
                [
                  { text: t('common.skip'), style: 'cancel' },
                  { 
                    text: t('common.login'), 
                    onPress: () => router.push('/(auth)/login') 
                  }
                ]
              );
              return;
            }

            try {
              const oldestDate = await getOldestUnpaidTransactionDate(item.id);
              const formattedDate = oldestDate ? formatDateLabel(oldestDate) : t('common.noData');
              const message = t('common.whatsappMessage', {
                name: item.name,
                amount: (item.total_baki || 0).toLocaleString(),
                date: formattedDate
              });
              
              const phone = (item.phone || '').replace(/[^0-9]/g, '');
              const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
              
              try {
                await Linking.openURL(url);
              } catch (err) {
                const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                await Linking.openURL(webUrl);
              }
            } catch (e) {
              console.error('WhatsApp failed', e);
            }
          }}
        >
          <Ionicons name="logo-whatsapp" size={sfs(24)} color={theme.colors.white} />
          <Text style={styles.actionText}>WhatsApp</Text>
        </RectButton>
      </View>
    );
  };

  const handleDelete = async (item: Customer) => {
    Alert.alert(
      t('common.delete'),
      t('customer.deleteConfirm', { name: item.name }) || `Are you sure you want to delete ${item.name}?`,
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => closeSwipeable(item.id) },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              const { deleteCustomer } = await import('../../database/customers');
              await deleteCustomer(item.id);
              fetchData();
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          } 
        }
      ]
    );
  };

  const renderRightActions = (item: Customer) => {
    if (item.is_starred) return null;
    return (
      <View style={styles.rightActions}>
        <RectButton
          style={[styles.actionBtn, { backgroundColor: theme.colors.danger }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={sfs(24)} color={theme.colors.white} />
          <Text style={styles.actionText}>{t('common.delete')}</Text>
        </RectButton>
      </View>
    );
  };

  const sortOptions: { label: string; value: typeof sortOrder; icon: string }[] = [
    { label: t('sort.nameAZ'), value: 'NAME_ASC', icon: 'text-outline' },
    { label: t('sort.nameZA'), value: 'NAME_DESC', icon: 'text-outline' },
    { label: t('sort.highestBalance'), value: 'DUE_DESC', icon: 'trending-down-outline' },
    { label: t('sort.lowestBalance'), value: 'DUE_ASC', icon: 'trending-up-outline' },
    { label: t('sort.newest'), value: 'NEWEST', icon: 'time-outline' },
    { label: t('sort.oldest'), value: 'OLDEST', icon: 'time-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { flex: 1, backgroundColor: theme.colors.surface, borderColor: isSearchFocused ? theme.colors.primary : theme.colors.border }]}>
            <Ionicons name="search" size={sfs(20)} color={isSearchFocused ? theme.colors.primary : theme.colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              placeholder={t('common.search') || 'Search...'}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>
          <TouchableOpacity 
            style={[styles.sortBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setIsSortModalVisible(true)}
          >
            <Ionicons name="funnel-outline" size={sfs(20)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'ALL' ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary } : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[styles.filterText, { color: filter === 'ALL' ? theme.colors.white : theme.colors.textSecondary }]}>
              {t('common.all', { defaultValue: 'All' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'DUE' ? { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger } : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setFilter('DUE')}
          >
            <Text style={[styles.filterText, { color: filter === 'DUE' ? theme.colors.white : theme.colors.textSecondary }]}>
              {t('shopkeeper.hasDue', { defaultValue: 'Has Due' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlashList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            <Swipeable
              ref={ref => (swipeableRefs.current[item.id] = ref)}
              renderLeftActions={() => renderLeftActions(item)}
              renderRightActions={() => renderRightActions(item)}
              overshootLeft={false}
              overshootRight={false}
            >
              <CustomerCard 
                customer={item} 
                onPress={() => router.push(`/customer/${item.id}`)} 
                onStarPress={() => handleStar(item)}
              />
            </Swipeable>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={sfs(48)} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textMuted, marginTop: 12 }}>{t('common.noData')}</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      />

      {/* Sort Modal */}
      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsSortModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('sort.title')}</Text>
              <TouchableOpacity onPress={() => setIsSortModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortOrder === option.value && { backgroundColor: theme.colors.primary + '10' }
                ]}
                onPress={() => {
                  setSortOrder(option.value);
                  setIsSortModalVisible(false);
                }}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={20} 
                  color={sortOrder === option.value ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.sortOptionText, 
                  { color: sortOrder === option.value ? theme.colors.primary : theme.colors.textPrimary }
                ]}>
                  {option.label}
                </Text>
                {sortOrder === option.value && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 20 }]}
        onPress={async () => {
          if (isGuest && filteredCustomers.length >= 5) {
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
          router.push({
            pathname: '/customer/add',
            params: { shopId: primaryShopId }
          });
        }}
      >
        <Ionicons name="add" size={sfs(32)} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );
}

