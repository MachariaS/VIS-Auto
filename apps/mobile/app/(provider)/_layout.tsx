import React from 'react';
import { Tabs } from 'expo-router';

export default function ProviderLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#1f2937' }, tabBarActiveTintColor: '#10b981', tabBarInactiveTintColor: '#6b7280' }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
      <Tabs.Screen name="services" options={{ title: 'Services' }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings' }} />
    </Tabs>
  );
}
