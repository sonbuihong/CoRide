import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Navigation, Route } from 'lucide-react-native';

import { ActiveRideMap } from '../../src/components/ActiveRideMap';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { bookingService } from '../../src/services/booking.service';
import { getDirectionsThroughStops } from '../../src/services/direction.service';
import { rideService } from '../../src/services/ride.service';
import { colors, radius, spacing } from '../../src/theme/tokens';
import { type ActiveRideViewModel, formatRideDistance, formatRideDuration, formatTripDistance, formatTripDuration, getTripStops } from '../../src/features/trip-flow/trip-flow';
import { TripScreen, TripScreenHeader } from '../../src/features/trip-flow/TripScreen';

export default function RouteDetailScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const rideQuery = useQuery({ queryKey: ['ride', rideId], queryFn: () => rideService.getRideById(rideId), enabled: Boolean(rideId) });
  const bookingsQuery = useQuery({ queryKey: ['driver-bookings'], queryFn: bookingService.getDriverBookings });

  const ride = useMemo(() => {
    if (!rideQuery.data) return null;
    return {
      ...rideQuery.data,
      origin: rideQuery.data.origin || rideQuery.data.departure,
      originLat: rideQuery.data.departureCoords?.latitude,
      originLng: rideQuery.data.departureCoords?.longitude,
      destinationLat: rideQuery.data.destinationCoords?.latitude,
      destinationLng: rideQuery.data.destinationCoords?.longitude,
      bookings: (bookingsQuery.data?.bookings || []).filter((booking) => booking.ride.id === rideId),
    } as ActiveRideViewModel;
  }, [bookingsQuery.data?.bookings, rideId, rideQuery.data]);

  const origin = useMemo(() => ride?.originLat != null && ride.originLng != null ? { latitude: ride.originLat, longitude: ride.originLng } : null, [ride?.originLat, ride?.originLng]);
  const destination = useMemo(() => ride?.destinationLat != null && ride.destinationLng != null ? { latitude: ride.destinationLat, longitude: ride.destinationLng } : null, [ride?.destinationLat, ride?.destinationLng]);

  useEffect(() => {
    if (!origin || !destination) return;
    const points = ride
      ? getTripStops(ride).map((stop) => stop.coordinate).filter((point): point is { latitude: number; longitude: number } => Boolean(point))
      : [origin, destination];
    void getDirectionsThroughStops(points).then((result) => {
      if (!result) return;
      setRouteCoords(result.polylineCoords);
      setDistance(result.distance);
      setDuration(result.duration);
    }).catch(() => setRouteCoords([origin, destination]));
  }, [destination, origin, ride]);

  const markers = useMemo(() => ride ? getTripStops(ride).filter((stop) => stop.booking && stop.coordinate).map((stop) => ({
    bookingId: stop.booking!.id,
    coordinate: stop.coordinate!,
    isActive: stop.state === 'CURRENT',
    kind: stop.kind === 'DROPOFF' ? 'DROPOFF' as const : 'PICKUP' as const,
    label: stop.title,
  })) : [], [ride]);

  if (rideQuery.isError || bookingsQuery.isError) {
    return (
      <TripScreen>
        <TripScreenHeader title="Chi tiết lộ trình" onBack={() => router.back()} />
        <ErrorState
          message="Không thể tải chi tiết lộ trình."
          onRetry={() => void Promise.all([rideQuery.refetch(), bookingsQuery.refetch()])}
        />
      </TripScreen>
    );
  }

  if (!ride || !origin || !destination) {
    return <TripScreen><TripScreenHeader title="Chi tiết lộ trình" onBack={() => router.back()} /><View style={styles.loading}><SkeletonLoader height="55%" /><SkeletonLoader height={180} className="mt-4" borderRadius={18} /></View></TripScreen>;
  }

  const stops = getTripStops(ride);
  const navigate = () => {
    const target = `${destination.latitude},${destination.longitude}`;
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${target}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=driving`;
    void Linking.openURL(url);
  };

  return (
    <TripScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <TripScreenHeader title="Chi tiết lộ trình" onBack={() => router.back()} />
      <View style={styles.map}>
        <ActiveRideMap originCoords={origin} destinationCoords={destination} routeCoords={routeCoords} pickupMarkers={markers} />
      </View>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.metrics}>
          <View style={styles.metric}><Route size={19} color={colors.info} /><AppText variant="title" weight="bold">{distance ? formatTripDistance(distance) : formatRideDistance(ride.distance)}</AppText></View>
          <View style={styles.metric}><Clock3 size={19} color={colors.info} /><AppText variant="title" weight="bold">{duration ? formatTripDuration(duration) : formatRideDuration(ride.duration)}</AppText></View>
        </View>
        <ScrollView style={styles.stopList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {stops.map((stop, index) => (
            <View key={stop.id} style={styles.stopRow}>
              <View style={styles.rail}>
                <View style={[styles.dot, (stop.kind === 'DROPOFF' || stop.kind === 'DESTINATION') && styles.dotRed]} />
                {index < stops.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.stopCopy}><AppText weight={stop.state === 'CURRENT' ? 'bold' : 'medium'}>{stop.title}</AppText><AppText variant="caption" numberOfLines={1}>{stop.address}</AppText></View>
            </View>
          ))}
        </ScrollView>
        <AppButton variant="driver" title="Bắt đầu điều hướng" leftIcon={<Navigation size={19} color={colors.surface} style={styles.buttonIcon} />} onPress={navigate} />
      </View>
    </TripScreen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, padding: spacing.screen },
  map: { flex: 1, minHeight: 250 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, height: '54%', marginTop: -24, paddingBottom: spacing.lg, paddingHorizontal: spacing.screen, paddingTop: spacing.sm },
  handle: { alignSelf: 'center', backgroundColor: colors.borderStrong, borderRadius: radius.full, height: 5, marginBottom: spacing.md, width: 42 },
  metrics: { flexDirection: 'row', gap: spacing.xl, marginBottom: spacing.md },
  metric: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  stopList: { flex: 1, marginBottom: spacing.md },
  stopRow: { flexDirection: 'row', minHeight: 48 },
  rail: { alignItems: 'center', width: 24 },
  dot: { backgroundColor: colors.success, borderRadius: radius.full, height: 11, marginTop: 5, width: 11 },
  dotRed: { backgroundColor: colors.danger },
  line: { backgroundColor: colors.borderStrong, flex: 1, width: 2 },
  stopCopy: { flex: 1, paddingBottom: spacing.sm, paddingLeft: spacing.sm },
  buttonIcon: { marginRight: spacing.sm },
});
