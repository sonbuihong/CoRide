import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, ActivityIndicator, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, MapPin, Navigation, User, Star, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { bookingService } from '../../src/services/booking.service';
import { socketService } from '../../src/services/socket.service';
import { SocketEvents } from '@repo/shared';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { colors, radius, spacing } from '../../src/theme/tokens';
import { nativeShadows } from '../../src/theme/shadows';

export default function WaitingConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const hasNavigatedRef = useRef(false);
  
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0.5)).current;
  const successFadeAnim = useRef(new Animated.Value(0)).current;

  // Start pulse animation for waiting state
  useEffect(() => {
    if (!isConfirmed && !isRejected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 600, // Faster pulse for better UX responsiveness
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [isConfirmed, isRejected, pulseAnim]);

  // Query booking data
  // Polling as a fallback to socket
  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBookingById(id as string),
    enabled: !!id,
    refetchInterval: (!isConfirmed && !isRejected) ? 3000 : false,
  });

  // Socket setup
  useEffect(() => {
    if (!booking?.ride?.id) return;
    const rideId = booking.ride.id;
    
    const handleSocketEvent = (payload: any) => {
      if (payload && payload.bookingId && payload.bookingId !== id) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    };
    
    const events = [
      SocketEvents.BOOKING_CONFIRMED,
      SocketEvents.BOOKING_REJECTED,
      SocketEvents.BOOKING_CANCELLED,
    ];
    
    socketService.connect();
    socketService.emit(SocketEvents.RIDE_JOIN_ROOM, rideId);
    events.forEach((event) => socketService.on(event, handleSocketEvent));
    
    return () => {
      socketService.emit(SocketEvents.RIDE_LEAVE_ROOM, rideId);
      events.forEach((event) => socketService.off(event, handleSocketEvent));
    };
  }, [booking?.ride?.id, id, queryClient]);

  // Handle status changes
  useEffect(() => {
    if (!booking || hasNavigatedRef.current) return;
    
    const status = booking.status;
    
    if (status === 'CONFIRMED') {
      hasNavigatedRef.current = true;
      setIsConfirmed(true);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200, // UI-UX standard: exit faster than enter
          useNativeDriver: true,
        }),
        Animated.timing(successFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(successScaleAnim, {
          toValue: 1,
          friction: 5,   // Snappier spring physics
          tension: 60,   // More initial velocity
          useNativeDriver: true,
        })
      ]).start();

      setTimeout(() => {
        router.replace({ pathname: '/booking/[id]', params: { id } } as any);
      }, 1000);
      
    } else if (status === 'REJECTED' || status === 'CANCELLED') {
      hasNavigatedRef.current = true;
      setIsRejected(true);
    }
  }, [booking, fadeAnim, successFadeAnim, successScaleAnim, id, router]);

  const handleBack = () => {
    if (hasNavigatedRef.current) return;
    router.replace('/(passenger-tabs)/my-rides' as any);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]} accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="bodySmall" style={styles.loadingText}>Đang lấy thông tin đặt chỗ...</AppText>
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AlertCircle size={48} color={colors.danger} style={{ marginBottom: 16 }} />
        <AppText variant="h3" weight="semibold" style={{ marginBottom: 8 }}>Không thể tải thông tin đặt chỗ</AppText>
        <AppText variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 24 }}>Vui lòng kiểm tra lại kết nối của bạn.</AppText>
        <AppButton title="Thử lại" onPress={() => refetch()} />
        <AppButton title="Về trang chủ" variant="ghost" onPress={handleBack} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const driver = booking.ride?.driver;
  const driverName = driver ? [driver.firstName, driver.lastName].filter(Boolean).join(' ') : 'Tài xế CoRide';
  const vehicle = driver?.vehicle || booking.ride?.vehicle;
  const vehicleText = vehicle ? [vehicle.type === 'CAR' ? 'Ô tô' : vehicle.type === 'BIKE' ? 'Xe máy' : '', vehicle.color, vehicle.licensePlate].filter(Boolean).join(' · ') : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable 
          onPress={handleBack} 
          style={styles.backBtn} 
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          accessibilityHint="Quay lại danh sách chuyến đi của bạn"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="h3" weight="bold" style={styles.headerTitle} accessibilityRole="header">Đặt chỗ</AppText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          {isRejected ? (
            <View style={styles.heroStatus}>
              <View style={[styles.iconWrap, { backgroundColor: colors.dangerSoft }]}>
                <AlertCircle size={32} color={colors.danger} />
              </View>
              <AppText variant="h2" weight="bold" style={{ color: colors.danger, marginTop: 16, textAlign: 'center' }}>
                Tài xế không thể nhận chuyến
              </AppText>
              <AppText variant="body" style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                Yêu cầu đặt chỗ của bạn chưa được xác nhận. Vui lòng tìm một chuyến đi khác.
              </AppText>
            </View>
          ) : (
            <View style={styles.heroStatus}>
              <Animated.View style={[styles.statusLayer, { opacity: fadeAnim }]}>
                <View style={styles.iconWrapSuccess}>
                  <CheckCircle2 size={32} color={colors.success} />
                </View>
                <AppText variant="body" weight="semibold" style={{ color: colors.success, marginTop: 12, textAlign: 'center' }}>
                  Yêu cầu đã được gửi
                </AppText>
                
                <Animated.View style={{ opacity: pulseAnim, marginTop: 16 }}>
                  <AppText variant="h2" weight="bold" style={{ color: colors.primary, textAlign: 'center' }}>
                    Đang chờ tài xế xác nhận...
                  </AppText>
                </Animated.View>
              </Animated.View>

              <Animated.View style={[
                styles.statusLayer, 
                StyleSheet.absoluteFillObject, 
                { opacity: successFadeAnim, transform: [{ scale: successScaleAnim }] },
                { alignItems: 'center', justifyContent: 'center' }
              ]} pointerEvents="none">
                <View style={[styles.iconWrap, { backgroundColor: colors.successSoft }]}>
                  <CheckCircle2 size={40} color={colors.success} />
                </View>
                <AppText variant="h2" weight="bold" style={{ color: colors.success, marginTop: 16, textAlign: 'center' }}>
                  Tài xế đã xác nhận!
                </AppText>
                <AppText variant="body" style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                  Chuyến đi của bạn đã sẵn sàng.
                </AppText>
              </Animated.View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.routeContainer}>
            <View style={styles.routeTimeline}>
              <View style={styles.routeDotTop} />
              <View style={styles.routeLine} />
              <View style={styles.routeDotBottom} />
            </View>
            <View style={styles.routeDetails}>
              <View style={styles.routePoint}>
                <AppText variant="body" weight="semibold" style={{ color: colors.textPrimary }}>
                  {booking.pickupAddress || booking.ride?.origin}
                </AppText>
              </View>
              <View style={styles.routeSpacing} />
              <View style={styles.routePoint}>
                <AppText variant="body" weight="semibold" style={{ color: colors.textPrimary }}>
                  {booking.dropoffAddress || booking.ride?.destination}
                </AppText>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.metaRow}>
            <AppText variant="bodySmall" weight="semibold" style={{ color: colors.textSecondary }}>
              {booking.ride?.departureTime ? format(new Date(booking.ride.departureTime), 'HH:mm · EEE, dd/MM', { locale: vi }) : ''}
            </AppText>
            <AppText variant="bodySmall" style={{ color: colors.textMuted }}>•</AppText>
            <AppText variant="bodySmall" weight="semibold" style={{ color: colors.textSecondary }}>
              {booking.seats} ghế
            </AppText>
          </View>
        </View>

        {driver && (
          <View style={styles.card}>
            <View style={styles.driverRow}>
              {driver.avatarUrl || driver.avatar ? (
                <Image source={{ uri: driver.avatarUrl || driver.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <User size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.driverInfo}>
                <View style={styles.driverNameRow}>
                  <AppText variant="body" weight="bold" style={{ color: colors.textPrimary }}>
                    {driverName}
                  </AppText>
                  {typeof driver.rating === 'number' && driver.rating > 0 && (
                    <View style={styles.ratingBadge}>
                      <Star size={12} color="#D97706" fill="#D97706" />
                      <AppText variant="caption" weight="bold" style={{ color: '#D97706', marginLeft: 4 }}>
                        {driver.rating.toFixed(1)}
                      </AppText>
                    </View>
                  )}
                </View>
                {vehicleText ? (
                  <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                    {vehicleText}
                  </AppText>
                ) : null}
              </View>
            </View>
            
            {!isRejected && !isConfirmed && (
              <View style={styles.waitingFooter}>
                <AppText variant="caption" style={{ color: colors.textTertiary, textAlign: 'center' }}>
                  Chúng tôi sẽ thông báo ngay khi tài xế phản hồi.
                </AppText>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {isRejected && (
        <View style={styles.footerBar}>
          <AppButton 
            title="Tìm chuyến khác" 
            variant="passenger"
            onPress={() => router.replace('/(passenger-tabs)' as any)}
            style={{ marginBottom: 12 }}
          />
          <AppButton 
            title="Về trang chủ" 
            variant="ghost"
            onPress={() => router.replace('/(passenger-tabs)' as any)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...nativeShadows.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  heroStatus: {
    alignItems: 'center',
    width: '100%',
    minHeight: 160,
  },
  statusLayer: {
    alignItems: 'center',
    width: '100%',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSuccess: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...nativeShadows.card,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  routeTimeline: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  routeDotTop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.mapPickup,
    marginTop: 6,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  routeDotBottom: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.mapDestination,
    marginBottom: 6,
  },
  routeDetails: {
    flex: 1,
  },
  routePoint: {
    justifyContent: 'center',
    minHeight: 24,
  },
  routeSpacing: {
    height: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  waitingFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerBar: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...nativeShadows.card,
  }
});
