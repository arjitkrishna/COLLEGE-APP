import { supabase } from './supabase';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${String(h % 12 || 12).padStart(2, '0')}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Turns a database row into the shape MessageBubble expects
export function toBubble(row, myId) {
  return {
    id: String(row.id),
    sender: row.profiles?.full_name || 'Student',
    avatar: row.profiles?.avatar_url,
    text: row.content,
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

// kind is 'channel' or 'dm'. Returns newest first.
export async function fetchThreadMessages(kind, id) {
  const cfg = THREADS[kind];
  const { data, error } = await supabase
    .from(cfg.table)
    .select(cfg.columns)
    .eq(cfg.fk, id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function sendThreadMessage(kind, id, content) {
  const cfg = THREADS[kind];
  const { data, error } = await supabase
    .from(cfg.table)
    .insert({ [cfg.fk]: id, content })
    .select(cfg.columns)
    .single();
  if (error) throw error;
  return data;
}

// Calls onInsert(row) for each new message. Returns an unsubscribe function.
export function subscribeToThread(kind, id, onInsert) {
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
        const { data } = await supabase
          .from(cfg.table)
          .select(cfg.columns)
          .eq('id', payload.new.id)
          .single();
        if (data) onInsert(data);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

// ---------- Channels ----------

export async function fetchChannels() {
  const { data, error } = await supabase
    .from('channels')
    .select('id, name, description, category, branch, icon, admin_only_post, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createChannel({ name, description, category, branch, createdBy }) {
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
  if (error) {
    if (error.code === '23505') throw new Error('A channel with this name already exists.');
    throw error;
  }
  return data;
}

// ---------- Direct messages ----------

export async function fetchConversations(myId) {
  if (!myId) return [];
  const { data, error } = await supabase
    .from('conversations')
    .select('id, user_a, user_b, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return [];

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

function cleanSearchTerm(query) {
  return (query || '').trim().replace(/[,()%*\\]/g, '');
}

export async function searchStudents(query, myId) {
  let q = supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, branch')
    .neq('id', myId)
    .order('full_name', { ascending: true })
    .limit(30);
  const term = cleanSearchTerm(query);
  if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getOrCreateDm(otherUserId) {
  const { data, error } = await supabase.rpc('get_or_create_dm', { other: otherUserId });
  if (error) throw error;
  return data;
}

// ---------- Admin ----------

export async function listStudents(query, myId) {
  let q = supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role, can_create_channels')
    .neq('id', myId)
    .order('full_name', { ascending: true })
    .limit(50);
  const term = cleanSearchTerm(query);
  if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function setChannelCreator(targetId, allowed) {
  const { error } = await supabase.rpc('set_channel_creator', { target: targetId, allowed });
  if (error) throw error;
}