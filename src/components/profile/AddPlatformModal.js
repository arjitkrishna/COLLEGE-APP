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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { getPlatformList, cleanUsername } from '../../lib/platforms';

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
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset local state when modal opens or closes
  useEffect(() => {
    if (visible) {
      setSelectedPlatform(null);
      setUsernameInput('');
      setErrorMsg('');
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
  };

  const handleBackToList = () => {
    setSelectedPlatform(null);
    setUsernameInput('');
    setErrorMsg('');
  };

  const handleSubmit = () => {
    if (!selectedPlatform) return;

    const raw = usernameInput.trim();
    if (!raw) {
      setErrorMsg('Please enter a username or profile URL');
      return;
    }

    let parsed = raw;
    if (typeof cleanUsername === 'function') {
      parsed = cleanUsername(selectedPlatform.id, raw);
    } else {
      parsed = raw.replace(/^@/, '').replace(/\/+$/, '');
    }

    if (!parsed) {
      setErrorMsg('Invalid username. Please enter a valid handle.');
      return;
    }

    if (onAdd) {
      onAdd(selectedPlatform.id, parsed);
    }

    if (onClose) {
      onClose();
    }
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
                    /* STEP 2: USERNAME INPUT */
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
                          onSubmitEditing={handleSubmit}
                        />
                        {usernameInput.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setUsernameInput('')}
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

                      {/* Hint */}
                      <View style={styles.hintContainer}>
                        <MaterialCommunityIcons
                          name="information-outline"
                          size={15}
                          color={colors.textMuted}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.hintText}>
                          You can paste a profile URL or just the username
                        </Text>
                      </View>

                      {/* Submit Button */}
                      <TouchableOpacity
                        style={[
                          styles.submitButton,
                          !usernameInput.trim() && styles.submitButtonDisabled,
                        ]}
                        activeOpacity={0.8}
                        onPress={handleSubmit}
                        disabled={!usernameInput.trim()}
                      >
                        <MaterialCommunityIcons
                          name="link-variant-plus"
                          size={18}
                          color={colors.white}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.submitButtonText}>Link Account</Text>
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
                            You have connected all available coding and gaming
                            platforms.
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
    maxHeight: '85%',
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
    paddingBottom: 10,
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
    marginBottom: 18,
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
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  submitButton: {
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
});

export default AddPlatformModal;
