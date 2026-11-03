import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getMessagesForChannel } from '../../data/channelsData';
import MessageBubble from '../../components/MessageBubble';
import colors from '../../theme/colors';

const ChatScreen = ({ route, navigation }) => {
  const { user } = useApp();
  const channel = route?.params?.channel || {
    id: 'general',
    name: 'general',
    description: 'Welcome to the channel!',
    unreadCount: 0,
  };

  const flatListRef = useRef(null);
  const [inputText, setInputText] = useState('');

  // Load initial messages from mock data and reverse for inverted FlatList
  const [messages, setMessages] = useState(() => {
    const raw = getMessagesForChannel(channel.id) || [];
    if (raw.length > 0) {
      // Map to normalize fields (time, isOwn)
      const normalized = raw.map((m) => ({
        ...m,
        time: m.time || m.timestamp || '12:00 PM',
        isOwn: m.isOwn ?? Boolean(m.isUser),
      }));
      // Inverted list needs newest at index 0
      return [...normalized].reverse();
    }

    // Default welcome messages if channel has no existing mock messages
    return [
      {
        id: 'init-2',
        sender: 'Bot Helper',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        text: `Welcome to #${channel.name}! Feel free to discuss topics, share resources, or ask questions.`,
        time: '10:00 AM',
        timestamp: '10:00 AM',
        date: 'Today',
        isOwn: false,
      },
      {
        id: 'init-1',
        sender: 'Council Admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        text: `Channel created for ${channel.description || channel.name}. Please follow college community guidelines.`,
        time: '09:30 AM',
        timestamp: '09:30 AM',
        date: 'Today',
        isOwn: false,
      },
    ];
  });

  // Calculate approximate member count based on channel scope
  const memberCount = useMemo(() => {
    if (channel.id?.includes('general') || channel.category === 'GENERAL') {
      return 342;
    }
    if (channel.id?.includes('cse') || channel.category === 'CSE') {
      return 148;
    }
    if (channel.id?.includes('dsai') || channel.category === 'DSAI') {
      return 96;
    }
    if (channel.id?.includes('ece') || channel.category === 'ECE') {
      return 112;
    }
    return 120;
  }, [channel]);

  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
    const timeString = `${displayHours}:${minutes} ${ampm}`;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: user?.name || 'You',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      text: trimmed,
      time: timeString,
      timestamp: timeString,
      date: 'Today',
      isOwn: true,
      isUser: true,
    };

    // Prepend to inverted list
    setMessages((prev) => [newMessage, ...prev]);
    setInputText('');

    // Scroll to bottom (offset 0 in inverted list)
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleAttachment = () => {
    Alert.alert(
      'Attachments',
      'Media and document uploads are coming in the next update!',
      [{ text: 'OK' }]
    );
  };

  const renderItem = ({ item, index }) => {
    // In inverted FlatList:
    // item is current message.
    // Older message in chronological order is at index + 1!
    const olderMessage = messages[index + 1];

    // Consecutive if the immediately preceding older message has the exact same sender & date
    const isConsecutive = Boolean(
      olderMessage &&
        olderMessage.sender === item.sender &&
        olderMessage.date === item.date
    );

    // Show date divider if this message is the first message of a new day
    // (i.e. older message has a different date or does not exist)
    const showDateSeparator = Boolean(
      !olderMessage || olderMessage.date !== item.date
    );

    return (
      <View>
        {/* Date separator displayed above the first message of each day */}
        {showDateSeparator && (
          <View style={styles.dateSeparatorRow}>
            <View style={styles.dateSeparatorLine} />
            <View style={styles.dateSeparatorBadge}>
              <Text style={styles.dateSeparatorText}>
                {item.date || 'Today'}
              </Text>
            </View>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}

        <MessageBubble message={item} isConsecutive={isConsecutive} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      {/* Custom Discord-style Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.channelTitleRow}>
            <MaterialCommunityIcons
              name="pound"
              size={20}
              color={colors.textSecondary}
              style={styles.poundIcon}
            />
            <Text style={styles.channelTitle} numberOfLines={1}>
              {channel.name}
            </Text>
          </View>
          <Text style={styles.channelTopic} numberOfLines={1}>
            {channel.description || channel.topic || 'General discussion'}
          </Text>
        </View>

        {/* Member Count Pill */}
        <View style={styles.memberPill}>
          <MaterialCommunityIcons
            name="account-group"
            size={15}
            color={colors.textSecondary}
            style={styles.memberIcon}
          />
          <Text style={styles.memberCountText}>{memberCount}</Text>
        </View>
      </View>

      {/* Keyboard Avoiding Container for Messages & Input */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Inverted Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={styles.channelWelcomeCard}>
              <View style={styles.welcomePoundCircle}>
                <MaterialCommunityIcons
                  name="pound"
                  size={36}
                  color={colors.white}
                />
              </View>
              <Text style={styles.welcomeTitle}>Welcome to #{channel.name}!</Text>
              <Text style={styles.welcomeSubtitle}>
                This is the start of the #{channel.name} channel.
              </Text>
            </View>
          }
        />

        {/* Message Input Bottom Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputBar}>
            {/* Attachment Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleAttachment}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="plus-circle"
                size={24}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {/* Input Field */}
            <TextInput
              style={styles.textInput}
              placeholder={`Message #${channel.name}`}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim().length > 0 && styles.sendButtonActive,
              ]}
              onPress={handleSendMessage}
              disabled={inputText.trim().length === 0}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="send"
                size={18}
                color={inputText.trim().length > 0 ? colors.white : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  channelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poundIcon: {
    marginRight: 3,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  channelTopic: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberIcon: {
    marginRight: 4,
  },
  memberCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 12,
  },
  dateSeparatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dateSeparatorBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  channelWelcomeCard: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 10,
  },
  welcomePoundCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButton: {
    padding: 6,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
});

export default ChatScreen;
