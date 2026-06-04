'use client';

import React from 'react';
import { Star, User } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface ReviewListProps {
  reviews: Review[];
}

export const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 italic">Chưa có đánh giá nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="overflow-hidden border-none shadow-sm bg-gray-50/50">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden border shadow-sm shrink-0">
                {review.reviewer.avatarUrl ? (
                  <img src={review.reviewer.avatarUrl} alt="Reviewer" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">
                      {review.reviewer.firstName} {review.reviewer.lastName}
                    </p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            'h-3 w-3',
                            s <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 italic mt-2">&quot;{review.comment}&quot;</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
