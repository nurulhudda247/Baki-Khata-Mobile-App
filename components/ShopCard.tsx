import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Shop } from '../database/shops';
import { useTranslation } from 'react-i18next';

interface ShopCardProps {
  shop: Shop;
  onPress: () => void;
}

export const ShopCard: React.FC<ShopCardProps> = React.memo(({ shop, onPress }) => {
  const { theme, mode, sfs } = useTheme();
  const styles = useMemo(() => getStyles(theme, sfs), [theme, sfs]);
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()}>
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
      <View style={styles.header}>
        {shop.image_uri ? (
          <Image 
            source={{ uri: shop.image_uri }} 
            style={styles.shopImage} 
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="storefront" size={sfs(24)} color={theme.colors.primary} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.colors.textPrimary, fontSize: sfs(20) }]}>{shop.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={sfs(14)} color={theme.colors.textSecondary} />
            <Text style={[styles.address, { color: theme.colors.textSecondary, fontSize: sfs(13) }]} numberOfLines={1}>
              {shop.address || t('common.noData')}
            </Text>
          </View>
          {shop.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={sfs(14)} color={theme.colors.textSecondary} />
              <Text style={[styles.address, { color: theme.colors.textSecondary, fontSize: sfs(13) }]} numberOfLines={1}>
                {shop.phone}
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={sfs(24)} color={theme.colors.textMuted} />
      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <View style={styles.bakiContainer}>
          <Text style={[styles.bakiLabel, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>{t('shop.totalDue')}</Text>
          <Text style={[styles.bakiAmount, { color: theme.colors.danger, fontSize: sfs(18) }]}>৳{(shop.total_baki || 0).toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
});

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shopImage: {
    width: 54,
    height: 54,
    borderRadius: 16,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  name: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
  address: {
    fontSize: sfs(16), marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  bakiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bakiLabel: {
    fontSize: sfs(16), fontWeight: '600',
  },
  bakiAmount: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
});
