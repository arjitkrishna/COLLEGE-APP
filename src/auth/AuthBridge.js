import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from '../context/AppContext';

export default function AuthBridge() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { state, login, logout } = useApp();
  const synced = useRef(false);

  useEffect(() => {
    if (authLoading || state.isLoading) return;

    const googleProfile = user && {
      name: user.name,
      email: user.email,
      avatar: user.picture,
    };

    // Signed in with Google, app not yet logged in (or was logged out inside the app)
    if (user && !state.isAuthenticated) {
      if (synced.current) {
        synced.current = false;
        signOut(); // user pressed Logout inside the app
      } else {
        login(googleProfile);
      }
      return;
    }

    // Both signed in
    if (user && state.isAuthenticated) {
      synced.current = true;
      if (state.user?.email !== user.email) login(googleProfile);
      return;
    }

    // Google signed out but app still thinks logged in
    if (!user && state.isAuthenticated) {
      synced.current = false;
      logout();
    }
  }, [user, authLoading, state.isLoading, state.isAuthenticated, state.user?.email]);

  return null;
}