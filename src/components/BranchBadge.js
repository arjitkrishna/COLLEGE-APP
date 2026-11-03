import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

const BranchBadge = ({ branch = 'CSE', size = 'small', style, textStyle }) => {
  const branchKey = (branch || 'CSE').toString().toUpperCase();
  const badgeColor = colors.branches[branchKey] || colors.primary;

  const sizeContainerStyle = styles[`container_${size}`] || styles.container_small;
  const sizeTextStyle = styles[`text_${size}`] || styles.text_small;

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }, sizeContainerStyle, style]}>
      <Text style={[styles.text, sizeTextStyle, textStyle]} numberOfLines={1}>
        {branchKey}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container_small: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  container_medium: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  container_large: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  text: {
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  text_small: {
    fontSize: 10,
    lineHeight: 12,
  },
  text_medium: {
    fontSize: 12,
    lineHeight: 15,
  },
  text_large: {
    fontSize: 14,
    lineHeight: 18,
  },
});

export default BranchBadge;
