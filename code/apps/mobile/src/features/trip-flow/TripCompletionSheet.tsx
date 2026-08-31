import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { colors, radius, spacing } from '../../theme/tokens';

interface TripCompletionSheetProps {
  visible: boolean;
  pendingPassengerCount: number;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function TripCompletionSheet({
  visible,
  pendingPassengerCount,
  isLoading,
  onClose,
  onConfirm,
}: TripCompletionSheetProps) {
  const insets = useSafeAreaInsets();
  const blocked = pendingPassengerCount > 0;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Đóng xác nhận" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <View style={[styles.icon, blocked && styles.iconBlocked]}>
            {blocked ? <AlertTriangle size={28} color={colors.warning} /> : <CheckCircle2 size={28} color={colors.success} />}
          </View>
          <AppText variant="h2" weight="bold" style={styles.title}>
            {blocked ? 'Không thể hoàn thành chuyến' : 'Hoàn thành chuyến?'}
          </AppText>
          <AppText style={styles.copy}>
            {blocked
              ? `Bạn vẫn còn ${pendingPassengerCount} hành khách chưa được trả tại điểm đến.`
              : 'Bạn đã trả tất cả hành khách và hoàn tất hành trình?'}
          </AppText>
          <View style={styles.actions}>
            <AppButton title="Quay lại" variant="outline" onPress={onClose} style={styles.action} />
            {!blocked ? <AppButton title="Hoàn thành chuyến" variant="driver" onPress={onConfirm} isLoading={isLoading} style={styles.action} /> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.scrim, flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: spacing.screen, paddingTop: spacing.sm },
  handle: { alignSelf: 'center', backgroundColor: colors.borderStrong, borderRadius: radius.full, height: 5, marginBottom: spacing.lg, width: 42 },
  icon: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.successSoft, borderRadius: radius.full, height: 58, justifyContent: 'center', width: 58 },
  iconBlocked: { backgroundColor: colors.warningSoft },
  title: { marginTop: spacing.md, textAlign: 'center' },
  copy: { color: colors.textSecondary, marginHorizontal: spacing.md, marginTop: spacing.sm, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  action: { flex: 1 },
});
