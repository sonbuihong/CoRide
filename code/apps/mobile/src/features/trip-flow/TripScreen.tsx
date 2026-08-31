import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { ArrowLeft, MoreHorizontal } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/ui/AppText';
import { colors, radius, spacing } from '../../theme/tokens';

export function TripScreen({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.canvas}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.viewport}>{children}</SafeAreaView>
    </View>
  );
}

export function TripScreenHeader({
  title,
  onBack,
  onMore,
}: {
  title: string;
  onBack: () => void;
  onMore?: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onBack} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
        <ArrowLeft size={22} color={colors.textPrimary} />
      </Pressable>
      <AppText variant="title" weight="bold" numberOfLines={1} style={styles.headerTitle}>{title}</AppText>
      {onMore ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Tùy chọn khác" onPress={onMore} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
          <MoreHorizontal size={22} color={colors.textPrimary} />
        </Pressable>
      ) : <View style={styles.headerButton} />}
    </View>
  );
}

export function TripScrollView(props: ScrollViewProps) {
  return (
    <ScrollView
      {...props}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollContent, props.contentContainerStyle]}
    />
  );
}

export const tripScreenStyles = StyleSheet.create({
  section: { backgroundColor: colors.surface, borderRadius: radius.card, marginBottom: spacing.md, padding: spacing.lg },
  sectionTitle: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, marginBottom: 2 },
  divider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  rowCopy: { flex: 1, marginLeft: spacing.md },
});

const styles = StyleSheet.create({
  canvas: { alignItems: 'center', backgroundColor: colors.driverSurface, flex: 1 },
  viewport: { backgroundColor: colors.background, flex: 1, maxWidth: 480, width: '100%' },
  header: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 56, paddingHorizontal: spacing.sm },
  headerButton: { alignItems: 'center', borderRadius: radius.full, height: 48, justifyContent: 'center', width: 48 },
  headerTitle: { flex: 1, textAlign: 'center' },
  scrollContent: { padding: spacing.screen, paddingBottom: spacing['2xl'] },
  pressed: { backgroundColor: colors.surfaceSecondary, opacity: 0.75 },
});
