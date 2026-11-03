import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import BranchBadge from '../../components/BranchBadge';
import { subjectsData } from '../../data/subjectsData';
import { channelsData } from '../../data/channelsData';

const BRANCH_NAMES = {
  CSE: 'Computer Science & Engineering',
  DSAI: 'Data Science & Artificial Intelligence',
  ECE: 'Electronics & Communication Engineering',
};

const ProfileScreen = ({ navigation }) => {
  const {
    user,
    currentBranch,
    logout,
    dispatch,
    setBranch,
    calculateOverallAttendance,
  } = useApp();

  const branch = user?.branch || currentBranch || 'CSE';
  const branchColor = colors.branches[branch] || colors.primary;
  const branchFullName = BRANCH_NAMES[branch] || 'Computer Science & Engineering';

  // Overall attendance calculation
  const overall = calculateOverallAttendance
    ? calculateOverallAttendance(branch)
    : { percentage: 84.5 };
  const attendanceDisplay = `${overall.percentage || 84.5}%`;

  // Count subjects and channels
  const subjectsCount = subjectsData[branch] ? subjectsData[branch].length : 6;
  const channelsCount = channelsData[branch] ? channelsData[branch].length : 5;

  // Initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'NR';

  // Switch Branch handler with prompt
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

  const applyBranchSwitch = (newBranch) => {
    if (newBranch === branch) {
      Alert.alert('Notice', `You are already in ${newBranch}.`);
      return;
    }

    if (typeof setBranch === 'function') {
      setBranch(newBranch);
    } else if (dispatch) {
      dispatch({ type: 'SET_BRANCH', payload: newBranch });
    }

    Alert.alert('Branch Updated', `Switched workspace to ${newBranch} successfully!`);
  };

  // About App info
  const handleAboutApp = () => {
    Alert.alert(
      'IIIT NR Workspace',
      'Version 1.0.0 (Release 2026)\n\nAn integrated student workspace application designed specifically for the students, faculty, and academic departments of Dr. SPM IIIT Naya Raipur.\n\nFeatures:\n• Real-time Department Timetables\n• Attendance Threshold Tracker (75% Safe Bunks)\n• Department Collaborative Channels\n• Important College Announcements',
      [{ text: 'Close', style: 'default' }]
    );
  };

  // Logout handler
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your workspace session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            if (typeof logout === 'function') {
              logout();
            } else if (dispatch) {
              dispatch({ type: 'LOGOUT' });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Large Avatar Circle with branch color */}
          <View
            style={[
              styles.avatarContainer,
              { borderColor: branchColor, backgroundColor: `${branchColor}20` },
            ]}
          >
            <Text style={[styles.avatarInitials, { color: branchColor }]}>
              {initials}
            </Text>
          </View>

          {/* User Name & Details */}
          <Text style={styles.userName}>{user?.name || 'Student'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'student@iiitnr.edu.in'}</Text>

          <View style={styles.badgeWrapper}>
            <BranchBadge branch={branch} size="medium" />
          </View>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.statsCardContainer}>
          <View style={styles.statCol}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              {attendanceDisplay}
            </Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {subjectsCount}
            </Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {channelsCount}
            </Text>
            <Text style={styles.statLabel}>Channels</Text>
          </View>
        </View>

        {/* Info Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Academic Information</Text>

          {/* Roll Number Card */}
          <View style={styles.infoCard}>
            <View style={[styles.infoIconBox, { backgroundColor: 'rgba(108, 92, 231, 0.15)' }]}>
              <MaterialCommunityIcons
                name="card-account-details-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Roll Number</Text>
              <Text style={styles.infoValue}>{user?.rollNo || '21100BT001'}</Text>
            </View>
          </View>

          {/* Semester Card */}
          <View style={styles.infoCard}>
            <View style={[styles.infoIconBox, { backgroundColor: 'rgba(0, 184, 148, 0.15)' }]}>
              <MaterialCommunityIcons
                name="school-outline"
                size={22}
                color={colors.secondary}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Semester</Text>
              <Text style={styles.infoValue}>{user?.semester || '6th Semester'}</Text>
            </View>
          </View>

          {/* Branch Full Name Card */}
          <View style={styles.infoCard}>
            <View style={[styles.infoIconBox, { backgroundColor: `${branchColor}20` }]}>
              <MaterialCommunityIcons
                name="domain"
                size={22}
                color={branchColor}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Branch / Department</Text>
              <Text style={styles.infoValue}>{branchFullName}</Text>
            </View>
          </View>
        </View>

        {/* Settings & Options Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Settings & App</Text>

          {/* Switch Branch */}
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={handleSwitchBranch}
          >
            <View style={[styles.settingIconBox, { backgroundColor: 'rgba(108, 92, 231, 0.15)' }]}>
              <MaterialCommunityIcons
                name="swap-horizontal-bold"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Switch Branch</Text>
              <Text style={styles.settingDesc}>
                Change current department ({branch})
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {/* About App */}
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={handleAboutApp}
          >
            <View style={[styles.settingIconBox, { backgroundColor: 'rgba(0, 184, 148, 0.15)' }]}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={colors.secondary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About IIIT NR Workspace</Text>
              <Text style={styles.settingDesc}>Version info, credits & details</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {/* Version Info Row */}
          <View style={styles.versionRow}>
            <MaterialCommunityIcons
              name="cellphone-check"
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.versionText}>Version 1.0.0 &bull; Build 2026</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={colors.white}
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  badgeWrapper: {
    marginTop: 2,
  },
  statsCardContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  versionText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: colors.danger,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;
