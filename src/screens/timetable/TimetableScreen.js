import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { timetableData } from '../../data/timetableData';
import colors from '../../theme/colors';

const ALL_DAYS = [
  { key: 'Monday', short: 'Mon' },
  { key: 'Tuesday', short: 'Tue' },
  { key: 'Wednesday', short: 'Wed' },
  { key: 'Thursday', short: 'Thu' },
  { key: 'Friday', short: 'Fri' },
  { key: 'Saturday', short: 'Sat' },
  { key: 'Sunday', short: 'Sun' },
];

// Helper to determine day of week name
const getCurrentDayName = () => {
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday, ...
  const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return map[dayIndex];
};

// Helper to parse '9:00 AM - 10:00 AM' into minute ranges
const parseTimeSlot = (timeStr = '') => {
  try {
    const parts = timeStr.split('-').map((s) => s.trim());
    if (parts.length < 2) return null;

    const parseMinutes = (t) => {
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const start = parseMinutes(parts[0]);
    const end = parseMinutes(parts[1]);

    if (start === null || end === null) return null;
    return { start, end };
  } catch (e) {
    return null;
  }
};

const TimetableScreen = () => {
  const { user, currentBranch } = useApp();
  const branch = user?.branch || currentBranch || 'CSE';
  const branchColor = colors.branches[branch] || colors.primary;

  const currentDayName = useMemo(() => getCurrentDayName(), []);
  const [selectedDay, setSelectedDay] = useState(currentDayName);

  // Get timetable for user's branch
  const branchSchedule = timetableData[branch] || timetableData.CSE;
  const daySchedule = branchSchedule[selectedDay] || [];

  const isToday = selectedDay === currentDayName;
  const isWeekend = selectedDay === 'Saturday' || selectedDay === 'Sunday';

  // Check if a class is currently active right now
  const isClassOngoing = (timeStr) => {
    if (!isToday) return false;
    const parsed = parseTimeSlot(timeStr);
    if (!parsed) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= parsed.start && currentMinutes <= parsed.end;
  };

  const getTypeBadgeStyles = (type) => {
    switch (type) {
      case 'Lab':
        return {
          bg: 'rgba(0, 184, 148, 0.15)',
          text: colors.success,
          border: 'rgba(0, 184, 148, 0.35)',
        };
      case 'Tutorial':
        return {
          bg: 'rgba(254, 202, 87, 0.15)',
          text: colors.warning,
          border: 'rgba(254, 202, 87, 0.35)',
        };
      case 'Break':
        return {
          bg: 'rgba(108, 92, 231, 0.15)',
          text: colors.primary,
          border: 'rgba(108, 92, 231, 0.35)',
        };
      case 'Lecture':
      default:
        return {
          bg: 'rgba(84, 160, 255, 0.15)',
          text: '#54A0FF',
          border: 'rgba(84, 160, 255, 0.35)',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerTitle}>Class Timetable</Text>
            <Text style={styles.headerSubtitle}>
              {branch} Department • Spring Semester
            </Text>
          </View>
          <View style={[styles.branchBadge, { borderColor: branchColor }]}>
            <Text style={[styles.branchBadgeText, { color: branchColor }]}>
              {branch}
            </Text>
          </View>
        </View>

        {/* Day Selector - Horizontal Scrollable Pill Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorScroll}
        >
          {ALL_DAYS.map((dayItem) => {
            const isSelected = selectedDay === dayItem.key;
            const isCurrent = currentDayName === dayItem.key;

            return (
              <TouchableOpacity
                key={dayItem.key}
                onPress={() => setSelectedDay(dayItem.key)}
                activeOpacity={0.8}
                style={[
                  styles.dayPill,
                  isSelected && styles.dayPillActive,
                  isCurrent && !isSelected && styles.dayPillCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.dayPillShort,
                    isSelected && styles.dayPillTextActive,
                    isCurrent && !isSelected && styles.dayPillCurrentText,
                  ]}
                >
                  {dayItem.short}
                </Text>
                {isCurrent && (
                  <View
                    style={[
                      styles.currentDot,
                      isSelected && { backgroundColor: colors.white },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Area */}
      <ScrollView
        style={styles.scheduleScroll}
        contentContainerStyle={styles.scheduleContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Day Subheader */}
        <View style={styles.daySubheader}>
          <Text style={styles.daySubheaderTitle}>
            {selectedDay.toUpperCase()}'S SCHEDULE
          </Text>
          {isToday && (
            <View style={styles.todayIndicator}>
              <View style={styles.livePulseDot} />
              <Text style={styles.todayIndicatorText}>TODAY</Text>
            </View>
          )}
        </View>

        {/* Weekend View */}
        {isWeekend ? (
          <View style={styles.weekendCard}>
            <View style={styles.weekendIconCircle}>
              <MaterialCommunityIcons
                name="party-popper"
                size={48}
                color={colors.accent}
              />
            </View>
            <Text style={styles.weekendTitle}>No classes - Weekend! 🎉</Text>
            <Text style={styles.weekendText}>
              Take a well-deserved break, work on your hackathon ideas, or catch up on sleep. Campus classes resume Monday morning!
            </Text>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setSelectedDay('Monday')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="calendar-arrow-right" size={18} color={colors.white} />
              <Text style={styles.switchButtonText}>View Monday's Schedule</Text>
            </TouchableOpacity>
          </View>
        ) : daySchedule.length === 0 ? (
          /* Empty / Holiday State */
          <View style={styles.weekendCard}>
            <View style={styles.weekendIconCircle}>
              <MaterialCommunityIcons
                name="calendar-blank"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.weekendTitle}>No Classes Scheduled</Text>
            <Text style={styles.weekendText}>
              There are no classes scheduled for this day. Enjoy your free time!
            </Text>
          </View>
        ) : (
          /* Timeline Schedule Layout */
          <View style={styles.timelineContainer}>
            {daySchedule.map((slot, index) => {
              const ongoing = isClassOngoing(slot.time);
              const isBreak =
                slot.type === 'Break' ||
                slot.code === 'LUNCH' ||
                slot.subject?.toLowerCase().includes('lunch');
              const badgeTheme = getTypeBadgeStyles(slot.type);

              if (isBreak) {
                // Special Lunch Break Divider
                return (
                  <View key={slot.id || `break-${index}`} style={styles.lunchBreakRow}>
                    <View style={styles.lunchLine} />
                    <View style={styles.lunchBadge}>
                      <MaterialCommunityIcons
                        name="silverware-fork-knife"
                        size={16}
                        color={colors.warning}
                        style={styles.lunchIcon}
                      />
                      <Text style={styles.lunchText}>
                        {slot.subject} • {slot.time} • Cafeteria
                      </Text>
                    </View>
                    <View style={styles.lunchLine} />
                  </View>
                );
              }

              return (
                <View key={slot.id || `slot-${index}`} style={styles.slotRow}>
                  {/* Left Column: Timeline & Time */}
                  <View style={styles.timeColumn}>
                    <Text style={[styles.timeText, ongoing && styles.timeTextOngoing]}>
                      {slot.time.split('-')[0].trim()}
                    </Text>
                    <Text style={styles.timeEndText}>
                      to {slot.time.split('-')[1]?.trim() || ''}
                    </Text>

                    {/* Timeline vertical connector */}
                    <View style={styles.timelineTrack}>
                      <View
                        style={[
                          styles.timelineNode,
                          ongoing && styles.timelineNodeOngoing,
                        ]}
                      />
                      {index < daySchedule.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                  </View>

                  {/* Right Column: Class Card */}
                  <View
                    style={[
                      styles.classCard,
                      ongoing && styles.classCardOngoing,
                    ]}
                  >
                    {/* Live Badge for Current Class */}
                    {ongoing && (
                      <View style={styles.ongoingBanner}>
                        <View style={styles.livePulseDot} />
                        <Text style={styles.ongoingBannerText}>NOW HAPPENING</Text>
                      </View>
                    )}

                    {/* Header Row: Subject & Type Badge */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardSubjectInfo}>
                        <Text style={styles.subjectName} numberOfLines={2}>
                          {slot.subject}
                        </Text>
                        <Text style={styles.subjectCode}>{slot.code}</Text>
                      </View>

                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor: badgeTheme.bg,
                            borderColor: badgeTheme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.typeBadgeText, { color: badgeTheme.text }]}
                        >
                          {slot.type}
                        </Text>
                      </View>
                    </View>

                    {/* Meta Details: Faculty & Room */}
                    <View style={styles.cardFooter}>
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons
                          name="account-tie-outline"
                          size={15}
                          color={colors.textSecondary}
                          style={styles.metaIcon}
                        />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {slot.faculty}
                        </Text>
                      </View>

                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={15}
                          color={colors.textSecondary}
                          style={styles.metaIcon}
                        />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {slot.room}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  branchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  branchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  daySelectorScroll: {
    gap: 8,
  },
  dayPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  dayPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayPillCurrent: {
    borderColor: colors.primary,
  },
  dayPillShort: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayPillTextActive: {
    color: colors.white,
  },
  dayPillCurrentText: {
    color: colors.text,
  },
  currentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  scheduleScroll: {
    flex: 1,
  },
  scheduleContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  daySubheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  daySubheaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  todayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 184, 148, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 6,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  todayIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  timelineContainer: {
    marginTop: 4,
  },
  slotRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timeColumn: {
    width: 76,
    alignItems: 'flex-start',
    paddingTop: 2,
    position: 'relative',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  timeTextOngoing: {
    color: colors.primary,
    fontWeight: '800',
  },
  timeEndText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  timelineTrack: {
    position: 'absolute',
    right: 8,
    top: 6,
    bottom: -14,
    alignItems: 'center',
    width: 14,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.border,
    zIndex: 2,
  },
  timelineNodeOngoing: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
  },
  timelineLine: {
    position: 'absolute',
    top: 10,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  classCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  classCardOngoing: {
    borderColor: colors.primary,
    borderWidth: 1.8,
    backgroundColor: '#181C38',
  },
  ongoingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  ongoingBannerText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardSubjectInfo: {
    flex: 1,
    marginRight: 8,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  subjectCode: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  lunchBreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  lunchLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  lunchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(254, 202, 87, 0.3)',
  },
  lunchIcon: {
    marginRight: 6,
  },
  lunchText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  weekendCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
  },
  weekendIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(253, 121, 168, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  weekendTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  weekendText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 8,
  },
  switchButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default TimetableScreen;
