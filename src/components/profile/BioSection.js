import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const MAX_BIO_LENGTH = 500;

const BioSection = ({ bio = '', editable = true, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftBio, setDraftBio] = useState(bio || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftBio(bio || '');
  }, [bio]);

  const handleStartEdit = () => {
    setDraftBio(bio || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftBio(bio || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (onSave) {
      try {
        setSaving(true);
        await onSave(draftBio.trim());
      } catch (err) {
        Alert.alert('Save Failed', err.message || 'Could not update bio.');
        return;
      } finally {
        setSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleUrlPress = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot Open URL', url);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  // Helper to render text with tappable hyperlinks
  const renderTextWithLinks = (textChunk, isHighlight = false) => {
    const parts = textChunk.split(URL_REGEX);
    return parts.map((part, index) => {
      if (part.match(/^https?:\/\//i)) {
        return (
          <Text
            key={index}
            style={[styles.linkText, isHighlight && styles.highlightLinkText]}
            onPress={() => handleUrlPress(part)}
          >
            {part}
          </Text>
        );
      }
      return (
        <Text
          key={index}
          style={[styles.bioText, isHighlight && styles.highlightBioText]}
        >
          {part}
        </Text>
      );
    });
  };

  // Helper to render lines with awards/milestone highlights
  const renderFormattedBio = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      const isAchievement =
        trimmed.startsWith('🏆') || trimmed.startsWith('⭐') || trimmed.startsWith('🎯');

      if (isAchievement) {
        return (
          <View key={idx} style={styles.highlightBadgeRow}>
            <View style={styles.highlightAccentDot} />
            <Text style={styles.highlightLineText}>
              {renderTextWithLinks(line, true)}
            </Text>
          </View>
        );
      }

      // Normal line
      return (
        <Text key={idx} style={styles.lineWrapper}>
          {renderTextWithLinks(line, false)}
          {idx < lines.length - 1 ? '\n' : ''}
        </Text>
      );
    });
  };

  const isEmpty = !bio || bio.trim().length === 0;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <MaterialCommunityIcons
            name="card-account-details-outline"
            size={18}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.sectionTitle}>About Me</Text>
        </View>

        {editable && !isEditing && (
          <TouchableOpacity
            style={styles.editIconButton}
            activeOpacity={0.7}
            onPress={handleStartEdit}
          >
            <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Card */}
      <View style={[styles.card, !isEditing && styles.quoteCard]}>
        {isEditing ? (
          /* EDIT MODE */
          <View style={styles.editContainer}>
            <TextInput
              style={styles.textInput}
              value={draftBio}
              onChangeText={setDraftBio}
              placeholder="Write about yourself — awards, achievements, interests..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={MAX_BIO_LENGTH}
              textAlignVertical="top"
              autoFocus
            />

            {/* Character Counter & Action Buttons */}
            <View style={styles.editFooter}>
              <Text
                style={[
                  styles.charCountText,
                  draftBio.length >= MAX_BIO_LENGTH && styles.charCountLimit,
                  draftBio.length > 450 && styles.charCountWarn,
                ]}
              >
                {draftBio.length} / {MAX_BIO_LENGTH}
              </Text>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.7}
                  onPress={handleCancelEdit}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  activeOpacity={0.7}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color={colors.white}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* DISPLAY MODE */
          <TouchableOpacity
            activeOpacity={editable && isEmpty ? 0.7 : 1}
            onPress={editable && isEmpty ? handleStartEdit : undefined}
          >
            {isEmpty ? (
              <View style={styles.emptyBioWrapper}>
                <MaterialCommunityIcons
                  name="text-box-plus-outline"
                  size={20}
                  color={colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.emptyPlaceholderText}>
                  {editable
                    ? 'No bio yet. Tap edit to add one!'
                    : 'No bio provided.'}
                </Text>
              </View>
            ) : (
              <View style={styles.bioTextContainer}>{renderFormattedBio(bio)}</View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  editIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  quoteCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bioTextContainer: {
    flexDirection: 'column',
  },
  lineWrapper: {
    lineHeight: 22,
  },
  bioText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
    lineHeight: 22,
  },
  highlightBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.25)',
  },
  highlightAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 8,
  },
  highlightLineText: {
    flex: 1,
    lineHeight: 22,
  },
  highlightBioText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  highlightLinkText: {
    fontSize: 14,
    color: colors.accent,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  emptyBioWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyPlaceholderText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  editContainer: {
    width: '100%',
  },
  textInput: {
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCountText: {
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
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});

export default BioSection;
