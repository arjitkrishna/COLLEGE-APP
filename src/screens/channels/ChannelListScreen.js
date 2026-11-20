import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchChannels, fetchConversations } from '../../lib/chat';
import { useAuth } from '../../auth/AuthContext';
import useProfile from '../../hooks/useProfile';
import { useApp } from '../../context/AppContext';
import ChannelItem from '../../components/ChannelItem';
import colors from '../../theme/colors';

const BRANCHES = ['CSE', 'DSAI', 'ECE'];

const ChannelListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { setBranch } = useApp();
  const { profile, loading: profileLoading, updateBranch, refresh } = useProfile();
  const branch = profile?.branch;
  const branchColor = colors.branches[branch] || colors.primary;
  const isAdmin = profile?.role === 'admin';
  const canManage = isAdmin || Boolean(profile?.can_create_channels);

  const [channels, setChannels] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        setLoadError(null);
        const [chs, convs] = await Promise.all([
          fetchChannels(),
          fetchConversations(user?.id),
        ]);
        setChannels(chs);
        setConversations(convs);
      } catch (e) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
      load();
    }, [load, refresh])
  );

  const toggleCategory = (categoryTitle) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle],
    }));
  };

  const pickBranch = async (b) => {
    try {
      await updateBranch(b);
      setBranch(b);
      await load();
    } catch (e) {
      Alert.alert('Could not save your branch', e.message);
    }
  };

  const sections = useMemo(() => {
    const visible = channels.filter((c) => !c.branch || c.branch === branch);
    const query = searchQuery.trim().toLowerCase();

    const filterList = (list) =>
      !query
        ? list
        : list.filter(
            (ch) =>
              ch.name.toLowerCase().includes(query) ||
              ch.description?.toLowerCase().includes(query)
          );

    const dmItems = conversations.map((c) => ({
      id: `dm-${c.id}`,
      name: c.otherUser.name,
      description: 'Direct message',
      icon: 'account-circle-outline',
      isDm: true,
      conversation: c,
    }));

    const raw = [
      { title: 'DIRECT MESSAGES', data: filterList(dmItems) },
      { title: 'GENERAL', data: filterList(visible.filter((c) => c.category === 'GENERAL')) },
      { title: 'ACADEMICS', data: filterList(visible.filter((c) => c.category === 'ACADEMICS')) },
      { title: `${branch} DISCUSSIONS`, data: filterList(visible.filter((c) => c.category === 'BRANCH')) },
    ];

    return raw
      .map((sec) => ({
        ...sec,
        id: sec.title,
        totalCount: sec.data.length,
        isCollapsed: Boolean(collapsedCategories[sec.title]),
        data: collapsedCategories[sec.title] ? [] : sec.data,
      }))
      .filter((sec) => sec.totalCount > 0);
  }, [channels, conversations, branch, searchQuery, collapsedCategories]);

  const handleCreateChannel = () => {
    if (canManage) {
      navigation.navigate('CreateChannel');
    } else {
      Alert.alert(
        'Create Channel',
        'Only admins and students they allow can create channels. Ask an admin if you need this.',
        [{ text: 'Got it' }]
      );
    }
  };

  const handleItemPress = (item) => {
    if (item.isDm) {
      navigation.navigate('Chat', {
        dm: {
          conversationId: item.conversation.id,
          otherUser: item.conversation.otherUser,
        },
      });
    } else {
      navigation.navigate('Chat', { channel: item });
    }
  };

  const renderSectionHeader = ({ section }) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleCategory(section.title)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={section.isCollapsed ? 'chevron-right' : 'chevron-down'}
        size={18}
        color={colors.textMuted}
        style={styles.chevronIcon}
      />
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{section.totalCount}</Text>
      </View>
    </TouchableOpacity>
  );

  if (profileLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={extra.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!branch) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={extra.center}>
          <Text style={extra.pickTitle}>Choose your branch</Text>
          <Text style={extra.pickSub}>This decides which branch channels you can see.</Text>
          {BRANCHES.map((b) => (
            <TouchableOpacity
              key={b}
              style={[extra.branchButton, { borderColor: colors.branches[b] }]}
              onPress={() => pickBranch(b)}
              activeOpacity={0.8}
            >
              <Text style={[extra.branchButtonText, { color: colors.branches[b] }]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.serverIcon, { backgroundColor: `${branchColor}30`, borderColor: branchColor }]}>
            <MaterialCommunityIcons name="pound-box" size={26} color={branchColor} />
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.workspaceName}>{branch} Workspace</Text>
            <Text style={styles.workspaceTagline}>IIIT Naya Raipur</Text>
          </View>
        </View>

        <View style={extra.headerActions}>
          <TouchableOpacity
            style={extra.iconButton}
            onPress={() => navigation.navigate('NewMessage')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="message-plus-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity
              style={extra.iconButton}
              onPress={() => navigation.navigate('ManageCreators')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="shield-account-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          <View style={[styles.branchPill, { backgroundColor: `${branchColor}20`, borderColor: branchColor }]}>
            <View style={[styles.branchDot, { backgroundColor: branchColor }]} />
            <Text style={[styles.branchPillText, { color: branchColor }]}>{branch}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search channels..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChannelItem channel={item} onPress={() => handleItemPress(item)} />
        )}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="message-text-outline"
              size={48}
              color={colors.textMuted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>
              {loadError ? 'Could not load channels' : 'No Channels Found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {loadError || `No channels match "${searchQuery}". Try a different keyword.`}
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreateChannel} activeOpacity={0.85}>
        <MaterialCommunityIcons name="plus" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const extra = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  pickTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
  pickSub: { fontSize: 13, color: colors.textMuted, marginBottom: 24, textAlign: 'center' },
  branchButton: {
    width: '70%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 12,
  },
  branchButtonText: { fontSize: 16, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { padding: 2 },
});
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serverIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  workspaceName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  workspaceTagline: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  branchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  branchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  branchPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 90,
    paddingTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  chevronIcon: {
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default ChannelListScreen;
