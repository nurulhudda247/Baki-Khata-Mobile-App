import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { createPayment } from '../../database/payments';
import { getCurrentDateBD } from '../../utils/dateUtils';
import { getCustomerById, Customer } from '../../database/customers';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  customerHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  customerName: {
    fontSize: sfs(16), fontWeight: 'bold',
    marginTop: 12,
  },
  amountInput: {
    fontSize: sfs(16), fontWeight: 'bold',
    height: 70,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 20,
  },
});

export default function RecordPayment() {
  const { customerId } = useLocalSearchParams();
  const { theme, mode, sfs } = useTheme();
  const { showToast } = useToast();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getCurrentDateBD());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      const data = await getCustomerById(customerId as string);
      setCustomer(data);
    } catch (e) {
      console.error('Failed to load customer', e);
    }
  };

  const handleSave = async () => {
    if (!amount.trim() || isNaN(parseFloat(amount))) {
      showToast(t('payment.invalidAmount'), 'warning');
      return;
    }

    setLoading(true);
    try {
      await createPayment(
        customerId as string,
        parseFloat(amount),
        date,
        note.trim()
      );
      router.back();
    } catch (e) {
      console.error('Failed to save payment', e);
      showToast(t('payment.saveError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen options={{ title: t('payment.recordPayment') }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {customer && (
          <View style={styles.customerHeader}>
            <Avatar name={customer.name} uri={customer.image_uri} size={sfs(24)} />
            <Text style={[styles.customerName, { color: theme.colors.textPrimary }]}>{customer.name}</Text>
          </View>
        )}

        <FloatingLabelInput
          label={t('payment.paymentAmount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          inputStyle={styles.amountInput}
        />
        
        <FloatingLabelInput
          label={t('shop.date')}
          value={date}
          onChangeText={setDate}
        />

        <FloatingLabelInput
          label={t('payment.noteOptional')}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={2}
        />

        <Button 
          title={t('payment.recordPayment')}
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


