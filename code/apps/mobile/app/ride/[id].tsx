import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rideService } from '../../src/services/ride.service';
import { bookingService } from '../../src/services/booking.service';
import { RideMap } from '../../src/components/RideMap';
import { MatchExplanation } from '../../src/components/MatchExplanation';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { Clock, Users, Star, ShieldCheck, MessageCircle, ArrowLeft, Heart, MapPin, CircleDot } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function RideDetailScreen() {
  const { id, matchType, matchScore, pickupDistanceKm, detourKm, routeOverlap } = useLocalSearchParams<{
    id: string;
    matchType?: 'DIRECT' | 'NEARBY' | 'ON_ROUTE';
    matchScore?: string;
    pickupDistanceKm?: string;
    detourKm?: string;
    routeOverlap?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [seats, setSeats] = useState(1);
  const [pickupStopId, setPickupStopId] = useState<string | undefined>();

  const { data: ride, isLoading } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideService.getRideById(id as string),
    enabled: !!id,
  });

  const bookingMutation = useMutation({
    mutationFn: () => bookingService.createBooking(id as string, seats, pickupStopId),
    onSuccess: (result) => {
      const confirmed = result.booking?.status === 'CONFIRMED';
      Alert.alert(
        confirmed ? 'Đã đặt chỗ' : 'Đã gửi yêu cầu',
        confirmed
          ? 'Chỗ của bạn đã được xác nhận ngay.'
          : 'Ghế được giữ trong 15 phút để tài xế phản hồi.', [
        { text: 'OK', onPress: () => router.replace('/(passenger-tabs)/my-rides' as any) }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thực hiện đặt chỗ');
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <AppText variant="body" className="text-text-secondary text-lg">Không tìm thấy thông tin chuyến đi</AppText>
        <AppButton 
          title="Quay lại" 
          variant="passenger"
          onPress={() => router.back()} 
          className="mt-4 px-6" 
        />
      </View>
    );
  }

  const departureDateFormatted = format(new Date(ride.departureTime), 'eeee, dd MMMM yyyy', { locale: vi });
  const matchingRide = {
    ...ride,
    matchType: matchType || ride.matchType,
    matchScore: matchScore ? Number(matchScore) : ride.matchScore,
    pickupDistanceKm: pickupDistanceKm ? Number(pickupDistanceKm) : ride.pickupDistanceKm,
    detourKm: detourKm ? Number(detourKm) : ride.detourKm,
    routeOverlap: routeOverlap ? Number(routeOverlap) : ride.routeOverlap,
  };

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header nổi đè lên bản đồ */}
      <View 
        style={{ paddingTop: insets.top + 10 }} 
        className="absolute top-0 left-0 right-0 z-20 flex-row justify-between px-6 items-center"
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface border border-border/30 items-center justify-center shadow-md active:bg-slate-50"
          accessibilityRole="button"
          accessibilityLabel="Quay lại trang trước"
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-surface border border-border/30 items-center justify-center shadow-md active:bg-slate-50"
          accessibilityRole="button"
          accessibilityLabel="Lưu chuyến đi này"
        >
          <Heart size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Bản đồ tuyến đường */}
        <View className="overflow-hidden">
          <RideMap 
            departureCoords={ride.departureCoords} 
            destinationCoords={ride.destinationCoords} 
          />
        </View>

        <View className="p-6 -mt-6 bg-background rounded-t-3xl z-10">
          {/* Thông tin điểm đi - điểm đến chính */}
          <View className="bg-surface p-5 rounded-3xl shadow-sm border border-border/40 mb-6">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <AppText variant="h2" weight="bold" className="text-text-primary mb-1">
                  Đến: {ride.destination}
                </AppText>
                <AppText variant="bodySmall" className="text-text-secondary">
                  Từ: <AppText weight="bold" className="text-text-primary">{ride.departure}</AppText>
                </AppText>
              </View>
              <AppText variant="h2" weight="bold" className="text-passenger">
                {ride.price.toLocaleString('vi-VN')}đ
              </AppText>
            </View>
            <AppText variant="caption" weight="medium" className="text-text-secondary">
              Thời gian khởi hành: {departureDateFormatted}
            </AppText>
          </View>

          {matchingRide.matchScore != null && (
            <View className="mb-6">
              <AppText variant="body" weight="semibold" className="text-text-primary mb-3">
                Vì sao chuyến này phù hợp?
              </AppText>
              <MatchExplanation ride={matchingRide} />
            </View>
          )}

          {ride.stops && ride.stops.length > 0 && (
            <View className="mb-6">
              <AppText variant="body" weight="semibold" className="text-text-primary mb-1">
                Chọn điểm đón
              </AppText>
              <AppText variant="bodySmall" className="text-text-secondary mb-3">
                Bạn có thể bắt đầu tại điểm đi chính hoặc một điểm đón công khai dọc tuyến.
              </AppText>
              <View className="bg-surface rounded-3xl border border-border/40 overflow-hidden">
                <PickupChoice
                  title="Điểm đi chính"
                  address={ride.departure}
                  selected={!pickupStopId}
                  onPress={() => setPickupStopId(undefined)}
                />
                {ride.stops.map((stop) => (
                  <PickupChoice
                    key={stop.id}
                    title={stop.name || `Điểm đón ${stop.order + 1}`}
                    address={stop.address}
                    selected={pickupStopId === stop.id}
                    onPress={() => setPickupStopId(stop.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Grid thông tin nhanh */}
          <View className="flex-row bg-surface p-4 rounded-3xl mb-6 justify-between border border-border/40 shadow-sm">
            <View className="items-center flex-1 border-r border-slate-100">
              <Clock size={20} color="#3B82F6" />
              <AppText variant="caption" className="text-text-secondary mt-1">Giờ xuất phát</AppText>
              <AppText variant="bodySmall" weight="bold" className="text-text-primary mt-0.5">
                {format(new Date(ride.departureTime), 'HH:mm')}
              </AppText>
            </View>
            <View className="items-center flex-1 border-r border-slate-100">
              <Users size={20} color="#3B82F6" />
              <AppText variant="caption" className="text-text-secondary mt-1">Ghế trống</AppText>
              <AppText variant="bodySmall" weight="bold" className="text-text-primary mt-0.5">
                {ride.availableSeats} / {ride.totalSeats}
              </AppText>
            </View>
            <View className="items-center flex-1">
              <ShieldCheck size={20} color="#16A34A" />
              <AppText variant="caption" className="text-text-secondary mt-1">Cam kết</AppText>
              <AppText variant="bodySmall" weight="bold" className="text-confirmed mt-0.5">
                An toàn P2P
              </AppText>
            </View>
          </View>

          {/* DriverTrustCard: Thông tin tài xế và uy tín */}
          <AppText variant="body" weight="bold" className="text-text-primary mb-3">Tài xế của bạn</AppText>
          <View className="flex-row items-center bg-surface border border-border/40 p-4 rounded-3xl shadow-sm mb-10">
            <View className="w-14 h-14 bg-passenger-soft rounded-full items-center justify-center mr-4 border border-passenger/10 overflow-hidden">
              {ride.driver.avatar ? (
                <Image source={{ uri: ride.driver.avatar }} className="w-full h-full" />
              ) : (
                <AppText variant="h2" weight="bold" className="text-passenger">
                  {ride.driver.firstName.charAt(0)}
                </AppText>
              )}
            </View>
            <View className="flex-1">
              <AppText variant="body" weight="bold" className="text-text-primary">
                {ride.driver.firstName} {ride.driver.lastName}
              </AppText>
              <View className="flex-row items-center mt-1">
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <AppText variant="caption" weight="bold" className="text-driver ml-1 mr-2">
                  {ride.driver.rating?.toFixed(1) || '5.0'}
                </AppText>
                <ShieldCheck size={12} color="#16A34A" />
                <AppText variant="caption" className="text-confirmed ml-0.5 font-semibold">
                  Tài xế uy tín
                </AppText>
              </View>
            </View>
            <TouchableOpacity 
              className="p-3 bg-passenger-soft rounded-full border border-passenger/10 active:bg-passenger/20"
              accessibilityRole="button"
              accessibilityLabel="Nhắn tin trò chuyện với tài xế"
            >
              <MessageCircle size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View 
        style={{ paddingBottom: insets.bottom + 16 }}
        className="p-6 border-t border-border/40 bg-surface shadow-lg"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 mr-4">
            <AppText variant="bodySmall" weight="bold" className="text-text-primary">Số lượng ghế cần đặt</AppText>
            <AppText variant="caption" className="text-text-secondary mt-0.5">
              Mỗi hành khách đặt tối đa {ride.availableSeats} ghế
            </AppText>
          </View>
          <View className="flex-row items-center bg-slate-100 rounded-xl p-1 border border-border/40">
            <TouchableOpacity 
              onPress={() => setSeats(Math.max(1, seats - 1))}
              className="w-10 h-10 items-center justify-center active:bg-slate-200 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Giảm số ghế"
            >
              <AppText weight="bold" className="text-text-primary text-lg">-</AppText>
            </TouchableOpacity>
            <AppText weight="bold" className="px-4 text-text-primary text-base">{seats}</AppText>
            <TouchableOpacity 
              onPress={() => setSeats(Math.min(ride.availableSeats, seats + 1))}
              className="w-10 h-10 items-center justify-center active:bg-slate-200 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Tăng số ghế"
            >
              <AppText weight="bold" className="text-text-primary text-lg">+</AppText>
            </TouchableOpacity>
          </View>
        </View>

        <AppButton 
          title={ride.availableSeats === 0 ? 'Chuyến đi đã hết chỗ' : 'Đặt chỗ'}
          variant="passenger"
          onPress={() => bookingMutation.mutate()}
          isLoading={bookingMutation.isPending}
          disabled={bookingMutation.isPending || ride.availableSeats === 0}
          className="w-full shadow-md"
        />
      </View>
    </View>
  );
}

function PickupChoice({ title, address, selected, onPress }: { title: string; address: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}, ${address}`}
      onPress={onPress}
      className={`min-h-[72px] flex-row items-center px-4 py-3 border-b border-border/30 ${selected ? 'bg-passenger-soft' : 'bg-surface'}`}
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${selected ? 'bg-passenger' : 'bg-background'}`}>
        {selected ? <CircleDot size={20} color="#FFFFFF" /> : <MapPin size={20} color="#64748B" />}
      </View>
      <View className="flex-1 min-w-0">
        <AppText variant="bodySmall" weight="semibold" className={selected ? 'text-passenger' : 'text-text-primary'} numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" className={selected ? 'text-passenger-pressed' : 'text-text-secondary'} numberOfLines={2}>
          {address}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}
