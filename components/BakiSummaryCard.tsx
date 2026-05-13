import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface BakiSummaryCardProps {
  totalBaki: number;
  totalPaid: number;
  netDue: number;
}

export const BakiSummaryCard: React.FC<BakiSummaryCardProps> = ({ totalBaki, totalPaid, netDue }) => {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('customer.totalBaki')}</Text>
          <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>৳{totalBaki}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.item}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('customer.totalPaid')}</Text>
          <Text style={[styles.amount, { color: theme.colors.success }]}>৳{totalPaid}</Text>
        </View>
      </View>
      
      <View style={[styles.dueContainer, { backgroundColor: theme.colors.surfaceElevated }]}>
        <Text style={[styles.dueLabel, { color: theme.colors.textSecondary }]}>{t('customer.netDue')}</Text>
        <Text style={[styles.dueAmount, { color: netDue > 0 ? theme.colors.danger : theme.colors.success }]}>
          ৳{netDue}
        </Text>
      </View>
    </View>
  );
};

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: sfs(16), marginBottom: 6,
  },
  amount: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: '100%',
  },
  dueContainer: {
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueLabel: {
    fontSize: sfs(16), fontWeight: '600',
  },
  dueAmount: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
});
