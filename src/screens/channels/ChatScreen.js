import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../auth/AuthContext';
import useProfile from '../../hooks/useProfile';
import { supabase } from '../../lib/supabase';
import { fetchThreadMessages, sendThreadMessage, subscribeToThread, toBubble } from '../../lib/chat';
import MessageBubble from '../../components/MessageBubble';
import colors from '../../theme/colors';

const ChatScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const channel = route?.params?.channel;
  const dm = route?.params?.dm;
  const isDm = Boolean(dm);
  const targetId = isDm ? dm.conversationId : channel?.id;
  const kind = isDm ? 'dm' : 'channel';
  const myId = user?.id;

  const flatListRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [memberCount, setMemberCount] = useState(null);

  const addMessage = useCallback(
    (row) => {
      const bubble = toBubble(row, myId);
      setMessages((prev) =>
        prev.some((m) => m.id === bubble.id) ? prev : [bubble, ...prev]
      );
    },
    [myId]
  );

  // Load history and listen for new messages
  useEffect(() => {
    if (!targetId) return undefined;
    let active = true;

    (async () => {
      try {
        const rows = await fetchThreadMessages(kind, targetId);
        if (active) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const older = rows.map((r) => toBubble(r, myId)).filter((m) => !ids.has(m.id));
            return [...prev, ...older];
          });
        }
      } catch (e) {
        Alert.alert('Could not load messages', e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsubscribe = subscribeToThread(kind, targetId, (row) => {
      if (active) addMessage(row);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [kind, targetId, myId, addMessage]);

  // Member count = students who have signed in (for this branch, if it is a branch channel)
  useEffect(() => {
    if (isDm || !channel?.id) return;
    (async () => {
      let q = supabase.from('profiles').select('id', { count: 'exact', head: true });
      if (channel?.branch) q = q.eq('branch', channel.branch);
      const { count } = await q;
      if (count != null) setMemberCount(count);
    })();
  }, [isDm, channel?.id, channel?.branch]);

  const canPost = isDm || !channel?.admin_only_post || profile?.role === 'admin';

  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending || !targetId) return;
    setSending(true);
    try {
      const row = await sendThreadMessage(kind, targetId, trimmed);
      addMessage(row);
      setInputText('');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (e) {
      Alert.alert('Message not sent', e.message);
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = () => {
    Alert.alert('Attachments', 'Media and document uploads are coming in a later update!', [
      { text: 'OK' },
    ]);
  };

  if (!channel && !dm) return null;

  const chatTitle = isDm ? (dm.otherUser?.name || 'Direct Message') : channel.name;
  const chatSubtitle = isDm ? (dm.otherUser?.email || 'Direct Conversation') : (channel.description || 'General discussion');
  const chatPlaceholder = isDm ? `Message ${dm.otherUser?.name || 'student'}` : `Message #${channel?.name}`;

  const renderItem = ({ item, index }) => {
    const olderMessage = messages[index + 1];
    const isConsecutive = Boolean(
      olderMessage && olderMessage.sender === item.sender && olderMessage.date === item.date
    );
    const showDateSeparator = Boolean(!olderMessage || olderMessage.date !== item.date);

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparatorRow}>
            <View style={styles.dateSeparatorLine} />
            <View style={styles.dateSeparatorBadge}>
              <Text style={styles.dateSeparatorText}>{item.date || 'Today'}</Text>
            </View>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}
        <MessageBubble message={item} isConsecutive={isConsecutive} />
      </View>
    );
  };

  const hasText = inputText.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.channelTitleRow}>
            <MaterialCommunityIcons
              name={isDm ? "account-circle-outline" : "pound"}
              size={20}
              color={colors.textSecondary}
              style={styles.poundIcon}
            />
            <Text style={styles.channelTitle} numberOfLines={1}>
              {chatTitle}
            </Text>
          </View>
          <Text style={styles.channelTopic} numberOfLines={1}>
            {chatSubtitle}
          </Text>
        </View>

        {memberCount != null && (
          <View style={styles.memberPill}>
            <MaterialCommunityIcons
              name="account-group"
              size={15}
              color={colors.textSecondary}
              style={styles.memberIcon}
            />
            <Text style={styles.memberCountText}>{memberCount}</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading && messages.length === 0 ? (
          <View style={extra.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
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
                    name={isDm ? "account-outline" : "pound"}
                    size={36}
                    color={colors.white}
                  />
                </View>
                <Text style={styles.welcomeTitle}>
                  {isDm ? chatTitle : `Welcome to #${channel.name}!`}
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  {isDm
                    ? `This is the start of your direct conversation with ${chatTitle}.`
                    : `This is the start of the #${channel.name} channel.`}
                </Text>
              </View>
            }
          />
        )}

        {canPost ? (
          <View style={styles.inputContainer}>
            <View style={styles.inputBar}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleAttachment}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="plus-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                placeholder={chatPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
              />

              <TouchableOpacity
                style={[styles.sendButton, hasText && styles.sendButtonActive]}
                onPress={handleSendMessage}
                disabled={!hasText || sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <MaterialCommunityIcons
                    name="send"
                    size={18}
                    color={hasText ? colors.white : colors.textMuted}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={extra.readOnlyBar}>
            <MaterialCommunityIcons name="lock-outline" size={16} color={colors.textMuted} />
            <Text style={extra.readOnlyText}>Only admins can post in this channel</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const extra = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  readOnlyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  readOnlyText: { fontSize: 13, color: colors.textMuted },
});
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
