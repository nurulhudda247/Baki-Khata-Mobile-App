import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Platform, StatusBar, TouchableWithoutFeedback, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { getShopById, Shop } from '../../database/shops';
import { getProductsByShop, Product } from '../../database/products';
import { createTransaction, getTransactionsByShopId } from '../../database/transactions';
import { getPaymentsByShopId, createPayment } from '../../database/payments';
import { getSelfCustomerByShop } from '../../database/customers';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { getCategoryIcon } from '../../utils/productUtils';
import { formatDateLabel, formatTimeLabel, getCurrentDateBD } from '../../utils/dateUtils';

type HistoryTab = 'DEBT' | 'PAYMENT';

const getStyles = (theme: any, sfs: any, insets: any) => StyleSheet.create({
  container: { flex: 1 },
  headerSection: { padding: 20, paddingTop: 12 },
  customAppBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerShopName: { fontSize: sfs(18), fontWeight: 'bold', marginLeft: 16, flex: 1 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: sfs(12), marginBottom: 4 },
  balanceAmount: { color: 'white', fontSize: sfs(16), fontWeight: 'bold' },
  balanceIcon: { backgroundColor: 'rgba(255,255,255,0.2)', width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  actionRow: { marginBottom: 32 },
  payBackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  payBackBtnText: { fontSize: sfs(16), fontWeight: 'bold', marginLeft: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: sfs(16) },
  productsList: { paddingRight: 20 },
  productCard: { width: 130, padding: 16, borderRadius: 20, borderWidth: 1, marginRight: 12, alignItems: 'center' },
  productIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  productName: { fontSize: sfs(18), fontWeight: '600', marginBottom: 2 },
  productCategory: { fontSize: sfs(16), fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  productPrice: { fontSize: sfs(16) },
  noResult: { padding: 20, borderRadius: 16, alignItems: 'center' },
  tabContainer: { flexDirection: 'row', marginTop: 32, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: sfs(16), fontWeight: 'bold' },
  listContent: { paddingBottom: 120 },
  dateHeader: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateHeaderText: { fontSize: sfs(16), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateTotalText: { fontSize: sfs(16), fontWeight: '500' },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 20, marginBottom: 12, borderRadius: 20 },
  historyIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyMain: { flex: 1 },
  historyProductName: { fontSize: sfs(18), fontWeight: '600', marginBottom: 2 },
  historyMetaRow: { flexDirection: 'row', alignItems: 'center' },
  historyTime: { fontSize: sfs(16), fontWeight: 'bold' },
  historyMeta: { fontSize: sfs(16), fontWeight: 'bold' },
  partialText: { fontSize: sfs(16), fontWeight: 'bold', marginTop: 2 },
  historyNote: { fontSize: sfs(16), fontStyle: 'italic', marginTop: 4 },
  historyPrice: { alignItems: 'flex-end' },
  historyTotal: { fontSize: sfs(16), fontWeight: 'bold' },
  settledBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  settledBadgeText: { fontSize: sfs(16), fontWeight: 'bold' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  fab: { position: 'absolute', right: 24, bottom: 40, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  fabBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'white', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalIndicator: { width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'center', borderRadius: 2, marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  selectedProductInfo: { marginBottom: 24, padding: 16, borderRadius: 20 },
  modalProductName: { fontSize: sfs(18), fontWeight: 'bold', marginBottom: 4 },
  modalBody: { marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: sfs(12), marginBottom: 8, fontWeight: '600' },
  modalInput: { height: 60, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: sfs(16), fontWeight: '600' }
});

export default function ShopDetail() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { theme, mode, sfs } = useTheme();
  const { showToast } = useToast();
  const styles = useMemo(() => getStyles(theme, sfs, insets), [theme, sfs, insets]);
  const { t } = useTranslation();
  const router = useRouter();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<HistoryTab>('DEBT');
  const [productSearch, setProductSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isQuantityFocused, setIsQuantityFocused] = useState(false);
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isPayAmountFocused, setIsPayAmountFocused] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    try {
      const shopId = parseInt(id as string);
      const [shopData, productData, transData, paymentData] = await Promise.all([
        getShopById(shopId),
        getProductsByShop(shopId),
        getTransactionsByShopId(shopId),
        getPaymentsByShopId(shopId)
      ]);
      setShop(shopData);
      setProducts(productData);
      setTransactions(transData);
      setPayments(paymentData);
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  };

  const processedTransactions = useMemo(() => {
    let totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const oldestToNewest = [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const processed = oldestToNewest.map(t => {
      let paidForThis = 0;
      let isSettled = false;
      if (totalPaid > 0) {
        if (totalPaid >= t.total_amount) {
          paidForThis = t.total_amount;
          totalPaid -= t.total_amount;
          isSettled = true;
        } else {
          paidForThis = totalPaid;
          totalPaid = 0;
          isSettled = false;
        }
      }
      return { ...t, isSettled, paidAmount: paidForThis, remainingAmount: t.total_amount - paidForThis };
    });
    return processed.sort((a, b) => {
      if (a.isSettled === b.isSettled) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.isSettled ? 1 : -1;
    });
  }, [transactions, payments]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payments]);

  const groupedData = useMemo(() => {
    const rawData = activeTab === 'DEBT' ? processedTransactions : sortedPayments;
    const groups: any[] = [];
    let lastDate = '';

    rawData.forEach((item: any) => {
      const itemDate = activeTab === 'DEBT' ? item.transaction_date : item.payment_date;
      if (itemDate !== lastDate) {
        // Calculate daily total
        const dayTotal = rawData
          .filter((i: any) => (activeTab === 'DEBT' ? i.transaction_date : i.payment_date) === itemDate)
          .reduce((sum: number, i: any) => sum + (activeTab === 'DEBT' ? i.total_amount : i.amount), 0);

        groups.push({ type: 'HEADER', date: itemDate, total: dayTotal });
        lastDate = itemDate;
      }
      groups.push({ type: 'ITEM', ...item });
    });
    return groups;
  }, [processedTransactions, sortedPayments, activeTab]);

  useFocusEffect(useCallback(() => { fetchData(); }, [id]));

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
  const [date, setDate] = useState(getCurrentDateBD());

  const handleProductTap = useCallback((product: Product) => {
    setSelectedProduct(product);
    setQuantity('1');
    setNote('');
    setModalVisible(true);
  }, []);

  const handleSaveTransaction = useCallback(async () => {
    if (!selectedProduct) return;
    try {
      const shopId = parseInt(id as string);
      const customer = await getSelfCustomerByShop(shopId);
      if (!customer) throw new Error('Self customer not found');
      const qtyNum = parseFloat(quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        showToast(t('payment.invalidAmount'), 'warning');
        return;
      }
      const totalAmount = qtyNum * selectedProduct.price;
      await createTransaction(customer.id, selectedProduct.id, qtyNum, selectedProduct.price, totalAmount, date, note);
      setModalVisible(false);
      showToast(t('shop.transactionSuccess'), 'success');
      fetchData();
    } catch (e) {
      console.error('Save failed', e);
      showToast(t('transaction.saveError'), 'error');
    }
  }, [id, selectedProduct, quantity, date, note, t, showToast]);

  const handleSavePayment = useCallback(async () => {
    const amount = parseFloat(payAmount);
    if (!payAmount || isNaN(amount) || amount <= 0) {
      showToast(t('payment.invalidAmount'), 'warning');
      return;
    }
    try {
      const shopId = parseInt(id as string);
      const customer = await getSelfCustomerByShop(shopId);
      if (!customer) throw new Error('Self customer not found');
      await createPayment(customer.id, amount, date, note);
      setPaymentModalVisible(false);
      setPayAmount('');
      setNote('');
      showToast(t('shop.paymentSuccess'), 'success');
      fetchData();
      setActiveTab('PAYMENT');
    } catch (e) {
      console.error('Payment failed', e);
      showToast(t('payment.saveError'), 'error');
    }
  }, [id, payAmount, date, note, t, showToast]);

  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => handleProductTap(item)}
      accessibilityLabel={item.name + ' - ৳' + item.price}
      accessibilityRole="button"
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

      <View style={[styles.customAppBar, { backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20, paddingBottom: 12, marginBottom: 0 }]}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={sfs(24)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerShopName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{shop?.name || t('common.loading')}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push({ pathname: '/shop/add', params: { id } })}
            accessibilityLabel={t('shop.editShop')}
            accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={sfs(24)} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={groupedData}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}><View><Text style={styles.balanceLabel}>{t('shop.totalDue')}</Text><Text style={styles.balanceAmount}>৳{shop?.total_baki?.toLocaleString() || '0'}</Text></View><View style={styles.balanceIcon}><Ionicons name="card-outline" size={sfs(24)} color="white" /></View></View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.payBackBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary, flex: 1 }]}
                onPress={() => { setPayAmount(''); setNote(''); setPaymentModalVisible(true); }}
                accessibilityLabel={t('shop.payBack')}
                accessibilityRole="button"
              >
                <Ionicons name="cash-outline" size={sfs(24)} color={theme.colors.primary} />
                <Text style={[styles.payBackBtnText, { color: theme.colors.primary }]}>{t('shop.payBack')}</Text>
              </TouchableOpacity>
            </View>
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
              {productSearch !== '' && (
                <TouchableOpacity onPress={() => setProductSearch('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={sfs(24)} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {filteredProducts.length > 0 ? (
              <FlatList
                horizontal
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={renderProductItem}
                contentContainerStyle={styles.productsList}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                removeClippedSubviews={Platform.OS === 'android'}
              />
            ) : (
              <View style={[styles.noResult, { backgroundColor: theme.colors.surface }]}><Text style={{ color: theme.colors.textMuted, fontSize: sfs(16) }}>{t('common.noData')}</Text></View>
            )}

            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tab, activeTab === 'DEBT' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 }]} onPress={() => setActiveTab('DEBT')} accessibilityRole="tab"><Text style={[styles.tabText, { color: activeTab === 'DEBT' ? theme.colors.primary : theme.colors.textMuted, fontSize: sfs(16) }]}>{t('shop.purchaseHistory')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'PAYMENT' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 }]} onPress={() => setActiveTab('PAYMENT')} accessibilityRole="tab"><Text style={[styles.tabText, { color: activeTab === 'PAYMENT' ? theme.colors.primary : theme.colors.textMuted, fontSize: sfs(16) }]}>{t('shop.paymentHistory')}</Text></TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'HEADER') {
            return (
              <View style={[styles.dateHeader, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.dateHeaderText, { color: theme.colors.textSecondary }]}>
                  {formatDateLabel(item.date)}
                </Text>
                <Text style={[styles.dateTotalText, { color: activeTab === 'DEBT' ? theme.colors.danger : theme.colors.success, fontWeight: 'bold' }]}>
                  ৳{item.total.toLocaleString()}
                </Text>
              </View>
            );
          }
          return (
            <View style={[styles.historyRow, { backgroundColor: theme.colors.surface, opacity: item.isSettled ? 0.6 : 1 }]}>
              <View style={[styles.historyIcon, { backgroundColor: activeTab === 'DEBT' ? (item.isSettled ? 'rgba(0,0,0,0.05)' : theme.colors.primary + '15') : 'rgba(46, 213, 115, 0.1)' }]}>
                <Ionicons
                  name={activeTab === 'DEBT' ? getCategoryIcon(item.category) : 'cash-outline'}
                  size={sfs(24)}
                  color={activeTab === 'DEBT' ? (item.isSettled ? theme.colors.textMuted : theme.colors.primary) : theme.colors.success}
                />
              </View>
              <View style={styles.historyMain}>
                <Text style={[styles.historyProductName, { color: item.isSettled ? theme.colors.textMuted : theme.colors.textPrimary }, item.isSettled && { textDecorationLine: 'line-through' }]}>{activeTab === 'DEBT' ? item.product_name : t('transaction.paymentReceived')}</Text>
                <View style={styles.historyMetaRow}>
                  <Text style={[styles.historyTime, { color: theme.colors.textMuted }]}>
                    {formatTimeLabel(item.created_at)}
                  </Text>
                  {activeTab === 'DEBT' && <Text style={[styles.historyMeta, { color: theme.colors.textMuted }]}>• {item.quantity} {item.unit}</Text>}
                </View>
                {activeTab === 'DEBT' && item.paidAmount > 0 && !item.isSettled && <Text style={[styles.partialText, { color: theme.colors.success }]}>{t('shop.paidLabel')} ৳{item.paidAmount} • {t('shop.left')} ৳{item.remainingAmount}</Text>}
                {item.note ? <Text style={[styles.historyNote, { color: theme.colors.textMuted }]}>{item.note}</Text> : null}
              </View>
              <View style={styles.historyPrice}>
                <Text style={[styles.historyTotal, { color: activeTab === 'DEBT' ? (item.isSettled ? theme.colors.textMuted : theme.colors.danger) : theme.colors.success }, item.isSettled && { textDecorationLine: 'line-through' }]}>{activeTab === 'DEBT' ? '-' : '+'}৳{activeTab === 'DEBT' ? item.total_amount : item.amount}</Text>
                {item.isSettled && <View style={[styles.settledBadge, { backgroundColor: theme.colors.success + '20' }]}><Text style={[styles.settledBadgeText, { color: theme.colors.success }]}>{t('shop.paid')}</Text></View>}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (<View style={styles.emptyContainer}><Ionicons name="document-text-outline" size={sfs(24)} color={theme.colors.textMuted} /><Text style={{ color: theme.colors.textMuted, marginTop: 12, fontSize: sfs(16) }}>{t('common.noData')}</Text></View>)}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} colors={[theme.colors.primary]} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 40 }]}
        onPress={() => router.push({ pathname: '/product/manage', params: { shopId: id } })}
        activeOpacity={0.8}
        accessibilityLabel={t('shop.manageProducts')}
        accessibilityRole="button"
      >
        <Ionicons name="cube" size={sfs(24)} color="white" />
        <View style={styles.fabBadge}><Ionicons name="settings" size={sfs(24)} color={theme.colors.primary} /></View>
      </TouchableOpacity>


      <Modal visible={isModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableWithoutFeedback><View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}><View style={styles.modalIndicator} /><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('shop.recordEntry')}</Text><TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}><Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} /></TouchableOpacity></View><View style={[styles.selectedProductInfo, { backgroundColor: theme.colors.primary + '10' }]}><Text style={[styles.modalProductName, { color: theme.colors.textPrimary }]}>{selectedProduct?.name}</Text><Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: sfs(16) }}>৳{selectedProduct?.price} / {selectedProduct?.unit}</Text></View><View style={styles.modalBody}><View style={styles.inputGroup}><Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('shop.buyAmount')}</Text><TextInput style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: isQuantityFocused ? theme.colors.primary : theme.colors.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} keyboardType="numeric" value={quantity} onChangeText={setQuantity} placeholder={t('shop.quantityPlaceholder')} placeholderTextColor={theme.colors.textMuted} autoFocus onFocus={() => setIsQuantityFocused(true)} onBlur={() => setIsQuantityFocused(false)} /></View><View style={styles.inputGroup}><Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('shop.date')}</Text><TextInput style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: isDateFocused ? theme.colors.primary : theme.colors.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} value={date} onChangeText={setDate} onFocus={() => setIsDateFocused(true)} onBlur={() => setIsDateFocused(false)} /></View></View><Button title={t('shop.saveEntry')} onPress={handleSaveTransaction} /></View></TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isPaymentModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPaymentModalVisible(false)}>
          <TouchableWithoutFeedback><View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}><View style={styles.modalIndicator} /><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('shop.recordPayment')}</Text><TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.modalClose}><Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} /></TouchableOpacity></View><View style={styles.modalBody}><View style={styles.inputGroup}><Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('shop.paymentAmount')}</Text><TextInput style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: isPayAmountFocused ? theme.colors.primary : theme.colors.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} placeholder={t('shop.amountPlaceholder')} placeholderTextColor={theme.colors.textMuted} autoFocus onFocus={() => setIsPayAmountFocused(true)} onBlur={() => setIsPayAmountFocused(false)} /></View><View style={styles.inputGroup}><Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('shop.date')}</Text><TextInput style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: isDateFocused ? theme.colors.primary : theme.colors.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} value={date} onChangeText={setDate} onFocus={() => setIsDateFocused(true)} onBlur={() => setIsDateFocused(false)} /></View></View><Button title={t('common.save')} onPress={handleSavePayment} /></View></TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>


    </View>
  );
}


