import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, Alert, Linking, Modal, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useTranslation } from 'react-i18next';




const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  sectionTitle: {
    fontSize: sfs(16), fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
    marginLeft: 4,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: sfs(20), fontWeight: 'bold', marginBottom: 4 },
  featureDesc: { fontSize: sfs(16), lineHeight: sfs(24) },
  requestBox: {
    marginTop: 24,
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
  },
  requestTitle: { fontSize: sfs(20), fontWeight: 'bold', marginBottom: 8 },
  requestSubtitle: { fontSize: sfs(16), marginBottom: 24, lineHeight: sfs(24) },
  
  // MODAL STYLES
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24 
  },
  modalIndicator: { 
    width: 40, 
    height: 4, 
    backgroundColor: 'rgba(0,0,0,0.1)', 
    alignSelf: 'center', 
    borderRadius: 2, 
    marginBottom: 16 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  modalTitle: { fontSize: sfs(20), fontWeight: 'bold' },
  modalClose: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: sfs(12), fontWeight: '600' },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: sfs(16), borderWidth: 1.5,
  },
  textArea: {
    height: 140,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    fontSize: sfs(16), borderWidth: 1.5,
    textAlignVertical: 'top',
  },
});


export default function UpcomingFeatures() {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const [isFormVisible, setFormVisible] = useState(false);
  const [featureName, setFeatureName] = useState('');
  const [description, setDescription] = useState('');
  const [isSuccessVisible, setSuccessVisible] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);

  const UPCOMING_FEATURES = [
    { id: 1, title: t('upcoming.features.dashboard.title'), description: t('upcoming.features.dashboard.desc'), icon: 'grid-outline' },
    { id: 3, title: t('upcoming.features.sync.title'), description: t('upcoming.features.sync.desc'), icon: 'cloud-done-outline' },
    { id: 4, title: t('upcoming.features.advanced.title'), description: t('upcoming.features.advanced.desc'), icon: 'people-outline' },
  ];

  const handleRequestFeature = async () => {
    if (!featureName.trim() || !description.trim()) {
      Alert.alert(t('common.error'), t('upcoming.errorFill'));
      return;
    }

    try {
      const email = 'nurulhudda247@gmail.com';
      const subject = `Feature Request: ${featureName}`;
      const body = `Feature Name: ${featureName}\n\nDescription:\n${description}`;
      const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        setFormVisible(false);
        setSuccessVisible(true);
        setFeatureName('');
        setDescription('');
      } else {
        Alert.alert(t('common.error'), t('upcoming.errorMail', { email }));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), 'Something went wrong while trying to send your request.');
    }

  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: theme.colors.surface }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={sfs(24)} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{t('upcoming.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{t('upcoming.subtitle')}</Text>
        
        {UPCOMING_FEATURES.map((feature) => (
          <View key={feature.id} style={[styles.featureCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name={feature.icon as any} size={sfs(24)} color={theme.colors.primary} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>{feature.title}</Text>
              <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>{feature.description}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.requestBox, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
          <Text style={[styles.requestTitle, { color: theme.colors.primary }]}>{t('upcoming.requestTitle')}</Text>
          <Text style={[styles.requestSubtitle, { color: theme.colors.textSecondary }]}>
            {t('upcoming.requestSubtitle')}
          </Text>
          <Button 
            title={t('upcoming.submitRequest')} 
            onPress={() => setFormVisible(true)}
            variant="outline"
          />
        </View>
      </ScrollView>

      {/* FEATURE REQUEST MODAL */}
      <Modal visible={isFormVisible} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setFormVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalIndicator} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>{t('upcoming.modalTitle')}</Text>
                <TouchableOpacity onPress={() => setFormVisible(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={sfs(24)} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('upcoming.featureName')}</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: theme.colors.background, 
                          color: theme.colors.textPrimary,
                          borderColor: isNameFocused ? theme.colors.primary : theme.colors.border
                        },
                        Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                      ]}
                      placeholder={t('upcoming.featurePlaceholder')}
                      placeholderTextColor={theme.colors.textMuted}
                      value={featureName}
                      onChangeText={setFeatureName}
                      onFocus={() => setIsNameFocused(true)}
                      onBlur={() => setIsNameFocused(false)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('upcoming.description')}</Text>
                    <TextInput
                      style={[
                        styles.textArea, 
                        { 
                          backgroundColor: theme.colors.background, 
                          color: theme.colors.textPrimary,
                          borderColor: isDescFocused ? theme.colors.primary : theme.colors.border
                        },
                        Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                      ]}
                      placeholder={t('upcoming.descPlaceholder')}
                      placeholderTextColor={theme.colors.textMuted}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={5}
                      onFocus={() => setIsDescFocused(true)}
                      onBlur={() => setIsDescFocused(false)}
                    />
                  </View>

                  <Button 
                    title={t('upcoming.sendRequest')} 
                    onPress={handleRequestFeature}
                    style={{ marginTop: 8 }}
                  />
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      <ConfirmModal
        visible={isSuccessVisible}
        title={t('upcoming.successTitle')}
        message={t('upcoming.successMsg')}
        type="success"
        showCancel={false}
        confirmText={t('common.ok')}
        onConfirm={() => setSuccessVisible(false)}
      />

    </View>
  );
}


