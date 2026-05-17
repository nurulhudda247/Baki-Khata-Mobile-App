import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Platform, StatusBar, TouchableWithoutFeedback, Alert, Linking, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getCustomerById, Customer } from '../../database/customers';
import { getProductsByShop, Product } from '../../database/products';
import { createTransaction, getTransactionsByCustomer, updateTransaction, Transaction, getOldestUnpaidTransactionDate } from '../../database/transactions';
import { getPaymentsByCustomer, createPayment, updatePayment, Payment, getCustomerBalance } from '../../database/payments';
import { Button } from '../../components/ui/Button';
import { getCategoryIcon } from '../../utils/productUtils';
import { formatDateLabel, formatTimeLabel, getCurrentDateBD } from '../../utils/dateUtils';
import { BottomModal } from '../../components/ui/BottomModal';
import { Avatar } from '../../components/ui/Avatar';

import { Theme } from '../../constants/darkTheme';

type HistoryTab = 'BAKI' | 'PAYMENT';

const getStyles = (theme: Theme, sfs: (s: number) => number, insets: any) => StyleSheet.create({
  container: { flex: 1 },
  headerSection: { padding: 20, paddingTop: 12 },
  customAppBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerCustomerName: { fontSize: sfs(18), fontWeight: 'bold', marginLeft: 16, flex: 1 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: sfs(12), marginBottom: 4 },
  balanceAmount: { color: theme.colors.white, fontSize: sfs(24), fontWeight: 'bold' },
  balanceIcon: { backgroundColor: 'rgba(255,255,255,0.2)', width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  actionRow: { marginBottom: 32 },
  paymentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  paymentBtnText: { fontSize: sfs(16), fontWeight: 'bold', marginLeft: 8 },
  searchBarContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 16, borderWidth: 1, flex: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: sfs(16) },
  filterBtn: { width: 50, height: 50, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  productsList: { paddingRight: 20 },
  productCard: { width: 130, padding: 16, borderRadius: 20, borderWidth: 1, marginRight: 12, alignItems: 'center' },
  productIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  productName: { fontSize: sfs(15), fontWeight: '600', marginBottom: 2 },
  productCategory: { fontSize: sfs(10), fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  productPrice: { fontSize: sfs(14), fontWeight: '700' },
  noResult: { padding: 20, borderRadius: 16, alignItems: 'center' },
  tabContainer: { flexDirection: 'row', marginTop: 32, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: sfs(16), fontWeight: 'bold' },
  listContent: { paddingBottom: 120 },
  dateHeader: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateHeaderText: { fontSize: sfs(16), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateTotalText: { fontSize: sfs(16), fontWeight: '500' },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 20, marginBottom: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  historyIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  historyMain: { flex: 1 },
  historyTitle: { fontSize: sfs(16), fontWeight: '600', marginBottom: 2 },
  historyMetaRow: { flexDirection: 'row', alignItems: 'center' },
  historyTime: { fontSize: sfs(12), fontWeight: '500' },
  historyMeta: { fontSize: sfs(12), fontWeight: '500' },
  partialText: { fontSize: sfs(12), fontWeight: '600', marginTop: 2 },
  historyNote: { fontSize: sfs(13), fontStyle: 'italic', marginTop: 4 },
  historyPrice: { alignItems: 'flex-end' },
  historyTotal: { fontSize: sfs(16), fontWeight: 'bold' },
  settledBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  settledBadgeText: { fontSize: sfs(10), fontWeight: 'bold' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  fab: { position: 'absolute', right: 24, bottom: 40, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: theme.colors.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  fabBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: theme.colors.white, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  selectedProductInfo: { marginBottom: 24, padding: 16, borderRadius: 20 },
  modalProductName: { fontSize: sfs(18), fontWeight: 'bold', marginBottom: 4 },
  modalBody: { marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: sfs(12), marginBottom: 8, fontWeight: '600' },
  modalInput: { height: 60, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: sfs(16), fontWeight: '600' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  qtyInput: { flex: 1, height: 60, borderRadius: 16, borderWidth: 1, textAlign: 'center', fontSize: sfs(20), fontWeight: 'bold' },
  presetContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  presetChipText: { fontWeight: 'bold', fontSize: sfs(14) },
  dateOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  dateOptionText: { fontSize: sfs(16), marginLeft: 12, flex: 1 },
});

export default function CustomerDetail() {
  const { id: rawId } = useLocalSearchParams();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const insets = useSafeAreaInsets();
  const { theme, mode, sfs } = useTheme();
  const { user, isGuest, activeProfile } = useAuth();
  const { showToast } = useToast();
  const styles = useMemo(() => getStyles(theme, sfs, insets), [theme, sfs, insets]);
  const { t } = useTranslation();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [balance, setBalance] = useState({ totalBaki: 0, totalPaid: 0, netDue: 0 });
  const [activeTab, setActiveTab] = useState<HistoryTab>('BAKI');
  const [productSearch, setProductSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isQuantityFocused, setIsQuantityFocused] = useState(false);
  const [isPayAmountFocused, setIsPayAmountFocused] = useState(false);
  const [isNoteFocused, setIsNoteFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isDateModalVisible, setDateModalVisible] = useState(false);

  const [bakiPage, setBakiPage] = useState(0);
  const [paymentPage, setPaymentPage] = useState(0);
  const [hasMoreBaki, setHasMoreBaki] = useState(true);
  const [hasMorePayment, setHasMorePayment] = useState(true);
  const LIMIT = 50;

  const fetchData = async (refresh = true) => {
    if (refresh) {
      setBakiPage(0);
      setPaymentPage(0);
      setHasMoreBaki(true);
      setHasMorePayment(true);
    }
    try {
      const cId = id as string;
      const [customerData, balanceData] = await Promise.all([
        getCustomerById(cId),
        getCustomerBalance(cId)
      ]);

      setCustomer(customerData);
      setBalance(balanceData);

      if (customerData?.shop_id) {
        const productData = await getProductsByShop(customerData.shop_id);
        setProducts(productData);
      }

      const [transData, payData] = await Promise.all([
        getTransactionsByCustomer(id, LIMIT, 0),
        getPaymentsByCustomer(id, LIMIT, 0)
      ]);

      setTransactions(transData);
      setPayments(payData);

      if (transData.length < LIMIT) setHasMoreBaki(false);
      if (payData.length < LIMIT) setHasMorePayment(false);
    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreData = async () => {
    const isBaki = activeTab === 'BAKI';
    const currentHasMore = isBaki ? hasMoreBaki : hasMorePayment;
    if (!currentHasMore || refreshing) return;

    const currentPage = isBaki ? bakiPage : paymentPage;
    const nextPage = currentPage + 1;

    try {
      if (isBaki) {
        const moreTrans = await getTransactionsByCustomer(id as string, LIMIT, nextPage * LIMIT);
        if (moreTrans.length > 0) {
          setTransactions(prev => [...prev, ...moreTrans]);
          setBakiPage(nextPage);
        }
        if (moreTrans.length < LIMIT) setHasMoreBaki(false);
      } else {
        const morePayments = await getPaymentsByCustomer(id as string, LIMIT, nextPage * LIMIT);
        if (morePayments.length > 0) {
          setPayments(prev => [...prev, ...morePayments]);
          setPaymentPage(nextPage);
        }
        if (morePayments.length < LIMIT) setHasMorePayment(false);
      }
    } catch (e) {
      console.error('Load more failed', e);
    }
  };

  const groupedData = useMemo(() => {
    let rawTransactions = [...transactions];
    let rawPayments = [...payments];

    // Apply Date Filter
    if (startDate) {
      rawTransactions = rawTransactions.filter(t => t.transaction_date >= startDate);
      rawPayments = rawPayments.filter(p => p.payment_date >= startDate);
    }
    if (endDate) {
      rawTransactions = rawTransactions.filter(t => t.transaction_date <= endDate);
      rawPayments = rawPayments.filter(p => p.payment_date <= endDate);
    }

    const rawData = activeTab === 'BAKI' ? rawTransactions : rawPayments;
    const groups: any[] = [];
    const totalsByDate: { [key: string]: number } = {};

    rawData.forEach((item: any) => {
      const date = activeTab === 'BAKI' ? item.transaction_date : item.payment_date;
      const amount = activeTab === 'BAKI' ? item.total_amount : item.amount;
      totalsByDate[date] = (totalsByDate[date] || 0) + amount;
    });

    let lastDate = '';
    rawData.forEach((item: any) => {
      const itemDate = activeTab === 'BAKI' ? item.transaction_date : item.payment_date;
      if (itemDate !== lastDate) {
        groups.push({ type: 'HEADER', date: itemDate, total: totalsByDate[itemDate] });
        lastDate = itemDate;
      }
      groups.push({ type: 'ITEM', ...item, itemType: activeTab === 'BAKI' ? 'baki' : 'payment' });
    });
    return groups;
  }, [transactions, payments, activeTab, startDate, endDate]);

  useFocusEffect(useCallback(() => {
    if (id && (user || isGuest)) fetchData(true);
  }, [id, user, isGuest]));

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const search = productSearch.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.category && p.category.toLowerCase().includes(search))
    );
  }, [productSearch, products]);

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [payAmount, setPayAmount] = useState('');
  const [note, setNote] = useState('');

  // History Modal State
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [editHistoryValue, setEditHistoryValue] = useState('');
  const [editHistoryNote, setEditHistoryNote] = useState('');

  const safeParseHistory = (historyStr: string | undefined) => {
    if (!historyStr) return [];
    try {
      return JSON.parse(historyStr);
    } catch (e) {
      return [];
    }
  };

  const handleIncrement = useCallback(() => {
    setQuantity(prev => {
      const val = parseFloat(prev) || 0;
      return (val + 1).toString();
    });
  }, []);

  const handleDecrement = useCallback(() => {
    setQuantity(prev => {
      const val = parseFloat(prev) || 0;
      return val > 1 ? (val - 1).toString() : '1';
    });
  }, []);

  const handleProductTap = useCallback((product: Product) => {
    setSelectedProduct(product);
    setQuantity('1');
    setNote('');
    setModalVisible(true);
  }, []);

  const handleSaveTransaction = useCallback(async () => {
    if (!selectedProduct || !customer) return;
    try {
      const qtyNum = parseFloat(quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        showToast(t('payment.invalidAmount'), 'warning');
        return;
      }
      const totalAmount = qtyNum * selectedProduct.price;
      await createTransaction(customer.id, selectedProduct.id, qtyNum, selectedProduct.price, totalAmount, getCurrentDateBD(), note);
      setModalVisible(false);
      showToast(t('shop.transactionSuccess'), 'success');
      fetchData(true);
      setActiveTab('BAKI');
    } catch (e) {
      console.error('Save failed', e);
      showToast(t('transaction.saveError'), 'error');
    }
  }, [customer, selectedProduct, quantity, note, t, showToast]);

  const handleSavePayment = useCallback(async () => {
    if (!customer) return;
    const amount = parseFloat(payAmount);
    if (!payAmount || isNaN(amount) || amount <= 0) {
      showToast(t('payment.invalidAmount'), 'warning');
      return;
    }
    try {
      await createPayment(customer.id, amount, getCurrentDateBD(), note);
      setPaymentModalVisible(false);
      setPayAmount('');
      setNote('');
      showToast(t('shop.paymentSuccess'), 'success');
      fetchData(true);
      setActiveTab('PAYMENT');
    } catch (e) {
      console.error('Payment failed', e);
      showToast(t('payment.saveError'), 'error');
    }
  }, [customer, payAmount, note, t, showToast]);

  const handleSaveHistoryEdit = useCallback(async () => {
    if (!selectedHistoryItem) return;
    try {
      const val = parseFloat(editHistoryValue);
      if (isNaN(val) || val <= 0) {
        showToast(t('payment.invalidAmount'), 'warning');
        return;
      }

      if (selectedHistoryItem.itemType === 'baki') {
        const unitPrice = selectedHistoryItem.unit_price || (selectedHistoryItem.total_amount / (selectedHistoryItem.quantity || 1));
        const newTotal = val * unitPrice;
        await updateTransaction(selectedHistoryItem.id, val, newTotal, editHistoryNote);
      } else {
        await updatePayment(selectedHistoryItem.id, val, editHistoryNote);
      }

      setIsEditingHistory(false);
      setHistoryModalVisible(false);
      showToast(t('common.success'), 'success');
      fetchData(true);
    } catch (e) {
      console.error('Update failed', e);
      showToast(t('common.error'), 'error');
    }
  }, [selectedHistoryItem, editHistoryValue, editHistoryNote, t, showToast]);

  const setDateRange = (days: number | null) => {
    if (days === null) {
      setStartDate(null);
      setEndDate(null);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
    setDateModalVisible(false);
  };

  const renderHistoryItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'HEADER') {
      return (
        <View style={[styles.dateHeader, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.dateHeaderText, { color: theme.colors.textSecondary }]}>
            {formatDateLabel(item.date)}
          </Text>
          <Text style={[styles.dateTotalText, { color: activeTab === 'BAKI' ? theme.colors.danger : theme.colors.success, fontWeight: 'bold' }]}>
            ৳{item.total.toLocaleString()}
          </Text>
        </View>
      );
    }
    const isBaki = item.itemType === 'baki';
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedHistoryItem(item);
          setEditHistoryValue(isBaki ? String(item.quantity ?? 1) : String(item.amount ?? 0));
          setEditHistoryNote(item.note || '');
          setIsEditingHistory(false);
          setHistoryModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.historyRow, { backgroundColor: theme.colors.surface, opacity: item.isSettled ? 0.6 : 1 }]}>
          <View style={[styles.historyIcon, { backgroundColor: isBaki ? (item.isSettled ? 'rgba(0,0,0,0.05)' : theme.colors.danger + '15') : 'rgba(46, 213, 115, 0.1)' }]}>
            <Ionicons
              name={isBaki ? getCategoryIcon(item.category) : 'cash-outline'}
              size={sfs(24)}
              color={isBaki ? (item.isSettled ? theme.colors.textMuted : theme.colors.danger) : theme.colors.success}
            />
          </View>
          <View style={styles.historyMain}>
            <Text style={[styles.historyTitle, { color: item.isSettled ? theme.colors.textMuted : theme.colors.textPrimary }, item.isSettled && { textDecorationLine: 'line-through' }]}>
              {isBaki ? item.product_name : t('transaction.paymentReceived')}
            </Text>
            <View style={styles.historyMetaRow}>
              <Text style={[styles.historyTime, { color: theme.colors.textMuted }]}>
                {formatTimeLabel(item.created_at)}
              </Text>
              {item.edit_history && <Text style={{ color: theme.colors.primary, fontSize: sfs(10), fontWeight: 'bold', marginLeft: 4 }}> ({t('shop.edited')})</Text>}
              {isBaki && <Text style={[styles.historyMeta, { color: theme.colors.textMuted }]}> • {item.quantity} {item.unit}</Text>}
            </View>
            {isBaki && item.paidAmount > 0 && !item.isSettled && <Text style={[styles.partialText, { color: theme.colors.success }]}>{t('shop.paidLabel')} ৳{item.paidAmount} • {t('shop.left')} ৳{item.remainingAmount}</Text>}
            {item.note ? <Text style={[styles.historyNote, { color: theme.colors.textMuted }]}>{item.note}</Text> : null}
          </View>
          <View style={styles.historyPrice}>
            <Text style={[styles.historyTotal, { color: isBaki ? (item.isSettled ? theme.colors.textMuted : theme.colors.danger) : theme.colors.success }, item.isSettled && { textDecorationLine: 'line-through' }]}>
              {isBaki ? '-' : '+'}৳{isBaki ? item.total_amount : item.amount}
            </Text>
            {item.isSettled && <View style={[styles.settledBadge, { backgroundColor: theme.colors.success + '20' }]}><Text style={[styles.settledBadgeText, { color: theme.colors.success }]}>{t('shop.paid')}</Text></View>}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [activeTab, styles, theme, sfs, t]);

  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => handleProductTap(item)}
    >
      <View style={[styles.productIcon, { backgroundColor: theme.colors.primary + '15' }]}>
        <Ionicons name={getCategoryIcon(item.category)} size={sfs(24)} color={theme.colors.primary} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.productName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.productPrice, { color: theme.colors.textSecondary }]}>৳{item.price}</Text>
      </View>
    </TouchableOpacity>
  ), [styles, theme, sfs, handleProductTap]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.customAppBar, { backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 12 }]}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={sfs(24)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 12 }}>
            <Avatar name={customer?.name || (isLoading ? 'C' : '?')} uri={customer?.image_uri} size={40} />
            <Text style={[styles.headerCustomerName, { color: theme.colors.textPrimary, marginLeft: 12 }]} numberOfLines={1}>
              {customer?.name || (isLoading ? t('common.loading') : t('common.error'))}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push(`/customer/edit/${id}`)}
          >
            <Ionicons name="settings-outline" size={sfs(24)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlashList
        data={groupedData}
        keyExtractor={(item, index) => item.type === 'HEADER' ? `header-${item.date}` : `item-${item.id}`}
        estimatedItemSize={100}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={[styles.balanceCard, { backgroundColor: balance.netDue > 0 ? theme.colors.danger : theme.colors.success }]}>
              <View>
                <Text style={styles.balanceLabel}>{t('customer.netDue')}</Text>
                <Text style={styles.balanceAmount}>৳{balance.netDue.toLocaleString()}</Text>
              </View>
              <View style={styles.balanceIcon}>
                <Ionicons name="wallet-outline" size={sfs(28)} color={theme.colors.white} />
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.paymentBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.success, flex: 1 }]}
                onPress={() => { setPayAmount(''); setNote(''); setPaymentModalVisible(true); }}
              >
                <Ionicons name="cash-outline" size={sfs(24)} color={theme.colors.success} />
                <Text style={[styles.paymentBtnText, { color: theme.colors.success }]}>{t('shopkeeper.payment')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
              <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: isSearchFocused ? theme.colors.primary : theme.colors.border }]}>
                <Ionicons name="search" size={sfs(24)} color={isSearchFocused ? theme.colors.primary : theme.colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.textPrimary }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  placeholder={t('common.searchProduct')}
                  placeholderTextColor={theme.colors.textMuted}
                  value={productSearch}
                  onChangeText={setProductSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
              </View>
              <TouchableOpacity 
                style={[styles.filterBtn, { backgroundColor: theme.colors.surface, borderColor: (startDate || endDate) ? theme.colors.primary : theme.colors.border }]}
                onPress={() => setDateModalVisible(true)}
              >
                <Ionicons name="calendar-outline" size={sfs(24)} color={(startDate || endDate) ? theme.colors.primary : theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {filteredProducts.length > 0 ? (
              <FlashList
                horizontal
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={renderProductItem}
                contentContainerStyle={styles.productsList}
                estimatedItemSize={130}
              />
            ) : (
              <View style={[styles.noResult, { backgroundColor: theme.colors.surface }]}>
                <Text style={{ color: theme.colors.textMuted, fontSize: sfs(16) }}>{t('common.noData')}</Text>
              </View>
            )}

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'BAKI' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 }]}
                onPress={() => setActiveTab('BAKI')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'BAKI' ? theme.colors.primary : theme.colors.textMuted }]}>
                  {t('shopkeeper.bakiHistory')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'PAYMENT' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 }]}
                onPress={() => setActiveTab('PAYMENT')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'PAYMENT' ? theme.colors.primary : theme.colors.textMuted }]}>
                  {t('shopkeeper.paymentHistory')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={renderHistoryItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={sfs(24)} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textMuted, marginTop: 12, fontSize: sfs(16) }}>{t('common.noData')}</Text>
          </View>
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }] as any}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[theme.colors.primary]} />}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
      />

      {/* DATE FILTER MODAL */}
      <BottomModal visible={isDateModalVisible} onClose={() => setDateModalVisible(false)}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('shop.history')}</Text>
          <TouchableOpacity onPress={() => setDateModalVisible(false)} style={styles.modalClose}>
            <Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity style={styles.dateOption} onPress={() => setDateRange(null)}>
            <Ionicons name="infinite-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.dateOptionText, { color: theme.colors.textPrimary }]}>{t('sort.resetFilter')}</Text>
            {!startDate && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateOption} onPress={() => setDateRange(7)}>
            <Ionicons name="time-outline" size={24} color={theme.colors.textSecondary} />
            <Text style={[styles.dateOptionText, { color: theme.colors.textPrimary }]}>{t('common.last7Days')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateOption} onPress={() => setDateRange(30)}>
            <Ionicons name="calendar-outline" size={24} color={theme.colors.textSecondary} />
            <Text style={[styles.dateOptionText, { color: theme.colors.textPrimary }]}>{t('common.last30Days')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateOption} onPress={() => setDateRange(90)}>
            <Ionicons name="calendar-clear-outline" size={24} color={theme.colors.textSecondary} />
            <Text style={[styles.dateOptionText, { color: theme.colors.textPrimary }]}>{t('common.last90Days')}</Text>
          </TouchableOpacity>
        </View>
      </BottomModal>

      {/* BAKI ENTRY MODAL */}
      <BottomModal visible={isModalVisible} onClose={() => setModalVisible(false)}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('shop.recordEntry')}</Text>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
            <Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
          <View style={[styles.selectedProductInfo, { backgroundColor: theme.colors.primary + '10' }]}>
            <Text style={[styles.modalProductName, { color: theme.colors.textPrimary }]}>{selectedProduct?.name}</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: sfs(16) }}>৳{selectedProduct?.price} / {selectedProduct?.unit}</Text>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('shop.buyAmount')}</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={handleDecrement}
                >
                  <Ionicons name="remove" size={sfs(24)} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.qtyInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: isQuantityFocused ? theme.colors.primary : theme.colors.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textMuted}
                  onFocus={() => setIsQuantityFocused(true)}
                  onBlur={() => setIsQuantityFocused(false)}
                />
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={handleIncrement}
                >
                  <Ionicons name="add" size={sfs(24)} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('payment.noteOptional')}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                value={note}
                onChangeText={setNote}
                placeholder={t('payment.notePlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>
          <Button title={t('shop.saveEntry')} onPress={handleSaveTransaction} />
        </ScrollView>
      </BottomModal>

      {/* PAYMENT MODAL */}
      <BottomModal visible={isPaymentModalVisible} onClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('shop.recordPayment')}</Text>
          <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.modalClose}>
            <Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('shop.paymentAmount')}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: isPayAmountFocused ? theme.colors.primary : theme.colors.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder={t('shop.amountPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                autoFocus
                onFocus={() => setIsPayAmountFocused(true)}
                onBlur={() => setIsPayAmountFocused(false)}
              />
              <View style={styles.presetContainer}>
                {[50, 100, 200, 500].map(preset => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: payAmount === preset.toString() ? theme.colors.primary + '15' : theme.colors.background,
                        borderColor: payAmount === preset.toString() ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                    onPress={() => setPayAmount(preset.toString())}
                  >
                    <Text style={[
                      styles.presetChipText,
                      { color: payAmount === preset.toString() ? theme.colors.primary : theme.colors.textPrimary }
                    ]}>৳{preset}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('payment.noteOptional')}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                value={note}
                onChangeText={setNote}
                placeholder={t('payment.notePlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>
          <Button title={t('common.save')} onPress={handleSavePayment} />
        </ScrollView>
      </BottomModal>

      {/* HISTORY DETAILS & EDIT MODAL */}
      <BottomModal visible={isHistoryModalVisible} onClose={() => setHistoryModalVisible(false)} maxHeight="80%">
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
            {selectedHistoryItem?.itemType === 'baki' ? t('shop.transactionDetails') : t('shop.paymentDetails')}
          </Text>
          <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={styles.modalClose}>
            <Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {selectedHistoryItem && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: Dimensions.get('window').height * 0.65 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {!isEditingHistory ? (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(14) }}>{t('shop.currentRecord')}</Text>
                  <TouchableOpacity onPress={() => setIsEditingHistory(true)}>
                    <Ionicons name="pencil" size={sfs(32)} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={{ color: theme.colors.textPrimary, fontSize: sfs(24), fontWeight: 'bold', marginBottom: 8 }}>
                  ৳{selectedHistoryItem.itemType === 'baki' ? selectedHistoryItem.total_amount : selectedHistoryItem.amount}
                </Text>

                {selectedHistoryItem.itemType === 'baki' && (
                  <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(16), marginBottom: 8 }}>
                    {t('transaction.quantity')}: {selectedHistoryItem.quantity} {selectedHistoryItem.unit}
                  </Text>
                )}

                <Text style={{ color: theme.colors.textMuted, fontSize: sfs(14), marginBottom: 16 }}>
                  {t('shop.date')}: {formatDateLabel(selectedHistoryItem.itemType === 'baki' ? selectedHistoryItem.transaction_date : selectedHistoryItem.payment_date)} • {formatTimeLabel(selectedHistoryItem.created_at)}
                </Text>

                {selectedHistoryItem.note ? (
                  <View style={{ backgroundColor: theme.colors.background, padding: 12, borderRadius: 12, marginBottom: 16 }}>
                    <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic', fontSize: sfs(14) }}>{t('shop.noteLabel')}: {selectedHistoryItem.note}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: sfs(18), fontWeight: 'bold', marginBottom: 16 }}>
                  {selectedHistoryItem.itemType === 'baki' ? t('shop.editQuantity') : t('shop.editAmount')}
                </Text>

                <TextInput
                  style={{ height: 56, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 16, color: theme.colors.textPrimary, fontSize: sfs(16), marginBottom: 16, backgroundColor: theme.colors.background }}
                  keyboardType="numeric"
                  value={editHistoryValue}
                  onChangeText={setEditHistoryValue}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(14), marginBottom: 8 }}>{t('shop.noteLabel')}</Text>
                <TextInput
                  style={{ height: 56, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 16, color: theme.colors.textPrimary, fontSize: sfs(16), marginBottom: 24, backgroundColor: theme.colors.background }}
                  value={editHistoryNote}
                  onChangeText={setEditHistoryNote}
                  placeholder={t('shop.addNotePlaceholder')}
                  placeholderTextColor={theme.colors.textMuted}
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Button title={t('common.cancel')} onPress={() => setIsEditingHistory(false)} variant="outline" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button title={t('common.save')} onPress={handleSaveHistoryEdit} />
                  </View>
                </View>
              </View>
            )}

            <Text style={{ color: theme.colors.textPrimary, fontSize: sfs(18), fontWeight: 'bold', marginBottom: 16 }}>
              {t('shop.editHistoryTitle')} {safeParseHistory(selectedHistoryItem.edit_history).length > 0 ? `(${safeParseHistory(selectedHistoryItem.edit_history).length})` : ''}
            </Text>

            {selectedHistoryItem.edit_history && safeParseHistory(selectedHistoryItem.edit_history).length > 0 ? (
              safeParseHistory(selectedHistoryItem.edit_history).slice().reverse().map((hist: any, index: number) => (
                <View key={index} style={{ backgroundColor: theme.colors.background, padding: 16, borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
                  <Text style={{ color: theme.colors.textMuted, fontSize: sfs(12), marginBottom: 8 }}>
                    {formatDateLabel(hist.changed_at)} • {formatTimeLabel(hist.changed_at)}
                  </Text>

                  {selectedHistoryItem.itemType === 'baki' ? (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(14) }}>{t('shop.quantityChanged')}: </Text>
                        <Text style={{ textDecorationLine: 'line-through', color: theme.colors.textSecondary, fontSize: sfs(14) }}>{hist.old_quantity}</Text>
                        <Ionicons name="arrow-forward" size={sfs(14)} color={theme.colors.textMuted} style={{ marginHorizontal: 4 }} />
                        <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary, fontSize: sfs(14) }}>{hist.new_quantity}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(14) }}>{t('shop.totalChanged')}: </Text>
                        <Text style={{ textDecorationLine: 'line-through', color: theme.colors.textSecondary, fontSize: sfs(14) }}>৳{hist.old_total}</Text>
                        <Ionicons name="arrow-forward" size={sfs(14)} color={theme.colors.textMuted} style={{ marginHorizontal: 4 }} />
                        <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary, fontSize: sfs(14) }}>৳{hist.new_total}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: sfs(14) }}>{t('shop.amountChanged')}: </Text>
                      <Text style={{ textDecorationLine: 'line-through', color: theme.colors.textSecondary, fontSize: sfs(14) }}>৳{hist.old_amount}</Text>
                      <Ionicons name="arrow-forward" size={sfs(14)} color={theme.colors.textMuted} style={{ marginHorizontal: 4 }} />
                      <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary, fontSize: sfs(14) }}>৳{hist.new_amount}</Text>
                    </View>
                  )}

                  {hist.old_note !== undefined && (
                    <Text style={{ color: theme.colors.textMuted, fontSize: sfs(12), marginTop: 8, fontStyle: 'italic' }}>
                      {t('shop.previousNote')}: {hist.old_note || t('shop.none')}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', padding: 24, backgroundColor: theme.colors.background, borderRadius: 16 }}>
                <Ionicons name="time-outline" size={sfs(32)} color={theme.colors.textMuted} />
                <Text style={{ color: theme.colors.textMuted, marginTop: 8, fontSize: sfs(14) }}>{t('shop.noEditHistory')}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </BottomModal>
    </View>
  );
}
