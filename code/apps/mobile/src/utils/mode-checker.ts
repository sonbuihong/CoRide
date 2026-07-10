import { User } from '../services/auth.service';
import { KYCStatus } from '../components/ui/KYCStatusCard';

export type DriverEligibilityReason = 
  | 'approved' 
  | 'not_registered' 
  | 'pending' 
  | 'rejected' 
  | 'inconsistent_data';

export type DriverEligibilityResult = {
  eligible: boolean;
  reason: DriverEligibilityReason;
};

/**
 * Kiểm tra xem người dùng có đủ điều kiện sử dụng Driver Mode không.
 */
export function getDriverEligibility(user?: User | null): DriverEligibilityResult {
  if (!user) {
    return { eligible: false, reason: 'not_registered' };
  }

  const isVerifiedFlag = user.isDriverVerified === true;
  const kycStatus = user.driverVerification?.status;

  // Không có driverVerification và isDriverVerified === false
  if (!user.driverVerification && !isVerifiedFlag) {
    return { eligible: false, reason: 'not_registered' };
  }

  // status === 'PENDING' và chưa được xác minh
  if (kycStatus === 'PENDING' && !isVerifiedFlag) {
    return { eligible: false, reason: 'pending' };
  }

  // status === 'REJECTED'
  if (kycStatus === 'REJECTED') {
    // Nếu bị rejected mà backend vẫn để isVerifiedFlag = true, đây là mâu thuẫn
    if (isVerifiedFlag) return { eligible: false, reason: 'inconsistent_data' };
    return { eligible: false, reason: 'rejected' };
  }

  // status === 'APPROVED' và isDriverVerified === true
  if (kycStatus === 'APPROVED' && isVerifiedFlag) {
    return { eligible: true, reason: 'approved' };
  }

  // Hai trường mâu thuẫn (VD: status = PENDING/chưa có, nhưng isVerifiedFlag = true)
  return { eligible: false, reason: 'inconsistent_data' };
}

/**
 * Ánh xạ dữ liệu backend sang trạng thái hiển thị UI
 */
export function getKycStatusMapper(user?: User | null): KYCStatus {
  if (user?.driverVerification?.status) {
    return user.driverVerification.status; // PENDING, APPROVED, REJECTED
  }
  return 'NOT_STARTED';
}
