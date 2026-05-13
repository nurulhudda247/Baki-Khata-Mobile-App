import React, { useState } from 'react';
import { TextInput, StyleSheet, Text, View, ViewStyle, TextStyle, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  error,
  style,
  inputStyle,
  multiline,
  numberOfLines,
}) => {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: theme.colors.textPrimary }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: theme.colors.surface, 
            color: theme.colors.textPrimary,
            borderColor: error 
              ? theme.colors.danger 
              : isFocused 
                ? theme.colors.primary 
                : theme.colors.border,
          },
          multiline && { height: 100, textAlignVertical: 'top', paddingTop: 12 },
          inputStyle,
          Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error && <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>}
    </View>
  );
};

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: sfs(16), fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: sfs(16) },
  error: {
    fontSize: sfs(16), marginTop: 4,
    marginLeft: 4,
  },
});
