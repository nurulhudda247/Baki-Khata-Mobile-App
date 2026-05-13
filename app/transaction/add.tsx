import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { getProductsByShop, Product } from '../../database/products';
import { createTransaction } from '../../database/transactions';
import { getCustomerById, Customer } from '../../database/customers';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { getCurrentDateBD } from '../../utils/dateUtils';

interface CartItem extends Product {
  quantity: number;
}

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  customerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
  customerPhone: {
    fontSize: sfs(16) },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: 120,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: sfs(16), fontWeight: '500',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: sfs(16), fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: sfs(16), fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: sfs(16), fontWeight: '500',
  },
  totalAmount: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

export default function AddTransaction() {
  const { customerId, shopId } = useLocalSearchParams();
  const { theme, mode, sfs } = useTheme();
  const { showToast } = useToast();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(getCurrentDateBD());

  useEffect(() => {
    fetchData();
  }, [customerId, shopId]);

  const fetchData = async () => {
    try {
      const cId = customerId as string;
      const sId = shopId as string;
      const [customerData, productsData] = await Promise.all([
        getCustomerById(cId),
        getProductsByShop(sId)
      ]);
      setCustomer(customerData);
      setProducts(productsData);
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + (p.price * (cart[p.id] || 0)), 0);
  };

  const handleSave = async () => {
    const selectedProductIds = Object.keys(cart);
    if (selectedProductIds.length === 0) {
      showToast(t('transaction.selectProductError'), 'warning');
      return;
    }

    setLoading(true);
    try {
      for (const pId of selectedProductIds) {
        const product = products.find(p => p.id === pId);
        if (product) {
          await createTransaction(
            customerId as string,
            pId,
            cart[pId],
            product.price,
            product.price * cart[pId],
            date,
            ''
          );
        }
      }
      router.back();
    } catch (e) {
      console.error('Failed to save transaction', e);
      showToast(t('transaction.saveError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: t('transaction.newEntry') }} />
      
      <View style={[styles.customerBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {customer && (
          <>
            <Avatar name={customer.name} uri={customer.image_uri} size={sfs(24)} />
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: theme.colors.textPrimary }]}>{customer.name}</Text>
              <Text style={[styles.customerPhone, { color: theme.colors.textSecondary }]}>{customer.phone || t('customer.noPhone')}</Text>
            </View>
          </>
        )}
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={sfs(24)} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, marginLeft: 4 }}>{date}</Text>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.productRow, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.productPrice, { color: theme.colors.primary }]}>৳{item.price} / {item.unit}</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity 
                style={[styles.stepBtn, { backgroundColor: theme.colors.surfaceElevated }]}
                onPress={() => updateQuantity(item.id, -1)}
              >
                <Ionicons name="remove" size={sfs(24)} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: theme.colors.textPrimary }]}>{cart[item.id] || 0}</Text>
              <TouchableOpacity 
                style={[styles.stepBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => updateQuantity(item.id, 1)}
              >
                <Ionicons name="add" size={sfs(24)} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              No products found in this shop. Add products first.
            </Text>
            <Button 
              title={t('transaction.addProducts')} 
              onPress={() => router.push({ pathname: '/product/manage', params: { shopId } })}
              variant="outline"
              style={{ marginTop: 20 }}
            />
          </View>
        )}
      />

      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>{t('transaction.totalAmount')}</Text>
          <Text style={[styles.totalAmount, { color: theme.colors.danger }]}>৳{calculateTotal()}</Text>
        </View>
        <Button 
          title={t('transaction.saveTransaction')} 
          onPress={handleSave} 
          loading={loading}
          disabled={calculateTotal() === 0}
        />
      </View>
    </SafeAreaView>
  );
}


