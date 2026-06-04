import { View, Text } from 'react-native';

export default function MyRidesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-gray-800">Chuyến đi của tôi</Text>
      <Text className="text-gray-500">Danh sách các chuyến đi bạn đã tham gia hoặc tạo.</Text>
    </View>
  );
}
