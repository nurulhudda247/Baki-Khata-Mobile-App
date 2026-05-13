import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Platform,
  TextInputProps,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = React.memo(({
  label,
  value,
  error,
  rightElement,
  onFocus,
  onBlur,
  ...props
}) => {
  const { theme, sfs, mode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  const animatedValue = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    if (value || isFocused) {
      animatedValue.value = withTiming(1, { duration: 200 });
    } else {
      animatedValue.value = withTiming(0, { duration: 200 });
    }
  }, [value, isFocused]);

  const fs16 = sfs(16);
  const fs12 = sfs(12);

  const labelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            animatedValue.value,
            [0, 1],
            [0, -28], // 0 is centered via parent's alignItems, -28 puts it on top border
            Extrapolation.CLAMP
          ),
        },
        {
          translateX: interpolate(
            animatedValue.value,
            [0, 1],
            [4, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
      fontSize: interpolate(
        animatedValue.value,
        [0, 1],
        [fs16, fs12],
        Extrapolation.CLAMP
      ),
    };
  });

  const isDark = mode === 'dark';
  const bgColor = theme.colors.background;

  return (
    <View style={styles.container}>
      <Pressable 
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputContainer,
          {
            borderColor: error 
              ? theme.colors.danger 
              : isFocused 
                ? theme.colors.primary 
                : theme.colors.border,
            borderWidth: isFocused ? 2 : 1,
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.labelWrapper, 
            labelStyle,
            { backgroundColor: bgColor }
          ]} 
          pointerEvents="none"
        >
          <Text style={[
            styles.label,
            { 
              color: error 
                ? theme.colors.danger 
                : isFocused 
                  ? theme.colors.primary 
                  : theme.colors.textSecondary 
            }
          ]}>
            {label}
          </Text>
        </Animated.View>
        <TextInput
          {...props}
          ref={inputRef}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { color: theme.colors.textPrimary, fontSize: sfs(16) },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
          ]}
          placeholder=""
        />
        {rightElement && (
          <View style={styles.rightElement}>
            {rightElement}
          </View>
        )}
      </Pressable>
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.danger, fontSize: sfs(12) }]}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  inputContainer: {
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  labelWrapper: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  label: {
    fontFamily: 'Inter_400Regular',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 4,
  },
  rightElement: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 6,
    marginLeft: 4,
    fontFamily: 'Inter_400Regular',
  },
});
