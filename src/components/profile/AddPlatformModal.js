import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import {
  getPlatformList,
  cleanUsername,
  generateVerificationToken,
  verifyPlatformOwnership,
} from '../../lib/platforms';

const DEFAULT_PLATFORMS = [
  {
    id: 'leetcode',
    name: 'LeetCode',
    icon: 'code-braces',
    color: '#FFA116',
    description: 'Show your problem-solving stats',
    placeholder: 'Enter your LeetCode username',
  },
  {
    id: 'codeforces',
    name: 'Codeforces',
    icon: 'chart-bell-curve-cumulative',
    color: '#1F8ACB',
    description: 'Display your competitive rating',
    placeholder: 'Enter your Codeforces handle',
  },
  {
    id: 'codechef',
    name: 'CodeChef',
    icon: 'food-fork-drink',
    color: '#D4A373',
    description: 'Share your CodeChef stars & rank',
    placeholder: 'Enter your CodeChef username',
  },
  {
    id: 'chess',
    name: 'Chess.com',
    icon: 'chess-knight',
    color: '#81B64C',
    description: 'Flex your chess ELO ratings',
    placeholder: 'Enter your Chess.com username',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    color: '#F0F6FC',
    description: 'Showcase your open source work',
    placeholder: 'Enter your GitHub username',
  },
];

const AddPlatformModal = ({
  visible = false,
  onClose,
  onAdd,
  existingPlatforms = [],
  userEmail = '',
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [personalEmailInput, setPersonalEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const verificationToken = generateVerificationToken(userEmail || 'student');

  // Reset local state when modal opens or closes
  useEffect(() => {
    if (visible) {
      setSelectedPlatform(null);
      setUsernameInput('');
      setPersonalEmailInput('');
      setErrorMsg('');
      setVerifying(false);
      setVerificationError('');
      setVerificationSuccess(null);
      setCopiedCode(false);
      setCopiedEmail(false);
    }
  }, [visible]);

  // Retrieve platform list from lib, or fallback
  let allPlatforms = DEFAULT_PLATFORMS;
  try {
    if (typeof getPlatformList === 'function') {
      const list = getPlatformList();
      if (Array.isArray(list) && list.length > 0) {
        allPlatforms = list;
      }
    }
  } catch (e) {
    allPlatforms = DEFAULT_PLATFORMS;
  }

  // Filter out already linked platforms
  const existingSet = new Set(existingPlatforms || []);
  const availablePlatforms = allPlatforms.filter(
    (p) => !existingSet.has(p.id)
  );

  const handleSelectPlatform = (platform) => {
    setSelectedPlatform(platform);
    setUsernameInput('');
    setErrorMsg('');
    setVerificationError('');
    setVerificationSuccess(null);
  };

  const handleBackToList = () => {
    setSelectedPlatform(null);
    setUsernameInput('');
    setErrorMsg('');
    setVerificationError('');
    setVerificationSuccess(null);
  };

  const copyToClipboard = (text, isEmail = false) => {
    if (isEmail) {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
    Alert.alert(
      isEmail ? 'College Email' : 'Verification Code',
      `${text}\n\n(Tip: Long-press or select the code on screen to copy)`
    );
  };

  const parseUsername = () => {
    const raw = usernameInput.trim();
    if (!raw) return '';
    let parsed = raw;
    if (typeof cleanUsername === 'function') {
      parsed = cleanUsername(selectedPlatform.id, raw);
    } else {
      parsed = raw.replace(/^@/, '').replace(/\/+$/, '');
    }
    return parsed;
  };

  // Perform live verification with external platform API
  const handleVerifyAndLink = async () => {
    if (!selectedPlatform) return;
    const parsed = parseUsername();

    if (!parsed) {
      setErrorMsg('Please enter a valid username or profile URL.');
      return;
    }

    setVerifying(true);
    setVerificationError('');
    setErrorMsg('');

    try {
      const result = await verifyPlatformOwnership(
        selectedPlatform.id,
        parsed,
        userEmail,
        verificationToken,
        personalEmailInput.trim()
      );

      if (result.verified) {
        setVerificationSuccess(result);
        setTimeout(() => {
          if (onAdd) {
            onAdd(selectedPlatform.id, parsed, {
              verified: true,
              verifiedEmail: personalEmailInput.trim() || userEmail,
              verifiedAt: new Date().toISOString(),
              method: result.method || 'bio_verification',
            });
          }
          if (onClose) onClose();
        }, 800);
      } else {
        setVerificationError(
          result.reason ||
            `Could not verify ownership of @${parsed}. Make sure your bio contains '${verificationToken}' or your email.`
        );
      }
    } catch (err) {
      setVerificationError(err.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Allow linking without verification (unverified badge)
  const handleLinkUnverified = () => {
    const parsed = parseUsername();
    if (!parsed) {
      setErrorMsg('Please enter a valid username or profile URL.');
      return;
    }

    Alert.alert(
      'Link as Unverified',
      `Add @${parsed} without ownership verification? It will be marked with an "Unverified" warning badge on your profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Link Anyway',
          onPress: () => {
            if (onAdd) {
              onAdd(selectedPlatform.id, parsed, {
                verified: false,
                verifiedEmail: null,
                verifiedAt: null,
                method: 'unverified',
              });
            }
            if (onClose) onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetContainer}
            >
              <View style={styles.sheet}>
                {/* Drag Handle Bar */}
                <View style={styles.handleBar} />

                {/* Header */}
                <View style={styles.headerRow}>
                  {selectedPlatform ? (
                    <TouchableOpacity
                      style={styles.backButton}
                      activeOpacity={0.7}
                      onPress={handleBackToList}
                    >
                      <MaterialCommunityIcons
                        name="arrow-left"
                        size={22}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.titleWrapper}>
                    <Text style={styles.titleText}>
                      {selectedPlatform
                        ? `Link ${selectedPlatform.name}`
                        : 'Link a Platform'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.closeButton}
                    activeOpacity={0.7}
                    onPress={onClose}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={22}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Body Content */}
                <ScrollView
                  contentContainerStyle={styles.scrollBody}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {selectedPlatform ? (
                    /* STEP 2: USERNAME INPUT & VERIFICATION */
                    <View style={styles.formContainer}>
                      {/* Platform Highlight Header */}
                      <View
                        style={[
                          styles.platformBanner,
                          {
                            borderLeftColor:
                              selectedPlatform.color || colors.primary,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.bannerIconWrapper,
                            {
                              backgroundColor: `${
                                selectedPlatform.color || colors.primary
                              }20`,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={selectedPlatform.icon || 'code-braces'}
                            size={28}
                            color={selectedPlatform.color || colors.primary}
                          />
                        </View>
                        <View style={styles.bannerInfo}>
                          <Text style={styles.bannerName}>
                            {selectedPlatform.name}
                          </Text>
                          <Text style={styles.bannerDesc}>
                            {selectedPlatform.description}
                          </Text>
                        </View>
                      </View>

                      {/* Username Input Field */}
                      <Text style={styles.inputLabel}>
                        {selectedPlatform.name} Username or URL
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          errorMsg ? styles.inputWrapperError : null,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="at"
                          size={20}
                          color={colors.textMuted}
                          style={styles.inputAtIcon}
                        />
                        <TextInput
                          style={styles.inputField}
                          value={usernameInput}
                          onChangeText={(text) => {
                            setUsernameInput(text);
                            if (errorMsg) setErrorMsg('');
                            if (verificationError) setVerificationError('');
                          }}
                          placeholder={
                            selectedPlatform.placeholder ||
                            `Enter your ${selectedPlatform.name} username`
                          }
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoFocus
                          returnKeyType="done"
                        />
                        {usernameInput.length > 0 && (
                          <TouchableOpacity
                            onPress={() => {
                              setUsernameInput('');
                              setVerificationError('');
                            }}
                            style={styles.clearInputBtn}
                          >
                            <MaterialCommunityIcons
                              name="close-circle"
                              size={18}
                              color={colors.textMuted}
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Error text if any */}
                      {errorMsg ? (
                        <Text style={styles.errorText}>{errorMsg}</Text>
                      ) : null}

                      {/* OWNERSHIP VERIFICATION CARD */}
                      <View style={styles.verificationCard}>
                        <View style={styles.verificationHeader}>
                          <MaterialCommunityIcons
                            name="shield-check"
                            size={20}
                            color={colors.secondary}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={styles.verificationTitle}>
                            Account Ownership Verification
                          </Text>
                        </View>

                        <Text style={styles.verificationExplainer}>
                          To prevent fake accounts and prove this profile is yours, link it with your verified college identity.
                        </Text>

                        {/* Connected Email Tag */}
                        {userEmail ? (
                          <View style={styles.tokenBox}>
                            <View style={styles.tokenLeft}>
                              <Text style={styles.tokenLabel}>Your College Email</Text>
                              <Text style={styles.tokenValue} numberOfLines={1} selectable={true}>
                                {userEmail}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.copySmallBtn}
                              onPress={() => copyToClipboard(userEmail, true)}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons
                                name={copiedEmail ? 'check' : 'content-copy'}
                                size={16}
                                color={copiedEmail ? colors.success : colors.primary}
                              />
                              <Text
                                style={[
                                  styles.copySmallBtnText,
                                  copiedEmail && { color: colors.success },
                                ]}
                              >
                                {copiedEmail ? 'Copied' : 'Copy'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}

                        {/* Personal Email Optional Input */}
                        <View style={styles.tokenBox}>
                          <View style={styles.tokenLeft}>
                            <Text style={styles.tokenLabel}>Personal Email (Optional)</Text>
                            <TextInput
                              style={styles.personalEmailInput}
                              value={personalEmailInput}
                              onChangeText={setPersonalEmailInput}
                              placeholder="e.g. personal@gmail.com"
                              placeholderTextColor={colors.textMuted}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="email-address"
                            />
                          </View>
                        </View>

                        {/* Verification Code Box */}
                        <View style={styles.tokenBox}>
                          <View style={styles.tokenLeft}>
                            <Text style={styles.tokenLabel}>Verification Code</Text>
                            <Text style={styles.tokenCodeText} selectable={true}>
                              {verificationToken}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.copySmallBtn}
                            onPress={() => copyToClipboard(verificationToken, false)}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons
                              name={copiedCode ? 'check' : 'content-copy'}
                              size={16}
                              color={copiedCode ? colors.success : colors.primary}
                            />
                            <Text
                              style={[
                                styles.copySmallBtnText,
                                copiedCode && { color: colors.success },
                              ]}
                            >
                              {copiedCode ? 'Copied' : 'Copy'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Instructions Steps */}
                        <View style={styles.instructionStepRow}>
                          <Text style={styles.instructionNumber}>1.</Text>
                          <Text style={styles.instructionText}>
                            Add code <Text style={styles.boldWhite}>{verificationToken}</Text> (or your email) to your <Text style={styles.boldWhite}>{selectedPlatform.name}</Text> bio / about (or location).
                          </Text>
                        </View>

                        <View style={styles.instructionStepRow}>
                          <Text style={styles.instructionNumber}>2.</Text>
                          <Text style={styles.instructionText}>
                            Tap <Text style={styles.boldWhite}>Verify & Link Account</Text> below to check ownership.
                          </Text>
                        </View>

                        {/* Verification Success Message */}
                        {verificationSuccess && (
                          <View style={styles.successBox}>
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={20}
                              color={colors.success}
                              style={{ marginRight: 8 }}
                            />
                            <Text style={styles.successText}>
                              {verificationSuccess.message || 'Ownership confirmed! Linking profile...'}
                            </Text>
                          </View>
                        )}

                        {/* Verification Failure Message */}
                        {verificationError ? (
                          <View style={styles.failBox}>
                            <MaterialCommunityIcons
                              name="alert-circle-outline"
                              size={20}
                              color={colors.danger}
                              style={{ marginRight: 8 }}
                            />
                            <Text style={styles.failText}>{verificationError}</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Main Verify & Link Button */}
                      <TouchableOpacity
                        style={[
                          styles.verifySubmitButton,
                          (!usernameInput.trim() || verifying) &&
                            styles.submitButtonDisabled,
                        ]}
                        activeOpacity={0.8}
                        onPress={handleVerifyAndLink}
                        disabled={!usernameInput.trim() || verifying}
                      >
                        {verifying ? (
                          <>
                            <ActivityIndicator
                              size="small"
                              color={colors.white}
                              style={{ marginRight: 8 }}
                            />
                            <Text style={styles.submitButtonText}>
                              Verifying with {selectedPlatform.name}...
                            </Text>
                          </>
                        ) : (
                          <>
                            <MaterialCommunityIcons
                              name="shield-check-outline"
                              size={20}
                              color={colors.white}
                              style={{ marginRight: 8 }}
                            />
                            <Text style={styles.submitButtonText}>
                              Verify & Link Account
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {/* Secondary Link Unverified Option */}
                      <TouchableOpacity
                        style={styles.unverifiedLinkButton}
                        activeOpacity={0.7}
                        onPress={handleLinkUnverified}
                        disabled={!usernameInput.trim() || verifying}
                      >
                        <Text style={styles.unverifiedLinkText}>
                          Skip verification for now (Mark as Unverified)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* STEP 1: SELECT PLATFORM */
                    <View style={styles.listContainer}>
                      {availablePlatforms.length === 0 ? (
                        <View style={styles.emptyPlatformsBox}>
                          <MaterialCommunityIcons
                            name="check-decagram"
                            size={44}
                            color={colors.success}
                            style={{ marginBottom: 12 }}
                          />
                          <Text style={styles.emptyTitle}>
                            All Platforms Linked!
                          </Text>
                          <Text style={styles.emptySubtitle}>
                            You have connected all available coding and gaming platforms.
                          </Text>
                        </View>
                      ) : (
                        availablePlatforms.map((item) => {
                          const iconColor = item.color || colors.primary;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.platformRow}
                              activeOpacity={0.7}
                              onPress={() => handleSelectPlatform(item)}
                            >
                              <View
                                style={[
                                  styles.platformIconBox,
                                  { backgroundColor: `${iconColor}20` },
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name={item.icon || 'code-braces'}
                                  size={24}
                                  color={iconColor}
                                />
                              </View>
                              <View style={styles.platformRowInfo}>
                                <Text style={styles.platformRowName}>
                                  {item.name}
                                </Text>
                                <Text
                                  style={styles.platformRowDesc}
                                  numberOfLines={1}
                                >
                                  {item.description}
                                </Text>
                              </View>
                              <MaterialCommunityIcons
                                name="chevron-right"
                                size={22}
                                color={colors.textMuted}
                              />
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  )}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '92%',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingRight: 10,
  },
  titleWrapper: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  listContainer: {
    paddingBottom: 10,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  platformIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  platformRowInfo: {
    flex: 1,
  },
  platformRowName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  platformRowDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyPlatformsBox: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  formContainer: {
    paddingVertical: 4,
  },
  platformBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  bannerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  bannerDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 50,
  },
  inputWrapperError: {
    borderColor: colors.danger,
  },
  inputAtIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  clearInputBtn: {
    padding: 4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
  verificationCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 16,
    marginBottom: 18,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  verificationExplainer: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  tokenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  tokenLeft: {
    flex: 1,
    marginRight: 8,
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tokenValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  personalEmailInput: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 2,
  },
  tokenCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 1,
  },
  copySmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}18`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copySmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  instructionStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  instructionNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginRight: 6,
    marginTop: 1,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  boldWhite: {
    fontWeight: '700',
    color: colors.text,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}20`,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  successText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  failBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.danger}18`,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  failText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    lineHeight: 16,
    fontWeight: '500',
  },
  verifySubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  unverifiedLinkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  unverifiedLinkText: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});

export default AddPlatformModal;
