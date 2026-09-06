import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, ScanLine, ShieldCheck } from 'lucide-react-native';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { BottomSheetSurface } from '../../components/ui/BottomSheetSurface';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { completedSummary, type CompletedBookingData } from '../booking/completed-booking';
import type { PaymentState } from './booking-payment-machine';

interface Props {
  booking: CompletedBookingData;
  state: PaymentState;
  onClose: () => void;
  onConfirm: () => void;
  onRetry: () => void;
}

function PaymentSuccessState({ amount }: { amount?: number }) {
  const entrance = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!active || reduced) return;
      entrance.setValue(0);
      Animated.timing(entrance, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
    AccessibilityInfo.announceForAccessibility('Thanh toán thành công');
    return () => { active = false; entrance.stopAnimation(); };
  }, [entrance]);
  return <Animated.View style={[styles.success, { opacity: entrance, transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
    <View style={styles.check}><Check size={38} color={colors.success} /></View>
    <AppText variant="h1" weight="bold" style={styles.center}>Thanh toán thành công</AppText>
    {amount !== undefined && <AppText variant="display" weight="bold">{amount.toLocaleString('vi-VN')}đ</AppText>}
    <AppText style={styles.secondary}>Chuyến đi của bạn đã hoàn tất.</AppText>
    <AppText variant="caption" style={styles.secondary}>Đang trở về chi tiết chuyến đi…</AppText>
  </Animated.View>;
}

function QrPaymentView({ uri, onLoaded }: { uri: string; onLoaded: (loaded: boolean) => void }) {
  const [imageState, setImageState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [attempt, setAttempt] = useState(0);
  return <View style={styles.qrFrame}>
    <Image key={attempt} source={{ uri }} style={styles.qrImage} resizeMode="contain"
      accessibilityLabel="Mã VietQR thanh toán cho đặt chỗ này"
      onLoad={() => { setImageState('READY'); onLoaded(true); }}
      onError={() => { setImageState('ERROR'); onLoaded(false); }} />
    {imageState !== 'READY' && <View style={styles.imagePlaceholder}>
      {imageState === 'LOADING' ? <><ActivityIndicator color={colors.primary} /><AppText variant="bodySmall" style={styles.secondary}>Đang tải ảnh VietQR…</AppText></>
        : <><AppText variant="bodySmall" style={styles.center}>Không tải được ảnh QR.</AppText><AppButton title="Tải lại ảnh QR" variant="outline" onPress={() => { setImageState('LOADING'); setAttempt(value => value + 1); }} /></>}
    </View>}
  </View>;
}

export function BookingPaymentSheet({ booking, state, onClose, onConfirm, onRetry }: Props) {
  const insets = useSafeAreaInsets();
  const summary = completedSummary(booking);
  const [loadedUri, setLoadedUri] = useState<string>();
  const processing = state.phase === 'CONFIRMING';
  const locked = processing || state.phase === 'SUCCESS';
  const amount = state.qr ? `${state.qr.amount.toLocaleString('vi-VN')}đ` : summary.amount;
  const imageReady = !!state.qr && loadedUri === state.qr.qrUrl;
  return <Modal visible={state.phase !== 'IDLE'} transparent animationType="slide" onRequestClose={() => { if (!locked) onClose(); }}>
    <View style={[styles.backdrop, { paddingTop: insets.top + spacing.xs }]}>
      <BottomSheetSurface style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} accessibilityViewIsModal>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại chuyến đi" accessibilityState={{ disabled: locked }} disabled={locked} onPress={onClose} style={[styles.back, locked && styles.disabled]}><ArrowLeft size={22} color={colors.textPrimary} /></Pressable>
          <AppText weight="semibold" style={styles.headerTitle}>Thanh toán</AppText><View style={styles.back} />
        </View>
        {state.phase === 'SUCCESS' ? <PaymentSuccessState amount={state.amount} /> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="h2" weight="bold" style={styles.center}>{state.phase === 'LOADING_QR' ? 'Thanh toán chuyến đi' : 'Quét mã để thanh toán'}</AppText>
          {state.qr ? <QrPaymentView key={state.qr.qrUrl} uri={state.qr.qrUrl} onLoaded={loaded => setLoadedUri(loaded ? state.qr?.qrUrl : undefined)} />
            : <View style={[styles.qrFrame, styles.skeleton]}><ScanLine size={44} color={colors.textMuted} /><AppText variant="bodySmall" style={styles.secondary}>{state.phase === 'LOADING_QR' ? 'Đang tạo mã thanh toán…' : 'Chưa có mã thanh toán'}</AppText></View>}
          <View style={styles.amount}><AppText variant="bodySmall" style={styles.secondary}>Tổng thanh toán</AppText><AppText variant="display" weight="bold" style={styles.center}>{amount}</AppText></View>
          <View style={styles.route}>
            <AppText numberOfLines={2} style={styles.center}>{summary.pickup}</AppText>
            <AppText variant="bodySmall" style={styles.secondary}>đến</AppText>
            <AppText numberOfLines={2} style={styles.center}>{summary.dropoff}</AppText>
          </View>
          {state.qr && <View style={styles.description}><AppText variant="bodySmall" style={styles.secondary}>Nội dung chuyển khoản</AppText><AppText weight="medium" selectable style={styles.center}>{state.qr.description}</AppText></View>}
          {state.qr && <AppText variant="bodySmall" style={styles.secondary}>Dùng ứng dụng ngân hàng để quét mã QR phía trên. Đây là mô phỏng; không cần chuyển tiền thật.</AppText>}
          {state.message && <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}><AppText variant="bodySmall" style={styles.center}>{state.message}</AppText></View>}
          {processing ? <AppButton disabled accessibilityLabel="Đang xác nhận thanh toán" accessibilityState={{ disabled: true, busy: true }}><View style={styles.processing}><ActivityIndicator color={colors.surface} /><AppText weight="semibold" style={{ color: colors.surface }}>Đang xác nhận…</AppText></View></AppButton>
            : state.phase === 'QR_READY' ? <AppButton title="Tôi đã thanh toán" disabled={!imageReady} onPress={onConfirm} />
              : state.phase === 'ERROR' && state.retry ? <AppButton title={state.retry === 'RECONCILE' ? 'Kiểm tra lại thanh toán' : 'Thử lại'} onPress={onRetry} /> : null}
          <View style={styles.disclosure}><ShieldCheck size={16} color={colors.textSecondary} /><AppText variant="caption" style={styles.disclosureText}>Thanh toán mô phỏng dành cho môi trường demo.</AppText></View>
        </ScrollView>}
      </BottomSheetSurface>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  headerTitle: { flex: 1, textAlign: 'center' },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  center: { textAlign: 'center' },
  secondary: { textAlign: 'center', color: colors.textSecondary },
  qrFrame: { width: '100%', maxWidth: 300, aspectRatio: 1, alignSelf: 'center', padding: spacing.sm, backgroundColor: colors.surface },
  qrImage: { flex: 1, width: '100%' },
  imagePlaceholder: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.surface },
  skeleton: { backgroundColor: colors.surfaceMuted, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  amount: { alignItems: 'center', gap: spacing.xxs },
  route: { gap: spacing.xxs },
  description: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.lg, gap: spacing.xs },
  error: { backgroundColor: colors.warningSoft, borderRadius: radius.input, padding: spacing.md },
  processing: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  disclosure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  disclosureText: { flexShrink: 1, color: colors.textSecondary },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingBottom: spacing.xxl },
  check: { width: 80, height: 80, borderRadius: radius.full, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
});
