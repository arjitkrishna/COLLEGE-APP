import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { useAuth } from '../../auth/AuthContext';
import { useApp } from '../../context/AppContext';
import useProfile from '../../hooks/useProfile';
import UserAvatar from '../../components/UserAvatar';
import BranchBadge from '../../components/BranchBadge';
import {
  PlatformCard,
  BioSection,
  AddPlatformModal,
} from '../../components/profile';
import {
  PLATFORMS,
  getPlatformById,
  fetchPlatformStats,
} from '../../lib/platforms';
import { subjectsData } from '../../data/subjectsData';
import { supabase } from '../../lib/supabase';

const BRANCH_NAMES = {
  CSE: 'Computer Science & Engineering',
  DSAI: 'Data Science & Artificial Intelligence',
  ECE: 'Electronics & Communication Engineering',
};

const ProfileScreen = ({ navigation }) => {
  const { user: authUser, signOut } = useAuth();
  const {
    user: appUser,
    currentBranch,
    logout,
    setBranch,
    calculateOverallAttendance,
  } = useApp();

  const {
    profile,
    loading: profileLoading,
    refresh: refreshProfile,
    isOwnProfile,
    updateBranch,
    updateBio,
    addPlatform,
    removePlatform,
  } = useProfile();

  const [platformStats, setPlatformStats] = useState({});
  const [expandedPlatform, setExpandedPlatform] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [channelsCount, setChannelsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const prevLinkedRef = useRef('');

  // Branch resolution
  const branch = profile?.branch || authUser?.branch || currentBranch || 'CSE';
  const branchFullName = BRANCH_NAMES[branch] || 'Computer Science & Engineering';

  // User display metadata
  const userName = authUser?.name || appUser?.name || profile?.full_name || 'IIIT NR Student';
  const userEmail = authUser?.email || appUser?.email || profile?.email || '';
  const userAvatar = authUser?.picture || appUser?.avatar;
  const rollNo = profile?.roll_no || appUser?.rollNo || '21100BT001';
  const semester = profile?.semester || appUser?.semester || '6th Semester';

  // Overall attendance
  const overall = calculateOverallAttendance
    ? calculateOverallAttendance(branch)
    : { percentage: 84.5 };
  const attendanceDisplay = `${Math.round(overall.percentage || 84.5)}%`;

  // Total subjects for current branch
  const subjectsCount = subjectsData[branch] ? subjectsData[branch].length : 6;

  // Active channels count from Supabase
  const loadChannelsCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('channels')
        .select('id', { count: 'exact', head: true });
      if (!error && count != null) {
        setChannelsCount(count);
      }
    } catch (e) {
      // Fallback count
      setChannelsCount(6);
    }
  }, []);

  useEffect(() => {
    loadChannelsCount();
  }, [loadChannelsCount, branch]);

  // Fetch stats for a single platform
  const fetchStatsForPlatform = useCallback(async (platformId, username) => {
    if (!platformId || !username) return;

    setPlatformStats((prev) => ({
      ...prev,
      [platformId]: { loading: true, data: null, error: null },
    }));

    try {
      const result = await fetchPlatformStats(platformId, username);
      if (result?.error) {
        setPlatformStats((prev) => ({
          ...prev,
          [platformId]: { loading: false, data: null, error: result.error },
        }));
      } else {
        setPlatformStats((prev) => ({
          ...prev,
          [platformId]: { loading: false, data: result, error: null },
        }));
      }
    } catch (err) {
      setPlatformStats((prev) => ({
        ...prev,
        [platformId]: {
          loading: false,
          data: null,
          error: err.message || 'Could not fetch stats',
        },
      }));
    }
  }, []);

  // Fetch stats for all linked platforms on mount / changes
  useEffect(() => {
    const linked = profile?.linked_profiles || {};
    const serialized = JSON.stringify(linked);

    if (serialized !== prevLinkedRef.current) {
      prevLinkedRef.current = serialized;
      Object.entries(linked).forEach(([platformId, username]) => {
        if (username) {
          fetchStatsForPlatform(platformId, username);
        }
      });
    }
  }, [profile?.linked_profiles, fetchStatsForPlatform]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      await loadChannelsCount();

      const linked = profile?.linked_profiles || {};
      const fetchPromises = Object.entries(linked).map(([platId, uname]) => {
        if (uname) return fetchStatsForPlatform(platId, uname);
        return Promise.resolve();
      });
      await Promise.all(fetchPromises);
    } catch (e) {
      // Ignore refresh error
    } finally {
      setRefreshing(false);
    }
  };

  // Add a platform
  const handleAddPlatform = async (platformId, username) => {
    try {
      await addPlatform(platformId, username);
      fetchStatsForPlatform(platformId, username);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not link platform');
    }
  };

  // Remove a platform
  const handleRemovePlatform = async (platformId) => {
    try {
      await removePlatform(platformId);
      setPlatformStats((prev) => {
        const next = { ...prev };
        delete next[platformId];
        return next;
      });
      if (expandedPlatform === platformId) {
        setExpandedPlatform(null);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not remove platform');
    }
  };

  // Switch Branch handler
  const handleSwitchBranch = () => {
    Alert.alert(
      'Switch Department',
      'Select a new department. This will update your timetable, courses, and department channels.',
      [
        {
          text: 'CSE (Computer Science)',
          onPress: () => applyBranchSwitch('CSE'),
        },
        {
          text: 'DSAI (Data Science & AI)',
          onPress: () => applyBranchSwitch('DSAI'),
        },
        {
          text: 'ECE (Electronics & Comm)',
          onPress: () => applyBranchSwitch('ECE'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const applyBranchSwitch = async (newBranch) => {
    if (newBranch === branch) {
      Alert.alert('Notice', `You are already in ${newBranch}.`);
      return;
    }

    try {
      await updateBranch(newBranch);
      if (typeof setBranch === 'function') {
        setBranch(newBranch);
      }
      Alert.alert('Branch Updated', `Switched workspace to ${newBranch} successfully!`);
    } catch (e) {
      Alert.alert('Could not switch branch', e.message);
    }
  };

  // About App modal
  const handleAboutApp = () => {
    Alert.alert(
      'About IIIT NR Workspace',
      'IIIT NR Workspace • v1.0.0\n\nA modern campus app built for IIIT Naya Raipur students featuring live batch channels, attendance insights, academic schedules, and competitive programming profile showcases.\n\nDeveloped with React Native & Supabase.',
      [{ text: 'OK' }]
    );
  };

  // Sign out handler
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of IIIT NR Workspace?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              if (signOut) await signOut();
              if (logout) await logout();
            } catch (err) {
              Alert.alert('Sign Out Error', err.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const linkedProfiles = profile?.linked_profiles || {};
  const linkedKeys = Object.keys(linkedProfiles);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. PROFILE HEADER */}
        <LinearGradient
          colors={['#25214E', '#1A1A2E']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.headerCard}
        >
          {/* Top Row with Edit Icon */}
          <View style={styles.headerTopRow}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerSectionTitle}>Student Profile</Text>
            {isOwnProfile ? (
              <TouchableOpacity
                style={styles.editProfileIconButton}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EditProfile')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="account-edit-outline"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Large Avatar */}
          <View style={styles.avatarWrapper}>
            <UserAvatar name={userName} uri={userAvatar} size={90} />
          </View>

          {/* User Details */}
          <Text style={styles.userNameText}>{userName}</Text>
          {userEmail ? (
            <Text style={styles.userEmailText}>{userEmail}</Text>
          ) : null}

          {/* Branch Badge */}
          <View style={styles.headerBadgeContainer}>
            <BranchBadge branch={branch} size="medium" />
          </View>
        </LinearGradient>

        {/* 2. BIO SECTION */}
        <View style={styles.sectionContainer}>
          <BioSection
            bio={profile?.bio || ''}
            editable={isOwnProfile}
            onSave={updateBio}
          />
        </View>

        {/* 3. LINKED PROFILES / STATS SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLeft}>
              <MaterialCommunityIcons
                name="link-variant"
                size={20}
                color={colors.secondary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionTitleText}>Linked Profiles</Text>
            </View>
            {linkedKeys.length > 0 && isOwnProfile ? (
              <TouchableOpacity
                style={styles.addSmallButton}
                activeOpacity={0.7}
                onPress={() => setShowAddModal(true)}
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                <Text style={styles.addSmallButtonText}>Add</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* If no platforms linked */}
          {linkedKeys.length === 0 ? (
            <View style={styles.emptyPlatformsCard}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons
                  name="trophy-variant-outline"
                  size={32}
                  color={colors.secondary}
                />
              </View>
              <Text style={styles.emptyPlatformsTitle}>Showcase Your Achievements</Text>
              <Text style={styles.emptyPlatformsDescription}>
                Link your coding & gaming profiles to show off your competitive ratings, problem counts, and chess ELO stats!
              </Text>

              {isOwnProfile ? (
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  activeOpacity={0.8}
                  onPress={() => setShowAddModal(true)}
                >
                  <MaterialCommunityIcons
                    name="plus-circle-outline"
                    size={18}
                    color={colors.white}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.emptyAddButtonText}>Link Your Accounts</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            /* Render list of PlatformCards */
            <View style={styles.platformsList}>
              {linkedKeys.map((platId) => {
                const platformMeta = getPlatformById(platId) || PLATFORMS[platId] || {
                  id: platId,
                  name: platId,
                  color: colors.primary,
                  icon: 'code-tags',
                };
                const username = linkedProfiles[platId];
                const statsState = platformStats[platId];

                return (
                  <PlatformCard
                    key={platId}
                    platform={platformMeta}
                    username={username}
                    stats={
                      statsState?.error
                        ? { error: statsState.error }
                        : statsState?.data || null
                    }
                    loading={!!statsState?.loading}
                    expanded={expandedPlatform === platId}
                    onToggleExpand={() =>
                      setExpandedPlatform((prev) => (prev === platId ? null : platId))
                    }
                    onRefresh={() => fetchStatsForPlatform(platId, username)}
                    onRemove={isOwnProfile ? () => handleRemovePlatform(platId) : undefined}
                  />
                );
              })}

              {/* Add Platform Outline Button at bottom of list */}
              {isOwnProfile && (
                <TouchableOpacity
                  style={styles.addPlatformOutlineButton}
                  activeOpacity={0.8}
                  onPress={() => setShowAddModal(true)}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
                  <Text style={styles.addPlatformOutlineText}>Add Platform</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 4. ACADEMIC STATS ROW */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLeft}>
              <MaterialCommunityIcons
                name="chart-timeline-variant"
                size={20}
                color={colors.accent}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionTitleText}>Academic Overview</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {/* Stat 1: Attendance */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: `${colors.success}20` }]}>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={20}
                  color={colors.success}
                />
              </View>
              <Text style={styles.statNumber}>{attendanceDisplay}</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>

            {/* Stat 2: Subjects */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: `${colors.primary}20` }]}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.statNumber}>{subjectsCount}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>

            {/* Stat 3: Active Channels */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: `${colors.accent}20` }]}>
                <MaterialCommunityIcons
                  name="forum-outline"
                  size={20}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.statNumber}>{channelsCount}</Text>
              <Text style={styles.statLabel}>Channels</Text>
            </View>
          </View>
        </View>

        {/* 5. ACADEMIC INFO CARDS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLeft}>
              <MaterialCommunityIcons
                name="school-outline"
                size={20}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionTitleText}>Academic Details</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            {/* Roll Number */}
            <View style={styles.infoItemRow}>
              <View style={styles.infoItemLeft}>
                <View style={styles.infoIconCircle}>
                  <MaterialCommunityIcons
                    name="card-account-details-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.infoLabel}>Roll Number</Text>
              </View>
              <Text style={styles.infoValue}>{rollNo}</Text>
            </View>

            <View style={styles.infoDivider} />

            {/* Semester */}
            <View style={styles.infoItemRow}>
              <View style={styles.infoItemLeft}>
                <View style={styles.infoIconCircle}>
                  <MaterialCommunityIcons
                    name="calendar-range"
                    size={18}
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.infoLabel}>Semester</Text>
              </View>
              <Text style={styles.infoValue}>{semester}</Text>
            </View>

            <View style={styles.infoDivider} />

            {/* Branch */}
            <View style={styles.infoItemRow}>
              <View style={styles.infoItemLeft}>
                <View style={styles.infoIconCircle}>
                  <MaterialCommunityIcons
                    name="domain"
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.infoLabel}>Branch</Text>
              </View>
              <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                {branchFullName}
              </Text>
            </View>
          </View>
        </View>

        {/* 6. SETTINGS SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLeft}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionTitleText}>Preferences</Text>
            </View>
          </View>

          <View style={styles.settingsMenuCard}>
            {/* Switch Branch */}
            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={handleSwitchBranch}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.settingsIconCircle, { backgroundColor: `${colors.primary}20` }]}>
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.settingsRowTitle}>Switch Department</Text>
                  <Text style={styles.settingsRowSubtitle}>
                    Currently in {branch}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            <View style={styles.infoDivider} />

            {/* Edit Profile */}
            {isOwnProfile && (
              <>
                <TouchableOpacity
                  style={styles.settingsRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <View style={styles.settingsRowLeft}>
                    <View
                      style={[
                        styles.settingsIconCircle,
                        { backgroundColor: `${colors.secondary}20` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account-edit-outline"
                        size={20}
                        color={colors.secondary}
                      />
                    </View>
                    <View>
                      <Text style={styles.settingsRowTitle}>Edit Profile & Platforms</Text>
                      <Text style={styles.settingsRowSubtitle}>
                        Update bio and linked accounts
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                <View style={styles.infoDivider} />
              </>
            )}

            {/* About App */}
            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={handleAboutApp}
            >
              <View style={styles.settingsRowLeft}>
                <View
                  style={[
                    styles.settingsIconCircle,
                    { backgroundColor: `${colors.textMuted}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                <View>
                  <Text style={styles.settingsRowTitle}>About IIIT NR Workspace</Text>
                  <Text style={styles.settingsRowSubtitle}>v1.0.0 • College Platform</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. LOGOUT BUTTON */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={colors.danger}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionFooter}>
            IIIT Naya Raipur Workspace • Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Add Platform Modal */}
      <AddPlatformModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        existingPlatforms={linkedKeys}
        onAdd={handleAddPlatform}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* 1. Header */
  headerCard: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  editProfileIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${colors.primary}25`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  avatarWrapper: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 12,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  userEmailText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  headerBadgeContainer: {
    marginTop: 10,
  },

  /* Section containers */
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  addSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addSmallButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },

  /* Empty state card for platforms */
  emptyPlatformsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyPlatformsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyPlatformsDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  emptyAddButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Platforms list */
  platformsList: {
    marginTop: 4,
  },
  addPlatformOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: `${colors.primary}0D`,
    marginTop: 8,
  },
  addPlatformOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },

  /* 4. Academic stats */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  /* 5. Academic info cards */
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  infoItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  /* 6. Settings menu */
  settingsMenuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  settingsRowSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* 7. Logout */
  logoutContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.danger}18`,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
  versionFooter: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ProfileScreen;
