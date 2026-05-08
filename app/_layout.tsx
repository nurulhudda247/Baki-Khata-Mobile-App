import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import { AppProvider, useAppContext } from '../context/AppContext';
import { ToastProvider } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import '../i18n';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this error. */
});


const RootLayoutContent = () => {
  const { theme, mode, sfs } = useTheme();
  const { isLoading } = useAppContext();
  const { t } = useTranslation();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F14' }}>
        <Text style={{ color: 'red' }}>Font Loading Error: {fontError?.message}</Text>
      </View>
    );
  }

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F14' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ color: '#F0F0F5', marginTop: 20, fontSize: sfs(16) }}>{t('common.loading')} Baki Khata...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
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
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="tutorial" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
        <Stack.Screen name="shop/[id]" options={{ title: t('shop.shopDetails') }} />
        <Stack.Screen name="shop/add" options={{ title: t('shop.addShop') }} />
        <Stack.Screen name="customer/[id]" options={{ title: t('customer.history') }} />
        <Stack.Screen name="customer/add" options={{ title: t('customer.addCustomer') }} />
        <Stack.Screen name="product/manage" options={{ title: t('shop.manageProducts') }} />
        <Stack.Screen name="product/add" options={{ title: t('productAdd.addProduct') }} />
        <Stack.Screen name="transaction/add" options={{ title: t('transaction.newEntry') }} />
        <Stack.Screen name="payment/add" options={{ title: t('payment.recordPayment') }} />
      </Stack>
    </>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <ThemeProvider>
            <ToastProvider>
              <LanguageProvider>
                <RootLayoutContent />
              </LanguageProvider>
            </ToastProvider>
          </ThemeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
