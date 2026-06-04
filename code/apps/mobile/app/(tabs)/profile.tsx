import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { LogOut, Settings, ChevronRight, Star } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-6 items-center border-b border-gray-100">
        <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4 overflow-hidden">
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} className="w-full h-full" />
          ) : (
            <Text className="text-3xl font-bold text-blue-600">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Text>
          )}
        </View>
        <Text className="text-2xl font-bold text-gray-800">
          {user?.firstName} {user?.lastName}
        </Text>
        <Text className="text-gray-500">{user?.email}</Text>
        
        <View className="flex-row items-center mt-3 bg-yellow-50 px-3 py-1 rounded-full">
          <Star size={16} color="#EAB308" fill="#EAB308" />
          <Text className="ml-1 text-yellow-700 font-bold">4.8</Text>
          <Text className="ml-1 text-yellow-600 text-xs">(12 đánh giá)</Text>
        </View>
      </View>

      <View className="mt-6 px-4">
        <Text className="text-gray-400 text-sm uppercase font-bold mb-3 ml-2">Cài đặt tài khoản</Text>
        
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-50">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
              <User size={20} color="#4B5563" />
            </View>
            <Text className="flex-1 text-gray-700 font-medium">Thông tin cá nhân</Text>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
              <Settings size={20} color="#4B5563" />
            </View>
            <Text className="flex-1 text-gray-700 font-medium">Cài đặt ứng dụng</Text>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className="bg-white mt-6 rounded-2xl flex-row items-center p-4 shadow-sm"
          onPress={handleLogout}
        >
          <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center mr-4">
            <LogOut size={20} color="#EF4444" />
          </View>
          <Text className="flex-1 text-red-600 font-bold">Đăng xuất</Text>
        </TouchableOpacity>
      </View>
      
      <Text className="text-center text-gray-400 text-xs mt-10 mb-10">CoRide v1.0.0</Text>
    </ScrollView>
  );
}

// Helper component for the icon in TouchableOpacity
function User({ size, color }: { size: number, color: string }) {
  const { User: UserIcon } = require('lucide-react-native');
  return <UserIcon size={size} color={color} />;
}
