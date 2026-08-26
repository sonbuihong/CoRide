import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { MapPin, Navigation, Car, Bike } from 'lucide-react-native';
import { SocketEvents } from '@repo/shared';

import { tripService } from '../../src/services/trip.service';
import { socketService } from '../../src/services/socket.service';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { LocationPicker } from '../../src/components/LocationPicker';
import { paymentService } from '../../src/services/payment.service';
import { ActiveRideMap } from '../../src/components/ActiveRideMap';
import { usePassengerTrackDriver } from '../../src/hooks/useDriverLocation';

export default function RideHailingScreen() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'CAR'>('BIKE');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const driverLocation = usePassengerTrackDriver(activeTrip?.id ?? null);

  useEffect(() => {
    // Check if there is an active trip
    socketService.connect();
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

    const handleMatched = (data: any) => {
      Alert.alert('Thành công', 'Đã tìm thấy tài xế!');
      setActiveTrip((prev: any) => ({ ...prev, status: 'ACCEPTED', driver: data.driver }));
    };
    const handleNoDriver = () => {
      Alert.alert('Xin lỗi', 'Không tìm thấy tài xế nào gần đây.');
      setActiveTrip(null);
    };
    socketService.on(SocketEvents.TRIP_STATUS_UPDATE, handleStatusUpdate);
    socketService.on(SocketEvents.TRIP_MATCHED, handleMatched);
    socketService.on(SocketEvents.TRIP_NO_DRIVER, handleNoDriver);
    
    return () => {
      socketService.off(SocketEvents.TRIP_STATUS_UPDATE, handleStatusUpdate);
      socketService.off(SocketEvents.TRIP_MATCHED, handleMatched);
      socketService.off(SocketEvents.TRIP_NO_DRIVER, handleNoDriver);
    };
  }, []);

  const handleRequestRide = async () => {
    if (!pickup || !dropoff || !pickupCoords || !dropoffCoords) {
      Alert.alert('Lỗi', 'Vui lòng chọn điểm đón và điểm đến từ danh sách gợi ý.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        originAddress: pickup,
        originLat: pickupCoords.latitude,
        originLng: pickupCoords.longitude,
        destAddress: dropoff,
        destLat: dropoffCoords.latitude,
        destLng: dropoffCoords.longitude,
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
    } catch {
      Alert.alert('Lỗi', 'Không thể hủy cuốc xe');
    }
  };

  const handlePayment = async () => {
    if (!activeTrip?.id) return;
    try {
      setIsPaying(true);
      const qr = await paymentService.getSimulatorQr(activeTrip.id);
      if (!qr?.data?.qrUrl) throw new Error('missing_qr');
      await Linking.openURL(qr.data.qrUrl);
      Alert.alert('Thanh toán mô phỏng', 'Sau khi quét mã, hãy xác nhận thanh toán.', [
        { text: 'Để sau', style: 'cancel', onPress: () => setIsPaying(false) },
        {
          text: 'Tôi đã thanh toán',
          onPress: async () => {
            try {
              await paymentService.confirmSimulatorPayment(activeTrip.id);
              setTimeout(() => {
                setActiveTrip(null);
                setIsPaying(false);
                Alert.alert('Thành công', 'Thanh toán đã được xác nhận.');
              }, 3500);
            } catch {
              setIsPaying(false);
              Alert.alert('Lỗi', 'Không thể xác nhận thanh toán.');
            }
          },
        },
      ]);
    } catch {
      setIsPaying(false);
      Alert.alert('Lỗi', 'Không thể tạo mã QR thanh toán.');
    }
  };

  if (activeTrip) {
    const originCoords = {
      latitude: Number(activeTrip.originLat),
      longitude: Number(activeTrip.originLng),
    };
    const destinationCoords = {
      latitude: Number(activeTrip.destLat),
      longitude: Number(activeTrip.destLng),
    };
    const hasMapCoordinates = [
      originCoords.latitude,
      originCoords.longitude,
      destinationCoords.latitude,
      destinationCoords.longitude,
    ].every(Number.isFinite);

    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View style={{ padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
          <AppText style={{ fontSize: 20, fontWeight: 'bold' }}>Trạng thái chuyến đi</AppText>
        </View>
        {hasMapCoordinates && (
          <View style={{ height: 260 }}>
            <ActiveRideMap
              originCoords={originCoords}
              destinationCoords={destinationCoords}
              routeCoords={[originCoords, destinationCoords]}
              driverLocation={driverLocation}
              originLabel={activeTrip.originAddress}
              destinationLabel={activeTrip.destAddress}
            />
          </View>
        )}
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
            <AppText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#3b82f6' }}>
              {activeTrip.status === 'MATCHING' && 'Đang tìm tài xế...'}
              {activeTrip.status === 'PENDING' && 'Đang chờ xử lý...'}
              {activeTrip.status === 'ACCEPTED' && 'Tài xế đang đến đón'}
              {activeTrip.status === 'ARRIVING' && 'Tài xế đang đến điểm đón'}
              {activeTrip.status === 'IN_PROGRESS' && 'Đang trong hành trình'}
              {activeTrip.status === 'WAITING_PAYMENT' && 'Chờ thanh toán'}
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
          {activeTrip.status === 'WAITING_PAYMENT' && (
            <AppButton title="Thanh toán bằng QR" onPress={handlePayment} isLoading={isPaying} />
          )}
          {activeTrip.status === 'COMPLETED' && (
            <AppButton title="Đặt chuyến mới" onPress={() => setActiveTrip(null)} />
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
        <AppText style={{ fontSize: 20, fontWeight: 'bold' }}>Gọi xe Nhanh</AppText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
          <View style={{ marginBottom: 15 }}>
            <AppText style={{ marginBottom: 5, fontWeight: '500' }}>Điểm đón</AppText>
            <LocationPicker
              label="Điểm đón"
              value={pickup}
              onChangeText={setPickup}
              placeholder="Nhập điểm đón"
              onSelectCoords={(latitude, longitude) => setPickupCoords({ latitude, longitude })}
            />
          </View>
          
          <View style={{ marginBottom: 20 }}>
            <AppText style={{ marginBottom: 5, fontWeight: '500' }}>Điểm đến</AppText>
            <LocationPicker
              label="Điểm đến"
              value={dropoff}
              onChangeText={setDropoff}
              placeholder="Nhập điểm đến"
              onSelectCoords={(latitude, longitude) => setDropoffCoords({ latitude, longitude })}
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
