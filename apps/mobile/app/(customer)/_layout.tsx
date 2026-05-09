import React from 'react';
import { Tabs } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#1f2937' }, tabBarActiveTintColor: '#10b981', tabBarInactiveTintColor: '#6b7280' }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="request" options={{ title: 'Request' }} />
      <Tabs.Screen name="track" options={{ title: 'Track' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="vehicles" options={{ title: 'Vehicles' }} />
    </Tabs>
  );
}
