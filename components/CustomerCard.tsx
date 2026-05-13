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
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onPress }) => {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();

  const isDue = (customer.total_baki || 0) > 0;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100).springify()}>
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
      <View style={styles.content}>
        <Avatar name={customer.name} uri={customer.image_uri} size={sfs(24)} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.colors.textPrimary, fontSize: sfs(16) }]}>{customer.name}</Text>
          <View style={styles.row}>
            <Ionicons name="call-outline" size={sfs(24)} color={theme.colors.textSecondary} />
            <Text style={[styles.phone, { color: theme.colors.textSecondary, fontSize: sfs(13) }]}>
              {customer.phone || t('common.noData')}
            </Text>
          </View>
        </View>
        <View style={styles.bakiInfo}>
          <Text style={[styles.bakiLabel, { color: theme.colors.textSecondary, fontSize: sfs(11) }]}>{t('customer.totalBaki')}</Text>
            <Text style={[
            styles.bakiAmount, 
            { color: isDue ? theme.colors.danger : theme.colors.success, fontSize: sfs(16) }
          ]}>
            ৳{customer.total_baki || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
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
    fontSize: sfs(16) },
  bakiInfo: {
    alignItems: 'flex-end',
  },
  bakiLabel: {
    fontSize: sfs(16), marginBottom: 2,
  },
  bakiAmount: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
});
