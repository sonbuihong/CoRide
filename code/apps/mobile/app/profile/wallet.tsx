import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  PlusCircle,
  QrCode,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react-native';

import { paymentService } from '../../src/services/payment.service';
import { authService } from '../../src/services/auth.service';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppInput } from '../../src/components/ui/AppInput';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';

interface Transaction {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'RECEIVE_PAYMENT' | 'REFUND' | string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description?: string | null;
  createdAt: string;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const POPULAR_BANKS = [
  'Vietcombank',
  'MB Bank',
  'Techcombank',
  'VPBank',
  'ACB',
  'BIDV',
  'Agribank',
  'TPBank',
];

export default function WalletScreen() {
  const queryClient = useQueryClient();

  // Queries
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['wallet'],
    queryFn: paymentService.getWallet,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => authService.getCurrentUser(),
  });

  // Modals state
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('100000');
  const [depositMethod, setDepositMethod] = useState<'SIMULATOR' | 'QR' | 'ATM'>('SIMULATOR');

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSource, setWithdrawSource] = useState<'driverEarnings' | 'rideBalance'>('driverEarnings');
  const [bankName, setBankName] = useState(POPULAR_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Transaction filter
  const [filterType, setFilterType] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'RIDES'>('ALL');

  // Mutations
  const depositMutation = useMutation({
    mutationFn: ({ amount, method }: { amount: number; method: string }) =>
      paymentService.deposit(amount, method),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setDepositModalVisible(false);
      Alert.alert('Nạp tiền thành công', res.message || 'Số dư ví đã được cập nhật.');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi nạp tiền', error.response?.data?.message || 'Không thể thực hiện nạp tiền.');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (payload: {
      amount: number;
      source: 'driverEarnings' | 'rideBalance';
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }) => paymentService.withdraw(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      setAccountNumber('');
      Alert.alert('Rút tiền thành công', res.message || 'Yêu cầu rút tiền đã được thực hiện.');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi rút tiền', error.response?.data?.message || 'Không thể thực hiện rút tiền.');
    },
  });

  const rideBalance = data?.wallet?.rideBalance ?? 0;
  const driverEarnings = data?.wallet?.driverEarnings ?? 0;
  const allTransactions: Transaction[] = data?.transactions ?? [];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (filterType === 'ALL') return allTransactions;
    if (filterType === 'DEPOSIT') return allTransactions.filter((t) => t.type === 'DEPOSIT');
    if (filterType === 'WITHDRAWAL') return allTransactions.filter((t) => t.type === 'WITHDRAWAL');
    if (filterType === 'RIDES') {
      return allTransactions.filter(
        (t) => t.type === 'PAYMENT' || t.type === 'RECEIVE_PAYMENT' || t.type === 'REFUND',
      );
    }
    return allTransactions;
  }, [allTransactions, filterType]);

  const handleOpenDeposit = () => {
    setDepositAmount('100000');
    setDepositMethod('SIMULATOR');
    setDepositModalVisible(true);
  };

  const handleOpenWithdraw = (defaultSource: 'driverEarnings' | 'rideBalance' = 'driverEarnings') => {
    setWithdrawSource(defaultSource);
    setWithdrawAmount('');
    if (!accountHolder && currentUser) {
      const name = [currentUser.lastName, currentUser.firstName].filter(Boolean).join(' ').trim().toUpperCase();
      if (name) setAccountHolder(name);
    }
    setWithdrawModalVisible(true);
  };

  const handleConfirmDeposit = () => {
    const amount = Number(depositAmount);
    if (isNaN(amount) || amount < 10000) {
      Alert.alert('Số tiền không hợp lệ', 'Số tiền nạp tối thiểu là 10.000đ');
      return;
    }
    depositMutation.mutate({ amount, method: depositMethod });
  };

  const handleConfirmWithdraw = () => {
    const amount = Number(withdrawAmount);
    const maxAvailable = withdrawSource === 'driverEarnings' ? driverEarnings : rideBalance;

    if (isNaN(amount) || amount < 50000) {
      Alert.alert('Số tiền không hợp lệ', 'Số tiền rút tối thiểu là 50.000đ');
      return;
    }
    if (amount > maxAvailable) {
      Alert.alert(
        'Số dư không đủ',
        `Số dư khả dụng của bạn là ${maxAvailable.toLocaleString('vi-VN')}đ`,
      );
      return;
    }
    if (!bankName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ngân hàng nhận tiền');
      return;
    }
    if (!accountNumber.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tài khoản ngân hàng');
      return;
    }
    if (!accountHolder.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên chủ tài khoản');
      return;
    }

    withdrawMutation.mutate({
      amount,
      source: withdrawSource,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Ví CoRide', headerBackTitle: 'Quay lại' }} />

      <View style={{ alignSelf: 'center', flex: 1, maxWidth: layout.maxContentWidth, width: '100%' }}>
        {/* ── THẺ VÍ CORIDE HIỆN ĐẠI ── */}
        <View style={styles.walletCard}>
          {/* Header Card */}
          <View style={styles.cardHeader}>
            <View style={styles.cardLogo}>
              <WalletCards color="#FFFFFF" size={22} />
              <AppText variant="bodySmall" weight="bold" style={styles.cardBrandText}>
                CoRide Pay
              </AppText>
            </View>
            <View style={styles.verifiedBadge}>
              <Sparkles size={13} color="#FBBF24" />
              <AppText variant="caption" weight="medium" style={styles.verifiedBadgeText}>
                Ví an toàn
              </AppText>
            </View>
          </View>

          {/* Hai cột số dư: Số dư đi xe & Thu nhập tài xế */}
          <View style={styles.balancesContainer}>
            <View style={styles.balanceCol}>
              <AppText variant="caption" style={styles.balanceLabel}>
                Số dư đi xe
              </AppText>
              <AppText variant="h2" weight="bold" style={styles.balanceMainValue}>
                {rideBalance.toLocaleString('vi-VN')}đ
              </AppText>
              <AppText variant="caption" style={styles.balanceSubnote}>
                Dùng đặt xe & thanh toán
              </AppText>
            </View>

            <View style={styles.balanceDivider} />

            <View style={styles.balanceCol}>
              <AppText variant="caption" style={styles.balanceLabel}>
                Thu nhập tài xế
              </AppText>
              <AppText variant="h2" weight="bold" style={styles.balanceDriverValue}>
                {driverEarnings.toLocaleString('vi-VN')}đ
              </AppText>
              <AppText variant="caption" style={styles.balanceSubnote}>
                Từ các chuyến đã đón
              </AppText>
            </View>
          </View>

          {/* Hai nút hành động: Nạp tiền & Rút tiền */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.depositActionButton}
              onPress={handleOpenDeposit}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Nạp tiền vào ví CoRide"
            >
              <PlusCircle size={18} color="#FFFFFF" />
              <AppText variant="bodySmall" weight="bold" style={styles.depositActionText}>
                Nạp tiền
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.withdrawActionButton}
              onPress={() => handleOpenWithdraw('driverEarnings')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Rút tiền về tài khoản ngân hàng"
            >
              <ArrowUpRight size={18} color="#FFFFFF" />
              <AppText variant="bodySmall" weight="semibold" style={styles.withdrawActionText}>
                Rút tiền
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── BỘ LỌC LỊCH SỬ GIAO DỊCH ── */}
        <View style={styles.historyHeader}>
          <AppText variant="h3" weight="bold" style={styles.historyTitle}>
            Lịch sử giao dịch
          </AppText>
          <View style={styles.filterRow}>
            {(
              [
                { key: 'ALL', label: 'Tất cả' },
                { key: 'DEPOSIT', label: 'Nạp' },
                { key: 'WITHDRAWAL', label: 'Rút' },
                { key: 'RIDES', label: 'Chuyến đi' },
              ] as const
            ).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, filterType === f.key && styles.filterChipActive]}
                onPress={() => setFilterType(f.key)}
                activeOpacity={0.7}
              >
                <AppText
                  variant="caption"
                  weight={filterType === f.key ? 'bold' : 'normal'}
                  style={[styles.filterChipText, filterType === f.key && styles.filterChipTextActive]}
                >
                  {f.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── DANH SÁCH GIAO DỊCH ── */}
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="Chưa có giao dịch"
              description="Các giao dịch nạp, rút hoặc thanh toán chuyến đi sẽ xuất hiện tại đây."
            />
          }
          renderItem={({ item }) => {
            const isDeposit = item.type === 'DEPOSIT';
            const isWithdrawal = item.type === 'WITHDRAWAL';
            const isReceive = item.type === 'RECEIVE_PAYMENT';
            const isRefund = item.type === 'REFUND';
            const isIncoming = isDeposit || isReceive || isRefund;

            let IconComponent = ArrowUpRight;
            let iconBgColor = '#EFF6FF';
            let iconColor = '#2563EB';

            if (isDeposit) {
              IconComponent = PlusCircle;
              iconBgColor = '#ECFDF5';
              iconColor = '#10B981';
            } else if (isWithdrawal) {
              IconComponent = ArrowUpRight;
              iconBgColor = '#FFF7ED';
              iconColor = '#F97316';
            } else if (isReceive) {
              IconComponent = ArrowDownLeft;
              iconBgColor = '#ECFDF5';
              iconColor = '#10B981';
            } else if (isRefund) {
              IconComponent = ArrowDownLeft;
              iconBgColor = '#F0F9FF';
              iconColor = '#0284C7';
            }

            return (
              <View style={styles.transactionCard}>
                <View style={[styles.transactionIconBox, { backgroundColor: iconBgColor }]}>
                  <IconComponent size={20} color={iconColor} />
                </View>
                <View style={styles.transactionInfo}>
                  <AppText weight="semibold" numberOfLines={1} style={styles.transactionDesc}>
                    {item.description || (isDeposit ? 'Nạp tiền ví' : isWithdrawal ? 'Rút tiền' : item.type)}
                  </AppText>
                  <View style={styles.transactionMeta}>
                    <AppText variant="caption" style={styles.transactionDate}>
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </AppText>
                    <View style={styles.statusBadge}>
                      <AppText variant="caption" style={styles.statusBadgeText}>
                        {item.status === 'SUCCESS' ? 'Thành công' : item.status === 'PENDING' ? 'Đang xử lý' : 'Thất bại'}
                      </AppText>
                    </View>
                  </View>
                </View>
                <AppText
                  weight="bold"
                  style={[
                    styles.transactionAmount,
                    { color: isIncoming ? '#16A34A' : isWithdrawal ? '#EA580C' : colors.textPrimary },
                  ]}
                >
                  {isIncoming ? '+' : '-'}{item.amount.toLocaleString('vi-VN')}đ
                </AppText>
              </View>
            );
          }}
        />
      </View>

      {/* ── MODAL NẠP TIỀN ── */}
      <Modal visible={depositModalVisible} transparent animationType="slide" onRequestClose={() => setDepositModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDepositModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <AppText variant="h3" weight="bold">Nạp tiền vào ví</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  Nạp số dư để thanh toán chuyến đi tiện lợi
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setDepositModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nhập số tiền */}
              <AppInput
                label="Số tiền nạp (VNĐ)"
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={(text) => setDepositAmount(text.replace(/[^0-9]/g, ''))}
                placeholder="Nhập số tiền (tối thiểu 10.000đ)"
                leftIcon={<Banknote size={20} color={colors.textSecondary} />}
              />

              {/* Mốc tiền gợi ý nhanh */}
              <AppText variant="caption" weight="medium" style={styles.inputSectionLabel}>
                Chọn nhanh số tiền
              </AppText>
              <View style={styles.quickAmountRow}>
                {QUICK_AMOUNTS.map((amt) => {
                  const isSelected = depositAmount === amt.toString();
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.quickAmountChip, isSelected && styles.quickAmountChipSelected]}
                      onPress={() => setDepositAmount(amt.toString())}
                      activeOpacity={0.7}
                    >
                      <AppText
                        variant="caption"
                        weight={isSelected ? 'bold' : 'medium'}
                        style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}
                      >
                        {(amt / 1000).toLocaleString('vi-VN')}k
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Phương thức nạp */}
              <AppText variant="caption" weight="medium" style={styles.inputSectionLabel}>
                Phương thức nạp
              </AppText>
              <View style={styles.methodList}>
                {[
                  {
                    id: 'SIMULATOR',
                    title: 'Cổng thanh toán CoRide (Nạp ngay)',
                    desc: 'Cập nhật số dư ví tức thì',
                    icon: <Sparkles size={20} color={colors.primary} />,
                  },
                  {
                    id: 'QR',
                    title: 'Chuyển khoản VietQR',
                    desc: 'Quét mã QR từ ứng dụng ngân hàng',
                    icon: <QrCode size={20} color="#16A34A" />,
                  },
                  {
                    id: 'ATM',
                    title: 'Thẻ ATM / Ngân hàng nội địa',
                    desc: 'Thẻ ngân hàng Napas có Internet Banking',
                    icon: <CreditCard size={20} color="#F59E0B" />,
                  },
                ].map((m) => {
                  const isSelected = depositMethod === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.methodItem, isSelected && styles.methodItemSelected]}
                      onPress={() => setDepositMethod(m.id as any)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.methodIconBox}>{m.icon}</View>
                      <View style={{ flex: 1 }}>
                        <AppText weight="semibold" style={styles.methodTitle}>
                          {m.title}
                        </AppText>
                        <AppText variant="caption" style={styles.methodDesc}>
                          {m.desc}
                        </AppText>
                      </View>
                      {isSelected && <CheckCircle2 size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: 24, marginBottom: 12 }}>
                <AppButton
                  title={
                    depositAmount
                      ? `Xác nhận nạp ${Number(depositAmount).toLocaleString('vi-VN')}đ`
                      : 'Xác nhận nạp tiền'
                  }
                  variant="primary"
                  isLoading={depositMutation.isPending}
                  disabled={depositMutation.isPending || !depositAmount}
                  onPress={handleConfirmDeposit}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL RÚT TIỀN ── */}
      <Modal visible={withdrawModalVisible} transparent animationType="slide" onRequestClose={() => setWithdrawModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setWithdrawModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <AppText variant="h3" weight="bold">Rút tiền về ngân hàng</AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  Tiền sẽ được chuyển về tài khoản trong 5-15 phút
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Chọn nguồn rút tiền */}
              <AppText variant="caption" weight="medium" style={styles.inputSectionLabel}>
                Nguồn rút tiền
              </AppText>
              <View style={styles.sourceSelector}>
                <TouchableOpacity
                  style={[styles.sourceOption, withdrawSource === 'driverEarnings' && styles.sourceOptionActive]}
                  onPress={() => setWithdrawSource('driverEarnings')}
                  activeOpacity={0.7}
                >
                  <AppText variant="caption" weight="semibold" style={withdrawSource === 'driverEarnings' ? styles.sourceTextActive : styles.sourceText}>
                    Thu nhập tài xế
                  </AppText>
                  <AppText variant="bodySmall" weight="bold" style={withdrawSource === 'driverEarnings' ? styles.sourceValueActive : styles.sourceValue}>
                    {driverEarnings.toLocaleString('vi-VN')}đ
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sourceOption, withdrawSource === 'rideBalance' && styles.sourceOptionActive]}
                  onPress={() => setWithdrawSource('rideBalance')}
                  activeOpacity={0.7}
                >
                  <AppText variant="caption" weight="semibold" style={withdrawSource === 'rideBalance' ? styles.sourceTextActive : styles.sourceText}>
                    Số dư chuyến đi
                  </AppText>
                  <AppText variant="bodySmall" weight="bold" style={withdrawSource === 'rideBalance' ? styles.sourceValueActive : styles.sourceValue}>
                    {rideBalance.toLocaleString('vi-VN')}đ
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Nhập số tiền rút */}
              <View style={{ position: 'relative' }}>
                <AppInput
                  label="Số tiền rút (VNĐ)"
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={(text) => setWithdrawAmount(text.replace(/[^0-9]/g, ''))}
                  placeholder="Tối thiểu 50.000đ"
                  leftIcon={<Banknote size={20} color={colors.textSecondary} />}
                />
                <TouchableOpacity
                  style={styles.allAmountBtn}
                  onPress={() => {
                    const max = withdrawSource === 'driverEarnings' ? driverEarnings : rideBalance;
                    setWithdrawAmount(max > 0 ? max.toString() : '');
                  }}
                >
                  <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                    Tất cả
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Chọn ngân hàng */}
              <AppText variant="caption" weight="medium" style={styles.inputSectionLabel}>
                Ngân hàng thụ hưởng
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankListHorizontal}>
                {POPULAR_BANKS.map((b) => {
                  const isSelected = bankName === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      style={[styles.bankChip, isSelected && styles.bankChipSelected]}
                      onPress={() => setBankName(b)}
                      activeOpacity={0.7}
                    >
                      <Building2 size={14} color={isSelected ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
                      <AppText
                        variant="caption"
                        weight={isSelected ? 'bold' : 'medium'}
                        style={isSelected ? styles.bankChipTextSelected : styles.bankChipText}
                      >
                        {b}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Số tài khoản */}
              <AppInput
                label="Số tài khoản"
                keyboardType="numeric"
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Nhập số tài khoản ngân hàng"
                leftIcon={<CreditCard size={20} color={colors.textSecondary} />}
              />

              {/* Tên chủ tài khoản */}
              <AppInput
                label="Tên chủ tài khoản (in hoa không dấu)"
                value={accountHolder}
                onChangeText={(text) => setAccountHolder(text.toUpperCase())}
                placeholder="Ví dụ: NGUYEN VAN A"
                autoCapitalize="characters"
              />

              <View style={{ marginTop: 24, marginBottom: 12 }}>
                <AppButton
                  title={
                    withdrawAmount
                      ? `Xác nhận rút ${Number(withdrawAmount).toLocaleString('vi-VN')}đ`
                      : 'Xác nhận rút tiền'
                  }
                  variant="primary"
                  isLoading={withdrawMutation.isPending}
                  disabled={withdrawMutation.isPending || !withdrawAmount || !accountNumber}
                  onPress={handleConfirmWithdraw}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    backgroundColor: '#0F172A', // slate-900 sang trọng
    borderRadius: 28,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardLogo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cardBrandText: {
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedBadgeText: {
    color: '#E2E8F0',
  },
  balancesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  balanceCol: {
    flex: 1,
  },
  balanceDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: spacing.sm,
    width: 1,
  },
  balanceLabel: {
    color: '#94A3B8',
  },
  balanceMainValue: {
    color: '#FFFFFF',
    marginTop: 2,
  },
  balanceDriverValue: {
    color: '#34D399', // Emerald-400
    marginTop: 2,
  },
  balanceSubnote: {
    color: '#64748B',
    marginTop: 2,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  depositActionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary, // Xanh CoRide
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
  },
  depositActionText: {
    color: '#FFFFFF',
  },
  withdrawActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
  },
  withdrawActionText: {
    color: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  historyTitle: {
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    backgroundColor: colors.surfaceSecondary || '#F1F5F9',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
    flexGrow: 1,
  },
  transactionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border || '#F1F5F9',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.xs,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  transactionIconBox: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionDesc: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  transactionMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 3,
  },
  transactionDate: {
    color: colors.textTertiary,
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 15,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    maxWidth: layout.maxContentWidth,
    paddingBottom: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary || '#F1F5F9',
    borderRadius: radius.full,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  inputSectionLabel: {
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 6,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  quickAmountChip: {
    backgroundColor: colors.surfaceSecondary || '#F1F5F9',
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickAmountChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  quickAmountText: {
    color: colors.textPrimary,
  },
  quickAmountTextSelected: {
    color: colors.primary,
  },
  methodList: {
    gap: 10,
  },
  methodItem: {
    alignItems: 'center',
    borderColor: colors.border || '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  methodItemSelected: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.primary,
  },
  methodIconBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary || '#F1F5F9',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  methodTitle: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  methodDesc: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  sourceSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  sourceOption: {
    borderColor: colors.border || '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    flex: 1,
    padding: 12,
  },
  sourceOptionActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  sourceText: {
    color: colors.textSecondary,
  },
  sourceTextActive: {
    color: '#047857',
  },
  sourceValue: {
    color: colors.textPrimary,
    marginTop: 4,
  },
  sourceValueActive: {
    color: '#047857',
    marginTop: 4,
  },
  allAmountBtn: {
    position: 'absolute',
    right: 16,
    top: 36,
  },
  bankListHorizontal: {
    marginBottom: spacing.md,
  },
  bankChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary || '#F1F5F9',
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bankChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  bankChipText: {
    color: colors.textPrimary,
  },
  bankChipTextSelected: {
    color: colors.primary,
  },
});

