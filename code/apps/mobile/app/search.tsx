import React from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ArrowLeft, Search } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { AppText } from '../src/components/ui/AppText';
import { colors, radius, spacing } from '../src/theme/tokens';

export default function SearchScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <AppText style={styles.headerTitle}>Tìm chuyến đi</AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Placeholder content */}
      <View style={styles.body}>
        <View style={styles.emptyIcon}>
          <Search size={40} color={colors.primary} strokeWidth={1.8} />
        </View>
        <AppText style={styles.emptyTitle}>Trang tìm kiếm</AppText>
        <AppText style={styles.emptyDesc}>
          Tính năng tìm kiếm sẽ được xây dựng ở đây.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backButtonPressed: { backgroundColor: 'rgba(0,0,0,0.06)' },
  headerTitle: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerRight: { width: 44 },
  body: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 80,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyDesc: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
