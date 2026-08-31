import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft, LocateFixed, MoreHorizontal } from 'lucide-react-native';

import { AppText } from '../../components/ui/AppText';
import { colors, radius, spacing } from '../../theme/tokens';

interface TripFloatingControlsProps {
  topInset: number;
  connected: boolean;
  showRecenter: boolean;
  recenterBottom: number;
  onBack: () => void;
  onMenu: () => void;
  onRecenter: () => void;
}

export const TripFloatingControls = memo(function TripFloatingControls({
  topInset,
  connected,
  showRecenter,
  recenterBottom,
  onBack,
  onMenu,
  onRecenter,
}: TripFloatingControlsProps) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [styles.circleButton, styles.back, { top: topInset + spacing.sm }, pressed && styles.pressed]}
      >
        <ArrowLeft size={21} color={colors.textPrimary} strokeWidth={2.4} />
      </Pressable>

      <View style={[styles.statusGroup, { top: topInset + spacing.sm }]}>
        <View style={styles.connectionPill} accessibilityRole="text">
          <View style={[styles.connectionDot, !connected && styles.connectionDotOffline]} />
          <AppText variant="caption" weight="bold">{connected ? 'Kết nối' : 'Đang nối lại'}</AppText>
        </View>
        <View style={styles.rolePill}><AppText variant="caption" weight="bold" style={styles.roleText}>Tài xế</AppText></View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở hỗ trợ chuyến đi"
          onPress={onMenu}
          style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
        >
          <MoreHorizontal size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {showRecenter ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Định vị lại vị trí tài xế"
          onPress={onRecenter}
          style={({ pressed }) => [styles.circleButton, styles.recenter, { bottom: recenterBottom }, pressed && styles.pressed]}
        >
          <LocateFixed size={22} color={colors.info} strokeWidth={2.3} />
        </Pressable>
      ) : null}
    </>
  );
});

const floatingShadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.14,
  shadowRadius: 10,
  elevation: 5,
} as const;

const styles = StyleSheet.create({
  circleButton: { ...floatingShadow, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, height: 48, justifyContent: 'center', position: 'absolute', width: 48, zIndex: 30 },
  back: { left: spacing.lg },
  recenter: { right: spacing.lg },
  statusGroup: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, position: 'absolute', right: spacing.md, zIndex: 30 },
  connectionPill: { ...floatingShadow, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, flexDirection: 'row', gap: 6, minHeight: 38, paddingHorizontal: spacing.md },
  connectionDot: { backgroundColor: colors.success, borderRadius: radius.full, height: 8, width: 8 },
  connectionDotOffline: { backgroundColor: colors.warning },
  rolePill: { backgroundColor: colors.driverAccent, borderRadius: radius.full, justifyContent: 'center', minHeight: 38, paddingHorizontal: spacing.md },
  roleText: { color: colors.surface },
  moreButton: { ...floatingShadow, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, height: 44, justifyContent: 'center', width: 44 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
