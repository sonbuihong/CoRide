import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { apiClient as api } from '../../src/api/client';
import { Plus, Trash2, Car, Bike, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface Vehicle {
  id: string;
  licensePlate: string;
  type: 'BIKE' | 'CAR';
  color?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ licensePlate: '', type: 'BIKE', color: '', imageUrl: '' });
  const [uploadingImg, setUploadingImg] = useState(false);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách xe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename!);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('file', { uri: localUri, name: filename, type } as any);

      setUploadingImg(true);
      try {
        const res = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setNewVehicle({...newVehicle, imageUrl: res.data.url});
      } catch (err) {
        console.error('Lỗi upload ảnh:', err);
        Alert.alert('Lỗi', 'Không thể tải ảnh. Vui lòng thử lại.');
      } finally {
        setUploadingImg(false);
      }
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.licensePlate) {
      Alert.alert('Lỗi', 'Vui lòng nhập biển số xe');
      return;
    }
    
    try {
      await api.post('/vehicles', newVehicle);
      setIsAdding(false);
      setNewVehicle({ licensePlate: '', type: 'BIKE', color: '', imageUrl: '' });
      fetchVehicles();
    } catch (err) {
      console.error('Lỗi khi thêm xe:', err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi thêm xe');
    }
  };

  const handleDeleteVehicle = (id: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa phương tiện này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/vehicles/${id}`);
              fetchVehicles();
            } catch (err) {
              console.error('Lỗi khi xóa xe:', err);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0071e3" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Phương tiện của bạn', headerBackTitle: 'Quay lại' }} />
      
      <View className="p-4">
        {!isAdding && (
          <TouchableOpacity 
            className="bg-blue-600 rounded-xl p-4 flex-row justify-center items-center mb-6"
            onPress={() => setIsAdding(true)}
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-bold ml-2">Thêm phương tiện mới</Text>
          </TouchableOpacity>
        )}

        {isAdding && (
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">Thêm xe mới</Text>
              <TouchableOpacity onPress={() => setIsAdding(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 font-medium mb-1">Biển số xe *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4"
              placeholder="VD: 29A-12345"
              value={newVehicle.licensePlate}
              onChangeText={(text) => setNewVehicle({...newVehicle, licensePlate: text})}
            />

            <Text className="text-gray-600 font-medium mb-1">Loại xe *</Text>
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity 
                className={`flex-1 p-3 rounded-xl border flex-row justify-center items-center ${newVehicle.type === 'BIKE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                onPress={() => setNewVehicle({...newVehicle, type: 'BIKE'})}
              >
                <Bike size={20} color={newVehicle.type === 'BIKE' ? '#0071e3' : '#6B7280'} />
                <Text className={`ml-2 font-medium ${newVehicle.type === 'BIKE' ? 'text-blue-600' : 'text-gray-600'}`}>Xe máy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-1 p-3 rounded-xl border flex-row justify-center items-center ${newVehicle.type === 'CAR' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                onPress={() => setNewVehicle({...newVehicle, type: 'CAR'})}
              >
                <Car size={20} color={newVehicle.type === 'CAR' ? '#0071e3' : '#6B7280'} />
                <Text className={`ml-2 font-medium ${newVehicle.type === 'CAR' ? 'text-blue-600' : 'text-gray-600'}`}>Ô tô</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 font-medium mb-1">Màu sắc (Tùy chọn)</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4"
              placeholder="VD: Đen"
              value={newVehicle.color}
              onChangeText={(text) => setNewVehicle({...newVehicle, color: text})}
            />

            <Text className="text-gray-600 font-medium mb-1">Ảnh xe (Tùy chọn)</Text>
            <TouchableOpacity 
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6 flex-row items-center justify-center"
              onPress={pickImage}
              disabled={uploadingImg}
            >
              {uploadingImg ? (
                <ActivityIndicator color="#0071e3" />
              ) : newVehicle.imageUrl ? (
                <Text className="text-blue-600 font-medium">Đã tải ảnh lên (Nhấn để đổi)</Text>
              ) : (
                <Text className="text-gray-600 font-medium">Chọn ảnh từ thư viện</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-blue-600 rounded-xl p-4 flex-row justify-center items-center"
              onPress={handleAddVehicle}
            >
              <Text className="text-white font-bold">Lưu phương tiện</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="space-y-3">
          {vehicles.length === 0 && !isAdding ? (
            <View className="py-10 items-center justify-center">
              <Car size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4 text-center">Bạn chưa thêm phương tiện nào.</Text>
            </View>
          ) : (
            vehicles.map((v) => (
              <View key={v.id} className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center justify-between mb-3 border border-gray-50">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-4">
                    {v.type === 'CAR' ? <Car size={24} color="#0071e3" /> : <Bike size={24} color="#0071e3" />}
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-gray-800">{v.licensePlate}</Text>
                    <Text className="text-gray-500">{v.type === 'CAR' ? 'Ô tô' : 'Xe máy'} {v.color ? `• ${v.color}` : ''}</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  className="p-2 bg-red-50 rounded-full"
                  onPress={() => handleDeleteVehicle(v.id)}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
