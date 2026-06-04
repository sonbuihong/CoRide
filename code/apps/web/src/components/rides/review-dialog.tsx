'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateReviewSchema, CreateReviewInput } from '@repo/shared';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ReviewDialogProps {
  rideId: string;
  revieweeId: string;
  revieweeName: string;
  onSuccess?: () => void;
}

export const ReviewDialog: React.FC<ReviewDialogProps> = ({
  rideId,
  revieweeId,
  revieweeName,
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(CreateReviewSchema),
    defaultValues: {
      rideId,
      revieweeId,
      rating: 5,
      comment: '',
    },
  });

  const onSubmit = async (data: CreateReviewInput) => {
    setLoading(true);
    try {
      await apiClient.post('/reviews', { ...data, rating });
      toast.success('Gửi đánh giá thành công!');
      setIsOpen(false);
      reset();
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      toast.error(((error as { response?: { data?: { message?: string } } }).response)?.data?.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <Star className="mr-2 h-4 w-4" /> Đánh giá ngay
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Đánh giá trải nghiệm
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Gửi đánh giá cho <strong>{revieweeName}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="space-y-3 text-center">
                <Label className="text-base">Mức độ hài lòng</Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        className={cn(
                          'h-10 w-10 transition-colors',
                          s <= rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-600">
                  {rating === 5 ? 'Tuyệt vời' : rating === 4 ? 'Tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Kém' : 'Rất kém'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Bình luận thêm (tùy chọn)
                </Label>
                <textarea
                  id="comment"
                  {...register('comment')}
                  className="w-full min-h-[100px] p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  placeholder="Chia sẻ thêm về chuyến đi của bạn..."
                />
                {errors.comment && (
                  <p className="text-xs text-red-500">{errors.comment.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Gửi đánh giá'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
