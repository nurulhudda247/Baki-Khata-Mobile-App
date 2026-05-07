import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  showCancel?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText,
  cancelText,
  type = 'danger',
  showCancel = true
}) => {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'danger': return 'trash-outline';
      case 'warning': return 'alert-circle-outline';
      case 'info': return 'information-circle-outline';
      case 'success': return 'checkmark-circle-outline';
      default: return 'trash-outline';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'danger': return theme.colors.danger;
      case 'warning': return theme.colors.warning;
      case 'info': return theme.colors.primary;
      case 'success': return theme.colors.success;
      default: return theme.colors.danger;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onCancel || onConfirm}
      >
        <TouchableWithoutFeedback>
          <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: getColor() + '15' }]}>
              <Ionicons name={getIcon()} size={sfs(24)} color={getColor()} />
            </View>
            
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
            
            <View style={styles.buttonRow}>
              {showCancel && onCancel && (
                <TouchableOpacity 
                  style={[styles.cancelBtn, { borderColor: theme.colors.border }]} 
                  onPress={onCancel}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>
                    {cancelText || t('common.cancel')}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: getColor(), flex: 1 }]} 
                onPress={onConfirm}
              >
                <Text style={styles.confirmBtnText}>
                  {confirmText || (showCancel ? t('common.delete') : t('common.ok'))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: sfs(16), fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: sfs(16), 
    lineHeight: sfs(24),
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
  confirmBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: 'white',
    fontSize: sfs(16), fontWeight: 'bold',
  },
});
