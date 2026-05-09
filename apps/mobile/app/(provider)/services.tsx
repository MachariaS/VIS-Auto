import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ServicesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service Catalog</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});
