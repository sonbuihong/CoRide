import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Circle, CircleDot } from 'lucide-react-native';

import { apiClient as api } from '../src/api/client';
import { AppButton } from '../src/components/ui/AppButton';
import { AppText } from '../src/components/ui/AppText';
import { TripScreen, TripScreenHeader, TripScrollView } from '../src/features/trip-flow/TripScreen';
import { colors, radius, spacing } from '../src/theme/tokens';
import { showInfoDialog } from '../src/utils/dialog';

const driverTripReasons = [
  'Không tìm thấy hành khách',
  'Hành khách không đến điểm hẹn',
  'Sai điểm đón',
  'Sai điểm trả',
  'Vấn đề thanh toán',
  'Hành vi không phù hợp',
  'Khác',
];

export default function ReportModalScreen() {
  const { reportedId, rideId } = useLocalSearchParams<{ reportedId: string; rideId?: string }>();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason) return showInfoDialog('Chưa chọn vấn đề', 'Vui lòng chọn vấn đề bạn đang gặp phải.');
    setLoading(true);
    try {
      await api.post('/reports', { reportedId, rideId, reason, description: description.trim() || undefined });
      showInfoDialog('Đã gửi báo cáo', 'CoRide đã ghi nhận và sẽ phản hồi sớm nhất có thể.', () => router.back());
    } catch (error: any) {
      showInfoDialog('Không thể gửi báo cáo', error?.response?.data?.message || 'Kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TripScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <TripScreenHeader title="Báo cáo sự cố" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TripScrollView contentContainerStyle={styles.content}>
          <AppText variant="h2" weight="bold">Bạn đang gặp vấn đề gì?</AppText>
          <AppText style={styles.intro}>Chọn một vấn đề để đội ngũ CoRide hỗ trợ đúng và nhanh hơn.</AppText>

          <View style={styles.reasonList} accessibilityRole="radiogroup">
            {driverTripReasons.map((item) => {
              const selected = item === reason;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setReason(item)}
                  style={({ pressed }) => [styles.reasonRow, selected && styles.reasonSelected, pressed && styles.pressed]}
                >
                  {selected ? <CircleDot size={22} color={colors.success} /> : <Circle size={22} color={colors.borderStrong} />}
                  <AppText weight={selected ? 'semibold' : 'normal'} style={styles.reasonText}>{item}</AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText weight="semibold" style={styles.label}>Mô tả thêm</AppText>
          <TextInput
            accessibilityLabel="Mô tả thêm về sự cố"
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả thêm..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={800}
            textAlignVertical="top"
            style={styles.input}
          />
          <AppText variant="caption" style={styles.counter}>{description.length}/800</AppText>
          <AppButton variant="driver" title="Gửi báo cáo" onPress={() => void submit()} isLoading={loading} style={styles.submit} />
        </TripScrollView>
      </KeyboardAvoidingView>
    </TripScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing['2xl'] },
  intro: { color: colors.textSecondary, marginTop: spacing.xs },
  reasonList: { backgroundColor: colors.surface, borderRadius: radius.card, marginTop: spacing.xl, overflow: 'hidden' },
  reasonRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 56, paddingHorizontal: spacing.lg },
  reasonSelected: { backgroundColor: colors.driverAccentSoft },
  reasonText: { flex: 1, marginLeft: spacing.md },
  label: { marginBottom: spacing.sm, marginTop: spacing.xl },
  input: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radius.input, borderWidth: 1, color: colors.textPrimary, fontSize: 16, minHeight: 132, padding: spacing.md },
  counter: { alignSelf: 'flex-end', marginTop: spacing.xs },
  submit: { marginTop: spacing.xl },
  pressed: { opacity: 0.72 },
});
