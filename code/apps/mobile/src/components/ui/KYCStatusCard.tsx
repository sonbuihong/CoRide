import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';
import { Clock, CheckCircle, XCircle, FileText, AlertTriangle, LucideIcon } from 'lucide-react-native';

export type KYCStatus = 'approved' | 'not_registered' | 'pending' | 'rejected' | 'inconsistent_data' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_STARTED';

interface KYCStatusCardProps {
  status?: KYCStatus;
  rejectionReason?: string;
  onPressAction?: () => void;
}

export const KYCStatusCard: React.FC<KYCStatusCardProps> = ({ 
  status = 'not_registered', 
  rejectionReason, 
  onPressAction 
}) => {
  const getStatusConfig = (s: KYCStatus): {
    title: string;
    description: string;
    bg: string;
    color: string;
    icon: LucideIcon;
    actionText: string;
  } => {
    const norm = s.toLowerCase() as any;
    switch (norm) {
      case 'approved':
        return {
          title: 'Đã xác minh tài xế',
          description: 'Hồ sơ của bạn đã được duyệt. Bạn có thể bắt đầu chuyển đổi sang chế độ Tài xế và đăng chuyến đi.',
          bg: 'bg-confirmed/10 border-confirmed/20',
          color: '#16A34A',
          icon: CheckCircle,
          actionText: 'Xem hồ sơ',
        };
      case 'pending':
        return {
          title: 'Đang chờ xác minh',
          description: 'Hồ sơ tài xế của bạn đang được ban quản trị kiểm tra. Vui lòng đợi trong vòng 24h.',
          bg: 'bg-pending/10 border-pending/20',
          color: '#D97706',
          icon: Clock,
          actionText: 'Xem trạng thái',
        };
      case 'rejected':
        return {
          title: 'Xác minh thất bại',
          description: rejectionReason || 'Hồ sơ tài xế của bạn không hợp lệ hoặc hình ảnh bị mờ. Vui lòng cập nhật lại.',
          bg: 'bg-rejected/10 border-rejected/20',
          color: '#DC2626',
          icon: XCircle,
          actionText: 'Chỉnh sửa & Gửi lại',
        };
      case 'inconsistent_data':
        return {
          title: 'Hồ sơ cần kiểm tra lại',
          description: 'Hệ thống phát hiện thông tin hồ sơ của bạn chưa đồng bộ. Vui lòng liên hệ bộ phận hỗ trợ.',
          bg: 'bg-rejected/10 border-rejected/20',
          color: '#DC2626',
          icon: AlertTriangle,
          actionText: 'Liên hệ hỗ trợ',
        };
      case 'not_registered':
      default:
        return {
          title: 'Đăng ký trở thành tài xế',
          description: 'Lái xe chia sẻ chuyến đi, giao lưu kết nối và cùng hành khách chia sẻ chi phí nhiên liệu.',
          bg: 'bg-surface border-border',
          color: '#64748B',
          icon: FileText,
          actionText: 'Đăng ký ngay',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <View 
      className={`p-5 rounded-2xl border ${config.bg} mb-4`}
      accessibilityRole="summary"
      accessibilityLabel={`${config.title}. ${config.description}`}
    >
      <View className="flex-row items-start">
        <View className="mr-3 mt-1">
          <Icon size={24} color={config.color} />
        </View>
        <View className="flex-1">
          <AppText variant="title" weight="bold" className="text-text-primary mb-1">
            {config.title}
          </AppText>
          <AppText variant="bodySmall" className="text-text-secondary mb-3 leading-5">
            {config.description}
          </AppText>
          {onPressAction && (
            <TouchableOpacity 
              onPress={onPressAction}
              accessibilityRole="button"
              accessibilityLabel={config.actionText}
            >
              <AppText variant="bodySmall" weight="bold" className="text-passenger">
                {config.actionText}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
