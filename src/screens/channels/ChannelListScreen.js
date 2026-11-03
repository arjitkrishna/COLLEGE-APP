import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { GENERAL_CHANNELS, BRANCH_CHANNELS } from '../../data/channelsData';
import ChannelItem from '../../components/ChannelItem';
import colors from '../../theme/colors';

const ChannelListScreen = ({ navigation }) => {
  const { user, currentBranch } = useApp();
  const branch = user?.branch || currentBranch || 'CSE';
  const branchColor = colors.branches[branch] || colors.primary;

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const toggleCategory = (categoryTitle) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle],
    }));
  };

  // Organize channels into GENERAL, ACADEMICS, and BRANCH
  const sections = useMemo(() => {
    const branchChannels = BRANCH_CHANNELS[branch] || BRANCH_CHANNELS.CSE || [];
    const generalList = GENERAL_CHANNELS || [];

    // Filter by academic keywords vs branch hub
    const academicList = branchChannels.filter(
      (ch) =>
        ch.name.includes('academic') ||
        ch.name.includes('assignment') ||
        ch.name.includes('resource') ||
        ch.description?.toLowerCase().includes('syllabus') ||
        ch.description?.toLowerCase().includes('notes')
    );

    const remainingBranchList = branchChannels.filter(
      (ch) => !academicList.some((ac) => ac.id === ch.id)
    );

    const query = searchQuery.trim().toLowerCase();

    const filterChannels = (list) => {
      if (!query) return list;
      return list.filter(
        (ch) =>
          ch.name.toLowerCase().includes(query) ||
          ch.description?.toLowerCase().includes(query) ||
          (typeof ch.lastMessage === 'string' &&
            ch.lastMessage.toLowerCase().includes(query)) ||
          (ch.lastMessage?.text &&
            ch.lastMessage.text.toLowerCase().includes(query))
      );
    };

    const generalFiltered = filterChannels(generalList);
    const academicFiltered = filterChannels(academicList);
    const branchFiltered = filterChannels(remainingBranchList);

    const rawSections = [
      {
        id: 'GENERAL',
        title: 'GENERAL',
        data: generalFiltered,
        count: generalFiltered.length,
      },
      {
        id: 'ACADEMICS',
        title: 'ACADEMICS',
        data: academicFiltered,
        count: academicFiltered.length,
      },
      {
        id: 'BRANCH',
        title: `${branch} DISCUSSIONS`,
        data: branchFiltered,
        count: branchFiltered.length,
      },
    ];

    // Handle collapsible behavior: if category is collapsed, pass empty data array
    return rawSections.map((sec) => ({
      ...sec,
      isCollapsed: Boolean(collapsedCategories[sec.title]),
      data: collapsedCategories[sec.title] ? [] : sec.data,
      totalCount: sec.count,
    }));
  }, [branch, searchQuery, collapsedCategories]);

  const handleCreateChannel = () => {
    Alert.alert(
      'Create Channel',
      'Channel creation is coming soon! Only administrators and student council members can create new channels.',
      [{ text: 'Got it' }]
    );
  };

  const handleChannelPress = (channel) => {
    navigation.navigate('Chat', { channel });
  };

  const renderSectionHeader = ({ section }) => {
    const isCollapsed = section.isCollapsed;

    return (
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleCategory(section.title)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={isCollapsed ? 'chevron-right' : 'chevron-down'}
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
  };

  const totalChannelsCount = sections.reduce(
    (acc, sec) => acc + sec.totalCount,
    0
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header with Workspace Name & Badge */}
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

        <View style={[styles.branchPill, { backgroundColor: `${branchColor}20`, borderColor: branchColor }]}>
          <View style={[styles.branchDot, { backgroundColor: branchColor }]} />
          <Text style={[styles.branchPillText, { color: branchColor }]}>
            {branch}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
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
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Channel Sections List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChannelItem
            channel={item}
            onPress={() => handleChannelPress(item)}
          />
        )}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          totalChannelsCount === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={48}
                color={colors.textMuted}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Channels Found</Text>
              <Text style={styles.emptySubtitle}>
                No channels match "{searchQuery}". Try a different keyword.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Floating Action Button (FAB) for Create Channel */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateChannel}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.white} />
      </TouchableOpacity>
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
