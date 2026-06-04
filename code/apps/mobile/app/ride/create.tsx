import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRideSchema, CreateRideInput } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rideService } from '../../src/services/ride.service';
import { LocationPicker } from '../../src/components/LocationPicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { vi } from 'vi-VN';
import { Calendar, Clock, DollarSign, Users, FileText } from 'lucide-react-native';

export default function CreateRideScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(Date.now() + 86400000)); // Ngày mai

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateRideInput>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      origin: '',
      destination: '',
      departureTime: new Date(Date.now() + 86400000).toISOString(),
      availableSeats: 4,
      pricePerSeat: 50000,
      description: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateRideInput) => rideService.createRide(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      Alert.alert('Thành công', 'Chuyến đi của bạn đã được đăng thành công.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/my-rides') }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo chuyến đi vào lúc này');
    }
  });

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const current = new Date(watch('departureTime'));
      current.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setValue('departureTime', current.toISOString());
      setTempDate(current);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const current = new Date(watch('departureTime'));
      current.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setValue('departureTime', current.toISOString());
      setTempDate(current);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-gray-800 mb-6">Đăng chuyến đi mới</Text>

      <Controller
        control={control}
        name="origin"
        render={({ field: { onChange, value } }) => (
          <LocationPicker
            label="Điểm đi"
            placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
            value={value}
            onChangeText={onChange}
            onSelectCoords={(lat, lng) => {
              setValue('originLat', lat);
              setValue('originLng', lng);
            }}
            error={errors.origin?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="destination"
        render={({ field: { onChange, value } }) => (
          <LocationPicker
            label="Điểm đến"
            placeholder="Ví dụ: Thành phố Thái Bình"
            value={value}
            onChangeText={onChange}
            onSelectCoords={(lat, lng) => {
              setValue('destinationLat', lat);
              setValue('destinationLng', lng);
            }}
            error={errors.destination?.message}
          />
        )}
      />

      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Thời gian khởi hành</Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 p-4 rounded-xl mr-2"
          >
            <Calendar size={20} color="#3B82F6" className="mr-2" />
            <Text className="text-gray-800">{format(tempDate, 'dd/MM/yyyy')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowTimePicker(true)}
            className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 p-4 rounded-xl"
          >
            <Clock size={20} color="#3B82F6" className="mr-2" />
            <Text className="text-gray-800">{format(tempDate, 'HH:mm')}</Text>
          </TouchableOpacity>
        </View>
        {errors.departureTime && <Text className="text-red-500 text-xs mt-1">{errors.departureTime.message}</Text>}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      <View className="flex-row mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-gray-700 font-medium mb-2">Số ghế trống</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
            <Users size={20} color="#6B7280" className="mr-2" />
            <Controller
              control={control}
              name="availableSeats"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="flex-1 text-gray-800"
                  keyboardType="numeric"
                  onChangeText={onChange}
                  value={value.toString()}
                />
              )}
            />
          </View>
          {errors.availableSeats && <Text className="text-red-500 text-xs mt-1">{errors.availableSeats.message}</Text>}
        </View>

        <View className="flex-1">
          <Text className="text-gray-700 font-medium mb-2">Giá / Ghế (VNĐ)</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
            <DollarSign size={20} color="#6B7280" className="mr-2" />
            <Controller
              control={control}
              name="pricePerSeat"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="flex-1 text-gray-800"
                  keyboardType="numeric"
                  onChangeText={onChange}
                  value={value.toString()}
                />
              )}
            />
          </View>
          {errors.pricePerSeat && <Text className="text-red-500 text-xs mt-1">{errors.pricePerSeat.message}</Text>}
        </View>
      </View>

      <View className="mb-8">
        <Text className="text-gray-700 font-medium mb-2">Mô tả thêm</Text>
        <View className="flex-row items-start bg-gray-50 border border-gray-200 p-4 rounded-xl h-24">
          <FileText size={20} color="#6B7280" className="mr-2 mt-1" />
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="flex-1 text-gray-800"
                multiline
                numberOfLines={4}
                placeholder="Lưu ý về đồ đạc, điểm dừng..."
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>
      </View>

      <TouchableOpacity 
        className={`p-4 rounded-2xl items-center shadow-md mb-10 ${mutation.isPending ? 'bg-blue-400' : 'bg-blue-600'}`}
        onPress={handleSubmit((data) => mutation.mutate(data))}
        disabled={mutation.isPending}
      >
        <Text className="text-white font-bold text-lg">
          {mutation.isPending ? 'Đang đăng chuyến...' : 'Đăng chuyến ngay'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
