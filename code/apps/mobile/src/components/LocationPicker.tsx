import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MapPin, Search } from 'lucide-react-native';
import type { GoongAutocompletePrediction } from '@repo/shared';
import { createGoongSessionToken, getAutocompletePredictionsMobile, getPlaceDetailMobile } from '../services/goong.service';
import { colors } from '../theme/tokens';

interface LocationPickerProps {
  label: string;
  placeholder: string;
  value: string;
  selected?: boolean;
  locationBias?: string;
  onChangeText: (text: string) => void;
  onSelectCoords?: (lat: number, lng: number, description: string) => void;
  error?: string;
  tone?: 'passenger' | 'driver';
}

export const LocationPicker = ({ label, placeholder, value, selected = false, locationBias, onChangeText, onSelectCoords, error, tone = 'passenger' }: LocationPickerProps) => {
  const [predictions, setPredictions] = useState<GoongAutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectionLocked, setSelectionLocked] = useState(false);
  const [lookupError, setLookupError] = useState<string>();
  const [focused, setFocused] = useState(false);
  const autocompleteRequest = useRef(0);
  const detailRequest = useRef(0);
  const sessionToken = useRef(createGoongSessionToken());
  const accentColor = tone === 'driver' ? colors.driverAccent : colors.primary;
  const hasError = Boolean(error || lookupError);

  useEffect(() => {
    if (selected || selectionLocked || value.trim().length < 2) {
      autocompleteRequest.current += 1;
      setPredictions([]);
      setLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      const requestId = ++autocompleteRequest.current;
      setLoading(true);
      setLookupError(undefined);
      try {
        const results = await getAutocompletePredictionsMobile(value, { version: 'v2', sessionToken: sessionToken.current, location: locationBias });
        if (requestId !== autocompleteRequest.current) return;
        setPredictions(results);
      } catch {
        if (requestId !== autocompleteRequest.current) return;
        setPredictions([]);
        setLookupError('Không thể tải gợi ý địa điểm. Kiểm tra kết nối và nhập lại.');
      } finally {
        if (requestId === autocompleteRequest.current) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      autocompleteRequest.current += 1;
    };
  }, [locationBias, selected, selectionLocked, value]);

  const selectPrediction = async (prediction: GoongAutocompletePrediction) => {
    const requestId = ++detailRequest.current;
    setSelectionLocked(true);
    setPredictions([]);
    setLookupError(undefined);
    setLoading(true);
    try {
      const detail = await getPlaceDetailMobile(prediction.place_id, 'v2', sessionToken.current);
      if (requestId !== detailRequest.current) return;
      if (!detail?.geometry?.location) {
        setSelectionLocked(false);
        setLookupError('Không thể xác định tọa độ. Vui lòng chọn lại một gợi ý.');
        return;
      }
      onChangeText(prediction.description);
      onSelectCoords?.(detail.geometry.location.lat, detail.geometry.location.lng, prediction.description);
      sessionToken.current = createGoongSessionToken();
    } catch {
      if (requestId !== detailRequest.current) return;
      setSelectionLocked(false);
      setLookupError('Không thể xác định tọa độ. Vui lòng chọn lại gợi ý này.');
    } finally {
      if (requestId === detailRequest.current) setLoading(false);
    }
  };

  return (
    <View className="mb-4">
      <Text className="text-slate-700 font-medium mb-2">{label}</Text>
      <View
        style={[
          styles.inputShell,
          { borderColor: hasError ? colors.danger : focused ? accentColor : colors.borderStrong },
        ]}
      >
        <MapPin size={20} color={hasError ? colors.danger : colors.textTertiary} />
        <TextInput
          className="flex-1 text-slate-950 min-h-12 px-3"
          style={Platform.OS === 'web' ? styles.webInput : undefined}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={(text) => {
            detailRequest.current += 1;
            setSelectionLocked(false);
            setLookupError(undefined);
            onChangeText(text);
          }}
          accessibilityLabel={label}
          accessibilityHint={error || lookupError}
        />
        {loading ? <ActivityIndicator color={accentColor} /> : <Search size={20} color={accentColor} />}
      </View>
      {predictions.length > 0 && (
        <View className="max-h-56 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {predictions.map((item) => (
            <Pressable
              key={item.place_id}
              className="min-h-12 justify-center border-b border-slate-100 px-4 active:bg-blue-50"
              onPress={() => selectPrediction(item)}
              accessibilityRole="button"
              accessibilityLabel={`Chọn ${item.description}`}
            >
              <Text className="text-slate-900">{item.description}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {(error || lookupError) && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="text-red-600 text-xs mt-1 ml-1"
        >
          {error || lookupError}
        </Text>
      )}
      {!loading && !lookupError && value.trim().length >= 2 && !selected && !selectionLocked && predictions.length === 0 && (
        <Text accessibilityLiveRegion="polite" className="text-slate-500 text-xs mt-1 ml-1">
          Không tìm thấy địa điểm phù hợp.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 12,
  },
  webInput: {
    outlineStyle: 'none',
  } as object,
});
