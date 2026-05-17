import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { queryAll, execute, getCurrentUserId } from '../database/db';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { useAppContext } from '../context/AppContext';
import { formatDateLabel, formatTimeLabel } from '../utils/dateUtils';

interface TrashItem {
  id: string;
  name: string;
  type: 'shop' | 'customer' | 'product';
  tableName: string;
  deleted_at: string;
}

export default function TrashScreen() {
  const { theme, sfs } = useTheme();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);

  const { userProfile } = useAppContext();
  const activeRole = userProfile?.role || 'personal';
  const shopType = activeRole === 'shopkeeper' ? 'business' : 'personal';

  const fetchTrashItems = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const allItems = await queryAll<TrashItem>(`
        SELECT id, name, updated_at as deleted_at, 'shop' as type, 'shops' as tableName 
        FROM shops 
        WHERE is_deleted = 1 AND user_id = ? AND type = ?
        
        UNION ALL
        
        SELECT c.id, c.name, c.updated_at as deleted_at, 'customer' as type, 'customers' as tableName 
        FROM customers c 
        JOIN shops s ON c.shop_id = s.id 
        WHERE c.is_deleted = 1 AND c.user_id = ? AND s.type = ?
        
        UNION ALL
        
        SELECT p.id, p.name, p.updated_at as deleted_at, 'product' as type, 'products' as tableName 
        FROM products p 
        JOIN shops s ON p.shop_id = s.id 
        WHERE p.is_deleted = 1 AND p.user_id = ? AND s.type = ?
        
        ORDER BY deleted_at DESC
      `, [userId, shopType, userId, shopType, userId, shopType]);

      setItems(allItems);
    } catch (e) {
      console.error('Failed to fetch trash items', e);
    } finally {
      setIsLoading(false);
    }
  }, [shopType]);

  useEffect(() => {
    fetchTrashItems();
  }, [fetchTrashItems]);

  const handleRestore = async (item: TrashItem) => {
    try {
      // 1. Restore the item itself
      await execute(`UPDATE ${item.tableName} SET is_deleted = 0, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [item.id]);
      
      if (item.type === 'shop') {
        // Restore all associated customers and products
        await execute(`UPDATE customers SET is_deleted = 0, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE shop_id = ? AND is_deleted = 1`, [item.id]);
        await execute(`UPDATE products SET is_deleted = 0, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE shop_id = ? AND is_deleted = 1`, [item.id]);
        
        // Recursively restore transactions and payments for all customers of this shop
        await execute(`
          UPDATE transactions SET is_deleted = 0, is_dirty = 1, updated_at = CURRENT_TIMESTAMP 
          WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ?) AND is_deleted = 1
        `, [item.id]);
        await execute(`
          UPDATE payments SET is_deleted = 0, is_dirty = 1, updated_at = CURRENT_TIMESTAMP 
          WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ?) AND is_deleted = 1
        `, [item.id]);
      } else if (item.type === 'customer' || item.type === 'product') {
        // RESTORE PARENT SHOP IF DELETED (Prevents Zombie Records)
        const parentShop = await queryAll<any>(`SELECT id FROM shops WHERE id = (SELECT shop_id FROM ${item.tableName} WHERE id = ?) AND is_deleted = 1`, [item.id]);
        if (parentShop && parentShop.length > 0) {
          await execute(`UPDATE shops SET is_deleted = 0, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [parentShop[0].id]);
          showToast(t('common.shopRestored'), 'success'); // Optional feedback
        }

        if (item.type === 'customer') {
          await execute(`UPDATE transactions SET is_deleted = 0, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND is_deleted = 1`, [item.id]);
          await execute(`UPDATE payments SET is_deleted = 0, is_dirty = 1, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND is_deleted = 1`, [item.id]);
        }
      }

      showToast(t('common.success'), 'success');
      fetchTrashItems();
    } catch (e) {
      console.error('Restore failed', e);
      showToast(t('common.error'), 'error');
    }
  };

  const handlePermanentDelete = (item: TrashItem) => {
    Alert.alert(
      t('common.deletePermanent', 'Permanent Delete?'),
      t('settings.deleteItemMsg', 'This item and all its data will be gone forever. This cannot be undone.'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.type === 'shop') {
                // Recursive physical delete
                await execute(`DELETE FROM transactions WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ?)`, [item.id]);
                await execute(`DELETE FROM payments WHERE customer_id IN (SELECT id FROM customers WHERE shop_id = ?)`, [item.id]);
                await execute(`DELETE FROM customers WHERE shop_id = ?`, [item.id]);
                await execute(`DELETE FROM products WHERE shop_id = ?`, [item.id]);
              } else if (item.type === 'customer') {
                await execute(`DELETE FROM transactions WHERE customer_id = ?`, [item.id]);
                await execute(`DELETE FROM payments WHERE customer_id = ?`, [item.id]);
              }

              await execute(`DELETE FROM ${item.tableName} WHERE id = ?`, [item.id]);
              showToast(t('common.success'), 'success');
              fetchTrashItems();
            } catch (e) {
              showToast(t('common.error'), 'error');
            }
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    
    Alert.alert(
      t('settings.emptyTrash', 'Empty Trash?'),
      t('settings.emptyTrashMsg', 'All items in the trash will be permanently deleted. Are you sure?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('settings.emptyTrash', 'Empty Trash'), 
          style: 'destructive',
          onPress: async () => {
            setIsCleaning(true);
            try {
              const userId = getCurrentUserId();
              
              // 1. Delete all transactions/payments for ANY deleted customer of this shop type
              await execute(`
                DELETE FROM transactions 
                WHERE customer_id IN (
                  SELECT c.id FROM customers c 
                  JOIN shops s ON c.shop_id = s.id 
                  WHERE c.is_deleted = 1 AND c.user_id = ? AND s.type = ?
                )
              `, [userId, shopType]);
              
              await execute(`
                DELETE FROM payments 
                WHERE customer_id IN (
                  SELECT c.id FROM customers c 
                  JOIN shops s ON c.shop_id = s.id 
                  WHERE c.is_deleted = 1 AND c.user_id = ? AND s.type = ?
                )
              `, [userId, shopType]);

              // 2. Delete all deleted customers and products of this shop type
              await execute(`
                DELETE FROM customers 
                WHERE is_deleted = 1 AND user_id = ? AND shop_id IN (SELECT id FROM shops WHERE type = ?)
              `, [userId, shopType]);
              
              await execute(`
                DELETE FROM products 
                WHERE is_deleted = 1 AND user_id = ? AND shop_id IN (SELECT id FROM shops WHERE type = ?)
              `, [userId, shopType]);

              // 3. Finally delete the deleted shops themselves
              await execute(`DELETE FROM shops WHERE is_deleted = 1 AND user_id = ? AND type = ?`, [userId, shopType]);
              
              showToast(t('common.success'), 'success');
              fetchTrashItems();
            } catch (e) {
              showToast(t('common.error'), 'error');
            } finally {
              setIsCleaning(false);
            }
          }
        }
      ]
    );
  };

  const formatDateTimeLabel = (dateStr: any) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    try {
      const d = dateStr.split('T')[0] || dateStr;
      return `${formatDateLabel(d)} • ${formatTimeLabel(dateStr)}`;
    } catch (e) {
      return dateStr;
    }
  };

  const renderItem = ({ item, index }: { item: TrashItem, index: number }) => (
    <View 
      style={[styles.itemCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={styles.itemInfo}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
          <Ionicons 
            name={item.type === 'shop' ? 'business' : item.type === 'customer' ? 'person' : 'cube'} 
            size={sfs(20)} 
            color={theme.colors.primary} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemName, { color: theme.colors.textPrimary, fontSize: sfs(16) }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemType, { color: theme.colors.textSecondary, fontSize: sfs(12) }]}>
            {t(`common.${item.type}`).toUpperCase()} • {formatDateTimeLabel(item.deleted_at)}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => handleRestore(item)} 
          style={[styles.actionBtn, { backgroundColor: theme.colors.success + '10' }]}
        >
          <Ionicons name="refresh" size={sfs(20)} color={theme.colors.success} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handlePermanentDelete(item)} 
          style={[styles.actionBtn, { backgroundColor: theme.colors.danger + '10' }]}
        >
          <Ionicons name="trash-outline" size={sfs(20)} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ 
        title: t('settings.trashBin'),
        headerRight: () => items.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: theme.colors.danger }]}>{t('common.clearAll')}</Text>
          </TouchableOpacity>
        ) : null
      }} />

      {isLoading || isCleaning ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="trash-bin-outline" size={sfs(80)} color={theme.colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary, fontSize: sfs(20) }]}>
            {t('common.trashEmpty')}
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: sfs(14) }]}>
            {t('common.trashEmptyDesc')}
          </Text>
          <Button 
            title={t('common.goBack')} 
            onPress={() => router.back()} 
            variant="outline"
            style={{ marginTop: 24, paddingHorizontal: 32 }}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={[styles.warningBanner, { backgroundColor: theme.colors.warning + '15' }]}>
            <Ionicons name="alert-circle-outline" size={sfs(18)} color={theme.colors.warning} />
            <Text style={[styles.warningText, { color: theme.colors.textPrimary, fontSize: sfs(13) }]}>
              {t('settings.trashWarning')}
            </Text>
          </View>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => `${item.type}-${item.id}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  itemCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1,
  },
  itemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  itemName: { fontWeight: 'bold' },
  itemType: { marginTop: 2, opacity: 0.7 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconContainer: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontWeight: 'bold', marginBottom: 8 },
  emptyText: { textAlign: 'center', opacity: 0.6, lineHeight: 20 },
  headerBtn: { paddingHorizontal: 12 },
  headerBtnText: { fontWeight: '700' },
  warningBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginTop: 16, borderRadius: 12, gap: 10 },
  warningText: { flex: 1, fontWeight: '500' },
});
