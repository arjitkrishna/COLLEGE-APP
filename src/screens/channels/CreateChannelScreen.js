import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../auth/AuthContext';
import useProfile from '../../hooks/useProfile';
import { createChannel } from '../../lib/chat';
import colors from '../../theme/colors';

const CATEGORIES = [
  { key: 'GENERAL', label: 'General (everyone)' },
  { key: 'ACADEMICS', label: 'Academics' },
  { key: 'BRANCH', label: 'Branch discussion' },
];
const ALL_BRANCHES = ['CSE', 'DSAI', 'ECE'];

const cleanName = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);

const Chip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const CreateChannelScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [branchChoice, setBranchChoice] = useState(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const canManage = isAdmin || Boolean(profile?.can_create_channels);
  const branchOptions = isAdmin ? ALL_BRANCHES : [profile?.branch].filter(Boolean);
  const chosenBranch = branchChoice || profile?.branch || 'CSE';

  const handleCreate = async () => {
    const cleaned = cleanName(name);
    if (cleaned.length < 2) {
      Alert.alert('Name too short', 'Use at least 2 letters or numbers.');
      return;
    }
    setSaving(true);
    try {
      await createChannel({
        name: cleaned,
        description: description.trim(),
        category,
        branch: chosenBranch,
        createdBy: user.id,
      });
      Alert.alert('Channel created', `#${cleaned} is ready.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Could not create channel', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create channel</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : !canManage ? (
        <Text style={styles.blocked}>
          You don't have permission to create channels. Ask an admin to allow you.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Channel name</Text>
          <View style={styles.inputRow}>
            <Text style={styles.hash}>#</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. coding-club"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={40}
            />
          </View>
          <Text style={styles.hint}>
            Saved as: #{cleanName(name) || 'channel-name'} (lowercase, no spaces)
          </Text>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.inputBox, styles.multiline]}
            placeholder="What is this channel for?"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={120}
          />

          <Text style={styles.label}>Section</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                selected={category === c.key}
                onPress={() => setCategory(c.key)}
              />
            ))}
          </View>

          {category !== 'GENERAL' && (
            <>
              <Text style={styles.label}>Branch</Text>
              <View style={styles.chipRow}>
                {branchOptions.map((b) => (
                  <Chip
                    key={b}
                    label={b}
                    selected={chosenBranch === b}
                    onPress={() => setBranchChoice(b)}
                  />
                ))}
              </View>
              {!isAdmin && (
                <Text style={styles.hint}>You can only create channels for your own branch.</Text>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.createButton, saving && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.createText}>Create channel</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: { marginRight: 12, padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  form: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  hash: { color: colors.textMuted, fontSize: 18, marginRight: 6 },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 },
  inputBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: colors.white },
  createButton: {
    marginTop: 28,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  blocked: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 60,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});

export default CreateChannelScreen;