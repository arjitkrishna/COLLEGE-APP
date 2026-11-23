import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
    async function prepare() {
      try {
        if (MaterialCommunityIcons?.font) {
          await Font.loadAsync(MaterialCommunityIcons.font);
        }
      } catch (e) {
        console.warn('Icon font load notice:', e?.message || e);
      } finally {
        setFontsReady(true);
      }
    }
    prepare();
  }, []);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

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