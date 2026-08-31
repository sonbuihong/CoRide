import { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Star, X } from 'lucide-react-native';
import { reviewService } from '../src/services/review.service';
import { AppText } from '../src/components/ui/AppText';
import { AppButton } from '../src/components/ui/AppButton';
import { getApiErrorMessage } from '../src/utils/api-error';

export default function ReviewModal() {
  const router = useRouter();
  const { rideId, tripRequestId, revieweeId } = useLocalSearchParams<{
    rideId?: string;
    tripRequestId?: string;
    revieweeId: string;
  }>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const mutation = useMutation({
    mutationFn: () => reviewService.createReview({
      ...(tripRequestId ? { tripRequestId } : { rideId: rideId! }),
      revieweeId,
      rating,
      comment,
    }),
    onSuccess: () => {
      Alert.alert('Cảm ơn bạn', 'Đánh giá đã được ghi nhận.');
      if (tripRequestId) router.replace('/(passenger-tabs)' as never);
      else router.back();
    },
    onError: (error) => Alert.alert(
      'Không thể gửi đánh giá',
      getApiErrorMessage(error, 'Vui lòng thử lại.'),
    ),
  });

  return (
    <View className="flex-1 justify-end bg-black/50">
      <View className="rounded-t-[32px] bg-surface p-6 pb-10">
        <View className="mb-5 flex-row items-center justify-between">
          <AppText variant="h2" weight="bold">Đánh giá chuyến đi</AppText>
          <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-slate-100" onPress={() => router.back()} accessibilityLabel="Đóng">
            <X size={22} color="#334155" />
          </Pressable>
        </View>
        <AppText className="mb-3 text-text-secondary">Trải nghiệm của bạn như thế nào?</AppText>
        <View className="mb-5 flex-row justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable key={value} className="h-12 w-12 items-center justify-center" onPress={() => setRating(value)} accessibilityLabel={`${value} sao`}>
              <Star size={34} color="#F59E0B" fill={value <= rating ? '#F59E0B' : 'transparent'} />
            </Pressable>
          ))}
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
        <AppButton title="Gửi đánh giá" onPress={() => mutation.mutate()} isLoading={mutation.isPending} />
      </View>
    </View>
  );
}
