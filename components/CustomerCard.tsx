import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Customer } from '../database/customers';
import { useTranslation } from 'react-i18next';
import { Avatar } from './ui/Avatar';

interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
  onStarPress?: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = React.memo(({ customer, onPress, onStarPress }) => {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();

  const isDue = (customer.total_baki || 0) > 0;
  const isStarred = !!customer.is_starred;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100).springify()}>
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Avatar name={customer.name} uri={customer.image_uri} size={sfs(48)} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.colors.textPrimary, fontSize: sfs(16) }]}>{customer.name}</Text>
            <View style={styles.row}>
              <Ionicons name="call-outline" size={sfs(14)} color={theme.colors.textSecondary} />
              <Text style={[styles.phone, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>
                {customer.phone || t('common.noData')}
              </Text>
            </View>
          </View>
          
          <View style={styles.rightSection}>
            <View style={styles.bakiInfo}>
              <Text style={[styles.bakiLabel, { color: theme.colors.textSecondary, fontSize: sfs(11) }]}>{t('customer.totalBaki')}</Text>
              <Text style={[
                styles.bakiAmount, 
                { color: isDue ? theme.colors.danger : theme.colors.success, fontSize: sfs(16) }
              ]}>
                ৳{customer.total_baki || 0}
              </Text>
            </View>

            {onStarPress && (
              <TouchableOpacity onPress={onStarPress} style={styles.starBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons 
                  name={isStarred ? "star" : "star-outline"} 
                  size={sfs(20)} 
                  color={isStarred ? "#F1C40F" : theme.colors.textMuted} 
                />
              </TouchableOpacity>
            )}
            {!onStarPress && isStarred && (
              <View style={styles.starIcon}>
                <Ionicons name="star" size={sfs(16)} color="#F1C40F" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: sfs(16), fontWeight: 'bold',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phone: {
    fontSize: sfs(13) },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bakiInfo: {
    alignItems: 'flex-end',
  },
  bakiLabel: {
    fontSize: sfs(11), marginBottom: 2,
  },
  bakiAmount: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
  starBtn: {
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.05)',
  },
  starIcon: {
    marginLeft: 8,
  }
});
