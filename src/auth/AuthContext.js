import React, { createContext, useContext, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const ALLOWED_DOMAIN = "iiitnr.edu.in";
const AuthContext = createContext(null);

async function fetchGoogleProfile(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Could not fetch Google profile");
  return res.json();
}

function isAllowed(profile) {
  const email = (profile.email || "").toLowerCase();
  return (
    profile.email_verified === true &&
    email.endsWith(`@${ALLOWED_DOMAIN}`) &&
    profile.hd === ALLOWED_DOMAIN
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    extraParams: { hd: ALLOWED_DOMAIN, prompt: "select_account" },
  });

  // Restore the session when the app starts
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sbUser = data?.session?.user;
        const email = (sbUser?.email || "").toLowerCase();

        if (sbUser && email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          const meta = sbUser.user_metadata || {};
          setUser({
            id: sbUser.id,
            email: sbUser.email,
            name: meta.full_name || meta.name || sbUser.email,
            picture: meta.avatar_url || meta.picture,
          });
        } else {
          await SecureStore.deleteItemAsync("user");
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle the response from Google
  useEffect(() => {
    if (response?.type !== "success") return;
    (async () => {
      try {
        const { accessToken, idToken } = response.authentication || {};
        if (!idToken) throw new Error("Google did not return an ID token");

        const profile = await fetchGoogleProfile(accessToken);
        if (!isAllowed(profile)) {
          setError(`Only @${ALLOWED_DOMAIN} accounts are allowed.`);
          return;
        }

        const { data, error: sbError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (sbError) throw sbError;

        setError(null);
        setUser({
          id: data.user.id,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        });
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [response]);

  const signIn = () => {
    setError(null);
    return promptAsync();
  };

  const signInAsDemo = (branch = 'CSE') => {
    setError(null);
    setUser({
      id: 'demo-iiitnr-student',
      email: `student.${branch.toLowerCase()}@iiitnr.edu.in`,
      name: 'IIIT NR Student',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      branch,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signIn, signInAsDemo, signOut, ready: !!request }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);