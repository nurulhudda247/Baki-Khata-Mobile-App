import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Error Boundary to catch render crashes and show them on screen
class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string; stack: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '', stack: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error?.message || error), stack: String(error?.stack || '') };
  }
  render() {
    if (this.state.hasError) {
      return <AuthErrorView error={this.state.error} stack={this.state.stack} />;
    }
    return this.props.children;
  }
}

const AuthErrorView = ({ error, stack }: { error: string, stack: string }) => {
  const { theme } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20 }}>
      <Text style={{ color: theme.colors.danger, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        🔴 AUTH CRASH ERROR:
      </Text>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 14, marginBottom: 10 }}>
        {error}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>
        {stack}
      </Text>
    </ScrollView>
  );
};

export default function AuthLayout() {
  const { theme } = useTheme();

  return (
    <AuthErrorBoundary>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: {
              backgroundColor: 'transparent',
            },
          }}
        />
      </View>
    </AuthErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
