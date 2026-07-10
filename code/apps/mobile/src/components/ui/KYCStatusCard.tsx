import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';
import { Clock, CheckCircle, XCircle, FileText, LucideIcon } from 'lucide-react-native';

export type KYCStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface KYCStatusCardProps {
  status?: KYCStatus;
  rejectionReason?: string;
  onPressAction?: () => void;
}

export const KYCStatusCard: React.FC<KYCStatusCardProps> = ({ 
  status = 'NOT_STARTED', 
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
    switch (s) {
      case 'APPROVED':
        return {
          title: 'Đã xác minh tài xế',
          description: 'Hồ sơ của bạn đã được duyệt. Bạn có thể bắt đầu đăng chuyến đi.',
          bg: 'bg-status-success/10 border-status-success/20',
          color: '#10B981', // status-success
          icon: CheckCircle,
          actionText: 'Xem hồ sơ',
        };
      case 'PENDING':
        return {
          title: 'Đang chờ xác minh',
          description: 'Hồ sơ của bạn đang được chúng tôi kiểm tra. Vui lòng đợi.',
          bg: 'bg-status-warning/10 border-status-warning/20',
          color: '#F59E0B', // status-warning
          icon: Clock,
          actionText: 'Xem trạng thái',
        };
      case 'REJECTED':
        return {
          title: 'Xác minh thất bại',
          description: rejectionReason || 'Hồ sơ của bạn không hợp lệ. Vui lòng cập nhật lại.',
          bg: 'bg-status-danger/10 border-status-danger/20',
          color: '#EF4444', // status-danger
          icon: XCircle,
          actionText: 'Cập nhật lại',
        };
      case 'NOT_STARTED':
      default:
        return {
          title: 'Chưa xác minh tài xế',
          description: 'Trở thành tài xế để chia sẻ chuyến đi và tiết kiệm chi phí.',
          bg: 'bg-surface border-border',
          color: '#64748B', // text-secondary
          icon: FileText,
          actionText: 'Bắt đầu xác minh',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <View className={`p-4 rounded-2xl border ${config.bg} mb-4`}>
      <View className="flex-row items-start">
        <View className="mr-3 mt-1">
          <Icon size={24} color={config.color} />
        </View>
        <View className="flex-1">
          <AppText variant="title" weight="bold" className="text-text-primary mb-1">
            {config.title}
          </AppText>
          <AppText variant="bodySmall" className="text-text-secondary mb-3">
            {config.description}
          </AppText>
          {onPressAction && (
            <TouchableOpacity onPress={onPressAction}>
              <AppText variant="bodySmall" weight="bold" className="text-primary">
                {config.actionText}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
