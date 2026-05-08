import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TutorialOverlay } from '../components/TutorialOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TutorialScreen() {
  const { theme, sfs, mode } = useTheme();
  const { completeTutorial, userProfile } = useAppContext();
  const { t } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [targets, setTargets] = useState<{ [key: string]: any }>({});
  
  // Refs
  const rootRef = useRef<View>(null);
  const fabRef = useRef<View>(null);
  const shopCardRef = useRef<View>(null);
  const recordBtnRef = useRef<View>(null);
  const manageProductsRef = useRef<View>(null);
  const savePurchaseRef = useRef<View>(null);
  const addProductRef = useRef<View>(null);
  const productItemRef = useRef<View>(null);
  const productCardRef = useRef<View>(null);
  const settingsRef = useRef<View>(null);

  const onMeasure = useCallback((key: string, ref: React.RefObject<View>) => {
    if (ref.current && rootRef.current) {
      ref.current.measureLayout(
        rootRef.current as any,
        (x, y, width, height) => {
          if (width > 0 && height > 0) {
            setTargets(prev => ({ ...prev, [key]: { x, y, width, height } }));
          }
        },
        () => {
          ref.current?.measureInWindow((x, y, width, height) => {
            if (width > 0) {
              setTargets(prev => ({ ...prev, [key]: { x, y, width, height } }));
            }
          });
        }
      );
    }
  }, []);

  const onRootLayout = () => {
    setTimeout(() => {
      onMeasure('fab', fabRef);
      onMeasure('settings', settingsRef);
    }, 600);
  };

  const steps = [
    {
      id: 'home_add',
      targetRect: targets['fab'] || null,
      title: t('tutorial.steps.addShop.title'),
      description: t('tutorial.steps.addShop.desc'),
      arrowDirection: 'down' as const,
    },
    {
      id: 'home_card',
      targetRect: targets['shopCard'] || null,
      title: t('tutorial.steps.shopDetails.title'),
      description: t('tutorial.steps.shopDetails.desc'),
      arrowDirection: 'up' as const,
    },
    {
      id: 'shop_record',
      targetRect: targets['recordBtn'] || null,
      title: t('tutorial.steps.quickEntry.title'),
      description: t('tutorial.steps.quickEntry.desc'),
      arrowDirection: 'up' as const,
    },
    {
      id: 'product_tap',
      targetRect: targets['productCard'] || null,
      title: t('tutorial.steps.recordPurchase.title'),
      description: t('tutorial.steps.recordPurchase.desc'),
      arrowDirection: 'up' as const,
    },
    {
      id: 'purchase_save',
      targetRect: targets['savePurchase'] || null,
      title: t('tutorial.steps.recordPurchase.title'),
      description: t('tutorial.steps.recordPurchase.desc'),
      arrowDirection: 'up' as const,
    },
    {
      id: 'shop_manage',
      targetRect: targets['manageProducts'] || null,
      title: t('tutorial.steps.manageProducts.title'),
      description: t('tutorial.steps.manageProducts.desc'),
      arrowDirection: 'up' as const,
    },
    {
      id: 'product_add',
      targetRect: targets['addProduct'] || null,
      title: t('tutorial.steps.addProduct.title'),
      description: t('tutorial.steps.addProduct.desc'),
      arrowDirection: 'down' as const,
    },
    {
      id: 'product_delete',
      targetRect: targets['productItem'] || null,
      title: t('tutorial.steps.deleteProduct.title'),
      description: t('tutorial.steps.deleteProduct.desc'),
      arrowDirection: 'up' as const,
    },
    {
      id: 'tutorial_restart',
      targetRect: targets['settings'] || null,
      title: t('tutorial.steps.restartLocation.title'),
      description: t('tutorial.steps.restartLocation.desc'),
      arrowDirection: 'up' as const,
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      setTimeout(() => {
        const nextId = steps[nextStep].id;
        if (nextId === 'home_card') onMeasure('shopCard', shopCardRef);
        if (nextId === 'shop_record') onMeasure('recordBtn', recordBtnRef);
        if (nextId === 'product_tap') onMeasure('productCard', productCardRef);
        if (nextId === 'purchase_save') onMeasure('savePurchase', savePurchaseRef);
        if (nextId === 'shop_manage') onMeasure('manageProducts', manageProductsRef);
        if (nextId === 'product_add') onMeasure('addProduct', addProductRef);
        if (nextId === 'product_delete') onMeasure('productItem', productItemRef);
        if (nextId === 'tutorial_restart') onMeasure('settings', settingsRef);
      }, 400);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setIsFinished(false);
    setCurrentStep(0);
    setTargets({});
    setTimeout(() => {
      onMeasure('fab', fabRef);
      onMeasure('settings', settingsRef);
    }, 500);
  };

  const handleFinish = async () => {
    router.replace('/');
    try {
      await completeTutorial();
    } catch (e) {
      console.error('Failed to complete tutorial', e);
    }
  };

  // --- MOCK SCREENS ---
  
  const renderMockHome = () => (
    <View style={styles.mockScreen}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary, fontSize: sfs(16) }]}>{t('home.hello')},</Text>
          <Text style={[styles.userName, { color: theme.colors.textPrimary, fontSize: sfs(24) }]}>{userProfile?.name || 'User'}</Text>
        </View>
        <View 
          ref={settingsRef}
          collapsable={false}
          onLayout={() => onMeasure('settings', settingsRef)}
          style={[styles.profileBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <Ionicons name="settings-outline" size={sfs(24)} color={theme.colors.textPrimary} />
        </View>
      </View>
      <View style={styles.contentPadding}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={sfs(24)} color={theme.colors.textMuted} />
          <Text style={{ color: theme.colors.textMuted, marginLeft: 12, fontSize: sfs(16) }}>{t('common.searchShop')}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: sfs(20) }]}>{t('home.myLedger')}</Text>
        <View 
          ref={shopCardRef}
          collapsable={false}
          onLayout={() => onMeasure('shopCard', shopCardRef)}
          style={[styles.shopCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={[styles.shopIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="storefront" size={sfs(24)} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.shopName, { color: theme.colors.textPrimary, fontSize: sfs(18) }]}>Bhai Bhai Store</Text>
            <Text style={[styles.shopAddress, { color: theme.colors.textSecondary, fontSize: sfs(14) }]}>Dhaka, Bangladesh</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.shopBakiLabel, { color: theme.colors.textSecondary, fontSize: sfs(12) }]}>{t('home.totalDue')}</Text>
            <Text style={[styles.shopBakiValue, { color: theme.colors.danger, fontSize: sfs(18) }]}>৳ 1,250</Text>
          </View>
        </View>
      </View>
      <View ref={fabRef} collapsable={false} onLayout={() => onMeasure('fab', fabRef)} style={[styles.fab, { backgroundColor: theme.colors.primary }]}>
        <Ionicons name="add" size={sfs(24)} color="white" />
      </View>
    </View>
  );

  const renderMockShopDetails = () => (
    <View style={styles.mockScreen}>
      <View style={[styles.detailsHeader, { backgroundColor: theme.colors.background }]}>
        <View style={styles.appBarLeft}>
          <View style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}><Ionicons name="arrow-back" size={sfs(24)} color={theme.colors.textPrimary} /></View>
          <Text style={[styles.headerShopName, { color: theme.colors.textPrimary, fontSize: sfs(18) }]} numberOfLines={1}>Bhai Bhai Store</Text>
        </View>
        <View style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}><Ionicons name="settings-outline" size={sfs(24)} color={theme.colors.textPrimary} /></View>
      </View>
      
      <View style={styles.contentPadding}>
        <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
          <View>
            <Text style={styles.balanceLabel}>{t('shop.totalDue')}</Text>
            <Text style={styles.balanceAmount}>৳1,250.00</Text>
          </View>
          <View style={styles.balanceIcon}>
            <Ionicons name="card-outline" size={sfs(24)} color="white" />
          </View>
        </View>
        
        <View style={styles.actionRow}>
          <TouchableOpacity
            ref={recordBtnRef}
            collapsable={false}
            onLayout={() => onMeasure('recordBtn', recordBtnRef)}
            style={[styles.payBackBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
          >
            <Ionicons name="cash-outline" size={sfs(24)} color={theme.colors.primary} />
            <Text style={[styles.payBackBtnText, { color: theme.colors.primary, fontSize: sfs(16) }]}>{t('shop.payBack')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={sfs(24)} color={theme.colors.textMuted} />
          <Text style={{ color: theme.colors.textMuted, marginLeft: 10, fontSize: sfs(16) }}>{t('common.searchProduct')}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          <View 
            ref={productCardRef}
            collapsable={false}
            onLayout={() => onMeasure('productCard', productCardRef)}
            style={[styles.productCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <View style={[styles.productIcon, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="fast-food" size={sfs(24)} color={theme.colors.primary} /></View>
            <Text style={[styles.productName, { color: theme.colors.textPrimary }]} numberOfLines={1}>Potato</Text>
            <Text style={[styles.productPrice, { color: theme.colors.textSecondary }]}>৳50</Text>
          </View>
          <View style={[styles.productCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.productIcon, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="water" size={sfs(24)} color={theme.colors.primary} /></View>
            <Text style={[styles.productName, { color: theme.colors.textPrimary }]} numberOfLines={1}>Onion</Text>
            <Text style={[styles.productPrice, { color: theme.colors.textSecondary }]}>৳80</Text>
          </View>
        </ScrollView>

        <View style={styles.tabContainer}>
          <View style={[styles.tab, { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 }]}><Text style={[styles.tabText, { color: theme.colors.primary, fontSize: sfs(16) }]}>{t('shop.purchaseHistory')}</Text></View>
          <View style={styles.tab}><Text style={[styles.tabText, { color: theme.colors.textMuted, fontSize: sfs(16) }]}>{t('shop.paymentHistory')}</Text></View>
        </View>
      </View>

      <View 
        ref={manageProductsRef} 
        collapsable={false}
        onLayout={() => onMeasure('manageProducts', manageProductsRef)}
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: 40 }]}
      >
        <Ionicons name="cube" size={sfs(24)} color="white" />
        <View style={styles.fabBadge}><Ionicons name="settings" size={sfs(14)} color={theme.colors.primary} /></View>
      </View>
    </View>
  );

  const renderMockPurchaseEntry = () => (
    <View style={styles.mockScreen}>
      <View style={[styles.detailsHeader, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="close" size={sfs(24)} color={theme.colors.textPrimary} />
        <Text style={[styles.detailsTitle, { color: theme.colors.textPrimary, fontSize: sfs(18) }]}>{t('shop.recordEntry')}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.contentPadding}>
        <View style={[styles.selectedProductInfo, { backgroundColor: theme.colors.primary + '10' }]}>
          <Text style={[styles.modalProductName, { color: theme.colors.textPrimary, fontSize: sfs(18) }]}>Potato</Text>
          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: sfs(16) }}>৳50 / kg</Text>
        </View>
        
        <View style={styles.modalBody}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('shop.buyAmount')}</Text>
            <View style={[styles.modalInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary }]}><Text style={{ color: theme.colors.textPrimary, fontSize: sfs(16) }}>2</Text></View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('shop.date')}</Text>
            <View style={[styles.modalInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}><Text style={{ color: theme.colors.textPrimary, fontSize: sfs(16) }}>08 May, 2026</Text></View>
          </View>
        </View>

        <TouchableOpacity 
          ref={savePurchaseRef}
          collapsable={false}
          onLayout={() => onMeasure('savePurchase', savePurchaseRef)}
          style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.saveBtnText}>{t('shop.saveEntry')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMockManageProducts = () => (
    <View style={styles.mockScreen}>
      <View style={styles.detailsHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}><Ionicons name="arrow-back" size={sfs(24)} color={theme.colors.textPrimary} /></View>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontSize: sfs(20) }]} numberOfLines={1}>{t('shop.manageProducts')}</Text>
        </View>
      </View>
      
      <View style={styles.contentPadding}>
        <View 
          ref={productItemRef}
          collapsable={false}
          onLayout={() => onMeasure('productItem', productItemRef)}
          style={[styles.productManageCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={[styles.productIcon, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="fast-food" size={sfs(24)} color={theme.colors.primary} /></View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.productName, { color: theme.colors.textPrimary, fontSize: sfs(18) }]}>Potato</Text>
            <Text style={[styles.productPrice, { color: theme.colors.textSecondary, fontSize: sfs(16) }]}>৳50 / kg</Text>
          </View>
          <Ionicons name="chevron-forward" size={sfs(20)} color={theme.colors.textMuted} />
        </View>

        <View style={[styles.productManageCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: 0.6 }]}>
          <View style={[styles.productIcon, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="water" size={sfs(24)} color={theme.colors.primary} /></View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.productName, { color: theme.colors.textPrimary, fontSize: sfs(18) }]}>Onion</Text>
            <Text style={[styles.productPrice, { color: theme.colors.textSecondary, fontSize: sfs(16) }]}>৳80 / kg</Text>
          </View>
        </View>
      </View>

      <View 
        ref={addProductRef} 
        collapsable={false}
        onLayout={() => onMeasure('addProduct', addProductRef)}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      >
        <Ionicons name="add" size={sfs(24)} color="white" />
      </View>
    </View>
  );

  const renderCurrentMock = () => {
    const stepId = steps[currentStep]?.id;
    if (stepId === 'home_add' || stepId === 'home_card' || stepId === 'tutorial_restart') return renderMockHome();
    if (stepId === 'shop_record' || stepId === 'shop_manage' || stepId === 'product_tap') return renderMockShopDetails();
    if (stepId === 'purchase_save') return renderMockPurchaseEntry();
    if (stepId === 'product_add' || stepId === 'product_delete') return renderMockManageProducts();
    return renderMockHome();
  };

  return (
    <View ref={rootRef} onLayout={onRootLayout} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      {renderCurrentMock()}
      
      {!isFinished ? (
        <TutorialOverlay 
          visible={true}
          steps={steps}
          currentStep={currentStep}
          onNext={handleNext}
          onSkip={handleFinish}
        />
      ) : (
        <View style={styles.finishOverlay}>
          <View style={[styles.finishCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="checkmark-done-circle" size={sfs(60)} color={theme.colors.success} />
            </View>
            <Text style={[styles.finishTitle, { color: theme.colors.textPrimary, fontSize: sfs(24) }]}>{t('tutorial.doneTitle')}</Text>
            <Text style={[styles.finishDesc, { color: theme.colors.textSecondary, fontSize: sfs(16) }]}>{t('tutorial.doneDesc')}</Text>
            <Text style={[styles.settingsNote, { color: theme.colors.textMuted, fontSize: sfs(14) }]}>{t('tutorial.settingsNote')}</Text>
            
            <TouchableOpacity 
              style={[styles.getStartedBtn, { backgroundColor: theme.colors.primary }]} 
              onPress={handleFinish}
              activeOpacity={0.8}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={[styles.getStartedBtnText, { fontSize: sfs(18) }]}>{t('tutorial.getStarted')}</Text>
              <Ionicons name="rocket-outline" size={sfs(20)} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.restartBtn, { borderColor: theme.colors.border }]} 
              onPress={handleRestart}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="refresh-outline" size={sfs(20)} color={theme.colors.textSecondary} />
              <Text style={[styles.restartBtnText, { color: theme.colors.textSecondary, fontSize: sfs(14) }]}>{t('tutorial.restart')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  mockScreen: { flex: 1, width: '100%', height: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 16 },
  userName: { fontSize: 24, fontWeight: 'bold' },
  profileBtn: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  contentPadding: { paddingHorizontal: 24 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  shopCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  shopIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  shopName: { fontSize: 18, fontWeight: 'bold' },
  shopAddress: { fontSize: 14 },
  shopBakiLabel: { fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
  shopBakiValue: { fontSize: 18, fontWeight: 'bold' },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
  detailsTitle: { fontSize: 18, fontWeight: 'bold' },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerShopName: { fontWeight: 'bold', marginLeft: 16 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
  balanceAmount: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  balanceIcon: { backgroundColor: 'rgba(255,255,255,0.2)', width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  actionRow: { marginBottom: 24 },
  payBackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5 },
  payBackBtnText: { fontWeight: 'bold', marginLeft: 8 },
  productCard: { width: 130, padding: 16, borderRadius: 20, borderWidth: 1, marginRight: 12, alignItems: 'center' },
  productIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  productName: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
  productPrice: { fontSize: 16 },
  tabContainer: { flexDirection: 'row', marginTop: 32, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontWeight: 'bold' },
  fabBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'white', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  finishOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 10000 },
  finishCard: { width: '100%', padding: 32, borderRadius: 32, borderWidth: 1, alignItems: 'center' },
  successIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  finishTitle: { fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  finishDesc: { textAlign: 'center', marginBottom: 12, lineHeight: 24 },
  settingsNote: { textAlign: 'center', marginBottom: 32, fontStyle: 'italic' },
  getStartedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 32, borderRadius: 20, width: '100%', gap: 10, marginBottom: 16 },
  getStartedBtnText: { color: 'white', fontWeight: 'bold' },
  restartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1, width: '100%', gap: 8 },
  restartBtnText: { fontWeight: '600' },
  selectedProductInfo: { marginBottom: 24, padding: 16, borderRadius: 20 },
  modalProductName: { fontWeight: 'bold', marginBottom: 4 },
  modalBody: { marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, marginBottom: 8, fontWeight: '600' },
  modalInput: { height: 60, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, justifyContent: 'center' },
  saveBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitle: { fontWeight: 'bold', flex: 1 },
  productManageCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
});
