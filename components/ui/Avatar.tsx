import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 50 }) => {
  const { theme, mode, sfs } = useTheme();
  const styles = getStyles(theme, sfs);
  
  const getInitials = (n: string) => {
    return n.split(' ').map(i => i[0]).join('').toUpperCase().slice(0, 2);
  };

  if (uri) {
    return (
      <Image 
        source={{ uri }} 
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2.5 }]} 
      />
    );
  }

  return (
    <View style={[
      styles.avatar, 
      styles.placeholder, 
      { width: size, height: size, borderRadius: size / 2.5, backgroundColor: theme.colors.primaryLight }
    ]}>
      <Text style={[styles.initials, { fontSize: size * 0.4, color: theme.colors.primary }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const getStyles = (theme: any, sfs: any) => StyleSheet.create({
  avatar: {
    overflow: 'hidden',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: 'bold',
  },
});
