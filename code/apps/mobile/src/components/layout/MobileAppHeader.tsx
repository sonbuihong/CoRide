import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Bell, Car, ChevronRight, ClipboardList, LogOut, Menu, Navigation, PlusSquare, Search, User, WalletCards, X } from 'lucide-react-native';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../stores/useAppStore';
import * as SecureStore from '../../services/secure-store';
import { getDriverEligibility } from '../../utils/mode-checker';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { AppText } from '../ui/AppText';
import { IconButton } from '../ui/IconButton';

interface MobileAppHeaderProps {
  mode: 'passenger' | 'driver';
}

export function MobileAppHeader({ mode }: MobileAppHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setAppMode } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDriver = mode === 'driver';
  const foreground = isDriver ? '#FFFFFF' : colors.textPrimary;

  const switchMode = async () => {
    const nextMode = isDriver ? 'passenger' : 'driver';
    if (nextMode === 'driver') {
      const eligibility = getDriverEligibility(user);
      if (!eligibility.eligible) {
        setMenuOpen(false);
        Alert.alert('Cần xác thực tài xế', 'Hoàn tất hồ sơ tài xế trước khi chuyển sang chế độ này.', [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Mở hồ sơ', onPress: () => router.push('/driver/register' as any) },
        ]);
        return;
      }
    }
    if (user?.id) await SecureStore.setAppMode(user.id, nextMode);
    setAppMode(nextMode);
    setMenuOpen(false);
    router.replace((nextMode === 'driver' ? '/(driver-tabs)' : '/(passenger-tabs)') as any);
  };

  const openRoute = (route: string) => {
    setMenuOpen(false);
    router.push(route as any);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi CoRide?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <>
      <SafeAreaView edges={['top']} style={[styles.safeArea, isDriver && styles.driverSafeArea]}>
        <View style={[styles.header, isDriver && styles.driverHeader]}>
          <Pressable
            onPress={() => router.replace((isDriver ? '/(driver-tabs)' : '/(passenger-tabs)') as any)}
            accessibilityRole="button"
            accessibilityLabel="Về trang chủ CoRide"
            style={({ pressed }) => [styles.brand, pressed && styles.pressed]}
          >
            <Car size={20} color={foreground} strokeWidth={2} />
            <AppText style={[styles.brandText, { color: foreground }]}>CoRide</AppText>
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              onPress={switchMode}
              accessibilityRole="button"
              accessibilityLabel={`Đang ở chế độ ${isDriver ? 'Tài xế' : 'Hành khách'}. Nhấn để chuyển chế độ.`}
              style={({ pressed }) => [styles.modePill, isDriver && styles.driverModePill, pressed && styles.pressed]}
            >
              <AppText variant="caption" weight="semibold" style={styles.modeText}>{isDriver ? 'Tài xế' : 'Hành khách'}</AppText>
            </Pressable>
            <View style={[styles.separator, isDriver && styles.driverSeparator]} />
            <IconButton
              tone="ghost"
              icon={<Menu size={21} color={foreground} />}
              accessibilityLabel="Mở menu"
              onPress={() => setMenuOpen(true)}
              style={styles.headerIcon}
            />
          </View>
        </View>
      </SafeAreaView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.scrim} accessibilityLabel="Đóng menu" onPress={() => setMenuOpen(false)} />
          <SafeAreaView edges={['top', 'bottom']} style={[styles.drawer, isDriver && styles.driverDrawer]}>
            <View style={styles.drawerHeader}>
              <View>
                <AppText variant="h2" weight="semibold" style={isDriver && styles.lightText}>Menu</AppText>
                <AppText variant="caption" style={isDriver ? styles.lightSecondary : styles.secondaryText}>
                  {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Tài khoản CoRide'}
                </AppText>
              </View>
              <IconButton tone="ghost" icon={<X size={21} color={foreground} />} accessibilityLabel="Đóng menu" onPress={() => setMenuOpen(false)} />
            </View>

            <View style={styles.menuGroup}>
              {isDriver ? (
                <>
                  <MenuItem icon={<PlusSquare size={20} color={foreground} />} label="Đăng chuyến mới" foreground={foreground} onPress={() => openRoute('/ride/create')} />
                  <MenuItem icon={<ClipboardList size={20} color={foreground} />} label="Chuyến và yêu cầu" foreground={foreground} onPress={() => openRoute('/(driver-tabs)/requests')} />
                </>
              ) : (
                <>
                  <MenuItem icon={<Search size={20} color={foreground} />} label="Tìm chuyến" foreground={foreground} onPress={() => openRoute('/(passenger-tabs)')} />
                  <MenuItem icon={<ClipboardList size={20} color={foreground} />} label="Chuyến của tôi" foreground={foreground} onPress={() => openRoute('/(passenger-tabs)/my-rides')} />
                </>
              )}
            </View>

            <View style={styles.utilityGroup}>
              <MenuItem icon={<Bell size={20} color={foreground} />} label="Thông báo" foreground={foreground} onPress={() => openRoute(isDriver ? '/(driver-tabs)/notifications' : '/(passenger-tabs)/notifications')} />
              <MenuItem icon={<User size={20} color={foreground} />} label="Hồ sơ cá nhân" foreground={foreground} onPress={() => openRoute(isDriver ? '/(driver-tabs)/profile' : '/(passenger-tabs)/profile')} />
              <MenuItem icon={<WalletCards size={20} color={foreground} />} label="Ví và giao dịch" foreground={foreground} onPress={() => openRoute('/profile/wallet')} />
              <MenuItem icon={<Navigation size={20} color={foreground} />} label={`Chuyển sang ${isDriver ? 'Hành khách' : 'Tài xế'}`} foreground={foreground} onPress={switchMode} />
            </View>

            <Pressable onPress={handleLogout} accessibilityRole="button" style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
              <LogOut size={20} color={colors.danger} />
              <AppText weight="semibold" style={styles.logoutText}>Đăng xuất</AppText>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

function MenuItem({ icon, label, foreground, onPress }: { icon: React.ReactNode; label: string; foreground: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
      {icon}
      <AppText variant="bodySmall" weight="medium" style={[styles.menuLabel, { color: foreground }]}>{label}</AppText>
      <ChevronRight size={18} color={foreground} opacity={0.45} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: 'rgba(255,255,255,0.96)' },
  driverSafeArea: { backgroundColor: colors.driverSurface },
  header: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderBottomColor: 'rgba(0,0,0,0.16)', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 48, justifyContent: 'space-between', paddingHorizontal: spacing.md },
  driverHeader: { backgroundColor: 'rgba(10,30,60,0.96)', borderBottomColor: 'rgba(255,255,255,0.08)' },
  brand: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 44 },
  brandText: { fontSize: 17, fontWeight: '600', letterSpacing: -0.37 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  modePill: { alignItems: 'center', backgroundColor: '#0071E3', borderRadius: radius.pill, justifyContent: 'center', minHeight: 32, paddingHorizontal: 12 },
  driverModePill: { backgroundColor: colors.driverAccent },
  modeText: { color: '#FFFFFF' },
  separator: { backgroundColor: 'rgba(0,0,0,0.2)', height: 14, width: StyleSheet.hairlineWidth },
  driverSeparator: { backgroundColor: 'rgba(255,255,255,0.2)' },
  headerIcon: { minHeight: 40, minWidth: 40 },
  pressed: { opacity: 0.66 },
  modalRoot: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  scrim: { backgroundColor: colors.scrim, ...StyleSheet.absoluteFillObject },
  drawer: { backgroundColor: colors.background, height: '100%', paddingHorizontal: spacing.lg, width: '85%' },
  driverDrawer: { backgroundColor: colors.driverSurface },
  drawerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.lg, paddingTop: spacing.md },
  lightText: { color: '#FFFFFF' },
  lightSecondary: { color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  secondaryText: { color: colors.textSecondary, marginTop: 3 },
  menuGroup: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm },
  utilityGroup: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.md, paddingTop: spacing.sm },
  menuItem: { alignItems: 'center', borderRadius: radius.sm, flexDirection: 'row', gap: spacing.sm, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.sm },
  menuItemPressed: { backgroundColor: 'rgba(127,127,127,0.1)' },
  menuLabel: { flex: 1 },
  logout: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, minHeight: 52, paddingHorizontal: spacing.sm },
  logoutText: { color: colors.danger },
});
