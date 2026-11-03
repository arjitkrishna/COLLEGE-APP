import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp, ACTION_TYPES } from '../../context/AppContext';
import { getSubjectsByBranch } from '../../data/subjectsData';
import AttendanceCard from '../../components/AttendanceCard';
import colors from '../../theme/colors';

const AttendanceScreen = () => {
  const { user, currentBranch, attendance, dispatch, markAttendance } = useApp();

  const branch = user?.branch || currentBranch || 'CSE';
  const semester = user?.semester || '6th Semester';
  const branchColor = colors.branches[branch] || colors.primary;

  const subjects = useMemo(() => {
    return getSubjectsByBranch(branch);
  }, [branch]);

  // Calculate weighted overall attendance
  const overallStats = useMemo(() => {
    let totalPresent = 0;
    let totalClasses = 0;
    const lowAttendanceSubjects = [];

    subjects.forEach((subj) => {
      const record = attendance?.[subj.id] || { present: 0, total: 0 };
      totalPresent += record.present;
      totalClasses += record.total;

      const pct = record.total > 0 ? (record.present / record.total) * 100 : 0;
      if (pct < 75) {
        lowAttendanceSubjects.push({
          ...subj,
          percentage: Math.round(pct),
          present: record.present,
          total: record.total,
        });
      }
    });

    const percentage =
      totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

    return {
      totalPresent,
      totalClasses,
      percentage,
      lowAttendanceSubjects,
    };
  }, [subjects, attendance]);

  const getAttendanceColor = (pct) => {
    if (pct > 85) return colors.success;
    if (pct >= 75) return colors.warning;
    return colors.danger;
  };

  const getStatusLabel = (pct) => {
    if (pct > 85) return 'Safe Zone';
    if (pct >= 75) return 'Borderline';
    return 'Critical';
  };

  const handleMarkPresent = (subjectId) => {
    if (markAttendance) {
      markAttendance(subjectId, 'present');
    } else if (dispatch) {
      dispatch({
        type: ACTION_TYPES.MARK_ATTENDANCE,
        payload: { subjectId, status: 'present' },
      });
    }
  };

  const handleMarkAbsent = (subjectId) => {
    if (markAttendance) {
      markAttendance(subjectId, 'absent');
    } else if (dispatch) {
      dispatch({
        type: ACTION_TYPES.MARK_ATTENDANCE,
        payload: { subjectId, status: 'absent' },
      });
    }
  };

  const overallColor = getAttendanceColor(overallStats.percentage);
  const statusLabel = getStatusLabel(overallStats.percentage);
  const lowCount = overallStats.lowAttendanceSubjects.length;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Title Bar */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.screenTitle}>Attendance Tracker</Text>
          <Text style={styles.screenSubtitle}>
            Minimum 75% required per academic regulation
          </Text>
        </View>
        <View style={[styles.branchPill, { backgroundColor: `${branchColor}25`, borderColor: branchColor }]}>
          <Text style={[styles.branchPillText, { color: branchColor }]}>{branch}</Text>
        </View>
      </View>

      {/* Info / Filter Bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="school-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{semester}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="book-multiple-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{subjects.length} Courses</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {user?.rollNo || '21100BT001'}
          </Text>
        </View>
      </View>

      {/* Low Attendance Warning Banner */}
      {lowCount > 0 && (
        <View style={styles.warningBanner}>
          <View style={styles.warningIconWrapper}>
            <MaterialCommunityIcons name="alert" size={22} color={colors.danger} />
          </View>
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>
              ⚠️ Low attendance in {lowCount} subject{lowCount > 1 ? 's' : ''}!
            </Text>
            <Text style={styles.warningSubtitle}>
              {overallStats.lowAttendanceSubjects
                .map((s) => `${s.code} (${s.percentage}%)`)
                .join(', ')}
            </Text>
          </View>
        </View>
      )}

      {/* Overall Attendance Circular / Metric Card */}
      <View style={styles.overallCard}>
        <View style={styles.overallTopRow}>
          <View style={styles.overallTextGroup}>
            <Text style={styles.overallLabel}>OVERALL ATTENDANCE</Text>
            <Text style={styles.overallHint}>
              Weighted across all registered courses
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${overallColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: overallColor }]} />
            <Text style={[styles.statusBadgeText, { color: overallColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.circularDisplayRow}>
          {/* Circular Ring Display */}
          <View style={[styles.circleRing, { borderColor: overallColor }]}>
            <View style={styles.circleInner}>
              <Text style={[styles.circlePercentage, { color: overallColor }]}>
                {overallStats.percentage}%
              </Text>
              <Text style={styles.circleSubtext}>AVERAGE</Text>
            </View>
          </View>

          {/* Metric Details Column */}
          <View style={styles.metricDetails}>
            <View style={styles.metricRow}>
              <View style={styles.metricDotBox}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              </View>
              <View style={styles.metricTextBlock}>
                <Text style={styles.metricValue}>{overallStats.totalPresent}</Text>
                <Text style={styles.metricLabel}>Classes Attended</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricDotBox}>
                <MaterialCommunityIcons name="calendar-clock" size={18} color={colors.primary} />
              </View>
              <View style={styles.metricTextBlock}>
                <Text style={styles.metricValue}>{overallStats.totalClasses}</Text>
                <Text style={styles.metricLabel}>Total Classes Held</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricDotBox}>
                <MaterialCommunityIcons name="shield-check" size={18} color={colors.warning} />
              </View>
              <View style={styles.metricTextBlock}>
                <Text style={styles.metricValue}>75%</Text>
                <Text style={styles.metricLabel}>Mandatory Criteria</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mini progress bar below circular display */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(Math.max(overallStats.percentage, 0), 100)}%`,
                backgroundColor: overallColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Section Subheader */}
      <View style={styles.listSectionHeader}>
        <Text style={styles.listSectionTitle}>SUBJECTS BREAKDOWN</Text>
        <Text style={styles.listSectionCount}>{subjects.length} Subjects</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AttendanceCard
            subject={item}
            attendance={attendance?.[item.id] || { present: 0, total: 0 }}
            onMarkPresent={() => handleMarkPresent(item.id)}
            onMarkAbsent={() => handleMarkAbsent(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  branchPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  branchPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  warningIconWrapper: {
    marginRight: 10,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  warningSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  overallCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 18,
  },
  overallTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallTextGroup: {
    flex: 1,
  },
  overallLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  overallHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  circularDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  circleRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  circleInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePercentage: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  circleSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  metricDetails: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDotBox: {
    width: 28,
    alignItems: 'center',
    marginRight: 8,
  },
  metricTextBlock: {
    flex: 1,
  },
  metricValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  listSectionCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default AttendanceScreen;
