import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../auth/AuthContext';
import { searchStudents, getOrCreateDm } from '../../lib/chat';
import UserAvatar from '../../components/UserAvatar';
import colors from '../../theme/colors';

const NewMessageScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const rows = await searchStudents(query, user?.id);
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
  }, [query, user?.id]);

  const openChat = async (student) => {
    if (opening) return;
    setOpening(true);
    try {
      const conversationId = await getOrCreateDm(student.id);
      navigation.replace('Chat', {
        dm: {
          conversationId,
          otherUser: {
            id: student.id,
            name: student.full_name || student.email,
            avatar: student.avatar_url,
          },
        },
      });
    } catch (e) {
      Alert.alert('Could not open chat', e.message);
      setOpening(false);
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
        <Text style={styles.title}>New message</Text>
      </View>

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
            <TouchableOpacity style={styles.row} onPress={() => openChat(item)} activeOpacity={0.7}>
              <UserAvatar name={item.full_name || item.email} uri={item.avatar_url} size={42} />
              <View style={styles.rowText}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.full_name || item.email}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
              {item.branch ? <Text style={styles.branch}>{item.branch}</Text> : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No students found. Students appear here after they sign in to the app once.
            </Text>
          }
        />
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
  rowText: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  branch: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 40,
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});

export default NewMessageScreen;