import React from 'react';
import { StyleSheet, View } from 'react-native';

export const GREEN_TAB_COLOR = '#00A86B';

export function GreenTabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      {children}
      {focused ? <View style={styles.indicator} /> : null}
    </View>
  );
}

export const greenTabBarStyles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF', borderTopColor: '#E8ECEA',
    borderTopWidth: StyleSheet.hairlineWidth, elevation: 12, height: 72,
    paddingBottom: 8, paddingHorizontal: 8, paddingTop: 7,
    shadowColor: '#12372A', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 12,
  },
  item: { borderRadius: 18, paddingVertical: 2 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: -0.15, marginTop: 1 },
});

const styles = StyleSheet.create({
  container: { alignItems: 'center', height: 32, justifyContent: 'center', position: 'relative', width: 48 },
  containerFocused: { backgroundColor: '#E8F8F1', borderRadius: 16 },
  indicator: { backgroundColor: GREEN_TAB_COLOR, borderRadius: 2, bottom: -3, height: 3, position: 'absolute', width: 16 },
});
