import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeftRight, Car, User } from 'lucide-react-native';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../hooks/useAuth';
import * as SecureStore from '../../services/secure-store';
import { useAppStore } from '../../stores/useAppStore';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { getDriverEligibility } from '../../utils/mode-checker';
import { AppText } from '../ui/AppText';

interface MobileAppHeaderProps {
  mode: 'passenger' | 'driver';
}

export function MobileAppHeader({ mode }: MobileAppHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { setAppMode } = useAppStore();
  const { width } = useWindowDimensions();
  const [isSwitching, setIsSwitching] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const isDriver = mode === 'driver';
  const foreground = isDriver ? colors.surface : colors.textPrimary;
  const avatarUri = user?.avatarUrl || user?.avatar;
  const compact = width < 340;
  const nextModeLabel = isDriver ? 'Hành khách' : 'Tài xế';
  const modeActionLabel = compact ? nextModeLabel : `Sang ${nextModeLabel}`;
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'C';

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUri]);

  const goHome = () => {
    router.replace((isDriver ? '/(driver-tabs)' : '/(passenger-tabs)') as any);
  };

  const switchMode = async () => {
    if (isSwitching) return;
    const nextMode = isDriver ? 'passenger' : 'driver';

    if (nextMode === 'driver') {
      const eligibility = getDriverEligibility(user);
      if (!eligibility.eligible) {
        Alert.alert(
          'Cần xác thực tài xế',
          'Hoàn tất hồ sơ tài xế trước khi chuyển sang chế độ này.',
          [
            { text: 'Để sau', style: 'cancel' },
            { text: 'Mở hồ sơ', onPress: () => router.push('/driver/register' as any) },
          ],
        );
        return;
      }
    }

    setIsSwitching(true);
    try {
      if (user?.id) await SecureStore.setAppMode(user.id, nextMode);
      setAppMode(nextMode);
      router.replace((nextMode === 'driver' ? '/(driver-tabs)' : '/(passenger-tabs)') as any);
    } catch {
      Alert.alert('Không thể chuyển chế độ', 'Vui lòng thử lại sau ít phút.');
    } finally {
      setIsSwitching(false);
    }
  };

  const openProfile = () => {
    router.push((isDriver ? '/(driver-tabs)/profile' : '/(passenger-tabs)/profile') as any);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, isDriver && styles.driverSafeArea]}>
      <View style={[styles.header, compact && styles.compactHeader, isDriver && styles.driverHeader]}>
        <Pressable
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Về trang chủ CoRide"
          style={({ pressed }) => [styles.brand, pressed && styles.brandPressed]}
        >
          <Car size={22} color={foreground} strokeWidth={2.1} />
          <AppText numberOfLines={1} maxFontSizeMultiplier={1.5} style={[styles.brandText, { color: foreground }]}>CoRide</AppText>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={switchMode}
            disabled={isSwitching}
            accessibilityRole="button"
            accessibilityLabel={`Chuyển sang chế độ ${nextModeLabel}`}
            accessibilityHint="Thay đổi vai trò sử dụng CoRide"
            accessibilityState={{ busy: isSwitching, disabled: isSwitching }}
            style={({ pressed }) => [styles.modeTouchTarget, pressed && styles.controlPressed, isSwitching && styles.controlDisabled]}
          >
            <View style={[styles.modePill, compact && styles.compactModePill, isDriver && styles.driverModePill]}>
              {isSwitching
                ? <ActivityIndicator size="small" color={colors.surface} />
                : <ArrowLeftRight size={16} color={colors.surface} strokeWidth={2.2} />}
              <AppText numberOfLines={1} maxFontSizeMultiplier={1.5} variant="caption" weight="semibold" style={styles.modeText}>
                {modeActionLabel}
              </AppText>
            </View>
          </Pressable>

          <Pressable
            onPress={openProfile}
            accessibilityRole="button"
            accessibilityLabel="Mở hồ sơ cá nhân"
            accessibilityHint="Chuyển đến tab Hồ sơ"
            style={({ pressed }) => [styles.avatarTouchTarget, pressed && styles.controlPressed]}
          >
            <View style={[styles.avatarFrame, isDriver && styles.driverAvatarFrame]}>
              {avatarUri && !avatarFailed ? (
                <Image source={{ uri: avatarUri }} onError={() => setAvatarFailed(true)} style={styles.avatarImage} accessibilityIgnoresInvertColors />
              ) : initials ? (
                <AppText maxFontSizeMultiplier={1.3} weight="semibold" style={[styles.initials, isDriver && styles.driverInitials]}>{initials}</AppText>
              ) : (
                <User size={18} color={foreground} />
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.surface },
  driverSafeArea: { backgroundColor: colors.driverSurface },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 56,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxs,
  },
  compactHeader: { paddingHorizontal: spacing.md },
  driverHeader: {
    backgroundColor: colors.driverSurface,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  brand: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.xxs,
  },
  brandPressed: { opacity: 0.58 },
  brandText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 23,
  },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  modeTouchTarget: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.xxs,
  },
  controlPressed: { opacity: 0.68 },
  controlDisabled: { opacity: 0.72 },
  modePill: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minWidth: 118,
    paddingHorizontal: spacing.md,
  },
  compactModePill: { minWidth: 92, paddingHorizontal: spacing.sm },
  driverModePill: { backgroundColor: colors.driverAccent },
  modeText: { color: colors.surface, letterSpacing: -0.1 },
  avatarTouchTarget: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: layout.minTouchTarget,
    justifyContent: 'center',
    width: layout.minTouchTarget,
  },
  avatarFrame: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },
  driverAvatarFrame: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.24)' },
  avatarImage: { height: '100%', width: '100%' },
  initials: { color: colors.primary, fontSize: 13, letterSpacing: 0.2 },
  driverInitials: { color: colors.surface },
});
