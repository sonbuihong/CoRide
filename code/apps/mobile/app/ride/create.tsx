import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRideInput, createRideSchema } from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Minus, Plus } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { LocationPicker } from '../../src/components/LocationPicker';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { IconButton } from '../../src/components/ui/IconButton';
import { rideService } from '../../src/services/ride.service';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';

const steps = ['Điểm đi', 'Điểm đến', 'Thời gian', 'Chỗ & giá', 'Xem lại'];

export default function CreateRideScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(Date.now() + 86_400_000));

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateRideInput>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      origin: '',
      destination: '',
      departureTime: tempDate.toISOString(),
      availableSeats: 4,
      pricePerSeat: 50_000,
      description: '',
      allowRoutePickup: true,
    },
  });

  const values = watch();
  const mutation = useMutation({
    mutationFn: (data: CreateRideInput) => rideService.createRide(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['my-driver-rides'] });
      Alert.alert('Đã đăng chuyến', 'Hành trình của bạn đã sẵn sàng để nhận đặt chỗ.', [
        { text: 'Xem chuyến đi', onPress: () => router.replace('/(driver-tabs)' as any) },
      ]);
    },
    onError: (error: any) => Alert.alert('Không thể đăng chuyến', error.response?.data?.message || 'Vui lòng kiểm tra thông tin và thử lại.'),
  });

  const changeDate = (_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;
    const next = new Date(values.departureTime);
    next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    setTempDate(next);
    setValue('departureTime', next.toISOString());
  };

  const changeTime = (_event: unknown, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (!selectedDate) return;
    const next = new Date(values.departureTime);
    next.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    setTempDate(next);
    setValue('departureTime', next.toISOString());
  };

  const continueToNextStep = () => {
    if (step === 0 && !values.origin?.trim()) return Alert.alert('Chọn điểm đi', 'Vui lòng chọn một gợi ý địa điểm để xác định đúng vị trí.');
    if (step === 1 && !values.destination?.trim()) return Alert.alert('Chọn điểm đến', 'Vui lòng chọn điểm đến của hành trình.');
    if (step === 2 && new Date(values.departureTime) <= new Date()) return Alert.alert('Thời gian chưa hợp lệ', 'Giờ khởi hành phải ở tương lai.');
    if (step === 3 && (!values.availableSeats || values.pricePerSeat == null)) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập số chỗ và giá đề xuất.');
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon={<ArrowLeft size={21} color={colors.textPrimary} />} accessibilityLabel="Quay lại" onPress={() => step > 0 ? setStep(step - 1) : router.back()} />
        <View style={styles.headerCopy}>
          <AppText variant="h3" weight="semibold">Tạo chuyến đi</AppText>
          <AppText variant="caption" style={styles.secondary}>Bước {step + 1}/{steps.length} · {steps[step]}</AppText>
        </View>
      </View>

      <View style={styles.progressTrack} accessibilityLabel={`Tiến độ ${step + 1} trên ${steps.length}`}>
        <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {step === 0 && (
          <View>
            <AppText variant="h1" weight="semibold">Bạn bắt đầu từ đâu?</AppText>
            <AppText variant="body" style={styles.intro}>Chọn chính xác địa điểm để hệ thống tính tuyến và tìm hành khách phù hợp.</AppText>
            <Controller control={control} name="origin" render={({ field: { onChange, value } }) => (
              <LocationPicker
                label="Điểm đi"
                placeholder="Tìm địa điểm khởi hành"
                value={value || ''}
                onChangeText={onChange}
                onSelectCoords={(lat, lng) => { setValue('originLat', lat); setValue('originLng', lng); }}
                error={errors.origin?.message as string | undefined}
              />
            )} />
          </View>
        )}

        {step === 1 && (
          <View>
            <AppText variant="h1" weight="semibold">Bạn sẽ đi đến đâu?</AppText>
            <AppText variant="body" style={styles.intro}>CoRide có thể ghép khách ở gần hoặc nằm trên tuyến đường của bạn.</AppText>
            <Controller control={control} name="destination" render={({ field: { onChange, value } }) => (
              <LocationPicker
                label="Điểm đến"
                placeholder="Tìm điểm đến"
                value={value || ''}
                onChangeText={onChange}
                onSelectCoords={(lat, lng) => { setValue('destinationLat', lat); setValue('destinationLng', lng); }}
                error={errors.destination?.message as string | undefined}
              />
            )} />
          </View>
        )}

        {step === 2 && (
          <View>
            <AppText variant="h1" weight="semibold">Khi nào bạn khởi hành?</AppText>
            <AppText variant="body" style={styles.intro}>Hành khách có thời gian gần nhất sẽ được ưu tiên trong kết quả matching.</AppText>
            <View style={styles.dateRow}>
              <Pressable onPress={() => setShowDatePicker(true)} accessibilityRole="button" accessibilityLabel="Chọn ngày khởi hành" style={({ pressed }) => [styles.picker, pressed && styles.pressed]}>
                <Calendar size={21} color={colors.primary} />
                <View><AppText variant="caption" style={styles.secondary}>Ngày</AppText><AppText weight="semibold">{format(tempDate, 'dd/MM/yyyy')}</AppText></View>
              </Pressable>
              <Pressable onPress={() => setShowTimePicker(true)} accessibilityRole="button" accessibilityLabel="Chọn giờ khởi hành" style={({ pressed }) => [styles.picker, pressed && styles.pressed]}>
                <Clock size={21} color={colors.primary} />
                <View><AppText variant="caption" style={styles.secondary}>Giờ</AppText><AppText weight="semibold">{format(tempDate, 'HH:mm')}</AppText></View>
              </Pressable>
            </View>
            {showDatePicker && <DateTimePicker value={tempDate} mode="date" minimumDate={new Date()} onChange={changeDate} />}
            {showTimePicker && <DateTimePicker value={tempDate} mode="time" onChange={changeTime} />}
          </View>
        )}

        {step === 3 && (
          <View>
            <AppText variant="h1" weight="semibold">Chỗ trống và chi phí</AppText>
            <AppText variant="body" style={styles.intro}>Chỉ nhập số ghế thực tế còn trống. Giá là mức đóng góp cho mỗi hành khách.</AppText>
            <AppText weight="medium" style={styles.fieldLabel}>Số ghế trống</AppText>
            <View style={styles.counter}>
              <IconButton tone="ghost" icon={<Minus size={20} color={colors.textPrimary} />} accessibilityLabel="Giảm số ghế" disabled={values.availableSeats <= 1} onPress={() => setValue('availableSeats', Math.max(1, values.availableSeats - 1))} />
              <AppText variant="h2" weight="semibold" style={styles.counterValue}>{values.availableSeats}</AppText>
              <IconButton tone="ghost" icon={<Plus size={20} color={colors.textPrimary} />} accessibilityLabel="Tăng số ghế" onPress={() => setValue('availableSeats', Math.min(8, values.availableSeats + 1))} />
            </View>
            <AppText weight="medium" style={styles.fieldLabel}>Giá đề xuất mỗi ghế</AppText>
            <Controller control={control} name="pricePerSeat" render={({ field: { onChange, value } }) => (
              <View style={styles.moneyInput}>
                <TextInput accessibilityLabel="Giá đề xuất mỗi ghế" keyboardType="number-pad" value={String(value)} onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)} style={styles.textInput} />
                <AppText weight="medium" style={styles.secondary}>VNĐ</AppText>
              </View>
            )} />
          </View>
        )}

        {step === 4 && (
          <View>
            <AppText variant="h1" weight="semibold">Kiểm tra chuyến đi</AppText>
            <AppText variant="body" style={styles.intro}>Bạn có thể quay lại từng bước để chỉnh sửa trước khi đăng.</AppText>
            <View style={styles.review}>
              <ReviewRow label="Điểm đi" value={values.origin || 'Chưa chọn'} />
              <ReviewRow label="Điểm đến" value={values.destination || 'Chưa chọn'} />
              <ReviewRow label="Khởi hành" value={format(new Date(values.departureTime), 'HH:mm · dd/MM/yyyy')} />
              <ReviewRow label="Số ghế" value={`${values.availableSeats} ghế`} />
              <ReviewRow label="Giá mỗi ghế" value={`${Number(values.pricePerSeat).toLocaleString('vi-VN')}đ`} last />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && <AppButton title="Quay lại" variant="ghost" onPress={() => setStep(step - 1)} style={styles.backButton} />}
        <AppButton
          title={step === steps.length - 1 ? 'Đăng chuyến' : 'Tiếp tục'}
          onPress={step === steps.length - 1 ? handleSubmit((data) => mutation.mutate(data)) : continueToNextStep}
          isLoading={mutation.isPending}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

function ReviewRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.reviewRow, last && styles.reviewRowLast]}><AppText variant="bodySmall" style={styles.secondary}>{label}</AppText><AppText variant="bodySmall" weight="semibold" style={styles.reviewValue}>{value}</AppText></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.surface, flexDirection: 'row', paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  headerCopy: { flex: 1, marginLeft: spacing.sm },
  secondary: { color: colors.textSecondary },
  progressTrack: { backgroundColor: colors.border, height: 3 },
  progressFill: { backgroundColor: colors.primary, height: 3 },
  content: { flexGrow: 1, padding: spacing.lg },
  intro: { color: colors.textSecondary, marginBottom: spacing.xl, marginTop: spacing.xs },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  picker: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.input, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 72, padding: spacing.md },
  pressed: { backgroundColor: colors.surfaceMuted },
  fieldLabel: { marginBottom: spacing.xs, marginTop: spacing.md },
  counter: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.input, borderWidth: 1, flexDirection: 'row' },
  counterValue: { minWidth: 52, textAlign: 'center' },
  moneyInput: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.input, borderWidth: 1, flexDirection: 'row', minHeight: 56, paddingHorizontal: spacing.md },
  textInput: { color: colors.textPrimary, flex: 1, fontSize: 18, fontVariant: ['tabular-nums'] },
  review: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card, borderWidth: 1, paddingHorizontal: spacing.md },
  reviewRow: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.xs, paddingVertical: spacing.md },
  reviewRowLast: { borderBottomWidth: 0 },
  reviewValue: { color: colors.textPrimary },
  footer: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  backButton: { flex: 0.42, minHeight: layout.minTouchTarget },
  nextButton: { flex: 1, minHeight: layout.minTouchTarget },
});
