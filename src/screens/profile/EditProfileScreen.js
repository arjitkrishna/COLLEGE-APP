import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import useProfile from '../../hooks/useProfile';
import { useAuth } from '../../auth/AuthContext';
import { useApp } from '../../context/AppContext';
import UserAvatar from '../../components/UserAvatar';
import BranchBadge from '../../components/BranchBadge';
import { AddPlatformModal } from '../../components/profile';
import { PLATFORMS, getPlatformById } from '../../lib/platforms';

const MAX_BIO_LENGTH = 500;

const EditProfileScreen = ({ navigation }) => {
  const { user: authUser } = useAuth();
  const { user: appUser, currentBranch } = useApp();
  const { profile, loading: profileLoading, updateBio, updateLinkedProfiles } = useProfile();

  const [draftBio, setDraftBio] = useState('');
  const [linkedProfiles, setLinkedProfiles] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state once profile loads
  useEffect(() => {
    if (profile) {
      setDraftBio(profile.bio || '');
      setLinkedProfiles(profile.linked_profiles || {});
    }
  }, [profile]);

  const userName = authUser?.name || appUser?.name || 'IIIT NR Student';
  const userEmail = authUser?.email || appUser?.email || '';
  const userAvatar = authUser?.picture || appUser?.avatar;
  const branch = profile?.branch || authUser?.branch || currentBranch || 'CSE';

  const handleAddPlatform = (platformId, username, verificationMeta) => {
    setLinkedProfiles((prev) => ({
      ...prev,
      [platformId]: {
        username,
        verified: Boolean(verificationMeta?.verified),
        verifiedEmail: verificationMeta?.verifiedEmail || userEmail,
        verifiedAt: verificationMeta?.verifiedAt || (verificationMeta?.verified ? new Date().toISOString() : null),
        method: verificationMeta?.method || 'manual',
      },
    }));
  };

  const handleRemovePlatform = (platformId) => {
    const meta = getPlatformById(platformId);
    const raw = linkedProfiles[platformId];
    const username = typeof raw === 'object' ? raw?.username : raw;
    Alert.alert(
      'Remove Platform',
      `Unlink ${meta?.name || platformId} account (@${username})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setLinkedProfiles((prev) => {
              const updated = { ...prev };
              delete updated[platformId];
              return updated;
            });
          },
        },
      ]
    );
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await updateBio(draftBio.trim());
      await updateLinkedProfiles(linkedProfiles);
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const linkedKeys = Object.keys(linkedProfiles || {});

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <TouchableOpacity
          style={[styles.headerSaveButton, saving && { opacity: 0.6 }]}
          onPress={handleSaveAll}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.headerSaveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Mini Banner */}
          <View style={styles.userBannerCard}>
            <UserAvatar name={userName} uri={userAvatar} size={64} />
            <View style={styles.userBannerInfo}>
              <Text style={styles.userBannerName} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={styles.userBannerEmail} numberOfLines={1}>
                {userEmail}
              </Text>
              <View style={styles.badgeRow}>
                <BranchBadge branch={branch} size="small" />
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <MaterialCommunityIcons
                  name="text-account"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>About Me / Bio</Text>
              </View>
              <Text
                style={[
                  styles.charCount,
                  draftBio.length >= MAX_BIO_LENGTH && styles.charCountLimit,
                  draftBio.length > 450 && styles.charCountWarn,
                ]}
              >
                {draftBio.length} / {MAX_BIO_LENGTH}
              </Text>
            </View>

            <Text style={styles.sectionSubtitle}>
              Share your competitive programming achievements, awards, tech interests, or personal projects.
            </Text>

            <View style={styles.bioInputContainer}>
              <TextInput
                style={styles.bioInput}
                value={draftBio}
                onChangeText={setDraftBio}
                placeholder="e.g. 🏆 Knight on LeetCode | 🎯 Specialist on Codeforces | Interested in Distributed Systems & AI"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                maxLength={MAX_BIO_LENGTH}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Linked Platforms Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <MaterialCommunityIcons
                  name="link-variant"
                  size={20}
                  color={colors.secondary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Linked Platforms</Text>
              </View>
              <Text style={styles.platformCountText}>
                {linkedKeys.length} connected
              </Text>
            </View>

            <Text style={styles.sectionSubtitle}>
              Connect your handles to showcase your competitive ratings, problem counts, and chess ELO on your profile.
            </Text>

            {linkedKeys.length === 0 ? (
              <View style={styles.emptyPlatformsCard}>
                <MaterialCommunityIcons
                  name="link-variant-off"
                  size={36}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyPlatformsText}>
                  No platforms connected yet.
                </Text>
                <Text style={styles.emptyPlatformsSub}>
                  Link LeetCode, Codeforces, CodeChef, Chess.com, or GitHub to showcase your stats.
                </Text>
              </View>
            ) : (
              <View style={styles.platformList}>
                {linkedKeys.map((platId) => {
                  const platMeta = getPlatformById(platId) || PLATFORMS[platId] || {
                    name: platId,
                    color: colors.primary,
                    icon: 'code-tags',
                  };
                  const rawEntry = linkedProfiles[platId];
                  const username = typeof rawEntry === 'object' ? rawEntry?.username : rawEntry;
                  const isVerified = typeof rawEntry === 'object' ? Boolean(rawEntry?.verified) : false;

                  return (
                    <View key={platId} style={styles.platformRowItem}>
                      <View
                        style={[
                          styles.platformIconCircle,
                          { backgroundColor: `${platMeta.color}20` },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={platMeta.icon || 'code-tags'}
                          size={22}
                          color={platMeta.color || colors.primary}
                        />
                      </View>

                      <View style={styles.platformDetails}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.platformName}>{platMeta.name}</Text>
                          {isVerified ? (
                            <View style={styles.verifiedTag}>
                              <MaterialCommunityIcons name="shield-check" size={12} color={colors.success} />
                              <Text style={styles.verifiedTagText}>Verified</Text>
                            </View>
                          ) : (
                            <View style={styles.unverifiedTag}>
                              <MaterialCommunityIcons name="alert-circle-outline" size={11} color={colors.warning} />
                              <Text style={styles.unverifiedTagText}>Unverified</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.platformHandle} numberOfLines={1}>
                          @{username}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.removePlatformButton}
                        onPress={() => handleRemovePlatform(platId)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={20}
                          color={colors.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Add Platform Button */}
            <TouchableOpacity
              style={styles.addPlatformButton}
              activeOpacity={0.8}
              onPress={() => setShowAddModal(true)}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
              <Text style={styles.addPlatformButtonText}>Add Platform</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Save Changes Button */}
          <TouchableOpacity
            style={[styles.saveAllButton, saving && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSaveAll}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color={colors.white}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.saveAllButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal for adding a platform */}
      <AddPlatformModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        existingPlatforms={linkedKeys}
        userEmail={userEmail}
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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSaveButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${colors.primary}20`,
  },
  headerSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  userBannerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userBannerName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  userBannerEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  charCountWarn: {
    color: colors.warning,
  },
  charCountLimit: {
    color: colors.danger,
    fontWeight: '700',
  },
  bioInputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  bioInput: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 110,
  },
  platformCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyPlatformsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyPlatformsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 4,
  },
  emptyPlatformsSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  platformList: {
    marginBottom: 12,
  },
  platformRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  platformIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  platformDetails: {
    flex: 1,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  platformHandle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  removePlatformButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: `${colors.danger}15`,
  },
  addPlatformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: `${colors.primary}10`,
  },
  addPlatformButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
  saveAllButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveAllButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}18`,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 3,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  unverifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}18`,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 3,
  },
  unverifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
});

export default EditProfileScreen;
