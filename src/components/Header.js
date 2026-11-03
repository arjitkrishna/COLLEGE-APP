import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BranchBadge from './BranchBadge';
import colors from '../theme/colors';

const Header = ({
  title,
  subtitle,
  rightIcon,
  onRightPress,
  showBranch = false,
  branch,
  leftIcon,
  onLeftPress,
  style,
}) => {
  return (
    <LinearGradient
      colors={[colors.surface, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.gradientContainer, style]}
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.contentContainer}>
          {leftIcon && (
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.leftButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {typeof leftIcon === 'string' ? (
                <MaterialCommunityIcons name={leftIcon} size={24} color={colors.text} />
              ) : (
                leftIcon
              )}
            </TouchableOpacity>
          )}

          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {showBranch && Boolean(branch) && (
                <BranchBadge branch={branch} size="small" style={styles.branchBadge} />
              )}
            </View>
            {Boolean(subtitle) && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          {rightIcon ? (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.rightButton}
              activeOpacity={0.7}
              disabled={!onRightPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {typeof rightIcon === 'string' ? (
                <MaterialCommunityIcons name={rightIcon} size={24} color={colors.text} />
              ) : (
                rightIcon
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.rightPlaceholder} />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  safeArea: {},
  contentContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftButton: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  branchBadge: {
    marginLeft: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  rightButton: {
    marginLeft: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightPlaceholder: {
    width: 4,
  },
});

export default Header;
