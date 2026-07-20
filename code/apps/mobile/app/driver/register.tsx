import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Car, Bike, Upload, CheckCircle2, Shield, Eye } from 'lucide-react-native';
import { authService } from '../../src/services/auth.service';
import { authKeys } from '../../src/hooks/useAuth';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppInput } from '../../src/components/ui/AppInput';

type VehicleType = 'BIKE' | 'CAR';

export default function DriverRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState<VehicleType>('BIKE');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  // URL ảnh đã upload thành công lên server
  const [licenseFront, setLicenseFront] = useState('');
  const [licenseBack, setLicenseBack] = useState('');
  const [registrationFront, setRegistrationFront] = useState('');
  const [registrationBack, setRegistrationBack] = useState('');

  // Trạng thái đang upload của từng ảnh
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const kycMutation = useMutation({
    mutationFn: () => authService.submitDriverVerification({
      licenseFrontImageUrl: licenseFront,
      licenseBackImageUrl: licenseBack,
      registrationFrontImageUrl: registrationFront,
      registrationBackImageUrl: registrationBack,
      vehiclePlate,
      vehicleModel,
      vehicleType,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      Alert.alert(
        'Thành công',
        'Hồ sơ đăng ký tài xế đã được gửi lên hệ thống. Vui lòng chờ ban quản trị duyệt trong vòng 24h.',
        [{ text: 'Đồng ý', onPress: () => router.replace('/(passenger-tabs)/profile' as any) }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi gửi hồ sơ KYC.');
    }
  });

  const handlePickImage = async (field: 'licenseFront' | 'licenseBack' | 'registrationFront' | 'registrationBack') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập thư viện ảnh để tải giấy tờ lên.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0].uri, field);
    }
  };

  const uploadImage = async (uri: string, field: string) => {
    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const filename = uri.split('/').pop() || 'kyc_document.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const response = await authService.uploadKycImage(uri, type, filename);
      if (response && response.url) {
        if (field === 'licenseFront') setLicenseFront(response.url);
        if (field === 'licenseBack') setLicenseBack(response.url);
        if (field === 'registrationFront') setRegistrationFront(response.url);
        if (field === 'registrationBack') setRegistrationBack(response.url);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5001${url}`; // Fallback local server URL
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!vehiclePlate.trim() || !vehicleModel.trim()) {
        Alert.alert('Thông tin thiếu', 'Vui lòng nhập biển số xe và hãng xe/dòng xe.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!licenseFront || !licenseBack || !registrationFront || !registrationBack) {
        Alert.alert('Thiếu giấy tờ', 'Vui lòng tải lên đầy đủ hình ảnh 2 mặt bằng lái xe và 2 mặt đăng ký xe.');
        return;
      }
      setStep(3);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View className="flex-row justify-center items-center mb-8 px-6">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <View 
              className={`w-9 h-9 rounded-full items-center justify-center border-2 ${
                step >= s ? 'bg-passenger border-passenger' : 'bg-surface border-slate-300'
              }`}
            >
              {step > s ? (
                <CheckCircle2 size={16} color="white" />
              ) : (
                <AppText variant="bodySmall" weight="bold" className={step >= s ? 'text-white' : 'text-slate-500'}>
                  {s}
                </AppText>
              )}
            </View>
            {s < 3 && (
              <View className={`flex-1 h-[2px] ${step > s ? 'bg-passenger' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      {/* Custom Header */}
      <View 
        style={{ paddingTop: insets.top + 10 }}
        className="px-6 py-4 flex-row items-center bg-background border-b border-border/30"
      >
        <TouchableOpacity 
          onPress={() => step > 1 ? setStep(step - 1) : router.back()}
          className="w-10 h-10 rounded-full bg-surface border border-border/30 items-center justify-center shadow-sm active:bg-slate-50 mr-4"
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View className="flex-1">
          <AppText variant="h3" weight="bold" className="text-text-primary">Đăng ký tài xế</AppText>
          <AppText variant="caption" className="text-text-secondary">Bước {step} trên 3</AppText>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {renderStepIndicator()}

        {step === 1 && (
          <View className="bg-surface p-6 rounded-3xl border border-border/40 shadow-sm mb-6">
            <AppText variant="body" weight="bold" className="text-text-primary mb-4">Thông tin phương tiện</AppText>
            
            <AppText variant="bodySmall" weight="semibold" className="text-text-secondary mb-3">Loại phương tiện</AppText>
            <View className="flex-row mb-6 space-x-4">
              <TouchableOpacity
                onPress={() => setVehicleType('BIKE')}
                className={`flex-1 py-4 items-center justify-center rounded-2xl border-2 mr-2 ${
                  vehicleType === 'BIKE' ? 'border-passenger bg-passenger-soft text-passenger' : 'border-slate-200 bg-surface'
                }`}
                accessibilityRole="radio"
                accessibilityState={{ checked: vehicleType === 'BIKE' }}
              >
                <Bike size={24} color={vehicleType === 'BIKE' ? '#3B82F6' : '#64748B'} className="mb-1" />
                <AppText variant="bodySmall" weight="bold" className={vehicleType === 'BIKE' ? 'text-passenger' : 'text-text-secondary'}>Xe máy</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setVehicleType('CAR')}
                className={`flex-1 py-4 items-center justify-center rounded-2xl border-2 ml-2 ${
                  vehicleType === 'CAR' ? 'border-passenger bg-passenger-soft text-passenger' : 'border-slate-200 bg-surface'
                }`}
                accessibilityRole="radio"
                accessibilityState={{ checked: vehicleType === 'CAR' }}
              >
                <Car size={24} color={vehicleType === 'CAR' ? '#3B82F6' : '#64748B'} className="mb-1" />
                <AppText variant="bodySmall" weight="bold" className={vehicleType === 'CAR' ? 'text-passenger' : 'text-text-secondary'}>Ô tô</AppText>
              </TouchableOpacity>
            </View>

            <AppInput
              label="Biển số xe"
              placeholder="Ví dụ: 29A 123.45"
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
            />

            <AppInput
              label="Hãng xe & Dòng xe"
              placeholder="Ví dụ: Honda Wave RSX, Toyota Vios"
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
          </View>
        )}

        {step === 2 && (
          <View className="space-y-6 mb-6">
            {/* Giấy phép lái xe */}
            <View className="bg-surface p-5 rounded-3xl border border-border/40 shadow-sm mb-6">
              <AppText variant="body" weight="bold" className="text-text-primary mb-4">1. Bằng lái xe (GPLX)</AppText>
              
              <View className="flex-row space-x-4 mb-2">
                {/* Mặt trước */}
                <View className="flex-1 mr-2">
                  <AppText variant="caption" className="text-text-secondary mb-2">Mặt trước GPLX</AppText>
                  <TouchableOpacity 
                    onPress={() => handlePickImage('licenseFront')}
                    className="aspect-[4/3] border-2 border-dashed border-slate-300 rounded-2xl items-center justify-center overflow-hidden bg-slate-50"
                  >
                    {uploading.licenseFront ? (
                      <ActivityIndicator color="#3B82F6" />
                    ) : licenseFront ? (
                      <Image source={{ uri: getImageUrl(licenseFront) }} className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Mặt sau */}
                <View className="flex-1 ml-2">
                  <AppText variant="caption" className="text-text-secondary mb-2">Mặt sau GPLX</AppText>
                  <TouchableOpacity 
                    onPress={() => handlePickImage('licenseBack')}
                    className="aspect-[4/3] border-2 border-dashed border-slate-300 rounded-2xl items-center justify-center overflow-hidden bg-slate-50"
                  >
                    {uploading.licenseBack ? (
                      <ActivityIndicator color="#3B82F6" />
                    ) : licenseBack ? (
                      <Image source={{ uri: getImageUrl(licenseBack) }} className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Cà vẹt đăng ký xe */}
            <View className="bg-surface p-5 rounded-3xl border border-border/40 shadow-sm mb-6">
              <AppText variant="body" weight="bold" className="text-text-primary mb-4">2. Giấy đăng ký xe (Cà vẹt)</AppText>
              
              <View className="flex-row space-x-4">
                {/* Mặt trước */}
                <View className="flex-1 mr-2">
                  <AppText variant="caption" className="text-text-secondary mb-2">Mặt trước Cà vẹt</AppText>
                  <TouchableOpacity 
                    onPress={() => handlePickImage('registrationFront')}
                    className="aspect-[4/3] border-2 border-dashed border-slate-300 rounded-2xl items-center justify-center overflow-hidden bg-slate-50"
                  >
                    {uploading.registrationFront ? (
                      <ActivityIndicator color="#3B82F6" />
                    ) : registrationFront ? (
                      <Image source={{ uri: getImageUrl(registrationFront) }} className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Mặt sau */}
                <View className="flex-1 ml-2">
                  <AppText variant="caption" className="text-text-secondary mb-2">Mặt sau Cà vẹt</AppText>
                  <TouchableOpacity 
                    onPress={() => handlePickImage('registrationBack')}
                    className="aspect-[4/3] border-2 border-dashed border-slate-300 rounded-2xl items-center justify-center overflow-hidden bg-slate-50"
                  >
                    {uploading.registrationBack ? (
                      <ActivityIndicator color="#3B82F6" />
                    ) : registrationBack ? (
                      <Image source={{ uri: getImageUrl(registrationBack) }} className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="bg-surface p-6 rounded-3xl border border-border/40 shadow-sm mb-6">
            <AppText variant="body" weight="bold" className="text-text-primary mb-4 flex-row items-center">
              <Shield size={18} color="#16A34A" className="mr-2" /> Xem lại hồ sơ
            </AppText>

            <View className="space-y-4">
              <View className="flex-row justify-between py-2 border-b border-slate-100">
                <AppText className="text-text-secondary">Loại phương tiện</AppText>
                <AppText weight="bold" className="text-text-primary">{vehicleType === 'BIKE' ? 'Xe máy' : 'Ô tô'}</AppText>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-100">
                <AppText className="text-text-secondary">Biển số xe</AppText>
                <AppText weight="bold" className="text-text-primary">{vehiclePlate}</AppText>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-100">
                <AppText className="text-text-secondary">Dòng xe</AppText>
                <AppText weight="bold" className="text-text-primary">{vehicleModel}</AppText>
              </View>
              
              <View className="py-2">
                <AppText className="text-text-secondary mb-2">Giấy tờ tùy thân đã đính kèm</AppText>
                <View className="flex-row space-x-2">
                  <View className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-border/40 mr-1.5">
                    <Image source={{ uri: getImageUrl(licenseFront) }} className="w-full h-full object-cover" />
                  </View>
                  <View className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-border/40 mr-1.5">
                    <Image source={{ uri: getImageUrl(licenseBack) }} className="w-full h-full object-cover" />
                  </View>
                  <View className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-border/40 mr-1.5">
                    <Image source={{ uri: getImageUrl(registrationFront) }} className="w-full h-full object-cover" />
                  </View>
                  <View className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-border/40 mr-1.5">
                    <Image source={{ uri: getImageUrl(registrationBack) }} className="w-full h-full object-cover" />
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Button Điều hướng dưới chân */}
      <View className="p-6 border-t border-border/30 bg-surface">
        {step < 3 ? (
          <AppButton 
            title="Tiếp theo"
            variant="passenger"
            onPress={handleNextStep}
            className="w-full shadow-sm"
          />
        ) : (
          <AppButton 
            title="Gửi hồ sơ KYC"
            variant="passenger"
            onPress={() => kycMutation.mutate()}
            isLoading={kycMutation.isPending}
            disabled={kycMutation.isPending}
            className="w-full shadow-md"
          />
        )}
      </View>
    </View>
  );
}
