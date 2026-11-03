import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import colors from '../theme/colors';

const SENDER_COLORS = [
  '#6C5CE7', // purple
  '#00B894', // green
  '#FD79A8', // pink
  '#FECA57', // yellow
  '#54A0FF', // blue
  '#FF6B6B', // coral red
  '#1DD1A1', // teal
  '#48DBFB', // sky blue
  '#FF9FF3', // pastel pink
  '#F368E0', // energetic magenta
  '#0ABDE3', // cyan
];

const getSenderColor = (name = '') => {
  if (!name) return SENDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
};

const getInitials = (name = '') => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const MessageBubble = ({ message = {}, isConsecutive = false }) => {
  const {
    id,
    text = '',
    sender = 'Anonymous',
    time = '',
    isOwn = false,
    avatar,
  } = message;

  const consecutive = isConsecutive || Boolean(message.isConsecutive);
  const senderColor = getSenderColor(sender);
  const initials = getInitials(sender);

  return (
    <View
      style={[
        styles.container,
        isOwn && styles.ownContainer,
        consecutive && styles.consecutiveContainer,
      ]}
    >
      {/* Left Avatar */}
      <View style={styles.avatarWrapper}>
        {consecutive ? (
          <View style={styles.avatarSpacer} />
        ) : avatar && typeof avatar === 'string' && avatar.startsWith('http') ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: senderColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Right Content */}
      <View style={styles.contentWrapper}>
        {!consecutive && (
          <View style={styles.headerRow}>
            <Text style={[styles.senderName, { color: senderColor }]} numberOfLines={1}>
              {sender}
            </Text>
            {isOwn && <Text style={styles.ownTag}>YOU</Text>}
            {Boolean(time) && <Text style={styles.timestamp}>{time}</Text>}
          </View>
        )}

        <Text style={styles.messageText} selectable>
          {text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    marginVertical: 1,
  },
  consecutiveContainer: {
    paddingVertical: 2,
    marginTop: 0,
    marginBottom: 1,
  },
  ownContainer: {
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatarSpacer: {
    width: 38,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  ownTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
});

export default MessageBubble;
