-- =============================================================================
-- IIIT NR WORKSPACE - SUPABASE DATABASE SCHEMA
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  branch text DEFAULT 'CSE',
  role text DEFAULT 'student',
  can_create_channels boolean DEFAULT false,
  bio text DEFAULT '',
  linked_profiles jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Channels Table
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'GENERAL', -- GENERAL, ACADEMICS, BRANCH
  branch text, -- CSE, DSAI, ECE, or NULL for all branches
  icon text DEFAULT 'pound',
  admin_only_post boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channels are viewable by everyone" 
ON public.channels FOR SELECT USING (true);

CREATE POLICY "Allowed users can insert channels" 
ON public.channels FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin' OR can_create_channels = true
  )
);

-- 3. Messages Table (Channel Messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by everyone" 
ON public.messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" 
ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Direct Messages Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid REFERENCES public.profiles(id) NOT NULL,
  user_b uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT USING (
  auth.uid() = user_a OR auth.uid() = user_b
);

CREATE POLICY "Users can create conversations" 
ON public.conversations FOR INSERT WITH CHECK (
  auth.uid() = user_a OR auth.uid() = user_b
);

-- 5. DM Messages Table
CREATE TABLE IF NOT EXISTS public.dm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" 
ON public.dm_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = dm_messages.conversation_id 
    AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
  )
);

CREATE POLICY "Users can send DM messages" 
ON public.dm_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = dm_messages.conversation_id 
    AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
  )
);

-- 6. RPC: get_or_create_dm
CREATE OR REPLACE FUNCTION public.get_or_create_dm(other uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  me uuid := auth.uid();
  conv_id uuid;
  first_user uuid;
  second_user uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF me < other THEN
    first_user := me;
    second_user := other;
  ELSE
    first_user := other;
    second_user := me;
  END IF;

  SELECT id INTO conv_id
  FROM public.conversations
  WHERE user_a = first_user AND user_b = second_user;

  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (user_a, user_b)
    VALUES (first_user, second_user)
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$$;

-- 7. RPC: set_channel_creator
CREATE OR REPLACE FUNCTION public.set_channel_creator(target uuid, allowed boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can grant channel creation permissions';
  END IF;

  UPDATE public.profiles
  SET can_create_channels = allowed
  WHERE id = target;
END;
$$;

-- 8. Seed Default Channels
INSERT INTO public.channels (name, description, category, branch, sort_order)
VALUES
  ('announcements', 'Official college & batch announcements', 'GENERAL', NULL, 1),
  ('general', 'Casual banter & open college discussion', 'GENERAL', NULL, 2),
  ('coding-club', 'Competitive programming, CP contests & hackathons', 'ACADEMICS', NULL, 3),
  ('internships-placements', 'Placement cell updates & interview experiences', 'ACADEMICS', NULL, 4),
  ('cse-discussions', 'Computer Science & Engineering batch channel', 'BRANCH', 'CSE', 5),
  ('dsai-discussions', 'Data Science & Artificial Intelligence batch channel', 'BRANCH', 'DSAI', 6),
  ('ece-discussions', 'Electronics & Communication Engineering batch channel', 'BRANCH', 'ECE', 7)
ON CONFLICT (name) DO NOTHING;
