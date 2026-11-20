import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/auth/AuthContext';
import AuthBridge from './src/auth/AuthBridge';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    Font.loadAsync(MaterialCommunityIcons.font)
      .catch((e) => console.warn('Icon font failed to load:', e?.message || e))
      .finally(() => setFontsReady(true));
  }, []);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <AuthBridge />
          <StatusBar style="light" />
          <AppNavigator />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}