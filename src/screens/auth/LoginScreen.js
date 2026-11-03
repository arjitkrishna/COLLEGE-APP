import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const LoginScreen = ({ navigation }) => {
  // Access app context if needed
  const { user } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [rollNo, setRollNo] = useState(user?.rollNo || '');
  const [semester, setSemester] = useState(
    user?.semester ? user.semester.replace(/[^0-9]/g, '') : '6'
  );

  const [activeInput, setActiveInput] = useState(null);

  const handleContinue = () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing Field', 'Please enter your college email address.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!rollNo.trim()) {
      Alert.alert('Missing Field', 'Please enter your roll number.');
      return;
    }
    if (!semester.trim()) {
      Alert.alert('Missing Field', 'Please enter your current semester.');
      return;
    }

    const formattedSemester = `${semester.trim()}${
      semester.trim().endsWith('Sem') || semester.trim().endsWith('Semester')
        ? ''
        : 'th Semester'
    }`;

    // Navigate to BranchSelect screen with user parameters
    navigation.navigate('BranchSelect', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rollNo: rollNo.trim().toUpperCase(),
      semester: formattedSemester,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Logo and Header Area */}
          <View style={styles.headerArea}>
            <LinearGradient
              colors={['#252954', '#16213E']}
              style={styles.logoBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="school" size={44} color={colors.primary} />
              <View style={styles.logoTextContainer}>
                <Text style={styles.logoAbbreviation}>IIIT NR</Text>
              </View>
            </LinearGradient>

            <Text style={styles.appName}>IIIT NR Workspace</Text>
            <Text style={styles.tagline}>Your college, your workspace</Text>
            <View style={styles.badgeRow}>
              <View style={styles.collegePill}>
                <Text style={styles.collegePillText}>Dr. SPM IIIT Naya Raipur</Text>
              </View>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Student Profile</Text>
            <Text style={styles.formSubtitle}>
              Enter your student details to set up your workspace
            </Text>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeInput === 'name' && styles.inputWrapperFocused,
                ]}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={22}
                  color={activeInput === 'name' ? colors.primary : colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Arjit Sharma"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setActiveInput('name')}
                  onBlur={() => setActiveInput(null)}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>College Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeInput === 'email' && styles.inputWrapperFocused,
                ]}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={22}
                  color={activeInput === 'email' ? colors.primary : colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. arjit@iiitnr.edu.in"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setActiveInput('email')}
                  onBlur={() => setActiveInput(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Roll Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Roll Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeInput === 'rollNo' && styles.inputWrapperFocused,
                ]}
              >
                <MaterialCommunityIcons
                  name="card-account-details-outline"
                  size={22}
                  color={activeInput === 'rollNo' ? colors.primary : colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 21100BT042"
                  placeholderTextColor={colors.textMuted}
                  value={rollNo}
                  onChangeText={setRollNo}
                  onFocus={() => setActiveInput('rollNo')}
                  onBlur={() => setActiveInput(null)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Semester Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Semester</Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeInput === 'semester' && styles.inputWrapperFocused,
                ]}
              >
                <MaterialCommunityIcons
                  name="school-outline"
                  size={22}
                  color={activeInput === 'semester' ? colors.primary : colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 6"
                  placeholderTextColor={colors.textMuted}
                  value={semester}
                  onChangeText={setSemester}
                  onFocus={() => setActiveInput('semester')}
                  onBlur={() => setActiveInput(null)}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.semAffix}>Semester</Text>
              </View>
            </View>

            {/* Get Started Button */}
            <TouchableOpacity
              style={styles.submitButtonContainer}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.primary, '#8575FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitButtonText}>Get Started</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color={colors.white}
                  style={styles.submitIcon}
                />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footerNoteContainer}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.footerNoteText}>
                Official Student Portal Client &bull; IIIT Naya Raipur
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3D3D6A',
    marginBottom: 16,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  logoTextContainer: {
    marginTop: -2,
  },
  logoAbbreviation: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 2,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  badgeRow: {
    marginTop: 10,
  },
  collegePill: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
  },
  collegePillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 7,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: '#202447',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  semAffix: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginLeft: 6,
  },
  submitButtonContainer: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  submitGradient: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  submitIcon: {
    marginLeft: 8,
  },
  footerNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerNoteText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 6,
  },
});

export default LoginScreen;
