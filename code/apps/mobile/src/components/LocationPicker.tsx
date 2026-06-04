import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MapPin, Search } from 'lucide-react-native';

interface LocationPickerProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectCoords?: (lat: number, lng: number) => void;
  error?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  onSelectCoords,
  error 
}) => {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-2">{label}</Text>
      <View className={`flex-row items-center bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} p-3 rounded-xl`}>
        <MapPin size={20} color={error ? '#EF4444' : '#6B7280'} className="mr-2" />
        <TextInput
          className="flex-1 text-gray-800 h-10"
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            // Giả lập lấy tọa độ ngẫu nhiên khi nhập liệu (vì không có Google Places API Key)
            if (onSelectCoords && text.length > 5) {
              onSelectCoords(21.0 + Math.random() * 0.1, 105.8 + Math.random() * 0.1);
            }
          }}
        />
        <TouchableOpacity>
          <Search size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
};
