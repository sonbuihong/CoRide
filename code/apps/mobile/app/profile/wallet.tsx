import { ActivityIndicator, FlatList, View } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, WalletCards } from 'lucide-react-native';
import { paymentService } from '../../src/services/payment.service';
import { AppText } from '../../src/components/ui/AppText';
import { EmptyState } from '../../src/components/ui/EmptyState';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description?: string | null;
  createdAt: string;
}

export default function WalletScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: paymentService.getWallet,
  });

  if (isLoading) {
    return <View className="flex-1 items-center justify-center bg-background"><ActivityIndicator color="#2563EB" /></View>;
  }

  const transactions: Transaction[] = data?.transactions ?? [];
  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Ví CoRide' }} />
      <View className="m-5 rounded-3xl bg-slate-950 p-6">
        <View className="mb-5 h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <WalletCards color="#FFFFFF" size={24} />
        </View>
        <AppText variant="bodySmall" className="text-slate-300">Số dư chuyến đi</AppText>
        <AppText variant="display" className="mt-1 text-white">{(data?.wallet?.rideBalance ?? 0).toLocaleString('vi-VN')}đ</AppText>
        <AppText variant="bodySmall" className="mt-4 text-slate-300">Thu nhập tài xế: {(data?.wallet?.driverEarnings ?? 0).toLocaleString('vi-VN')}đ</AppText>
      </View>
      <AppText variant="h3" weight="bold" className="px-5 pb-3 text-text-primary">Giao dịch gần đây</AppText>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState title="Chưa có giao dịch" description="Các khoản thanh toán sẽ xuất hiện tại đây." />}
        renderItem={({ item }) => {
          const incoming = item.type === 'RECEIVE_PAYMENT' || item.type === 'REFUND' || item.type === 'DEPOSIT';
          const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
          return (
            <View className="mb-3 min-h-16 flex-row items-center rounded-2xl border border-border bg-surface p-4">
              <View className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${incoming ? 'bg-green-50' : 'bg-blue-50'}`}>
                <Icon size={20} color={incoming ? '#16A34A' : '#2563EB'} />
              </View>
              <View className="flex-1">
                <AppText weight="semibold" className="text-text-primary">{item.description || item.type}</AppText>
                <AppText variant="caption" className="text-text-secondary">{new Date(item.createdAt).toLocaleString('vi-VN')} · {item.status}</AppText>
              </View>
              <AppText weight="bold" className={incoming ? 'text-status-success' : 'text-text-primary'}>{incoming ? '+' : '-'}{item.amount.toLocaleString('vi-VN')}đ</AppText>
            </View>
          );
        }}
      />
    </View>
  );
}
