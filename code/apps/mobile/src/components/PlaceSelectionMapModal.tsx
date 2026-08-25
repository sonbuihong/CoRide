import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { LocateFixed, MapPin, X } from 'lucide-react-native';
import type { PlaceSearchResult } from '@repo/shared';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reversePlacesMobile } from '../services/goong.service';
import { colors, radius, spacing } from '../theme/tokens';
import { resolveMapCandidate } from '../utils/place-selection';
import { AppButton } from './ui/AppButton';
import { AppText } from './ui/AppText';
import { StartLocationMap, type MapCoordinates } from './StartLocationMap';

const DEFAULT_CENTER: MapCoordinates = { latitude: 21.0285, longitude: 105.8542 };

interface PlaceSelectionMapModalProps {
  visible: boolean;
  title: string;
  initialCoordinates?: MapCoordinates;
  onClose: () => void;
  onConfirm: (place: PlaceSearchResult) => void;
}

export function PlaceSelectionMapModal({ visible, title, initialCoordinates, onClose, onConfirm }: PlaceSelectionMapModalProps) {
  const requestId = useRef(0);
  const initialLatitude = initialCoordinates?.latitude ?? DEFAULT_CENTER.latitude;
  const initialLongitude = initialCoordinates?.longitude ?? DEFAULT_CENTER.longitude;
  const initial = useMemo(() => ({ latitude: initialLatitude, longitude: initialLongitude }), [initialLatitude, initialLongitude]);
  const hasInitialCoordinates = Boolean(initialCoordinates);
  const [center, setCenter] = useState<MapCoordinates>(initial);
  const [cameraTarget, setCameraTarget] = useState<MapCoordinates>();
  const [moving, setMoving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [selected, setSelected] = useState<PlaceSearchResult>();
  const [error, setError] = useState<string>();
  const [locating, setLocating] = useState(false);

  const locateUser = useCallback(async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Cần quyền vị trí để trở về vị trí hiện tại.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setCenter(next);
      setCameraTarget(next);
    } catch {
      setError('Không thể lấy vị trí hiện tại. Hãy kiểm tra GPS và thử lại.');
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    requestId.current += 1;
    setSelected(undefined);
    setError(undefined);
    setCenter(initial);
    setCameraTarget(hasInitialCoordinates ? initial : undefined);
    if (hasInitialCoordinates) return;
    void locateUser();
  }, [hasInitialCoordinates, initial, locateUser, visible]);

  const handleCenterChange = useCallback((next: MapCoordinates) => {
    setCameraTarget(undefined);
    setCenter(next);
  }, []);

  useEffect(() => {
    if (!visible || moving) return;
    const timer = setTimeout(() => {
      const currentRequest = ++requestId.current;
      setResolving(true);
      setSelected(undefined);
      setError(undefined);
      void reversePlacesMobile(center.latitude, center.longitude, 5, 'v2')
        .then((results) => {
          if (currentRequest !== requestId.current) return;
          const resolution = resolveMapCandidate(center, results, undefined, false);
          if (!resolution.selected) throw new Error('no candidate');
          setSelected(resolution.selected);
        })
        .catch(() => {
          if (currentRequest === requestId.current) setError('Không đọc được địa chỉ tại vị trí này. Hãy di chuyển bản đồ và thử lại.');
        })
        .finally(() => {
          if (currentRequest === requestId.current) setResolving(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [center, moving, visible]);

  const handleMovingChange = (next: boolean) => {
    setMoving(next);
    if (next) {
      requestId.current += 1;
      setSelected(undefined);
      setError(undefined);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Đóng bản đồ" accessibilityRole="button" hitSlop={10} onPress={onClose} style={styles.closeButton}>
            <X size={22} color={colors.textPrimary} />
          </Pressable>
          <AppText variant="h3" weight="semibold" numberOfLines={1} style={styles.title}>{title}</AppText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.map}>
          <StartLocationMap origin={initial} cameraTarget={cameraTarget} onCenterChange={handleCenterChange} onMovingChange={handleMovingChange} />
          <Pressable
            accessibilityLabel="Trở về vị trí hiện tại"
            accessibilityRole="button"
            disabled={locating}
            onPress={locateUser}
            style={({ pressed }) => [styles.locateButton, pressed && styles.locateButtonPressed]}
          >
            {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <LocateFixed size={22} color={colors.primary} />}
          </Pressable>
        </View>
        <View style={styles.sheet}>
          <View style={styles.locationRow}>
            <View style={styles.iconBadge}><MapPin size={21} color={colors.primary} /></View>
            <View style={styles.copy}>
              <AppText variant="caption" style={styles.caption}>{moving ? 'Đang di chuyển bản đồ…' : 'Điểm đang chọn'}</AppText>
              {resolving ? <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /><AppText variant="bodySmall">Đang xác định địa chỉ…</AppText></View> : selected ? <>
                <AppText weight="semibold" numberOfLines={1}>{selected.name}</AppText>
                <AppText variant="bodySmall" numberOfLines={2} style={styles.address}>{selected.address}</AppText>
                {selected.confidence === 'APPROXIMATE' && <AppText variant="caption" style={styles.approximate}>Địa chỉ gần đúng theo vị trí ghim</AppText>}
              </> : <AppText variant="bodySmall" style={error ? styles.error : styles.address}>{error || 'Thả bản đồ để xác định địa điểm.'}</AppText>}
            </View>
          </View>
          <AppButton
            title="Xác nhận vị trí"
            disabled={!selected || resolving || moving}
            onPress={() => selected && onConfirm(selected)}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.surface, flex: 1 },
  header: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 56, paddingHorizontal: spacing.md },
  closeButton: { alignItems: 'center', borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  title: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: 44 },
  map: { flex: 1, minHeight: 320 },
  locateButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, bottom: spacing.lg, elevation: 4, height: 46, justifyContent: 'center', position: 'absolute', right: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 5, width: 46 },
  locateButtonPressed: { backgroundColor: colors.primarySoft, transform: [{ scale: 0.96 }] },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, gap: spacing.md, padding: spacing.lg },
  locationRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 76 },
  iconBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  copy: { flex: 1 },
  caption: { color: colors.textSecondary, marginBottom: 3 },
  address: { color: colors.textSecondary, marginTop: 2 },
  error: { color: colors.danger },
  approximate: { color: '#A16207', marginTop: 3 },
  loadingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 40 },
});
