import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../auth/AuthContext';
import useProfile from '../../hooks/useProfile';
import { listStudents, setChannelCreator } from '../../lib/chat';
import UserAvatar from '../../components/UserAvatar';
import colors from '../../theme/colors';

const ManageCreatorsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const rows = await listStudents(query, user?.id);
        if (active) setStudents(rows);
      } catch (e) {
        if (active) Alert.alert('Could not load students', e.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, user?.id, isAdmin]);

  const toggle = async (student, value) => {
    const update = (v) =>
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, can_create_channels: v } : s))
      );
    update(value);
    try {
      await setChannelCreator(student.id, value);
    } catch (e) {
      update(!value);
      Alert.alert('Could not update', e.message);
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
        <Text style={styles.title}>Who can create channels</Text>
      </View>

      {profileLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : !isAdmin ? (
        <Text style={styles.empty}>Only admins can manage this.</Text>
      ) : (
        <>
          <Text style={styles.intro}>
            Students you switch on can create channels. Admins can always create channels.
          </Text>

          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <UserAvatar name={item.full_name || item.email} uri={item.avatar_url} size={42} />
                  <View style={styles.rowText}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.full_name || item.email}
                    </Text>
                    <Text style={styles.email} numberOfLines={1}>
                      {item.email}
                    </Text>
                  </View>
                  {item.role === 'admin' ? (
                    <Text style={styles.adminTag}>ADMIN</Text>
                  ) : (
                    <Switch
                      value={Boolean(item.can_create_channels)}
                      onValueChange={(v) => toggle(item, v)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.white}
                    />
                  )}
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  No students found. Students appear here after they sign in once.
                </Text>
              }
            />
          )}
        </>
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
  intro: {
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 14,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 14,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowText: { flex: 1, marginLeft: 12, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  adminTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 50,
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});

export default ManageCreatorsScreen;