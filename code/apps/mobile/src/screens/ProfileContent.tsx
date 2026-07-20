import React, { useState } from 'react';
import { View, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { authKeys } from '../../src/hooks/useAuth';
import { authService } from '../../src/services/auth.service';
import { useRouter } from 'expo-router';
import { LogOut, Settings, ChevronRight, Car, User as UserIcon, Camera, ShieldCheck, Bell, HelpCircle, FileText, Briefcase, Navigation, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { AppText } from '../../src/components/ui/AppText';
import { KYCStatusCard } from '../../src/components/ui/KYCStatusCard';
import { useAppStore } from '../stores/useAppStore';
import { getDriverEligibility, getKycStatusMapper } from '../utils/mode-checker';
import * as SecureStore from '../services/secure-store';
import { User } from '../services/auth.service';

export interface ProfileContentProps {
  user: User | null;
  isPrototype?: boolean;
  onLogout?: () => void;
}

export default function ProfileContent({ user, isPrototype = false, onLogout }: ProfileContentProps) {
  const router = useRouter();
  const { appMode, setAppMode } = useAppStore();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      if (Platform.OS === 'web') {
        const confirm = window.confirm("Bạn có chắc chắn muốn đăng xuất?");
        if (confirm) onLogout();
        return;
      }
      Alert.alert(
        "Đăng xuất",
        "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đăng xuất",
            style: "destructive",
            onPress: () => onLogout()
          }
        ]
      );
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập thư viện ảnh để đổi ảnh đại diện');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleUploadAvatar(result.assets[0]);
    }
  };

  const handleUploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploading(true);
      const uri = asset.uri;
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const response = await authService.uploadAvatar(uri, type, filename);
      queryClient.setQueryData(authKeys.me(), response.user);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const eligibility = getDriverEligibility(user);
  const kycStatus = getKycStatusMapper(user);
  const displayAvatar = user?.avatarUrl || user?.avatar;

  const toggleAppMode = async (mode: 'passenger' | 'driver') => {
    if (mode === appMode) return;
    
    if (mode === 'passenger' && appMode === 'driver') {
      if (!isPrototype) {
        if (user?.id) await SecureStore.setAppMode(user.id, 'passenger');
        setAppMode('passenger');
        router.replace('/(passenger-tabs)' as any);
      } else {
        setAppMode('passenger');
      }
      return;
    }

    if (mode === 'driver' && eligibility.eligible) {
      if (!isPrototype) {
        if (user?.id) await SecureStore.setAppMode(user.id, 'driver');
        setAppMode('driver');
        router.replace('/(driver-tabs)' as any);
      } else {
        setAppMode('driver');
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-background pb-10" showsVerticalScrollIndicator={false}>
      {/* 1. Header Area */}
      <View className="bg-surface p-6 pb-8 items-center rounded-b-[32px] shadow-sm mb-6 border-b border-border z-10">
        <TouchableOpacity 
          onPress={pickImage}
          disabled={isUploading}
          className="relative w-28 h-28 bg-primary-soft rounded-full mb-5"
          activeOpacity={0.8}
        >
          <View className="w-full h-full rounded-full overflow-hidden items-center justify-center border-4 border-surface shadow-sm">
            {isUploading ? (
              <ActivityIndicator color="#3B82F6" size="large" />
            ) : displayAvatar ? (
              <Image source={{ uri: displayAvatar }} className="w-full h-full" />
            ) : (
              <AppText variant="display" weight="bold" className="text-primary">
                {user?.firstName?.charAt(0) || ''}
              </AppText>
            )}
          </View>
          <View className="absolute bottom-1 right-1 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-surface shadow-sm">
            <Camera size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <AppText variant="h2" weight="bold" className="text-text-primary mb-1">
          {user?.firstName} {user?.lastName}
        </AppText>
        <AppText variant="body" className="text-text-secondary mb-4">{user?.email}</AppText>
        
        <TouchableOpacity 
          className="bg-gray-100 px-6 py-2.5 rounded-full flex-row items-center border border-border"
          onPress={() => router.push('/profile/edit' as any)}
        >
          <UserIcon size={16} color="#0F172A" className="mr-2" />
          <AppText variant="bodySmall" weight="bold" className="text-text-primary">Chỉnh sửa hồ sơ</AppText>
        </TouchableOpacity>
      </View>

      <View className="px-5">
        {/* 2. Mode Selector Segmented Control */}
        {eligibility.eligible ? (
          <View className="bg-surface p-1.5 rounded-2xl mb-8 border border-border shadow-sm flex-row">
            <TouchableOpacity 
              onPress={() => toggleAppMode('passenger')}
              className={`flex-1 py-3 px-2 rounded-xl flex-row items-center justify-center ${appMode === 'passenger' ? 'bg-primary shadow-sm' : ''}`}
            >
              <Navigation size={18} color={appMode === 'passenger' ? '#FFFFFF' : '#64748B'} className="mr-2" />
              <AppText variant="bodySmall" weight="bold" className={appMode === 'passenger' ? 'text-surface' : 'text-text-secondary'}>Hành khách</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => toggleAppMode('driver')}
              className={`flex-1 py-3 px-2 rounded-xl flex-row items-center justify-center ${appMode === 'driver' ? 'bg-primary shadow-sm' : ''}`}
            >
              <Car size={18} color={appMode === 'driver' ? '#FFFFFF' : '#64748B'} className="mr-2" />
              <AppText variant="bodySmall" weight="bold" className={appMode === 'driver' ? 'text-surface' : 'text-text-secondary'}>Tài xế</AppText>
            </TouchableOpacity>
          </View>
        ) : eligibility.reason === 'inconsistent_data' ? (
          <View className="bg-status-warning/10 p-4 rounded-2xl border border-status-warning/20 mb-8 flex-row items-center">
            <ShieldCheck size={24} color="#F59E0B" className="mr-3" />
            <AppText variant="bodySmall" className="text-status-warning font-medium flex-1">
              Hồ sơ tài xế của bạn cần được kiểm tra lại. Vui lòng liên hệ hỗ trợ.
            </AppText>
          </View>
        ) : null}

        {/* 3. Driver Verification Card */}
        <AppText variant="h3" weight="bold" className="text-text-primary mb-3 ml-1">Tài xế & Phương tiện</AppText>
        <View className="mb-6">
          <KYCStatusCard 
            status={kycStatus} 
            rejectionReason={user?.driverVerification?.rejectionReason}
            onPressAction={() => router.push('/driver/register' as any)} 
          />

          {kycStatus === 'APPROVED' && (
            <View className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-border mt-3">
              {user?.vehicles && user.vehicles.length > 0 ? (
                user.vehicles.map((v, idx) => (
                  <TouchableOpacity 
                    key={v.id}
                    className={`flex-row items-center p-4 ${idx < (user.vehicles?.length || 0) - 1 ? 'border-b border-border' : ''}`}
                    onPress={() => router.push('/profile/vehicles' as any)}
                  >
                    <View className="w-10 h-10 bg-primary-soft rounded-full items-center justify-center mr-4">
                      <Car size={20} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      <AppText variant="body" weight="medium" className="text-text-primary">
                        {v.licensePlate}
                      </AppText>
                      <AppText variant="caption" className="text-text-secondary mt-0.5">
                        {v.type === 'CAR' ? 'Ô tô' : 'Xe máy'} {v.color ? `• ${v.color}` : ''}
                      </AppText>
                    </View>
                    <ChevronRight size={20} color="#94A3B8" />
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity 
                  className="flex-row items-center p-4"
                  onPress={() => router.push('/profile/vehicles' as any)}
                >
                  <View className="w-10 h-10 bg-primary-soft rounded-full items-center justify-center mr-4">
                    <Car size={20} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <AppText variant="body" weight="medium" className="text-text-primary">Thêm phương tiện</AppText>
                    <AppText variant="caption" className="text-text-secondary mt-0.5">Quản lý xe của bạn</AppText>
                  </View>
                  <ChevronRight size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 4. Settings Group */}
        <AppText variant="h3" weight="bold" className="text-text-primary mb-3 ml-1 mt-2">Cài đặt</AppText>
        <View className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-border mb-6">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-border">
            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4 border border-border">
              <Bell size={20} color="#64748B" />
            </View>
            <AppText variant="body" weight="medium" className="flex-1 text-text-primary">Thông báo</AppText>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-4 border-b border-border">
            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4 border border-border">
              <ShieldCheck size={20} color="#64748B" />
            </View>
            <AppText variant="body" weight="medium" className="flex-1 text-text-primary">Quyền riêng tư & Bảo mật</AppText>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-4">
            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4 border border-border">
              <Settings size={20} color="#64748B" />
            </View>
            <AppText variant="body" weight="medium" className="flex-1 text-text-primary">Cài đặt chung</AppText>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 5. Help Group */}
        <AppText variant="h3" weight="bold" className="text-text-primary mb-3 ml-1 mt-2">Trợ giúp</AppText>
        <View className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-border mb-6">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-border">
            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4 border border-border">
              <HelpCircle size={20} color="#64748B" />
            </View>
            <AppText variant="body" weight="medium" className="flex-1 text-text-primary">Trung tâm hỗ trợ</AppText>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-4">
            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4 border border-border">
              <FileText size={20} color="#64748B" />
            </View>
            <AppText variant="body" weight="medium" className="flex-1 text-text-primary">Điều khoản dịch vụ</AppText>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 6. Logout */}
        <TouchableOpacity 
          className="bg-surface rounded-2xl flex-row items-center p-4 shadow-sm border border-status-danger/30"
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <View className="w-10 h-10 bg-status-danger/10 rounded-full items-center justify-center mr-4">
            <LogOut size={20} color="#EF4444" />
          </View>
          <AppText variant="body" weight="bold" className="flex-1 text-status-danger">Đăng xuất</AppText>
        </TouchableOpacity>
      </View>
      
      <AppText variant="caption" className="text-center text-text-secondary mt-8 mb-4">CoRide v1.0.0</AppText>
    </ScrollView>
  );
}
