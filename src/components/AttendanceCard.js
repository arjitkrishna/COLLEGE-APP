import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';

const AttendanceCard = ({
  subject = {},
  attendance = { present: 0, total: 0 },
  onMarkPresent,
  onMarkAbsent,
}) => {
  const present = attendance?.present ?? 0;
  const total = attendance?.total ?? 0;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  const getProgressColor = (pct) => {
    if (pct > 85) return colors.success;
    if (pct >= 75) return colors.warning;
    return colors.danger;
  };

  const statusColor = getProgressColor(percentage);

  return (
    <View style={styles.card}>
      {/* Top Header: Subject info & Percentage */}
      <View style={styles.headerRow}>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName} numberOfLines={2}>
            {subject.name || 'Subject Name'}
          </Text>
          <Text style={styles.subjectCode}>{subject.code || 'CODE101'}</Text>
        </View>

        <View style={styles.percentageContainer}>
          <Text style={[styles.percentageText, { color: statusColor }]}>
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Faculty Name */}
      {Boolean(subject.faculty) && (
        <View style={styles.facultyRow}>
          <MaterialCommunityIcons
            name="account-tie-outline"
            size={16}
            color={colors.textSecondary}
            style={styles.facultyIcon}
          />
          <Text style={styles.facultyText} numberOfLines={1}>
            {subject.faculty}
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(Math.max(percentage, 0), 100)}%`,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>

      {/* Attendance Count */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          Present: <Text style={styles.statsHighlight}>{present}</Text>/{total}
        </Text>
        <Text style={[styles.statusLabel, { color: statusColor }]}>
          {percentage > 85 ? 'On Track' : percentage >= 75 ? 'Acceptable' : 'Low Attendance'}
        </Text>
      </View>

      {/* Action Buttons: Present and Absent */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.button, styles.presentButton]}
          onPress={onMarkPresent}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="check" size={18} color={colors.white} />
          <Text style={styles.buttonText}>✓ Present</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.absentButton]}
          onPress={onMarkAbsent}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={18} color={colors.white} />
          <Text style={styles.buttonText}>✗ Absent</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subjectInfo: {
    flex: 1,
    marginRight: 12,
  },
  subjectName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  subjectCode: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  percentageContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 70,
  },
  percentageText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  facultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  facultyIcon: {
    marginRight: 6,
  },
  facultyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statsText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  statsHighlight: {
    color: colors.text,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  presentButton: {
    backgroundColor: colors.success,
  },
  absentButton: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AttendanceCard;
