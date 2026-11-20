import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const UserAvatar = ({ name = '', uri, size = 40 }) => {
  const initials = (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?'
  ).toUpperCase();

  const base = { width: size, height: size, borderRadius: size / 2 };

  if (uri && typeof uri === 'string' && uri.startsWith('http')) {
    return <Image source={{ uri }} style={base} />;
  }

  return (
    <View style={[base, styles.fallback]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    fontWeight: '700',
  },
});

export default UserAvatar;