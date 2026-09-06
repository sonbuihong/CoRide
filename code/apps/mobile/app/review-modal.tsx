import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, X } from 'lucide-react-native';
import { reviewService } from '../src/services/review.service';
import { AppText } from '../src/components/ui/AppText';
import { AppButton } from '../src/components/ui/AppButton';
import { getApiErrorMessage } from '../src/utils/api-error';
import { BottomSheetSurface } from '../src/components/ui/BottomSheetSurface';
import { colors, spacing } from '../src/theme/tokens';

export default function ReviewModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { rideId, tripRequestId, revieweeId, initialRating } =
    useLocalSearchParams<{
      rideId?: string;
      tripRequestId?: string;
      revieweeId: string;
      initialRating?: string;
    }>();
  const [rating, setRating] = useState(() => {
    const value = Number(initialRating);
    return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0;
  });
  const [comment, setComment] = useState('');
  const mutation = useMutation({
    mutationFn: () =>
      reviewService.createReview({
        ...(tripRequestId ? { tripRequestId } : { rideId: rideId! }),
        revieweeId,
        rating,
        comment,
      }),
    onSuccess: (review) => {
      queryClient.setQueryData<
        Awaited<ReturnType<typeof reviewService.getUserReviews>>
      >(['user-reviews', revieweeId], (previous) => [
        ...(previous || []).filter((item) => item.id !== review.id),
        review,
      ]);
      void queryClient.invalidateQueries({
        queryKey: ['user-reviews', revieweeId],
      });
      Alert.alert('Cảm ơn bạn', 'Đánh giá đã được ghi nhận.');
      if (tripRequestId) router.replace('/(passenger-tabs)' as never);
      else router.back();
    },
    onError: (error) =>
      Alert.alert(
        'Không thể gửi đánh giá',
        getApiErrorMessage(error, 'Vui lòng thử lại.'),
      ),
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: colors.scrim,
        paddingTop: insets.top,
      }}
    >
      <BottomSheetSurface
        style={{
          maxHeight: '95%',
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="mb-5 flex-row items-center justify-between">
            <AppText variant="h2" weight="bold" style={{ flex: 1 }}>
              Đánh giá chuyến đi
            </AppText>
            <Pressable
              className="h-12 w-12 items-center justify-center rounded-full bg-background"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <AppText className="mb-3 text-text-secondary">
            Trải nghiệm của bạn như thế nào?
          </AppText>
          <View className="mb-5 flex-row justify-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                className="h-12 w-12 items-center justify-center"
                onPress={() => setRating(value)}
                accessibilityRole="button"
                accessibilityState={{ selected: value === rating }}
                accessibilityLabel={`${value} sao`}
              >
                <Star
                  size={34}
                  color={colors.warning}
                  fill={value <= rating ? colors.warning : 'transparent'}
                />
              </Pressable>
            ))}
          </View>

          {/* Quick feedback tags */}
          <View className="mb-4 flex-row flex-wrap justify-center gap-2">
            {['Lái xe an toàn', 'Xe sạch sẽ', 'Thân thiện, lịch sự', 'Đón đúng giờ'].map((tag) => {
              const active = comment.includes(tag);
              return (
                <Pressable
                  key={tag}
                  accessibilityRole="button"
                  accessibilityLabel={`Gắn nhận xét ${tag}`}
                  onPress={() => {
                    if (active) {
                      setComment(comment.replace(tag, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim());
                    } else {
                      setComment(comment.trim() ? `${comment.trim()}, ${tag}` : tag);
                    }
                  }}
                  className={`rounded-full px-3 py-1.5 border ${active ? 'bg-passenger/15 border-passenger' : 'bg-background border-border'}`}
                >
                  <AppText variant="caption" weight="medium" style={{ color: active ? colors.primary : colors.textSecondary }}>
                    {tag}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            className="mb-5 min-h-28 rounded-2xl border border-border bg-background p-4 text-text-primary"
            multiline
            maxLength={500}
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ thêm nhận xét (không bắt buộc)"
            accessibilityLabel="Nhận xét chuyến đi"
          />
          <AppButton
            title="Gửi đánh giá"
            onPress={() => mutation.mutate()}
            disabled={rating < 1}
            isLoading={mutation.isPending}
          />
        </ScrollView>
      </BottomSheetSurface>
    </KeyboardAvoidingView>
  );
}
