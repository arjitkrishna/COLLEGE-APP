import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import BranchBadge from '../../components/BranchBadge';
import { getClassesForDay } from '../../data/timetableData';
import { getTotalUnreadMessages } from '../../data/channelsData';

const ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Mid-semester exams start from Nov 15',
    category: 'Exams',
    timeAgo: '2h ago',
    icon: 'calendar-alert',
    accentColor: colors.danger,
    description: 'Detailed seat allocation and syllabus circular uploaded on the portal.',
  },
  {
    id: 'ann-2',
    title: 'Hackathon registrations open - TechFest 2026',
    category: 'Hackathon',
    timeAgo: '5h ago',
    icon: 'trophy-outline',
    accentColor: colors.primary,
    description: 'Teams of up to 4 can register for the 36-hour flagship hackathon.',
  },
  {
    id: 'ann-3',
    title: 'Library hours extended till 11 PM during exams',
    category: 'Facilities',
    timeAgo: '1d ago',
    icon: 'book-clock-outline',
    accentColor: colors.secondary,
    description: 'Central reading hall open with high-speed WiFi for night revision.',
  },
  {
    id: 'ann-4',
    title: 'Sports day scheduled for Nov 20',
    category: 'Sports',
    timeAgo: '2d ago',
    icon: 'basketball',
    accentColor: colors.warning,
    description: 'Inter-department cricket, badminton, and athletics tournaments.',
  },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HomeScreen = ({ navigation }) => {
  const { user, currentBranch, calculateOverallAttendance } = useApp();

  // Selected or active branch
  const branch = user?.branch || currentBranch || 'CSE';
  const branchColor = colors.branches[branch] || colors.primary;

  // Real current day
  const todayIndex = new Date().getDay();
  const currentRealDay = DAYS[todayIndex];

  // Selected schedule day (defaults to today, or Monday if today is weekend)
  const isWeekend = todayIndex === 0 || todayIndex === 6;
  const [selectedDay, setSelectedDay] = useState(currentRealDay);

  const classesToday = getClassesForDay(branch, currentRealDay);
  const displayedClasses = getClassesForDay(branch, selectedDay);

  // Overall attendance calculation from AppContext
  const overallAttendance = calculateOverallAttendance
    ? calculateOverallAttendance(branch)
    : { percentage: 84.5 };
  const attendanceDisplay = `${overallAttendance.percentage || 84.5}%`;

  // Channels unread count
  const unreadCount = getTotalUnreadMessages(branch);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeSubtext}>Welcome back,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || 'Student'}
            </Text>
            <View style={styles.badgeRow}>
              <BranchBadge branch={branch} size="medium" />
              <View style={styles.dateChip}>
                <MaterialCommunityIcons
                  name="calendar-today"
                  size={12}
                  color={colors.textSecondary}
                  style={styles.dateChipIcon}
                />
                <Text style={styles.dateChipText}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          {/* User Profile Initial Badge / Quick shortcut */}
          <TouchableOpacity
            style={[styles.headerAvatar, { borderColor: branchColor }]}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate && navigation.navigate('Profile')}
          >
            <Text style={[styles.avatarText, { color: branchColor }]}>
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'NR'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Row (3 cards) */}
        <View style={styles.statsContainer}>
          {/* Card 1: Today's Classes */}
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(108, 92, 231, 0.15)', 'transparent']}
              style={styles.statCardGradient}
            >
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: 'rgba(108, 92, 231, 0.2)' },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.statValue}>{classesToday.length}</Text>
              <Text style={styles.statLabel}>Today's Classes</Text>
            </LinearGradient>
          </View>

          {/* Card 2: Attendance % */}
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(0, 184, 148, 0.15)', 'transparent']}
              style={styles.statCardGradient}
            >
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: 'rgba(0, 184, 148, 0.2)' },
                ]}
              >
                <MaterialCommunityIcons
                  name="chart-arc"
                  size={20}
                  color={colors.secondary}
                />
              </View>
              <Text style={styles.statValue}>{attendanceDisplay}</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </LinearGradient>
          </View>

          {/* Card 3: Channels Unread */}
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(253, 121, 168, 0.15)', 'transparent']}
              style={styles.statCardGradient}
            >
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: 'rgba(253, 121, 168, 0.2)' },
                ]}
              >
                <MaterialCommunityIcons
                  name="chat-processing-outline"
                  size={20}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.statValue}>{unreadCount}</Text>
              <Text style={styles.statLabel}>Unread Msgs</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Today's Schedule Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons
              name="clock-time-four-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
          </View>
          <Text style={styles.sectionDayIndicator}>
            {selectedDay}
          </Text>
        </View>

        {/* Schedule List or Weekend Empty State */}
        {classesToday.length === 0 && selectedDay === currentRealDay ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.partyIconCircle}>
              <Text style={styles.partyEmoji}>🎉</Text>
            </View>
            <Text style={styles.emptyTitle}>No classes today! 🎉</Text>
            <Text style={styles.emptySubtitle}>
              It's the weekend! Take time to rest, work on projects, or chat with classmates.
            </Text>
            {isWeekend && (
              <TouchableOpacity
                style={styles.previewWeekdayButton}
                activeOpacity={0.8}
                onPress={() => setSelectedDay(selectedDay === 'Monday' ? currentRealDay : 'Monday')}
              >
                <Text style={styles.previewWeekdayText}>
                  {selectedDay === 'Monday' ? 'Back to Today' : 'Preview Monday Schedule'}
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        ) : displayedClasses.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyTitle}>No classes scheduled for {selectedDay}</Text>
          </View>
        ) : (
          <View style={styles.scheduleList}>
            {displayedClasses.map((item, index) => {
              const isLab = item.type === 'Lab';
              return (
                <View
                  key={item.id || index}
                  style={[
                    styles.classCard,
                    { borderLeftColor: isLab ? colors.accent : branchColor },
                  ]}
                >
                  <View style={styles.classTopRow}>
                    <View style={styles.timeBadge}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color={colors.textSecondary}
                        style={styles.timeIcon}
                      />
                      <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                    <View
                      style={[
                        styles.classTypeBadge,
                        {
                          backgroundColor: isLab
                            ? 'rgba(253, 121, 168, 0.15)'
                            : 'rgba(108, 92, 231, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.classTypeText,
                          { color: isLab ? colors.accent : colors.primary },
                        ]}
                      >
                        {item.type || 'Lecture'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.className}>{item.subject}</Text>

                  <View style={styles.classDetailsRow}>
                    <View style={styles.classDetailItem}>
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={15}
                        color={colors.textMuted}
                      />
                      <Text style={styles.classDetailText}>{item.room}</Text>
                    </View>
                    <View style={styles.classDetailItem}>
                      <MaterialCommunityIcons
                        name="account-tie-outline"
                        size={15}
                        color={colors.textMuted}
                      />
                      <Text style={styles.classDetailText}>{item.faculty}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Announcements Section */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons
              name="bullhorn-outline"
              size={22}
              color={colors.accent}
            />
            <Text style={styles.sectionTitle}>Announcements</Text>
          </View>
          <Text style={styles.announcementCount}>
            {ANNOUNCEMENTS.length} Updates
          </Text>
        </View>

        <View style={styles.announcementsList}>
          {ANNOUNCEMENTS.map((item) => (
            <View key={item.id} style={styles.announcementCard}>
              <View
                style={[
                  styles.announcementIconWrapper,
                  { backgroundColor: `${item.accentColor}20` },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={item.accentColor}
                />
              </View>

              <View style={styles.announcementBody}>
                <View style={styles.announcementMetaRow}>
                  <View
                    style={[
                      styles.categoryTag,
                      { backgroundColor: `${item.accentColor}25` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTagText,
                        { color: item.accentColor },
                      ]}
                    >
                      {item.category}
                    </Text>
                  </View>
                  <Text style={styles.timeAgoText}>{item.timeAgo}</Text>
                </View>

                <Text style={styles.announcementTitle}>{item.title}</Text>
                <Text style={styles.announcementDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  welcomeSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
    marginTop: 2,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipIcon: {
    marginRight: 4,
  },
  dateChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  sectionDayIndicator: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  announcementCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyStateCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  partyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(254, 202, 87, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  partyEmoji: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  previewWeekdayButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.4)',
  },
  previewWeekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 6,
  },
  scheduleList: {
    gap: 12,
  },
  classCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  classTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 5,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  classTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  classTypeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  classDetailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  classDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 5,
    fontWeight: '500',
  },
  announcementsList: {
    gap: 12,
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  announcementIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementBody: {
    flex: 1,
  },
  announcementMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeAgoText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  announcementDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});

export default HomeScreen;
