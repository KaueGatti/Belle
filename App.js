import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

import { DataProvider, useData } from './src/context/DataContext';
import { AuthProvider } from './src/context/AuthContext';
import { SyncProvider } from './src/context/SyncContext';
import { ToastProvider } from './src/components/Toast';
import NotificationSync from './src/components/NotificationSync';
import Logo from './src/components/Logo';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

function Root() {
  const { loading } = useData();

  if (loading) {
    return (
      <View style={styles.loading}>
        <Logo size={88} showName />
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
      NavigationBar.setBehaviorAsync('inset-swipe').catch(() => {});
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DataProvider>
          <AuthProvider>
            <SyncProvider>
              <NotificationSync />
              <ToastProvider>
                <StatusBar style="dark" />
                <Root />
              </ToastProvider>
            </SyncProvider>
          </AuthProvider>
        </DataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
