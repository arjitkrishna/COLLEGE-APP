/**
 * useProfile.js
 * 
 * Manages student profile data (bio, branch, linked competitive & gaming platforms).
 * Features dual-layer storage:
 * 1. AsyncStorage for instant offline/local persistence
 * 2. Supabase backend synchronization with graceful fallback
 * 
 * Supabase migration SQL (run this in Supabase SQL Editor for multi-device sync):
 * 
 * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
 * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linked_profiles jsonb DEFAULT '{}';
 * 
 * CREATE POLICY IF NOT EXISTS "Users can update own profile" 
 * ON profiles FOR UPDATE USING (auth.uid() = id);
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

const getCacheKey = (id) => `@iiit_nr_profile_cache_${id || 'me'}`;

export default function useProfile(targetUserId = null) {
  const { user } = useAuth();
  const profileId = targetUserId || user?.id;
  const isOwnProfile = !targetUserId || targetUserId === user?.id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Save profile to local storage cache
  const saveToLocal = useCallback(
    async (data) => {
      if (!profileId || !data) return;
      try {
        await AsyncStorage.setItem(getCacheKey(profileId), JSON.stringify(data));
      } catch (e) {
        console.warn('Could not cache profile locally:', e);
      }
    },
    [profileId]
  );

  // Load from local storage and then sync with Supabase
  const refresh = useCallback(async () => {
    if (!profileId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // 1. Load from AsyncStorage first for immediate display
    let localData = null;
    try {
      const cached = await AsyncStorage.getItem(getCacheKey(profileId));
      if (cached) {
        localData = JSON.parse(cached);
        setProfile(localData);
      }
    } catch (e) {
      // Ignore cache read error
    }

    // 2. Fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (!error && data) {
        // Merge Supabase data with local data (preserving locally added platforms if Supabase hasn't synced)
        const merged = {
          ...localData,
          ...data,
          linked_profiles: {
            ...(localData?.linked_profiles || {}),
            ...(data.linked_profiles || {}),
          },
          bio: data.bio !== undefined && data.bio !== null && data.bio !== '' ? data.bio : (localData?.bio || ''),
        };
        setProfile(merged);
        await saveToLocal(merged);
      } else if (!data && isOwnProfile && user?.id) {
        // Create initial profile row if missing
        const initial = {
          id: user.id,
          full_name: user.name || 'IIIT NR Student',
          email: user.email || '',
          avatar_url: user.picture || null,
          branch: localData?.branch || 'CSE',
          bio: localData?.bio || '',
          linked_profiles: localData?.linked_profiles || {},
        };
        setProfile(initial);
        await saveToLocal(initial);

        try {
          await supabase.from('profiles').upsert(
            {
              id: user.id,
              full_name: initial.full_name,
              email: initial.email,
              avatar_url: initial.avatar_url,
              branch: initial.branch,
            },
            { onConflict: 'id' }
          );
        } catch (ignored) {}
      }
    } catch (e) {
      console.warn('Supabase fetch profile warning:', e.message);
    } finally {
      setLoading(false);
    }
  }, [profileId, isOwnProfile, user, saveToLocal]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateBranch = async (branch) => {
    const updated = { ...(profile || {}), id: user?.id || profileId, branch };
    setProfile(updated);
    await saveToLocal(updated);

    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, branch }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase updateBranch warning:', err.message);
      }
    }
  };

  const updateBio = async (bio) => {
    const updated = { ...(profile || {}), id: user?.id || profileId, bio };
    setProfile(updated);
    await saveToLocal(updated);

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, bio }, { onConflict: 'id' });
        if (error) {
          console.warn('Supabase updateBio warning:', error.message);
        }
      } catch (err) {
        console.warn('Supabase updateBio sync failed:', err.message);
      }
    }
  };

  const updateLinkedProfiles = async (linkedProfiles) => {
    const updated = {
      ...(profile || {}),
      id: user?.id || profileId,
      linked_profiles: linkedProfiles,
    };
    setProfile(updated);
    await saveToLocal(updated);

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, linked_profiles: linkedProfiles }, { onConflict: 'id' });
        if (error) {
          console.warn('Supabase updateLinkedProfiles warning:', error.message);
        }
      } catch (err) {
        console.warn('Supabase updateLinkedProfiles sync failed:', err.message);
      }
    }
  };

  const addPlatform = async (platformId, usernameOrObj, verificationMeta = {}) => {
    const current = profile?.linked_profiles || {};
    let entry;
    if (typeof usernameOrObj === 'object' && usernameOrObj !== null) {
      entry = usernameOrObj;
    } else {
      entry = {
        username: usernameOrObj,
        verified: Boolean(verificationMeta.verified),
        verifiedEmail: verificationMeta.verifiedEmail || user?.email || '',
        verifiedAt: verificationMeta.verifiedAt || (verificationMeta.verified ? new Date().toISOString() : null),
        method: verificationMeta.method || 'manual',
      };
    }
    const updated = { ...current, [platformId]: entry };
    await updateLinkedProfiles(updated);
  };

  const verifyPlatform = async (platformId, verificationResult = {}) => {
    const current = profile?.linked_profiles || {};
    const existing = current[platformId];
    if (!existing) return;
    const username = typeof existing === 'object' ? existing.username : existing;
    const updatedEntry = {
      username,
      verified: true,
      verifiedEmail: verificationResult.verifiedEmail || user?.email || '',
      verifiedAt: new Date().toISOString(),
      method: verificationResult.method || 'bio_verification',
    };
    const updated = { ...current, [platformId]: updatedEntry };
    await updateLinkedProfiles(updated);
  };

  const removePlatform = async (platformId) => {
    const current = profile?.linked_profiles || {};
    const updated = { ...current };
    delete updated[platformId];
    await updateLinkedProfiles(updated);
  };

  return {
    profile,
    loading,
    refresh,
    isOwnProfile,
    updateBranch,
    updateBio,
    updateLinkedProfiles,
    addPlatform,
    verifyPlatform,
    removePlatform,
  };
}
