import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getShops, createShop } from '../../database/shops';
import { useTranslation } from 'react-i18next';

export default function ShopkeeperLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const ensureShop = async () => {
      try {
        const shops = await getShops('business');
        if (shops.length === 0) {
          const shopName = user?.displayName ? `${user.displayName}'s Shop` : 'My Shop';
          await createShop(shopName, '', '', '', 'business');
        }
      } catch (e) {
        console.error('Failed to ensure shop', e);
      } finally {
        setIsInitializing(false);
      }
    };
    ensureShop();
  }, [user]);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="customers" options={{ title: t('shopkeeper.customers') }} />
      <Stack.Screen name="products" options={{ title: t('shopkeeper.products') }} />
      <Stack.Screen name="shop-profile" options={{ title: t('shop.settings') }} />
    </Stack>
  );
}
