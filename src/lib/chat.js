import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { GENERAL_CHANNELS, BRANCH_CHANNELS, mockMessages } from '../data/channelsData';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTime(iso) {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${String(h % 12 || 12).padStart(2, '0')}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(iso) {
  if (!iso) return 'Today';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Turns a database row OR mock message into the shape MessageBubble expects
export function toBubble(row, myId) {
  if (!row) return null;

  // Already a bubble or mock message
  if (row.text !== undefined && row.sender !== undefined) {
    return {
      id: String(row.id),
      sender: row.sender,
      avatar: row.avatar,
      text: row.text,
      time: row.timestamp || row.time || 'Just now',
      date: row.date || 'Today',
      isOwn: row.isOwn ?? row.isUser ?? (row.user_id === myId),
    };
  }

  return {
    id: String(row.id),
    sender: row.profiles?.full_name || 'Student',
    avatar: row.profiles?.avatar_url,
    text: row.content || '',
    time: formatTime(row.created_at),
    date: formatDate(row.created_at),
    isOwn: row.user_id === myId,
  };
}

// ---------- Channel and direct messages share the same functions ----------

const THREADS = {
  channel: {
    table: 'messages',
    fk: 'channel_id',
    columns: 'id, content, created_at, user_id, profiles(full_name, avatar_url)',
  },
  dm: {
    table: 'dm_messages',
    fk: 'conversation_id',
    columns: 'id, content, created_at, user_id:sender_id, profiles(full_name, avatar_url)',
  },
};

const getThreadLocalKey = (kind, id) => `@iiit_nr_thread_${kind}_${id}`;

// kind is 'channel' or 'dm'. Returns newest first.
export async function fetchThreadMessages(kind, id) {
  let dbMessages = [];
  try {
    const cfg = THREADS[kind];
    const { data, error } = await supabase
      .from(cfg.table)
      .select(cfg.columns)
      .eq(cfg.fk, id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && Array.isArray(data)) {
      dbMessages = data;
    }
  } catch (e) {
    // Supabase unavailable or table not created
  }

  // Load locally saved messages
  let localMessages = [];
  try {
    const cached = await AsyncStorage.getItem(getThreadLocalKey(kind, id));
    if (cached) {
      localMessages = JSON.parse(cached);
    }
  } catch (e) {}

  // Merge DB + local
  if (dbMessages.length > 0 || localMessages.length > 0) {
    const all = [...localMessages, ...dbMessages];
    // De-duplicate by id
    const seen = new Set();
    return all.filter((m) => {
      const mid = String(m.id);
      if (seen.has(mid)) return false;
      seen.add(mid);
      return true;
    });
  }

  // Fallback to sample mock messages if available
  if (kind === 'channel') {
    const baseId = id.replace(/^(cse|dsai|ece)-/, '');
    const sample = mockMessages[id] || mockMessages[baseId] || mockMessages['general'] || [];
    // Convert to row format with newest first
    return [...sample].reverse().map((m) => ({
      id: m.id,
      content: m.text,
      created_at: new Date().toISOString(),
      user_id: m.isUser ? 'me' : 'other',
      profiles: {
        full_name: m.sender,
        avatar_url: m.avatar,
      },
    }));
  }

  return [];
}

export async function sendThreadMessage(kind, id, content, senderProfile = null) {
  const cfg = THREADS[kind];

  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from(cfg.table)
      .insert({ [cfg.fk]: id, content })
      .select(cfg.columns)
      .single();
    if (!error && data) {
      return data;
    }
  } catch (e) {
    // Supabase insert failed, fallback to local storage
  }

  // 2. Local fallback row
  const localRow = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    content,
    created_at: new Date().toISOString(),
    user_id: 'me',
    profiles: {
      full_name: senderProfile?.name || 'You (Student)',
      avatar_url: senderProfile?.avatar || null,
    },
  };

  try {
    const key = getThreadLocalKey(kind, id);
    const cached = await AsyncStorage.getItem(key);
    const existing = cached ? JSON.parse(cached) : [];
    await AsyncStorage.setItem(key, JSON.stringify([localRow, ...existing]));
  } catch (e) {}

  return localRow;
}

// Calls onInsert(row) for each new message. Returns an unsubscribe function.
export function subscribeToThread(kind, id, onInsert) {
  try {
    const cfg = THREADS[kind];
    const subscription = supabase
      .channel(`${kind}:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: cfg.table,
          filter: `${cfg.fk}=eq.${id}`,
        },
        async (payload) => {
          try {
            const { data } = await supabase
              .from(cfg.table)
              .select(cfg.columns)
              .eq('id', payload.new.id)
              .single();
            if (data) onInsert(data);
          } catch (e) {}
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(subscription);
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}

// ---------- Channels ----------

const buildDefaultFallbackChannels = () => {
  const list = [];

  // General channels
  (GENERAL_CHANNELS || []).forEach((c, idx) => {
    list.push({
      id: c.id,
      name: c.name,
      description: c.description || '',
      category: c.category || 'GENERAL',
      branch: null,
      icon: c.icon || 'pound',
      admin_only_post: false,
      sort_order: idx + 1,
    });
  });

  // Branch channels
  ['CSE', 'DSAI', 'ECE'].forEach((b) => {
    const arr = BRANCH_CHANNELS[b] || [];
    arr.forEach((c, idx) => {
      list.push({
        id: c.id,
        name: c.name,
        description: c.description || '',
        category: 'BRANCH',
        branch: b,
        icon: c.icon || 'pound',
        admin_only_post: false,
        sort_order: 100 + idx,
      });
    });
  });

  return list;
};

export async function fetchChannels() {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('id, name, description, category, branch, icon, admin_only_post, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    // Supabase query error
  }

  // Fallback to built-in campus & branch channels
  return buildDefaultFallbackChannels();
}

export async function createChannel({ name, description, category, branch, createdBy }) {
  try {
    const { data, error } = await supabase
      .from('channels')
      .insert({
        name,
        description: description || null,
        category,
        branch: category === 'GENERAL' ? null : branch,
        created_by: createdBy,
      })
      .select()
      .single();
    if (!error && data) {
      return data;
    }
    if (error?.code === '23505') throw new Error('A channel with this name already exists.');
    if (error) throw error;
  } catch (e) {
    if (e.message && e.message.includes('already exists')) throw e;
  }

  // Local fallback creation
  return {
    id: `local-ch-${Date.now()}`,
    name,
    description: description || null,
    category,
    branch: category === 'GENERAL' ? null : branch,
    created_by: createdBy,
  };
}

// ---------- Direct messages ----------

const MOCK_PEERS = [
  { id: 'peer-aarav', full_name: 'Aarav Sharma', email: 'aarav21100@iiitnr.edu.in', branch: 'CSE' },
  { id: 'peer-sneha', full_name: 'Sneha Reddy', email: 'sneha21101@iiitnr.edu.in', branch: 'DSAI' },
  { id: 'peer-rohan', full_name: 'Rohan Verma', email: 'rohan21102@iiitnr.edu.in', branch: 'ECE' },
  { id: 'peer-priya', full_name: 'Priya Patel', email: 'priya21103@iiitnr.edu.in', branch: 'CSE' },
  { id: 'peer-devansh', full_name: 'Devansh Das', email: 'devansh21104@iiitnr.edu.in', branch: 'DSAI' },
];

export async function fetchConversations(myId) {
  if (!myId) return [];
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, user_a, user_b, created_at')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      const otherIds = data.map((c) => (c.user_a === myId ? c.user_b : c.user_a));
      const { data: people } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', otherIds);

      const byId = {};
      (people || []).forEach((p) => {
        byId[p.id] = p;
      });

      return data.map((c) => {
        const otherId = c.user_a === myId ? c.user_b : c.user_a;
        const p = byId[otherId];
        return {
          id: c.id,
          otherUser: {
            id: otherId,
            name: p?.full_name || 'Student',
            avatar: p?.avatar_url,
          },
        };
      });
    }
  } catch (e) {}

  // Local fallback conversations
  try {
    const cached = await AsyncStorage.getItem(`@iiit_nr_conversations_${myId}`);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  return [];
}

function cleanSearchTerm(query) {
  return (query || '').trim().replace(/[,()%*\\]/g, '');
}

export async function searchStudents(query, myId) {
  try {
    let q = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, branch')
      .neq('id', myId)
      .order('full_name', { ascending: true })
      .limit(30);
    const term = cleanSearchTerm(query);
    if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    const { data, error } = await q;
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (e) {}

  // Fallback to mock students
  const term = (query || '').toLowerCase();
  return MOCK_PEERS.filter(
    (p) =>
      p.id !== myId &&
      (!term || p.full_name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term))
  );
}

export async function getOrCreateDm(otherUserId) {
  try {
    const { data, error } = await supabase.rpc('get_or_create_dm', { other: otherUserId });
    if (!error && data) return data;
  } catch (e) {}

  // Local DM id fallback
  return `dm-${otherUserId}`;
}

// ---------- Admin ----------

export async function listStudents(query, myId) {
  try {
    let q = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, can_create_channels')
      .neq('id', myId)
      .order('full_name', { ascending: true })
      .limit(50);
    const term = cleanSearchTerm(query);
    if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    const { data, error } = await q;
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch (e) {}

  return MOCK_PEERS.filter((p) => p.id !== myId);
}

export async function setChannelCreator(targetId, allowed) {
  try {
    const { error } = await supabase.rpc('set_channel_creator', { target: targetId, allowed });
    if (error) throw error;
  } catch (e) {}
}
