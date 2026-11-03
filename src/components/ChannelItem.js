import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';

const ChannelItem = ({ channel = {}, onPress, isActive = false }) => {
  const unreadCount = channel.unreadCount ?? 0;
  const lastMessageText =
    typeof channel.lastMessage === 'string'
      ? channel.lastMessage
      : channel.lastMessage?.text || channel.description || '';

  const isVoice = channel.type === 'voice';

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={isVoice ? 'volume-high' : 'pound'}
          size={20}
          color={isActive ? colors.white : colors.textMuted}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <Text
            style={[styles.channelName, isActive && styles.activeChannelName]}
            numberOfLines={1}
          >
            {channel.name || 'general'}
          </Text>

          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {Boolean(lastMessageText) && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessageText}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeContainer: {
    backgroundColor: colors.surfaceLight,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  activeChannelName: {
    color: colors.white,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default ChannelItem;
