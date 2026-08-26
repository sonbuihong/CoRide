const fs = require('fs');
let file = 'app/ride/[id].tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. Rename pStyles to styles in the entire file
txt = txt.replace(/pStyles\./g, 'styles.');

// 2. Add the missing styles to styles = StyleSheet.create({
let newStyles = `
  sheetPadding: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border || '#E5E7EB', marginVertical: spacing.xs },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusText: { color: colors.navigationPassenger || '#0071E3', fontSize: 16 },
  statusRight: { color: colors.textTertiary },
  summaryCard: { backgroundColor: colors.surface || '#FFFFFF', borderRadius: radius.card || 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border || '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryCardDivider: { height: 1, backgroundColor: colors.border || '#F3F4F6', marginVertical: spacing.sm },
  cardTagsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  cardTag: { alignItems: 'center', flex: 1 },
  cardTagIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cardTagText: { color: colors.textSecondary || '#6B7280', fontSize: 11 },
  sectionLabel: { color: colors.textTertiary || '#9CA3AF', fontSize: 11, letterSpacing: 0.5, marginBottom: spacing.sm },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EAF4FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  driverAvatarImg: { width: '100%', height: '100%' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, color: colors.textPrimary || '#111827' },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { color: '#F59E0B' },
  verifiedText: { color: colors.success || '#16A34A', fontSize: 12 },
  chatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAF4FF', alignItems: 'center', justifyContent: 'center' },
  seatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  seatLabelCol: { flex: 1 },
  seatLabelText: { fontSize: 14, color: colors.textPrimary || '#111827' },
  seatHint: { color: colors.textTertiary || '#9CA3AF', marginTop: 2 },
  seatPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted || '#F8FAFC', borderRadius: radius.input || 8, overflow: 'hidden' },
  seatBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  seatBtnText: { fontSize: 20, color: colors.textPrimary || '#111827' },
  seatBtnDisabled: { color: colors.textTertiary || '#9CA3AF' },
  seatCount: { minWidth: 36, textAlign: 'center', fontSize: 16, color: colors.textPrimary || '#111827' },
  stopHint: { color: colors.textTertiary || '#9CA3AF', marginBottom: spacing.sm },
  stopsCard: { backgroundColor: colors.surface || '#FFFFFF', borderRadius: radius.card || 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border || '#E5E7EB', overflow: 'hidden' },
  ctaContainer: { gap: spacing.xs },
  ctaPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs, marginBottom: spacing.xxs },
  ctaTotalLabel: { color: colors.textSecondary || '#6B7280' },
  ctaTotal: { fontSize: 18, color: '#10B981' },
  ctaBtn: { width: '100%' },
  floatHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  floatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
`;

txt = txt.replace('const styles = StyleSheet.create({', 'const styles = StyleSheet.create({' + newStyles);

// 3. Fix missing Stack (import { Stack } from 'expo-router';)
if (!txt.includes("import { Stack }")) {
  txt = txt.replace("import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';", "import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';");
}

// 4. Fix missing formatVnd
if (!txt.includes("const formatVnd")) {
  txt = txt.replace("const currency = (value: number)", "const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')} đ`;\nconst currency = (value: number)");
}

// 5. Fix TS properties for Ride that might be missing (avatarUrl, fullName, autoApprove, notes, pricePerSeat)
// Since `ride` is typed via useQuery, it might complain. We can cast it or use `(ride as any).pricePerSeat`.
txt = txt.replace(/ride\.pricePerSeat/g, "(ride as any).pricePerSeat");
txt = txt.replace(/ride\.autoApprove/g, "(ride as any).autoApprove");
txt = txt.replace(/ride\.driver\?\.fullName/g, "((ride.driver as any)?.fullName || (ride.driver?.firstName + ' ' + ride.driver?.lastName))");
txt = txt.replace(/ride\.driver\?\.avatarUrl/g, "((ride.driver as any)?.avatarUrl || ride.driver?.avatar)");
txt = txt.replace(/ride\.notes/g, "(ride as any).notes");
txt = txt.replace(/ride\.departure \?\? ''/g, "(ride.departure ?? '') as string");

fs.writeFileSync(file, txt);
