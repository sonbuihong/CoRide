import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useQuery } from '@tanstack/react-query';
import type { PlaceSearchResult } from '@repo/shared';
import { format } from 'date-fns';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, BusFront, CalendarDays, Check, ChevronRight, Clock3, Coffee, GraduationCap,
  Heart, History, Hospital, Hotel, Landmark, Lightbulb, Map, MapPin, Minus, Plane,
  Plus, Search, RefreshCw, ShoppingBag, TrainFront, Utensils, X,
} from 'lucide-react-native';
import {
  ActivityIndicator, BackHandler, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable,
  ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../src/components/ui/AppButton';
import { AppText } from '../src/components/ui/AppText';
import { PlaceSelectionMapModal } from '../src/components/PlaceSelectionMapModal';
import { useAuth } from '../src/hooks/useAuth';
import { createGoongSessionToken, getPlaceDetailMobile, getReverseGeocodeMobile, searchPlacesMobile, type GoongApiVersion } from '../src/services/goong.service';
import { tripService } from '../src/services/trip.service';
import { colors, layout, radius, spacing } from '../src/theme/tokens';

type Coordinates = { latitude: number; longitude: number };
type PickerMode = 'date' | 'time' | null;
type SelectedPlace = { name: string; address: string; coords: Coordinates };
type RecentPlace = SelectedPlace & { id: string };

const initialTime = () => {
  const next = new Date(Date.now() + 60 * 60 * 1000);
  next.setSeconds(0, 0);
  return next;
};

const pad = (value: number) => String(value).padStart(2, '0');
const dateTimeLocalValue = (value: Date) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;

const shortPlaceName = (name?: string, address?: string) =>
  name?.trim() || address?.split(',')[0]?.trim() || 'Vị trí hiện tại';

const distanceLabel = (meters?: number) => {
  if (meters == null) return undefined;
  return meters < 1000 ? `${Math.max(1, Math.round(meters))} m` : `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
};

const getPlaceKind = (prediction: PlaceSearchResult) => {
  const types = new Set(prediction.type ? [prediction.type.toLowerCase()] : []);
  const value = `${prediction.name} ${prediction.address}`.toLowerCase();
  if (types.has('bus_station')) return { label: 'Bến xe', Icon: BusFront };
  if (types.has('train_station') || types.has('railway_station') || types.has('transit_station')) return { label: 'Nhà ga', Icon: TrainFront };
  if (types.has('airport')) return { label: 'Sân bay', Icon: Plane };
  if (types.has('shopping_mall') || types.has('supermarket')) return { label: 'Trung tâm mua sắm', Icon: ShoppingBag };
  if (types.has('restaurant')) return { label: 'Nhà hàng', Icon: Utensils };
  if (/bến xe|bus station|bus_station/.test(value)) return { label: 'Bến xe', Icon: BusFront };
  if (/nhà ga|\bga\b|railway|train/.test(value)) return { label: 'Nhà ga', Icon: TrainFront };
  if (/sân bay|airport/.test(value)) return { label: 'Sân bay', Icon: Plane };
  if (/trung tâm thương mại|mall|shopping|siêu thị|supermarket/.test(value)) return { label: 'Trung tâm mua sắm', Icon: ShoppingBag };
  if (/nhà hàng|restaurant|quán ăn|ẩm thực/.test(value)) return { label: 'Nhà hàng', Icon: Utensils };
  if (/cà phê|cafe|coffee/.test(value)) return { label: 'Quán cà phê', Icon: Coffee };
  if (/khách sạn|hotel|resort/.test(value)) return { label: 'Khách sạn', Icon: Hotel };
  if (/bệnh viện|hospital|clinic|phòng khám/.test(value)) return { label: 'Y tế', Icon: Hospital };
  if (/trường|university|college|school/.test(value)) return { label: 'Trường học', Icon: GraduationCap };
  if (/bảo tàng|museum|landmark|di tích/.test(value)) return { label: 'Địa danh', Icon: Landmark };
  return { label: 'Địa điểm', Icon: MapPin };
};

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const autocompleteRequest = useRef(0);
  const detailRequest = useRef(0);
  const originInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);
  const addressVersionRef = useRef<GoongApiVersion>('v2');
  const sessionTokenRef = useRef(createGoongSessionToken());
  const [origin, setOrigin] = useState<SelectedPlace>();
  const [originLoading, setOriginLoading] = useState(true);
  const [originError, setOriginError] = useState<string>();
  const [originFromGps, setOriginFromGps] = useState(false);
  const [locationAttempt, setLocationAttempt] = useState(0);
  const [openSettingsForLocation, setOpenSettingsForLocation] = useState(false);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlaceSearchResult[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string>();
  const [destination, setDestination] = useState<SelectedPlace>();
  const [editingOrigin, setEditingOrigin] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [departureTime, setDepartureTime] = useState(initialTime);
  const [seats, setSeats] = useState(1);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [activeTab, setActiveTab] = useState<'suggested' | 'recent'>('suggested');
  const [showMergedAddress, setShowMergedAddress] = useState(true);
  const [originUtilityNotice, setOriginUtilityNotice] = useState<string>();
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapPickerMode, setMapPickerMode] = useState<'origin' | 'destination'>('destination');
  const [mapPickerInitial, setMapPickerInitial] = useState<Coordinates>();
  const addressVersion: GoongApiVersion = showMergedAddress ? 'v2' : 'v1';
  addressVersionRef.current = addressVersion;

  const historyQuery = useQuery({
    queryKey: ['trip-history', 'search-destinations'],
    queryFn: () => tripService.getTripHistory(1, 12),
    retry: false,
  });

  const suggestedPlacesQuery = useQuery({
    queryKey: ['suggested-places', addressVersion, origin?.coords.latitude, origin?.coords.longitude],
    enabled: Boolean(origin),
    retry: false,
    queryFn: async () => {
      if (!origin) return [];
      const location = `${origin.coords.latitude},${origin.coords.longitude}`;
      const groups = await Promise.all(['Bến xe', 'Nhà ga', 'Trung tâm thương mại', 'Nhà hàng'].map((term) =>
        searchPlacesMobile(term, { limit: 3, location, version: addressVersion, sessionToken: sessionTokenRef.current }),
      ));
      const seen = new Set<string>();
      return groups.flat().filter((place) => {
        if (seen.has(place.id)) return false;
        seen.add(place.id);
        return true;
      }).slice(0, 8);
    },
  });

  const recentPlaces = useMemo<RecentPlace[]>(() => {
    const trips = Array.isArray(historyQuery.data?.trips) ? historyQuery.data.trips : [];
    const seen = new Set<string>();
    return trips.flatMap((trip: any) => {
      const address = trip.destAddress || trip.destination || '';
      const latitude = Number(trip.destLat ?? trip.destinationLat);
      const longitude = Number(trip.destLng ?? trip.destinationLng);
      const isCompletedPassengerTrip = trip.status === 'COMPLETED' && (trip.passengerId === user?.id || trip.passenger?.id === user?.id);
      if (!isCompletedPassengerTrip || !address || !Number.isFinite(latitude) || !Number.isFinite(longitude) || seen.has(address)) return [];
      seen.add(address);
      return [{ id: String(trip.id), name: shortPlaceName(undefined, address), address, coords: { latitude, longitude } }];
    }).slice(0, 8);
  }, [historyQuery.data, user?.id]);

  useEffect(() => {
    let mounted = true;
    const locate = async () => {
      setOriginLoading(true);
      setOriginError(undefined);
      setOpenSettingsForLocation(false);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          if (mounted) setOpenSettingsForLocation(!permission.canAskAgain);
          if (mounted) setOriginError('Cần quyền vị trí để xác định điểm đi của bạn.');
          return;
        }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = current.coords;
        const place = await getReverseGeocodeMobile(latitude, longitude, addressVersionRef.current);
        let address = place?.address;
        let name = place?.name;
        if (!address) {
          const fallback = (await Location.reverseGeocodeAsync({ latitude, longitude }))[0];
          if (fallback) {
            name = fallback.name || fallback.street || undefined;
            address = [fallback.name, fallback.street, fallback.district, fallback.city, fallback.region]
              .filter((part, index, parts): part is string => Boolean(part) && parts.indexOf(part) === index)
              .join(', ');
          }
        }
        if (!address) throw new Error('missing address');
        if (mounted) {
          setOrigin({ name: shortPlaceName(name, address), address, coords: { latitude, longitude } });
          setOriginFromGps(true);
        }
      } catch {
        if (mounted) setOriginError('Không thể lấy vị trí hiện tại. Hãy bật GPS và mở lại trang.');
      } finally {
        if (mounted) setOriginLoading(false);
      }
    };
    locate();
    return () => { mounted = false; };
  }, [locationAttempt]);

  useEffect(() => {
    if ((!editingOrigin && destination) || query.trim().length < 2) {
      autocompleteRequest.current += 1;
      setPredictions([]);
      setSuggestionLoading(false);
      setSuggestionError(undefined);
      return;
    }
    const timer = setTimeout(async () => {
      const requestId = ++autocompleteRequest.current;
      setSuggestionLoading(true);
      setSuggestionError(undefined);
      try {
        const results = await searchPlacesMobile(query, {
          limit: 10,
          location: origin ? `${origin.coords.latitude},${origin.coords.longitude}` : undefined,
          version: addressVersion,
          sessionToken: sessionTokenRef.current,
        });
        if (requestId === autocompleteRequest.current) setPredictions(results);
      } catch {
        if (requestId === autocompleteRequest.current) {
          setPredictions([]);
          setSuggestionError('Không thể tải gợi ý. Kiểm tra kết nối rồi thử lại.');
        }
      } finally {
        if (requestId === autocompleteRequest.current) setSuggestionLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timer); autocompleteRequest.current += 1; };
  }, [addressVersion, destination, editingOrigin, origin, query]);

  const selectPrediction = async (prediction: PlaceSearchResult) => {
    const requestId = ++detailRequest.current;
    setSuggestionLoading(true);
    setSuggestionError(undefined);
    try {
      const detail = prediction.latitude != null && prediction.longitude != null
        ? null
        : await getPlaceDetailMobile(prediction.placeId || '', addressVersion, sessionTokenRef.current);
      if (requestId !== detailRequest.current) return;
      const point = prediction.latitude != null && prediction.longitude != null
        ? { lat: prediction.latitude, lng: prediction.longitude }
        : detail?.geometry?.location;
      if (!point) throw new Error('missing coordinates');
      const selected = {
        name: detail?.name || prediction.name,
        address: detail?.formatted_address || prediction.address,
        coords: { latitude: point.lat, longitude: point.lng },
      };
      setMapPickerMode(editingOrigin ? 'origin' : 'destination');
      setMapPickerInitial(selected.coords);
      Keyboard.dismiss();
      setMapPickerOpen(true);
      setPredictions([]);
      sessionTokenRef.current = createGoongSessionToken();
    } catch {
      if (requestId === detailRequest.current) setSuggestionError('Không thể xác định tọa độ địa điểm này. Hãy chọn gợi ý khác.');
    } finally {
      if (requestId === detailRequest.current) setSuggestionLoading(false);
    }
  };

  const changeQuery = (text: string) => {
    detailRequest.current += 1;
    if (!editingOrigin) setDestination(undefined);
    setQuery(text);
  };

  const handleDateTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    const mode = pickerMode;
    if (Platform.OS === 'android' || event.type === 'dismissed') setPickerMode(null);
    if (!mode || event.type === 'dismissed' || !selected) return;
    const next = new Date(departureTime);
    if (mode === 'date') next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    if (next.getTime() > Date.now()) setDepartureTime(next);
  };

  const submit = () => {
    if (!origin || !destination) return;
    Keyboard.dismiss();
    router.push({ pathname: '/search-results' as any, params: {
      origin: origin.address, destination: destination.address,
      originLat: String(origin.coords.latitude), originLng: String(origin.coords.longitude),
      destinationLat: String(destination.coords.latitude), destinationLng: String(destination.coords.longitude),
      date: departureTime.toISOString(), seats: String(seats),
    } });
  };

  const displayRows = query.trim().length >= 2 && (editingOrigin || !destination);
  const quickTerms = ['Bến xe', 'Nhà ga', 'Trung tâm thương mại', 'Nhà hàng'];

  const recoverLocation = () => {
    if (openSettingsForLocation) Linking.openSettings();
    else setLocationAttempt((value) => value + 1);
  };

  const beginOriginEdit = () => {
    detailRequest.current += 1;
    setEditingOrigin(true);
    setSuggestionError(undefined);
    setPredictions([]);
    setOriginUtilityNotice(undefined);
    sessionTokenRef.current = createGoongSessionToken();
    setQuery(origin?.address || origin?.name || '');
  };

  const exitOriginEdit = useCallback(() => {
    detailRequest.current += 1;
    autocompleteRequest.current += 1;
    setEditingOrigin(false);
    setSuggestionError(undefined);
    setOriginUtilityNotice(undefined);
    setPredictions([]);
    setQuery(destination?.name || '');
  }, [destination?.name]);

  const selectOriginPlace = (place: SelectedPlace) => {
    setOrigin(place);
    setOriginFromGps(place === origin && originFromGps);
    setOriginError(undefined);
    setEditingOrigin(false);
    setQuery(destination?.name || '');
  };

  const changeAddressVersion = async (enabled: boolean) => {
    const version: GoongApiVersion = enabled ? 'v2' : 'v1';
    setShowMergedAddress(enabled);
    sessionTokenRef.current = createGoongSessionToken();
    addressVersionRef.current = version;
    autocompleteRequest.current += 1;
    detailRequest.current += 1;
    setPredictions([]);
    setSuggestionError(undefined);
    setOriginUtilityNotice(enabled ? 'Đang dùng địa chỉ hành chính mới của Goong API V2.' : 'Đang dùng địa chỉ trước sáp nhập của Goong API V1.');

    if (!origin || !originFromGps) return;
    setOriginLoading(true);
    try {
      const place = await getReverseGeocodeMobile(origin.coords.latitude, origin.coords.longitude, version);
      if (place?.address) {
        setOrigin({ ...origin, name: shortPlaceName(place.name, place.address), address: place.address });
      }
    } finally {
      setOriginLoading(false);
    }
  };

  const focusNewPlace = () => {
    setOriginUtilityNotice(`Nhập tên hoặc địa chỉ ${editingOrigin ? 'điểm đi' : 'điểm đến'} ở ô phía trên, sau đó chọn một gợi ý để xác định chính xác vị trí.`);
    changeQuery('');
    requestAnimationFrame(() => (editingOrigin ? originInputRef : destinationInputRef).current?.focus());
  };

  useEffect(() => {
    if (!editingOrigin || Platform.OS === 'web') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      exitOriginEdit();
      return true;
    });
    return () => subscription.remove();
  }, [editingOrigin, exitOriginEdit]);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {editingOrigin ? (
            <View style={styles.originEditHeader}>
              <Pressable accessibilityRole="button" accessibilityLabel="Đóng chọn điểm đi" onPress={exitOriginEdit} style={styles.backButton}>
                <ArrowLeft size={25} color={colors.textPrimary} strokeWidth={2.2} />
              </Pressable>
              <View style={[styles.searchBox, styles.originSearchBox, searchFocused && styles.searchBoxSelected]}>
                <View style={styles.originDot}><View style={styles.originDotCenter} /></View>
                <TextInput ref={originInputRef} autoFocus value={query} onChangeText={changeQuery} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                  placeholder="Nhập điểm đi" placeholderTextColor={colors.textTertiary} accessibilityLabel="Nhập điểm đi"
                  accessibilityHint={suggestionError} returnKeyType="search" selectTextOnFocus
                  style={[styles.searchInput, Platform.OS === 'web' && styles.searchInputWeb]} />
                {suggestionLoading ? <ActivityIndicator color={colors.primary} /> : query.length > 0 ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Xóa điểm đi" onPress={() => changeQuery('')} style={styles.clearButton}>
                    <X size={17} color={colors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : <>
            <View style={styles.locationHeader}>
              <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={25} color={colors.textPrimary} strokeWidth={2.2} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Thay đổi điểm đi" onPress={beginOriginEdit}
                cssInterop={false} style={({ pressed }) => [styles.locationCopy, pressed && styles.pressed]}>
                <AppText variant="bodySmall" style={styles.locationLabel}>Vị trí của bạn</AppText>
                <View style={styles.locationNameRow}>
                  {originLoading ? <ActivityIndicator size="small" color={colors.primary} /> : (
                    <AppText variant="h2" weight="semibold" numberOfLines={1} style={originError ? styles.errorText : undefined}>
                      {originError || origin?.name || 'Chưa xác định'}
                    </AppText>
                  )}
                </View>
              </Pressable>
              {!originLoading && originError && (
                <Pressable accessibilityRole="button" accessibilityLabel={openSettingsForLocation ? 'Mở cài đặt quyền vị trí' : 'Thử lấy lại vị trí hiện tại'}
                  onPress={recoverLocation} style={styles.locationRecovery}>
                  <RefreshCw size={20} color={colors.danger} />
                </Pressable>
              )}
            </View>
            <View style={[styles.searchBox, (searchFocused || destination) && styles.searchBoxSelected]}>
              <Search size={25} color={searchFocused || destination ? colors.primary : colors.textTertiary} />
              <TextInput ref={destinationInputRef} autoFocus value={query} onChangeText={changeQuery} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                placeholder="Bạn muốn đi đâu?" placeholderTextColor={colors.textTertiary} accessibilityLabel="Nhập điểm đến"
                accessibilityHint={suggestionError} returnKeyType="search" style={[styles.searchInput, Platform.OS === 'web' && styles.searchInputWeb]} />
              {suggestionLoading ? <ActivityIndicator color={colors.primary} /> : query.length > 0 ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Xóa điểm đến" onPress={() => changeQuery('')} style={styles.clearButton}>
                  <X size={17} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </>}

          {!editingOrigin && !displayRows && !destination && (
            <View style={styles.tabs}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: activeTab === 'suggested' }} accessibilityLabel="Xem địa điểm gợi ý" onPress={() => setActiveTab('suggested')} style={[styles.tab, activeTab === 'suggested' && styles.tabActive]}>
                <AppText variant="bodySmall" weight="bold" style={activeTab === 'suggested' ? styles.tabTextActive : styles.tabTextInactive}>Gợi ý</AppText>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: activeTab === 'recent' }} accessibilityLabel="Xem điểm đến đã đi gần đây" onPress={() => setActiveTab('recent')} style={[styles.tab, activeTab === 'recent' && styles.tabActive]}>
                <AppText variant="bodySmall" weight="bold" style={activeTab === 'recent' ? styles.tabTextActive : styles.tabTextInactive}>Đã đi gần đây</AppText>
              </Pressable>
            </View>
          )}

          {suggestionError && <AppText accessibilityRole="alert" variant="caption" style={styles.errorMessage}>{suggestionError}</AppText>}

          {displayRows ? (
            <View style={styles.listSection}>
              <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>{editingOrigin ? 'Chọn điểm đi' : 'Địa điểm'}</AppText>
              {predictions.map((prediction) => <PredictionRow key={prediction.id} prediction={prediction} onPress={() => selectPrediction(prediction)} />)}
              {!suggestionLoading && !suggestionError && predictions.length === 0 && <AppText variant="bodySmall" style={styles.emptyCopy}>Không tìm thấy địa điểm phù hợp.</AppText>}
            </View>
          ) : editingOrigin ? (
            <View style={styles.listSection}>
              <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>Địa điểm gần đây</AppText>
              {origin && <OriginPlaceRow place={origin} onPress={() => selectOriginPlace(origin)} />}
              {historyQuery.isLoading ? <ActivityIndicator color={colors.primary} style={styles.historyLoader} /> : recentPlaces.slice(0, 3).map((place) => (
                <RecentRow key={place.id} place={place} onPress={() => selectOriginPlace(place)} />
              ))}
              {!historyQuery.isLoading && recentPlaces.length === 0 && !origin && (
                <AppText variant="bodySmall" style={styles.emptyCopy}>Nhập ít nhất 2 ký tự để tìm một điểm đi khác.</AppText>
              )}
            </View>
          ) : destination ? (
            <View style={styles.selectedSection}>
              <View style={styles.selectedPlaceRow}>
                <View style={styles.selectedIcon}><MapPin size={21} color={colors.primary} /></View>
                <View style={styles.flex}>
                  <AppText variant="body" weight="semibold" numberOfLines={1}>{destination.name}</AppText>
                  <AppText variant="bodySmall" style={styles.secondaryText} numberOfLines={2}>{destination.address}</AppText>
                </View>
              </View>
              <TripOptions departureTime={departureTime} seats={seats} pickerMode={pickerMode} setPickerMode={setPickerMode} setSeats={setSeats} setDepartureTime={setDepartureTime} onDateTimeChange={handleDateTimeChange} />
              <AppButton title="Tìm chuyến" disabled={!origin} onPress={submit} leftIcon={<Search size={19} color={colors.surface} style={styles.buttonIcon} />} className="mt-5" />
            </View>
          ) : (
            <View style={styles.listSection}>
              <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>{activeTab === 'recent' ? 'Điểm đến gần đây' : 'Địa điểm gợi ý'}</AppText>
              {activeTab === 'suggested' && <View style={styles.quickTerms}>{quickTerms.map((term) => (
                <Pressable key={term} accessibilityRole="button" accessibilityLabel={`Tìm ${term}`} onPress={() => changeQuery(term)} style={styles.quickTerm}><AppText variant="caption" weight="semibold" style={styles.quickTermText}>{term}</AppText></Pressable>
              ))}</View>}
              {activeTab === 'suggested' ? (
                suggestedPlacesQuery.isLoading ? <ActivityIndicator color={colors.primary} style={styles.historyLoader} /> : suggestedPlacesQuery.isError ? (
                  <AppText accessibilityRole="alert" variant="bodySmall" style={styles.errorMessage}>Không thể tải địa điểm gợi ý. Hãy kiểm tra kết nối.</AppText>
                ) : suggestedPlacesQuery.data?.map((place) => <PredictionRow key={place.id} prediction={place} onPress={() => selectPrediction(place)} />)
              ) : historyQuery.isLoading ? <ActivityIndicator color={colors.primary} style={styles.historyLoader} /> : historyQuery.isError ? (
                <AppText accessibilityRole="alert" variant="bodySmall" style={styles.errorMessage}>Không thể tải các điểm đến đã đi. Hãy kiểm tra kết nối.</AppText>
              ) : recentPlaces.length > 0 ? (
                recentPlaces.map((place) => <RecentRow key={place.id} place={place} onPress={() => { setDestination(place); setQuery(place.name); }} />)
              ) : <AppText variant="bodySmall" style={styles.emptyCopy}>Chưa có chuyến hoàn thành trước đây. Hãy nhập tên địa điểm ở ô tìm kiếm.</AppText>}
            </View>
          )}

          {(editingOrigin || !destination) && (
            <OriginUtilitySection
              mode={editingOrigin ? 'origin' : 'destination'}
              showMergedAddress={showMergedAddress}
              onToggleMergedAddress={changeAddressVersion}
              notice={originUtilityNotice}
              onSavedAddresses={() => setOriginUtilityNotice('Bạn chưa có địa chỉ đã lưu. Các địa điểm đã đi gần đây vẫn hiển thị ở phía trên.')}
              onMap={() => {
                setMapPickerMode(editingOrigin ? 'origin' : 'destination');
                setMapPickerInitial((editingOrigin ? origin : destination)?.coords || origin?.coords);
                Keyboard.dismiss();
                setMapPickerOpen(true);
              }}
              onAddPlace={focusNewPlace}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <PlaceSelectionMapModal
        visible={mapPickerOpen}
        title={`Chọn ${mapPickerMode === 'origin' ? 'điểm đi' : 'điểm đến'}`}
        initialCoordinates={mapPickerInitial}
        onClose={() => {
          setMapPickerOpen(false);
          setMapPickerInitial(undefined);
        }}
        onConfirm={(place) => {
          if (place.latitude == null || place.longitude == null) return;
          const selectedPlace: SelectedPlace = {
            name: place.name,
            address: place.address,
            coords: { latitude: place.latitude, longitude: place.longitude },
          };
          if (mapPickerMode === 'origin') {
            setOrigin(selectedPlace);
            setOriginFromGps(false);
            setOriginError(undefined);
            setEditingOrigin(false);
            setQuery(destination?.name || '');
          } else {
            setDestination(selectedPlace);
            setQuery(selectedPlace.name);
          }
          setMapPickerOpen(false);
          setMapPickerInitial(undefined);
        }}
      />
    </SafeAreaView>
  );
}

// Keep callback styles on native Pressable: NativeWind interop can discard them,
// dropping row layout, padding, and pressed-state styling on Android.
function PredictionRow({ prediction, onPress }: { prediction: PlaceSearchResult; onPress: () => void }) {
  const { Icon, label } = getPlaceKind(prediction);
  const distance = distanceLabel(prediction.distance);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Chọn ${prediction.address}`} onPress={onPress} cssInterop={false} style={({ pressed }) => [styles.suggestionRow, pressed && styles.placeRowPressed]}>
      {({ pressed }) => <>
        <View style={styles.suggestionIconColumn}>
          <View style={[styles.suggestionIconBadge, pressed && styles.suggestionIconBadgePressed]}>
            <Icon size={20} color={pressed ? colors.primaryPressed : colors.textSecondary} strokeWidth={1.9} />
          </View>
          {distance && <AppText variant="caption" style={[styles.suggestionDistance, pressed && styles.primaryText]}>{distance}</AppText>}
        </View>
        <View style={styles.suggestionCopy}>
          <AppText variant="bodySmall" weight="semibold" numberOfLines={1} style={pressed && styles.primaryText}>{prediction.name}</AppText>
          <AppText variant="caption" style={[styles.suggestionAddress, pressed && styles.selectedSecondaryText]} numberOfLines={2}>{prediction.address}</AppText>
          <View style={[styles.suggestionTag, pressed && styles.kindTagPressed]}><AppText variant="caption" style={styles.suggestionTagText}>{prediction.confidence === 'APPROXIMATE' ? 'Vị trí gần đúng' : prediction.confidence === 'MEDIUM' ? 'Kết quả liên quan' : label}</AppText></View>
        </View>
      </>}
    </Pressable>
  );
}

function RecentRow({ place, onPress }: { place: RecentPlace; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Đi lại đến ${place.name}`} onPress={onPress} cssInterop={false} style={({ pressed }) => [styles.placeRow, pressed && styles.placeRowPressed]}>
      {({ pressed }) => <>
        <View style={styles.placeIconColumn}><History size={23} color={pressed ? colors.primary : colors.textSecondary} strokeWidth={1.8} /></View>
        <View style={styles.placeCopy}><AppText variant="body" weight="semibold" numberOfLines={1} style={pressed && styles.primaryText}>{place.name}</AppText><AppText variant="bodySmall" style={[styles.secondaryText, pressed && styles.selectedSecondaryText]} numberOfLines={2}>{place.address}</AppText><View style={[styles.kindTag, pressed && styles.kindTagPressed]}><AppText variant="caption" style={styles.kindText}>Đã đi trước đây</AppText></View></View>
      </>}
    </Pressable>
  );
}

function OriginPlaceRow({ place, onPress }: { place: SelectedPlace; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Dùng ${place.name} làm điểm đi`} onPress={onPress}
      cssInterop={false} style={({ pressed }) => [styles.placeRow, pressed && styles.placeRowPressed]}>
      {({ pressed }) => <>
        <View style={styles.placeIconColumn}>
          <View style={[styles.currentLocationIcon, pressed && styles.suggestionIconBadgePressed]}>
            <MapPin size={21} color={pressed ? colors.primaryPressed : colors.primary} strokeWidth={2} />
          </View>
        </View>
        <View style={styles.placeCopy}>
          <AppText variant="bodySmall" style={[styles.currentLocationLabel, pressed && styles.primaryText]}>Vị trí hiện tại</AppText>
          <AppText variant="body" weight="semibold" numberOfLines={1} style={pressed && styles.primaryText}>{place.name}</AppText>
          <AppText variant="caption" numberOfLines={2} style={[styles.secondaryText, pressed && styles.selectedSecondaryText]}>{place.address}</AppText>
        </View>
      </>}
    </Pressable>
  );
}

function OriginUtilitySection({ mode, showMergedAddress, onToggleMergedAddress, notice, onSavedAddresses, onMap, onAddPlace }: {
  mode: 'origin' | 'destination';
  showMergedAddress: boolean;
  onToggleMergedAddress: (value: boolean) => void;
  notice?: string;
  onSavedAddresses: () => void;
  onMap: () => void;
  onAddPlace: () => void;
}) {
  return (
    <View style={styles.originUtilitySection}>
      <OriginUtilityRow
        Icon={Heart}
        iconColor={colors.danger}
        title="Địa chỉ đã lưu"
        subtitle="Lưu địa chỉ để tìm chuyến nhanh hơn."
        onPress={onSavedAddresses}
      />
      <OriginUtilityRow Icon={Map} title={`Chọn ${mode === 'origin' ? 'điểm đi' : 'điểm đến'} trên bản đồ`} onPress={onMap} />
      <View style={styles.utilityRow}>
        <View style={styles.utilityIcon}><Lightbulb size={23} color={colors.textPrimary} strokeWidth={1.9} /></View>
        <View style={styles.utilityCopy}>
          <AppText variant="body" weight="semibold">Địa chỉ sau sáp nhập tỉnh</AppText>
          <AppText variant="caption" style={styles.secondaryText}>Ưu tiên tên hành chính mới</AppText>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Hiển thị địa chỉ sau sáp nhập tỉnh"
          accessibilityState={{ checked: showMergedAddress }}
          onPress={() => onToggleMergedAddress(!showMergedAddress)}
          cssInterop={false} style={({ pressed }) => [styles.toggleTrack, showMergedAddress && styles.toggleTrackOn, pressed && styles.togglePressed]}>
          <View style={[styles.toggleThumb, showMergedAddress && styles.toggleThumbOn]}>
            {showMergedAddress && <Check size={15} color={colors.primary} strokeWidth={3} />}
          </View>
        </Pressable>
      </View>
      {notice && <AppText accessibilityRole="alert" variant="bodySmall" style={styles.utilityNotice}>{notice}</AppText>}
      <View style={styles.utilityDivider} />
      <AppText variant="h3" weight="semibold" style={styles.missingPlaceTitle}>Không thấy địa điểm bạn cần?</AppText>
      <OriginUtilityRow
        Icon={Plus}
        title={`Thêm địa điểm ${mode === 'origin' ? 'đi' : 'đến'} mới để chuyến đi luôn chuẩn xác!`}
        onPress={onAddPlace}
      />
    </View>
  );
}

function OriginUtilityRow({ Icon, iconColor = colors.textPrimary, title, subtitle, onPress }: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
      cssInterop={false} style={({ pressed }) => [styles.utilityRow, pressed && styles.utilityRowPressed]}>
      {({ pressed }) => <>
        <View style={[styles.utilityIcon, pressed && styles.utilityIconPressed]}>
          <Icon size={23} color={pressed ? colors.primaryPressed : iconColor} strokeWidth={1.9} />
        </View>
        <View style={styles.utilityCopy}>
          <AppText variant="body" weight="semibold" style={pressed && styles.primaryText}>{title}</AppText>
          {subtitle && <AppText variant="bodySmall" style={[styles.secondaryText, pressed && styles.selectedSecondaryText]}>{subtitle}</AppText>}
        </View>
        <ChevronRight size={23} color={pressed ? colors.primaryPressed : colors.textTertiary} strokeWidth={1.8} />
      </>}
    </Pressable>
  );
}

function TripOptions({ departureTime, seats, pickerMode, setPickerMode, setSeats, setDepartureTime, onDateTimeChange }: {
  departureTime: Date; seats: number; pickerMode: PickerMode; setPickerMode: (mode: PickerMode) => void;
  setSeats: React.Dispatch<React.SetStateAction<number>>; setDepartureTime: (value: Date) => void;
  onDateTimeChange: (event: DateTimePickerEvent, selected?: Date) => void;
}) {
  return (
    <View style={styles.options}>
      <AppText variant="bodySmall" weight="semibold">Thời gian và số ghế</AppText>
      {Platform.OS === 'web' ? (
        <WebDateTimeInput value={departureTime} onChange={setDepartureTime} />
      ) : <View style={styles.optionRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Chọn ngày khởi hành" onPress={() => setPickerMode('date')} style={styles.optionField}><CalendarDays size={18} color={colors.primary} /><AppText variant="bodySmall" weight="semibold">{format(departureTime, 'dd/MM/yyyy')}</AppText></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Chọn giờ khởi hành" onPress={() => setPickerMode('time')} style={styles.optionField}><Clock3 size={18} color={colors.primary} /><AppText variant="bodySmall" weight="semibold">{format(departureTime, 'HH:mm')}</AppText></Pressable>
      </View>}
      {pickerMode && Platform.OS !== 'web' && <View><DateTimePicker value={departureTime} mode={pickerMode} minimumDate={new Date()} onChange={onDateTimeChange} />{Platform.OS === 'ios' && <Pressable accessibilityRole="button" accessibilityLabel="Xong chọn thời gian" onPress={() => setPickerMode(null)} style={styles.pickerDone}><AppText variant="bodySmall" weight="semibold" style={styles.primaryText}>Xong</AppText></Pressable>}</View>}
      <View style={styles.seatRow}><AppText variant="bodySmall" weight="semibold">Số ghế</AppText><View style={styles.counter}>
        <Pressable accessibilityRole="button" accessibilityLabel="Giảm số ghế" accessibilityState={{ disabled: seats <= 1 }} disabled={seats <= 1} onPress={() => setSeats((value) => Math.max(1, value - 1))} style={[styles.counterButton, seats <= 1 && styles.disabled]}><Minus size={17} color={colors.textPrimary} /></Pressable>
        <AppText variant="bodySmall" weight="semibold" style={styles.counterValue}>{seats}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Tăng số ghế" accessibilityState={{ disabled: seats >= 10 }} disabled={seats >= 10} onPress={() => setSeats((value) => Math.min(10, value + 1))} style={[styles.counterButton, seats >= 10 && styles.disabled]}><Plus size={17} color={colors.textPrimary} /></Pressable>
      </View></View>
    </View>
  );
}

function WebDateTimeInput({ value, onChange }: { value: Date; onChange: (value: Date) => void }) {
  return React.createElement('input', {
    type: 'datetime-local',
    value: dateTimeLocalValue(value),
    min: dateTimeLocalValue(new Date()),
    'aria-label': 'Ngày và giờ khởi hành',
    onChange: (event: { target: { value: string } }) => {
      const next = new Date(event.target.value);
      if (!Number.isNaN(next.getTime()) && next.getTime() > Date.now()) onChange(next);
    },
    style: {
      backgroundColor: colors.surfaceMuted, border: 'none', borderRadius: radius.input,
      boxSizing: 'border-box', color: colors.textPrimary, fontSize: 15, height: 48,
      marginTop: spacing.sm, padding: '0 14px', width: '100%',
    },
  });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.surface, flex: 1 }, flex: { flex: 1 },
  content: { alignSelf: 'center', maxWidth: layout.maxContentWidth, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg, width: '100%' },
  locationHeader: { alignItems: 'center', flexDirection: 'row', minHeight: 116, paddingTop: spacing.sm },
  originEditHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, minHeight: 112, paddingTop: spacing.sm },
  originSearchBox: { flex: 1, minWidth: 0, minHeight: 64 },
  originDot: { alignItems: 'center', backgroundColor: colors.textPrimary, borderRadius: radius.pill, height: 28, justifyContent: 'center', width: 28 },
  originDotCenter: { backgroundColor: colors.surface, borderRadius: radius.pill, height: 8, width: 8 },
  backButton: { alignItems: 'center', height: layout.minTouchTarget, justifyContent: 'center', marginRight: spacing.sm, width: layout.minTouchTarget },
  locationCopy: { borderRadius: radius.sm, flex: 1, minHeight: layout.minTouchTarget, minWidth: 0, paddingHorizontal: spacing.xs, justifyContent: 'center' }, locationCopyActive: { backgroundColor: colors.primarySoft }, locationLabel: { color: colors.textTertiary, marginBottom: 1 },
  locationRecovery: { alignItems: 'center', height: layout.minTouchTarget, justifyContent: 'center', width: layout.minTouchTarget },
  locationNameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, minHeight: 31 },
  searchBox: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.borderStrong, borderRadius: radius.input, borderWidth: 2, flexDirection: 'row', gap: spacing.sm, minHeight: 64, paddingHorizontal: spacing.md },
  searchBoxSelected: { borderColor: colors.primary, borderWidth: 2 }, searchInput: { color: colors.textPrimary, flex: 1, fontSize: 17, minWidth: 0, minHeight: 60, paddingHorizontal: 0, paddingVertical: 0, textAlignVertical: 'center' }, searchInputWeb: { outlineStyle: 'none' } as any,
  clearButton: { alignItems: 'center', borderRadius: radius.pill, height: layout.minTouchTarget, justifyContent: 'center', width: layout.minTouchTarget },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }, tab: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md },
  tabActive: { backgroundColor: colors.primaryPressed, borderColor: colors.primaryPressed }, tabTextActive: { color: '#FFFFFF', opacity: 1 }, tabTextInactive: { color: colors.textPrimary, opacity: 1 },
  listSection: { marginTop: spacing.xxl }, sectionTitle: { marginBottom: spacing.lg },
  quickTerms: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }, quickTerm: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, justifyContent: 'center', minHeight: layout.minTouchTarget, paddingHorizontal: spacing.sm }, quickTermText: { color: colors.primaryPressed },
  suggestionRow: { alignItems: 'flex-start', borderRadius: radius.sm, flexDirection: 'row', minHeight: 82, paddingHorizontal: spacing.xxs, paddingVertical: spacing.xs },
  suggestionIconColumn: { alignItems: 'center', marginRight: spacing.sm, width: 48 },
  suggestionIconBadge: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, height: 38, justifyContent: 'center', width: 38 },
  suggestionIconBadgePressed: { backgroundColor: colors.surface },
  suggestionDistance: { color: colors.textSecondary, fontSize: 11, marginTop: 3, textAlign: 'center' },
  suggestionCopy: { flex: 1, minWidth: 0, paddingBottom: spacing.xxs },
  suggestionAddress: { color: colors.textTertiary, lineHeight: 17, marginTop: 1 },
  suggestionTag: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 5, marginTop: 5, paddingHorizontal: 7, paddingVertical: 2 },
  suggestionTagText: { color: colors.primaryPressed, fontSize: 11, lineHeight: 15 },
  placeRow: { borderRadius: radius.sm, flexDirection: 'row', minHeight: 96, paddingVertical: spacing.sm }, placeRowPressed: { backgroundColor: colors.primarySoft }, placeIconColumn: { alignItems: 'center', paddingTop: 3, width: 64 }, distance: { color: colors.textSecondary, marginTop: spacing.xxs, textAlign: 'center' },
  currentLocationIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.sm, height: 40, justifyContent: 'center', width: 40 }, currentLocationLabel: { color: colors.primaryPressed, marginBottom: 2 },
  placeCopy: { flex: 1, minWidth: 0, paddingBottom: spacing.sm }, secondaryText: { color: colors.textTertiary, marginTop: 2 }, selectedSecondaryText: { color: colors.primaryPressed },
  kindTag: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 6, marginTop: spacing.xs, paddingHorizontal: spacing.xs, paddingVertical: 3 }, kindTagPressed: { backgroundColor: colors.surface }, kindText: { color: colors.primaryPressed },
  originUtilitySection: { marginHorizontal: -spacing.lg, marginTop: spacing.lg, paddingBottom: spacing.xl },
  utilityRow: { alignItems: 'center', borderRadius: radius.sm, flexDirection: 'row', gap: spacing.md, minHeight: 82, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  utilityRowPressed: { backgroundColor: colors.primarySoft },
  utilityIcon: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 },
  utilityIconPressed: { backgroundColor: colors.surface },
  utilityCopy: { flex: 1, minWidth: 0 },
  toggleTrack: { backgroundColor: colors.borderStrong, borderRadius: radius.pill, height: 34, justifyContent: 'center', paddingHorizontal: 4, width: 58 },
  toggleTrackOn: { alignItems: 'flex-end', backgroundColor: colors.primary }, togglePressed: { opacity: 0.76 },
  toggleThumb: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, height: 26, justifyContent: 'center', width: 26 },
  toggleThumbOn: { backgroundColor: colors.surface },
  utilityNotice: { backgroundColor: colors.primarySoft, borderRadius: radius.sm, color: colors.primaryPressed, lineHeight: 20, marginHorizontal: spacing.lg, marginTop: spacing.xs, padding: spacing.sm },
  utilityDivider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginTop: spacing.md },
  missingPlaceTitle: { marginBottom: spacing.xs, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  pressed: { opacity: 0.58 }, errorMessage: { color: colors.danger, marginTop: spacing.sm }, errorText: { color: colors.danger, fontSize: 14 }, emptyCopy: { color: colors.textSecondary, lineHeight: 21, paddingVertical: spacing.lg }, historyLoader: { marginTop: spacing.lg },
  selectedSection: { marginTop: spacing.lg }, selectedPlaceRow: { alignItems: 'flex-start', backgroundColor: colors.surfaceMuted, borderRadius: radius.card, flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, selectedIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 42, justifyContent: 'center', width: 42 },
  options: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.xl, paddingTop: spacing.lg }, optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }, optionField: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.input, flex: 1, flexDirection: 'row', gap: spacing.xs, minHeight: layout.minTouchTarget, minWidth: 140, paddingHorizontal: spacing.sm },
  pickerDone: { alignItems: 'flex-end', justifyContent: 'center', minHeight: layout.minTouchTarget }, primaryText: { color: colors.primary },
  seatRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }, counter: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.input, flexDirection: 'row' }, counterButton: { alignItems: 'center', height: layout.minTouchTarget, justifyContent: 'center', width: layout.minTouchTarget }, counterValue: { minWidth: 24, textAlign: 'center' }, disabled: { opacity: 0.28 }, buttonIcon: { marginRight: spacing.xs },
});
