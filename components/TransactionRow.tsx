import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface TransactionRowProps {
  item: {
    id: number;
    product_name?: string;
    amount?: number;
    quantity?: number;
    type: 'baki' | 'payment';
    date: string;
    note?: string;
  };
}

export const TransactionRow: React.FC<TransactionRowProps> = ({ item }) => {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();

  const isPayment = item.type === 'payment';

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: isPayment ? theme.colors.success + '20' : theme.colors.danger + '20' }]}>
        <Ionicons 
          name={isPayment ? 'arrow-down-circle' : 'arrow-up-circle'} 
          size={sfs(24)} 
          color={isPayment ? theme.colors.success : theme.colors.danger} 
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {isPayment ? t('transaction.paymentReceived') : item.product_name}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {isPayment ? (item.note || t('transaction.cashPayment')) : `${item.quantity} x ৳${item.amount! / item.quantity!}`}
        </Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: isPayment ? theme.colors.success : theme.colors.danger }]}>
          {isPayment ? '-' : '+'} ৳{item.amount}
        </Text>
        <Text style={[styles.date, { color: theme.colors.textMuted }]}>{item.date}</Text>
      </View>
    </View>
  );
};

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: sfs(16), fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: sfs(16) },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: sfs(16), fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: sfs(16) },
});
