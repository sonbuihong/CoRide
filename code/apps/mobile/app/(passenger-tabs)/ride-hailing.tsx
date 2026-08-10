import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Navigation, Car, Bike, AlertCircle } from 'lucide-react-native';

import { tripService } from '../../src/services/trip.service';
import { socketService } from '../../src/services/socket.service';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppInput } from '../../src/components/ui/AppInput';

export default function RideHailingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [pickup, setPickup] = useState('Hà Đông, Hà Nội');
  const [dropoff, setDropoff] = useState('Cầu Giấy, Hà Nội');
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'CAR'>('BIKE');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any>(null);

  useEffect(() => {
    // Check if there is an active trip
    tripService.getActiveTrip().then(res => {
      if (res.data) {
        setActiveTrip(res.data);
      }
    }).catch(err => console.log('No active trip'));

    // Socket events
    const handleStatusUpdate = (data: any) => {
      if (data.status === 'MATCHING') {
        // Keep showing searching
      } else if (data.status === 'NO_DRIVER') {
        Alert.alert('Xin lỗi', 'Không tìm thấy tài xế nào gần đây.');
        setActiveTrip(null);
      } else {
        // MATCHED, STARTED, etc.
        setActiveTrip((prev: any) => ({ ...prev, status: data.status }));
      }
    };

    socketService.on('trip:status_update', handleStatusUpdate);
    socketService.on('trip:matched', (data) => {
      Alert.alert('Thành công', 'Đã tìm thấy tài xế!');
      setActiveTrip((prev: any) => ({ ...prev, status: 'ACCEPTED', driver: data.driver }));
    });
    
    return () => {
      socketService.off('trip:status_update', handleStatusUpdate);
      socketService.off('trip:matched');
    };
  }, []);

  const handleRequestRide = async () => {
    if (!pickup || !dropoff) {
      Alert.alert('Lỗi', 'Vui lòng nhập điểm đón và điểm đến');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        originAddress: pickup,
        originLat: 20.971936, // Mock tọa độ Hà Đông
        originLng: 105.771239,
        destAddress: dropoff,
        destLat: 21.033623, // Mock tọa độ Cầu Giấy
        destLng: 105.795856,
        vehicleType
      };

      const res = await tripService.createTrip(payload);
      setActiveTrip(res.data);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo cuốc xe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!activeTrip) return;
    try {
      await tripService.cancelTrip(activeTrip.id, 'Hành khách đổi ý');
      setActiveTrip(null);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hủy cuốc xe');
    }
  };

  if (activeTrip) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingTop: insets.top }}>
        <View style={{ padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
          <AppText style={{ fontSize: 20, fontWeight: 'bold' }}>Trạng thái chuyến đi</AppText>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
            <AppText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#3b82f6' }}>
              {activeTrip.status === 'MATCHING' && 'Đang tìm tài xế...'}
              {activeTrip.status === 'PENDING' && 'Đang chờ xử lý...'}
              {activeTrip.status === 'ACCEPTED' && 'Tài xế đang đến đón'}
              {activeTrip.status === 'IN_PROGRESS' && 'Đang trong hành trình'}
              {activeTrip.status === 'COMPLETED' && 'Chuyến đi đã hoàn thành'}
            </AppText>
            
            {activeTrip.status === 'MATCHING' && (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 20 }} />
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <MapPin size={24} color="#ef4444" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <AppText style={{ color: '#64748b' }}>Điểm đón</AppText>
                <AppText style={{ fontWeight: '500' }}>{activeTrip.originAddress}</AppText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Navigation size={24} color="#3b82f6" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <AppText style={{ color: '#64748b' }}>Điểm đến</AppText>
                <AppText style={{ fontWeight: '500' }}>{activeTrip.destAddress}</AppText>
              </View>
            </View>
          </View>

          {activeTrip.driver && (
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
              <AppText style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Thông tin tài xế</AppText>
              <AppText>Tên: {activeTrip.driver.firstName} {activeTrip.driver.lastName}</AppText>
              <AppText>SĐT: {activeTrip.driver.phone || 'Không có'}</AppText>
            </View>
          )}

          {['PENDING', 'MATCHING', 'ACCEPTED'].includes(activeTrip.status) && (
            <AppButton title="Hủy chuyến" variant="outline" onPress={handleCancelTrip} />
          )}
          {activeTrip.status === 'COMPLETED' && (
            <AppButton title="Đặt chuyến mới" onPress={() => setActiveTrip(null)} />
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingTop: insets.top }}>
      <View style={{ padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
        <AppText style={{ fontSize: 20, fontWeight: 'bold' }}>Gọi xe Nhanh</AppText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
          <View style={{ marginBottom: 15 }}>
            <AppText style={{ marginBottom: 5, fontWeight: '500' }}>Điểm đón</AppText>
            <AppInput
              value={pickup}
              onChangeText={setPickup}
              placeholder="Nhập điểm đón"
            />
          </View>
          
          <View style={{ marginBottom: 20 }}>
            <AppText style={{ marginBottom: 5, fontWeight: '500' }}>Điểm đến</AppText>
            <AppInput
              value={dropoff}
              onChangeText={setDropoff}
              placeholder="Nhập điểm đến"
            />
          </View>

          <AppText style={{ marginBottom: 10, fontWeight: '500' }}>Loại xe</AppText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setVehicleType('BIKE')}
              style={{
                flex: 1,
                padding: 15,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: vehicleType === 'BIKE' ? '#3b82f6' : '#e2e8f0',
                backgroundColor: vehicleType === 'BIKE' ? '#eff6ff' : 'white',
                alignItems: 'center',
                marginRight: 10
              }}
            >
              <Bike size={32} color={vehicleType === 'BIKE' ? '#3b82f6' : '#64748b'} />
              <AppText style={{ marginTop: 5, color: vehicleType === 'BIKE' ? '#3b82f6' : '#64748b' }}>Xe máy</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setVehicleType('CAR')}
              style={{
                flex: 1,
                padding: 15,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: vehicleType === 'CAR' ? '#3b82f6' : '#e2e8f0',
                backgroundColor: vehicleType === 'CAR' ? '#eff6ff' : 'white',
                alignItems: 'center'
              }}
            >
              <Car size={32} color={vehicleType === 'CAR' ? '#3b82f6' : '#64748b'} />
              <AppText style={{ marginTop: 5, color: vehicleType === 'CAR' ? '#3b82f6' : '#64748b' }}>Ô tô</AppText>
            </TouchableOpacity>
          </View>

          <AppButton 
            title="Tìm Tài Xế" 
            onPress={handleRequestRide} 
            isLoading={isLoading}
          />
        </View>

      </ScrollView>
    </View>
  );
}
