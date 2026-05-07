import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getCustomerById, Customer } from '../../database/customers';
import { getTransactionsByCustomer, Transaction } from '../../database/transactions';
import { getPaymentsByCustomer, Payment, getCustomerBalance } from '../../database/payments';
import { BakiSummaryCard } from '../../components/BakiSummaryCard';
import { TransactionRow } from '../../components/TransactionRow';
import { Avatar } from '../../components/ui/Avatar';

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    padding: 24,
    paddingBottom: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: sfs(16), fontWeight: 'bold',
    marginBottom: 4,
  },
  phone: {
    fontSize: sfs(16) },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingTop: 40,
  },
  fabGroup: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});

export default function CustomerDetail() {
  const { id } = useLocalSearchParams();
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<(Transaction | Payment)[]>([]);
  const [balance, setBalance] = useState({ totalBaki: 0, totalPaid: 0, netDue: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const cId = parseInt(id as string);
      const [customerData, transactions, payments, balanceData] = await Promise.all([
        getCustomerById(cId),
        getTransactionsByCustomer(cId),
        getPaymentsByCustomer(cId),
        getCustomerBalance(cId)
      ]);

      setCustomer(customerData);
      setBalance(balanceData);

      // Combine and sort history
      const combined = [
        ...transactions.map((t: Transaction) => ({ ...t, type: 'baki' as const, amount: t.total_amount, date: t.transaction_date })),
        ...payments.map((p: Payment) => ({ ...p, type: 'payment' as const, amount: p.amount, date: p.payment_date }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setHistory(combined as any); // Type cast due to intersection complexity in UI
    } catch (e) {
      console.error('Failed to fetch customer details', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const renderHeader = useMemo(() => (
    <View style={styles.headerContent}>
      {customer && (
        <View style={styles.profileRow}>
          <Avatar name={customer.name} uri={customer.image_uri} size={sfs(24)} />
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{customer.name}</Text>
            <Text style={[styles.phone, { color: theme.colors.textSecondary }]}>{customer.phone || t('customer.noPhone')}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.callBtn, { backgroundColor: theme.colors.primaryLight }]}
            onPress={() => Alert.alert(t('customer.calling'), customer.phone)}
            accessibilityLabel={t('customer.calling') + ' ' + (customer.phone || '')}
            accessibilityRole="button"
          >
            <Ionicons name="call" size={sfs(24)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <BakiSummaryCard 
        totalBaki={balance.totalBaki} 
        totalPaid={balance.totalPaid} 
        netDue={balance.netDue} 
      />

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{t('customer.history')}</Text>
      </View>
    </View>
  ), [customer, balance, theme.colors, sfs, t, styles]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: t('customer.history'),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push(`/customer/edit/${id}`)}
              accessibilityLabel={t('common.edit')}
              accessibilityRole="button"
            >
              <Ionicons name="create-outline" size={sfs(24)} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )
        }} 
      />

      <FlatList
        data={history}
        keyExtractor={(item, index) => `${(item as any).type}-${item.id}`}
        renderItem={({ item }) => <TransactionRow item={item as any} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>{t('customer.noTransactions')}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      />

      <View style={styles.fabGroup}>
        <TouchableOpacity 
          style={[styles.fab, styles.fabSmall, { backgroundColor: theme.colors.success }]}
          onPress={() => router.push({ pathname: '/payment/add', params: { customerId: id } })}
          accessibilityLabel={t('payment.record')}
          accessibilityRole="button"
        >
          <Ionicons name="cash-outline" size={sfs(24)} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: theme.colors.danger }]}
          onPress={() => router.push({ pathname: '/transaction/add', params: { customerId: id, shopId: customer?.shop_id } })}
          accessibilityLabel={t('transaction.newEntry')}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={sfs(24)} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>

  );
}


