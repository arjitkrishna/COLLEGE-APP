import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const BRANCHES = [
  {
    key: 'CSE',
    title: 'Computer Science & Engineering',
    subtitle: 'CSE',
    description: 'Algorithms, Systems, Networks & Software Architecture',
    icon: 'code-tags',
    color: colors.branches.CSE, // '#6C5CE7'
    gradient: ['#282252', '#16213E'],
    stats: '6 Courses • 4 Labs',
  },
  {
    key: 'DSAI',
    title: 'Data Science & AI',
    subtitle: 'DSAI',
    description: 'Machine Learning, Deep Learning, NLP & Computer Vision',
    icon: 'brain',
    color: colors.branches.DSAI, // '#00B894'
    gradient: ['#123533', '#16213E'],
    stats: '6 Courses • AI Lab',
  },
  {
    key: 'ECE',
    title: 'Electronics & Communication',
    subtitle: 'ECE',
    description: 'VLSI Systems, DSP, Microprocessors & IoT Hardware',
    icon: 'chip',
    color: colors.branches.ECE, // '#FD79A8'
    gradient: ['#3A1C33', '#16213E'],
    stats: '6 Courses • Hardware Lab',
  },
];

const BranchSelectScreen = ({ navigation, route }) => {
  const { name, email, rollNo, semester } = route?.params || {};
  const { login, dispatch } = useApp();
  const [selectedKey, setSelectedKey] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectBranch = (branchKey) => {
    setSelectedKey(branchKey);
    setIsSubmitting(true);

    const userData = {
      name: name || 'Student',
      email: email || 'student@iiitnr.edu.in',
      rollNo: rollNo || '21100BT001',
      semester: semester || '6th Semester',
      branch: branchKey,
    };

    // Dispatch login action or call login helper
    setTimeout(() => {
      if (typeof login === 'function') {
        login(userData);
      } else if (dispatch) {
        dispatch({
          type: 'LOGIN',
          payload: userData,
        });
      }

      // If navigation is managed via stack instead of auth state switch
      if (navigation && navigation.canGoBack && !navigation.canGoBack()) {
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } catch (e) {
          // Handled by context state change
        }
      }
    }, 250);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar / Back button */}
        {navigation?.canGoBack && navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            <Text style={styles.backButtonText}>Back to details</Text>
          </TouchableOpacity>
        )}

        {/* Title and Subtitle Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Branch</Text>
          <Text style={styles.subtitle}>
            Choose your department to get started with tailored timetables, attendance, and channels
          </Text>
          {name ? (
            <View style={styles.userGreetingBadge}>
              <MaterialCommunityIcons
                name="account-check"
                size={16}
                color={colors.secondary}
              />
              <Text style={styles.userGreetingText}>
                Setting up workspace for <Text style={styles.boldText}>{name}</Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Branch Cards */}
        <View style={styles.cardsContainer}>
          {BRANCHES.map((item) => {
            const isSelected = selectedKey === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.8}
                onPress={() => handleSelectBranch(item.key)}
                disabled={isSubmitting}
                style={[
                  styles.cardTouchWrapper,
                  isSelected && styles.cardSelectedBorder,
                ]}
              >
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.card,
                    { borderLeftColor: item.color },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    {/* Icon Circle */}
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: `${item.color}25`, borderColor: item.color },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={28}
                        color={item.color}
                      />
                    </View>

                    {/* Badge */}
                    <View
                      style={[
                        styles.branchBadge,
                        { backgroundColor: `${item.color}20`, borderColor: item.color },
                      ]}
                    >
                      <Text style={[styles.branchBadgeText, { color: item.color }]}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* Branch Information */}
                  <View style={styles.cardBody}>
                    <Text style={styles.branchTitle}>{item.title}</Text>
                    <Text style={styles.branchDescription}>{item.description}</Text>
                  </View>

                  {/* Card Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.statsRow}>
                      <MaterialCommunityIcons
                        name="book-open-page-variant-outline"
                        size={15}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.statsText}>{item.stats}</Text>
                    </View>

                    <View style={styles.actionArrow}>
                      {isSelected && isSubmitting ? (
                        <ActivityIndicator size="small" color={item.color} />
                      ) : (
                        <View
                          style={[
                            styles.arrowCircle,
                            { backgroundColor: `${item.color}25` },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="arrow-right"
                            size={18}
                            color={item.color}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.textMuted}
          />
          <Text style={styles.footerText}>
            You can always switch your branch later in the Profile settings.
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  header: {
    marginBottom: 24,
    marginTop: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  userGreetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 184, 148, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 148, 0.25)',
  },
  userGreetingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  boldText: {
    color: colors.text,
    fontWeight: '700',
  },
  cardsContainer: {
    gap: 16,
  },
  cardTouchWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  cardSelectedBorder: {
    borderColor: colors.white,
    transform: [{ scale: 1.01 }],
  },
  card: {
    borderRadius: 18,
    padding: 20,
    backgroundColor: colors.surface,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  branchBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  branchBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardBody: {
    marginBottom: 16,
  },
  branchTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  branchDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  actionArrow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 12,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    textAlign: 'center',
  },
});

export default BranchSelectScreen;
