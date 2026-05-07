import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Product } from '../database/products';
import { getCategoryIcon } from '../utils/productUtils';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onEdit }) => {
  const { theme, mode, sfs } = useTheme();
  const styles = useMemo(() => getStyles(theme, sfs), [theme, sfs]);
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
        <Ionicons name={getCategoryIcon(product.category)} size={sfs(24)} color={theme.colors.primary} />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{product.name}</Text>
          {product.category && (
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.categoryText, { color: theme.colors.primary }]}>{t('categories.' + product.category)}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.price, { color: theme.colors.primary }]}>
          ৳{product.price} <Text style={{ fontSize: sfs(12), color: theme.colors.textSecondary }}>/ {product.unit}</Text>
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
          <Ionicons name="create-outline" size={sfs(24)} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    fontSize: sfs(16), fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: sfs(16), fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: sfs(16), fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
