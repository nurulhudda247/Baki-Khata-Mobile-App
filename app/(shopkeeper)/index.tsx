import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Platform, SafeAreaView, StatusBar, ScrollView, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getMarketStats } from '../../database/stats';
import { getStarredCustomers, Customer } from '../../database/customers';
import { GuestBanner } from '../../components/ui/GuestBanner';
import { CustomerCard } from '../../components/CustomerCard';
import { getOldestUnpaidTransactionDate } from '../../database/transactions';
import { formatDateLabel } from '../../utils/dateUtils';

import { Theme } from '../../constants/darkTheme';

const getStyles = (theme: Theme, sfs: (s: number) => number, insets: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: sfs(16) },
  userName: { fontSize: sfs(24), fontWeight: 'bold' },
  profileBtn: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 40 },
  actionBtn: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: sfs(13), fontWeight: '700', textAlign: 'center' },
  heroCard: { marginHorizontal: 24, padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, elevation: 8, shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  heroAmount: { color: theme.colors.white, fontWeight: 'bold' },
  heroIconContainer: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 20 },
  statsRow: { flexDirection: 'row', marginHorizontal: 24, gap: 12, marginBottom: 12 },
  statBox: { flex: 1, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', elevation: 2, shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statValue: { fontWeight: 'bold' },
  sectionTitle: { fontSize: sfs(20), fontWeight: 'bold', marginHorizontal: 24, marginTop: 24, marginBottom: 16 },
  starredList: { paddingHorizontal: 24 },
  starredEmpty: { alignItems: 'center', justifyContent: 'center', padding: 40, opacity: 0.6 },
  leftActions: { flexDirection: 'row', width: 170, marginRight: 10, paddingVertical: 2 },
  swipeActionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  swipeActionText: { color: theme.colors.white, fontSize: 10, fontWeight: 'bold', marginTop: 4 },
});

export default function ShopkeeperHome() {
  const insets = useSafeAreaInsets();
  const { user, isGuest } = useAuth();
  const swipeableRefs = React.useRef<{ [key: string]: Swipeable | null }>({});
  const { theme, sfs, mode } = useTheme();
  const styles = useMemo(() => getStyles(theme, sfs, insets), [theme, sfs, insets]);
  const { userProfile } = useAppContext();
  const { t } = useTranslation();
  const router = useRouter();

  const [stats, setStats] = useState({ totalMarketDue: 0, todayCollection: 0, todayDue: 0, activeCustomers: 0 });
  const [starredCustomers, setStarredCustomers] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [shopName, setShopName] = useState<string | null>(null);
  const [primaryShopId, setPrimaryShopId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const { getPrimaryShop, createShop } = await import('../../database/shops');
      let primaryShop = await getPrimaryShop('business');
      
      // Auto-create default shop if none exists
      if (!primaryShop) {
        const merchantLabel = t('settings.merchant');
        const defaultShopName = (userProfile?.name || merchantLabel) + "'s Shop";
        await createShop(defaultShopName, '', '', '', 'business');
        primaryShop = await getPrimaryShop('business');
      }

      const statsData = await getMarketStats();
      const starred = await getStarredCustomers();
      
      setStats(statsData);
      setStarredCustomers(starred);
      if (primaryShop) {
        setShopName(primaryShop.name);
        setPrimaryShopId(primaryShop.id);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, [userProfile]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const merchantLabel = t('settings.merchant');
  const userLabel = t('settings.user');
  const currentName = userProfile?.name || '';
  const googleName = (user?.displayName || '').trim();
  const baseName = (currentName === 'Merchant' || currentName === 'User' || currentName === merchantLabel || currentName === userLabel || !currentName) ? (googleName || currentName) : currentName;
  const displayName = shopName || baseName || merchantLabel;
  
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
          style={[styles.swipeActionBtn, { backgroundColor: theme.colors.success }]}
          onPress={() => {
            closeSwipeable(item.id);
            Linking.openURL(`tel:${item.phone}`);
          }}
        >
          <Ionicons name="call" size={sfs(24)} color={theme.colors.white} />
          <Text style={styles.swipeActionText}>{t('common.call')}</Text>
        </RectButton>
        <RectButton
          style={[styles.swipeActionBtn, { backgroundColor: '#25D366', marginLeft: 8 }]}
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
          <Text style={styles.swipeActionText}>{t('common.whatsapp', { defaultValue: 'WhatsApp' })}</Text>
        </RectButton>
      </View>
    );
  };
  
  const handleStar = async (customer: Customer) => {
    try {
      const { toggleCustomerStar } = await import('../../database/customers');
      const newStatus = !customer.is_starred;
      await toggleCustomerStar(customer.id, newStatus);
      setStarredCustomers(prev => prev.filter(c => c.id !== customer.id));
    } catch (e) {
      console.error('Failed to toggle star', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>{t('shopkeeper.dashboard')},</Text>
          <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>{displayName}</Text>
        </View>
        <TouchableOpacity style={[styles.profileBtn, { backgroundColor: theme.colors.surface }]} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={sfs(24)} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <GuestBanner />

      <ScrollView 
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HERO SECTION - TOTAL DUE */}
        <LinearGradient
          colors={mode === 'dark' ? ['#4834D4', '#686DE0'] : [theme.colors.primary, '#8E7CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View>
            <Text style={styles.heroLabel}>{t('shopkeeper.totalMarketDue')}</Text>
            <Text style={[styles.heroAmount, { fontSize: sfs(32) }]}>৳{stats.totalMarketDue.toLocaleString()}</Text>
          </View>
          <View style={styles.heroIconContainer}>
            <Ionicons name="wallet-outline" size={sfs(40)} color="rgba(255,255,255,0.4)" />
          </View>
        </LinearGradient>

        {/* TODAY STATS ROW */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.danger + '15' }]}>
              <Ionicons name="trending-up" size={sfs(20)} color={theme.colors.danger} />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('shopkeeper.todayDue')}</Text>
            <Text style={[styles.statValue, { color: theme.colors.danger, fontSize: sfs(18) }]}>৳{stats.todayDue.toLocaleString()}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.success + '15' }]}>
              <Ionicons name="cash-outline" size={sfs(20)} color={theme.colors.success} />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('shopkeeper.todayCollection')}</Text>
            <Text style={[styles.statValue, { color: theme.colors.success, fontSize: sfs(18) }]}>৳{stats.todayCollection.toLocaleString()}</Text>
          </View>
        </View>

        {/* QUICK ACCESS ROW */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/(shopkeeper)/customers')}
          >
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="people" size={sfs(24)} color={theme.colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>{t('shopkeeper.customers')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/(shopkeeper)/products')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#F0932B15' }]}>
              <Ionicons name="cube" size={sfs(24)} color="#F0932B" />
            </View>
            <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>{t('shopkeeper.products')}</Text>
          </TouchableOpacity>
        </View>

        {/* STARRED CUSTOMERS */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{t('shopkeeper.starredCustomers')}</Text>
        <View style={styles.starredList}>
          {starredCustomers.length > 0 ? (
            starredCustomers.map(customer => (
              <View key={customer.id} style={{ marginBottom: 12 }}>
                <Swipeable
                  ref={ref => (swipeableRefs.current[customer.id] = ref)}
                  renderLeftActions={() => renderLeftActions(customer)}
                  overshootLeft={false}
                  overshootRight={false}
                >
                  <CustomerCard 
                    customer={customer}
                    onPress={() => router.push(`/customer/${customer.id}`)}
                    onStarPress={() => handleStar(customer)}
                  />
                </Swipeable>
              </View>
            ))
          ) : (
            <View style={styles.starredEmpty}>
              <Ionicons name="star-outline" size={sfs(48)} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textMuted, marginTop: 12, textAlign: 'center' }}>
                {t('shopkeeper.noStarred')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

