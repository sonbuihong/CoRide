import os

file_path = 'app/ride/[id].tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import React, { useCallback, useMemo, useState } from 'react';",
    "import React, { useCallback, useMemo, useState, useRef } from 'react';"
)

if "DraggableBottomSheet" not in content:
    content = content.replace(
        "import { AppText } from '../../src/components/ui/AppText';",
        "import { AppText } from '../../src/components/ui/AppText';\nimport { DraggableBottomSheet, type DraggableBottomSheetRef } from '../../src/components/ui/DraggableBottomSheet';\nimport { FloatingMyLocation } from '../../src/components/ui/FloatingMyLocation';"
    )

if "const SNAP_COLLAPSED" not in content:
    content = content.replace(
        "const currency = (value: number)",
        "const SNAP_COLLAPSED = 0;\nconst SNAP_MEDIUM = 1;\nconst SNAP_EXPANDED = 2;\nconst SNAP_POINTS = [0.34, 0.62, 1];\n\nconst currency = (value: number)"
    )

# 2. Extract PassengerRideView
start_str = "function PassengerRideView() {"
end_str = "function PickupChoice"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    # Walk back to find the comment before PickupChoice
    while content[end_idx-1] != '\n' and content[end_idx-1] != '/' and end_idx > start_idx:
        end_idx -= 1
    # Walk back more to include the line break
    while content[end_idx-1] != '\n' and end_idx > start_idx:
        end_idx -= 1
    
    # We will replace from start_idx to end_idx with our new PassengerRideView implementation
    new_passenger_view = """function PassengerRideView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [seats, setSeats] = useState(1);
  const [pickupStopId, setPickupStopId] = useState<string | undefined>();
  const [snapIndex, setSnapIndex] = useState(SNAP_COLLAPSED);
  const [mapRoute, setMapRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  
  const sheetRef = useRef<DraggableBottomSheetRef>(null);
  const mapRef = useRef<MapView>(null);
  const { height: screenHeight } = useWindowDimensions();
  const animatedPosition = useSharedValue(screenHeight);

  // Lazy import
  const { MatchExplanation } = require('../../src/components/MatchExplanation');

  const { data: ride, isLoading } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideService.getRideById(id as string),
    enabled: !!id,
  });

  const fetchRoute = useCallback(async () => {
    if (!ride?.departureCoords || !ride?.destinationCoords) return;
    try {
      const result = await getDirections(
        { latitude: ride.departureCoords.latitude, longitude: ride.departureCoords.longitude },
        { latitude: ride.destinationCoords.latitude, longitude: ride.destinationCoords.longitude },
      );
      if (result?.polylineCoords) {
        setMapRoute(result.polylineCoords);
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(result.polylineCoords, {
            edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
            animated: true
          });
        }, 500);
      }
    } catch {
      // ignore
    }
  }, [ride?.departureCoords, ride?.destinationCoords]);

  React.useEffect(() => {
    void fetchRoute();
  }, [fetchRoute]);

  const bookingMutation = useMutation({
    mutationFn: () => bookingService.createBooking(id as string, seats, pickupStopId),
    onSuccess: (result) => {
      const confirmed = result.booking?.status === 'CONFIRMED';
      Alert.alert(
        confirmed ? 'Đã đặt chỗ' : 'Đã gửi yêu cầu',
        confirmed
          ? 'Chỗ của bạn đã được xác nhận ngay.'
          : 'Ghế được giữ trong 15 phút để tài xế phản hồi.',
        [{ text: 'OK', onPress: () => router.replace('/(passenger-tabs)/my-rides' as any) }],
      );
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thực hiện đặt chỗ');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navigationPassenger} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.centeredPad}>
        <AppText variant="body">Không tìm thấy thông tin chuyến đi</AppText>
        <AppButton title="Quay lại" variant="outline" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const isOngoing = ride.status === 'ONGOING';
  const departureDateFormatted = format(new Date(ride.departureTime), "HH:mm • EEEE, dd/MM", { locale: vi });
  const pricePerSeat = ride.pricePerSeat;
  const totalPrice = pricePerSeat * seats;
  const canBook = ride.status === 'SCHEDULED' && ride.availableSeats >= seats;
  const ctaLabel = canBook ? (ride.autoApprove ? 'Đặt ngay' : 'Gửi yêu cầu') : 'Không thể đặt';

  const mapRegion = ride.departureCoords && ride.destinationCoords
    ? {
        latitude: (ride.departureCoords.latitude + ride.destinationCoords.latitude) / 2,
        longitude: (ride.departureCoords.longitude + ride.destinationCoords.longitude) / 2,
        latitudeDelta: Math.abs(ride.departureCoords.latitude - ride.destinationCoords.latitude) * 2 + 0.05,
        longitudeDelta: Math.abs(ride.departureCoords.longitude - ride.destinationCoords.longitude) * 2 + 0.05,
      }
    : { latitude: 21.0285, longitude: 105.8542, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  const sheetFooter = (
    <View style={pStyles.ctaContainer}>
      <View style={pStyles.ctaPriceRow}>
        <AppText variant="caption" style={pStyles.ctaTotalLabel}>Tổng cộng</AppText>
        <AppText weight="bold" style={pStyles.ctaTotal}>{formatVnd(totalPrice)}</AppText>
      </View>
      <AppButton
        title={ctaLabel}
        variant="passenger"
        onPress={() => bookingMutation.mutate()}
        isLoading={bookingMutation.isPending}
        disabled={bookingMutation.isPending || !canBook}
        style={pStyles.ctaBtn}
      />
    </View>
  );

  return (
    <View style={pStyles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={StyleSheet.absoluteFill}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={mapRegion}
          mapPadding={{ bottom: screenHeight * SNAP_POINTS[0] + 40, top: insets.top + 60, left: 24, right: 24 }}
          toolbarEnabled={false}
          showsUserLocation={true}
          showsMyLocationButton={false}
          accessibilityLabel="Bản đồ hành trình"
          onMapReady={() => {
            if (ride?.departureCoords && ride?.destinationCoords) {
              mapRef.current?.fitToCoordinates([ride.departureCoords, ride.destinationCoords], {
                edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                animated: true
              });
            }
          }}
        >
          {mapRoute.length > 1 && (
            <Polyline
              coordinates={mapRoute}
              strokeColor={colors.navigationPassenger || '#0071E3'}
              strokeWidth={4}
            />
          )}
          {ride.departureCoords && ride.destinationCoords && (
            <>
              <Marker coordinate={ride.departureCoords} title="Điểm đi" pinColor="#0F766E" />
              <Marker coordinate={ride.destinationCoords} title="Điểm đến" pinColor="#DC2626" />
            </>
          )}
        </MapView>
      </View>
      <FloatingMyLocation 
        animatedPosition={animatedPosition} 
        onRecenter={(loc) => {
          mapRef.current?.animateCamera({ center: loc });
        }} 
      />

      <View style={[pStyles.floatHeader, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [pStyles.floatBtn, pressed && pStyles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={24} />
        </Pressable>
      </View>

      <DraggableBottomSheet
        ref={sheetRef}
        snapPoints={SNAP_POINTS}
        initialSnapIndex={SNAP_COLLAPSED}
        onSnapChange={(idx) => setSnapIndex(idx)}
        footer={sheetFooter}
        animatedPosition={animatedPosition}
      >
        <View style={pStyles.sheetPadding}>
          
          <View style={pStyles.statusRow}>
            <View style={pStyles.statusLeft}>
              <Navigation size={18} color={colors.navigationPassenger || '#0071E3'} />
              <AppText weight="bold" style={pStyles.statusText}>
                {rideStatusMeta(ride.status).label || 'Thông tin chuyến đi'}
              </AppText>
            </View>
            <AppText variant="caption" style={pStyles.statusRight}>
              {departureDateFormatted}
            </AppText>
          </View>

          <View style={pStyles.summaryCard}>
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#0F766E', marginRight: 12 }} />
                <AppText style={{ flex: 1, fontSize: 14, color: '#111827' }} numberOfLines={1}>{ride.departure}</AppText>
              </View>
              <View style={{ width: 2, height: 16, backgroundColor: '#E5E7EB', marginLeft: 5, marginVertical: 2 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#DC2626', marginRight: 12 }} />
                <AppText style={{ flex: 1, fontSize: 14, color: '#111827' }} numberOfLines={1}>{ride.destination}</AppText>
              </View>
            </View>
            
            <View style={pStyles.summaryCardDivider} />
            
            <View style={pStyles.cardTagsRow}>
              <View style={pStyles.cardTag}>
                <View style={pStyles.cardTagIcon}>
                  <Users size={16} color={colors.navigationPassenger || '#0071E3'} strokeWidth={2} />
                </View>
                <AppText variant="caption" weight="medium" style={pStyles.cardTagText}>
                  {ride.availableSeats} khách
                </AppText>
              </View>
              
              {ride.originDistanceKm ? (
                <View style={pStyles.cardTag}>
                  <View style={pStyles.cardTagIcon}>
                    <MapPin size={16} color={colors.navigationPassenger || '#0071E3'} strokeWidth={2} />
                  </View>
                  <AppText variant="caption" weight="medium" style={pStyles.cardTagText}>
                    {ride.originDistanceKm} km
                  </AppText>
                </View>
              ) : null}

              <View style={pStyles.cardTag}>
                <View style={pStyles.cardTagIcon}>
                  <Wallet size={16} color={colors.navigationPassenger || '#0071E3'} strokeWidth={2} />
                </View>
                <AppText variant="caption" weight="medium" style={pStyles.cardTagText}>
                  {formatVnd(pricePerSeat)}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={pStyles.divider} />

        {snapIndex > SNAP_COLLAPSED && (
          <View style={pStyles.sheetPadding}>
            <AppText variant="caption" weight="semibold" style={pStyles.sectionLabel}>THÔNG TIN TÀI XẾ</AppText>
            <View style={pStyles.driverRow}>
              <View style={pStyles.driverAvatar}>
                <Image source={{ uri: ride.driver?.avatarUrl || 'https://via.placeholder.com/150' }} style={pStyles.driverAvatarImg} />
              </View>
              <View style={pStyles.driverInfo}>
                <AppText weight="semibold" style={pStyles.driverName}>{ride.driver?.fullName || 'Tài xế'}</AppText>
                <View style={pStyles.driverMeta}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <AppText variant="caption" style={pStyles.ratingText}>{ride.driver?.rating?.toFixed(1) || '5.0'}</AppText>
                  <AppText variant="caption" style={{ color: '#9CA3AF' }}>•</AppText>
                  <ShieldCheck size={14} color="#16A34A" />
                  <AppText variant="caption" style={pStyles.verifiedText}>Đã xác minh</AppText>
                </View>
              </View>
              <Pressable style={pStyles.chatBtn} onPress={() => router.push(\`/chat/\${ride.id}\` as any)}>
                <MessageCircle size={20} color={colors.navigationPassenger || '#0071E3'} />
              </Pressable>
            </View>
          </View>
        )}

        <View style={pStyles.divider} />

        {snapIndex > SNAP_COLLAPSED && (
          <View style={pStyles.sheetPadding}>
            <AppText variant="caption" weight="semibold" style={pStyles.sectionLabel}>THÔNG TIN ĐẶT CHỖ</AppText>
            
            <View style={pStyles.seatRow}>
              <View style={pStyles.seatLabelCol}>
                <AppText weight="medium" style={pStyles.seatLabelText}>Số ghế cần đặt</AppText>
                <AppText variant="caption" style={pStyles.seatHint}>Tối đa {ride.availableSeats} ghế</AppText>
              </View>
              <View style={pStyles.seatPicker}>
                <Pressable
                  onPress={() => setSeats(Math.max(1, seats - 1))}
                  style={pStyles.seatBtn}
                  disabled={seats <= 1}
                >
                  <AppText style={[pStyles.seatBtnText, seats <= 1 && pStyles.seatBtnDisabled]}>-</AppText>
                </Pressable>
                <AppText weight="bold" style={pStyles.seatCount}>{seats}</AppText>
                <Pressable
                  onPress={() => setSeats(Math.min(ride.availableSeats, seats + 1))}
                  style={pStyles.seatBtn}
                  disabled={seats >= ride.availableSeats}
                >
                  <AppText style={[pStyles.seatBtnText, seats >= ride.availableSeats && pStyles.seatBtnDisabled]}>+</AppText>
                </Pressable>
              </View>
            </View>
            
            {ride.stops && ride.stops.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <AppText variant="caption" style={pStyles.stopHint}>Chọn điểm đón trên tuyến (Tùy chọn):</AppText>
                <View style={pStyles.stopsCard}>
                  <PickupChoice
                    title="Điểm xuất phát của tài xế"
                    address={ride.departure ?? ''}
                    selected={pickupStopId === undefined}
                    onPress={() => setPickupStopId(undefined)}
                  />
                  {ride.stops.map(stop => (
                    <PickupChoice
                      key={stop.id}
                      title={stop.name}
                      address={stop.address ?? ''}
                      selected={pickupStopId === stop.id}
                      onPress={() => setPickupStopId(stop.id)}
                    />
                  ))}
                </View>
              </View>
            )}
            
            {ride.notes && (
              <View style={{ marginTop: 16 }}>
                <AppText variant="caption" weight="semibold" style={pStyles.sectionLabel}>GHI CHÚ CỦA TÀI XẾ</AppText>
                <AppText variant="bodySmall" style={{ color: '#4B5563' }}>{ride.notes}</AppText>
              </View>
            )}
          </View>
        )}

      </DraggableBottomSheet>
    </View>
  );
}

// //"""
    
    content = content[:start_idx] + new_passenger_view + content[end_idx:]

# 3. Add styles
if "statusRow: {" not in content:
    styles_str = """
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    color: colors.navigationPassenger || '#0071E3',
    fontSize: 16,
  },
  statusRight: {
    color: colors.textTertiary,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCardDivider: {
    height: 1,
    backgroundColor: colors.border || '#F3F4F6',
    marginVertical: spacing.sm,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  cardTag: {
    alignItems: 'center',
    flex: 1,
  },
  cardTagIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.navigationPassengerSoft || '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTagText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
"""
    content = content.replace("  quickInfoBar: {", styles_str + "  quickInfoBar: {")

# 4. Format VND function if not exist
if "formatVnd" not in content:
    content = content.replace("const currency = (value: number)", "const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')} đ`;\nconst currency = (value: number)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done rewrite")
