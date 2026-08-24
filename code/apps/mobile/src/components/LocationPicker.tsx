import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { MapPin, Search } from 'lucide-react-native';
import type { GoongAutocompletePrediction } from '@repo/shared';
import { getAutocompletePredictionsMobile, getPlaceDetailMobile } from '../services/goong.service';

interface LocationPickerProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectCoords?: (lat: number, lng: number) => void;
  error?: string;
}

export const LocationPicker = ({ label, placeholder, value, onChangeText, onSelectCoords, error }: LocationPickerProps) => {
  const [predictions, setPredictions] = useState<GoongAutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectionLocked, setSelectionLocked] = useState(false);

  useEffect(() => {
    if (selectionLocked || value.trim().length < 2) {
      setPredictions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setPredictions(await getAutocompletePredictionsMobile(value));
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [selectionLocked, value]);

  const selectPrediction = async (prediction: GoongAutocompletePrediction) => {
    setSelectionLocked(true);
    setPredictions([]);
    onChangeText(prediction.description);
    const detail = await getPlaceDetailMobile(prediction.place_id);
    if (detail?.geometry?.location) {
      onSelectCoords?.(detail.geometry.location.lat, detail.geometry.location.lng);
    }
  };

  return (
    <View className="mb-4">
      <Text className="text-slate-700 font-medium mb-2">{label}</Text>
      <View className={`min-h-12 flex-row items-center bg-white border ${error ? 'border-red-600' : 'border-slate-200'} px-3 rounded-xl`}>
        <MapPin size={20} color={error ? '#DC2626' : '#64748B'} />
        <TextInput
          className="flex-1 text-slate-950 min-h-12 px-3"
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          value={value}
          onChangeText={(text) => {
            setSelectionLocked(false);
            onChangeText(text);
          }}
          accessibilityLabel={label}
        />
        {loading ? <ActivityIndicator color="#2563EB" /> : <Search size={20} color="#2563EB" />}
      </View>
      {predictions.length > 0 && (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.place_id}
          keyboardShouldPersistTaps="handled"
          className="max-h-56 mt-1 rounded-xl border border-slate-200 bg-white"
          renderItem={({ item }) => (
            <Pressable
              className="min-h-12 justify-center border-b border-slate-100 px-4 active:bg-blue-50"
              onPress={() => selectPrediction(item)}
              accessibilityRole="button"
              accessibilityLabel={`Chọn ${item.description}`}
            >
              <Text className="text-slate-900">{item.description}</Text>
            </Pressable>
          )}
        />
      )}
      {error && <Text className="text-red-600 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
};
