import React, { createContext, useContext, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";

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
    scopes: ["profile", "email"],
    extraParams: { hd: ALLOWED_DOMAIN, prompt: "select_account" }, // UI hint only
  });

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync("user");
        if (stored) setUser(JSON.parse(stored));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle Google response
  useEffect(() => {
    if (response?.type !== "success") return;
    (async () => {
      try {
        const token = response.authentication.accessToken;
        const profile = await fetchGoogleProfile(token);

        if (!isAllowed(profile)) {
          setError(`Only @${ALLOWED_DOMAIN} accounts are allowed.`);
          return;
        }

        const u = {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          accessToken: token,
        };
        await SecureStore.setItemAsync("user", JSON.stringify(u));
        setError(null);
        setUser(u);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [response]);

  const signIn = () => {
    setError(null);
    return promptAsync();
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut, ready: !!request }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);