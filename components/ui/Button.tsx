import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);

  const getBbackgroundColor = () => {
    if (disabled) return theme.colors.surfaceElevated;
    switch (variant) {
      case 'primary': return theme.colors.primary;
      case 'secondary': return theme.colors.surface;
      case 'danger': return theme.colors.danger;
      case 'outline': return 'transparent';
      default: return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textMuted;
    switch (variant) {
      case 'primary': return 'white';
      case 'secondary': return theme.colors.textPrimary;
      case 'danger': return 'white';
      case 'outline': return theme.colors.primary;
      default: return 'white';
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBbackgroundColor() },
        variant === 'outline' && { borderWidth: 1, borderColor: theme.colors.primary },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor(), fontSize: sfs(16) }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontSize: sfs(16), fontWeight: 'bold',
  },
});
