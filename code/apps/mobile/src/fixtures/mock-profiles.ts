import { User } from '../services/auth.service';

export const MOCK_USER_NO_KYC: User = {
  id: 'mock-1',
  email: 'nokyc@coride.vn',
  firstName: 'Nguyễn',
  lastName: 'Khách',
  role: 'USER',
  isDriverVerified: false,
};

export const MOCK_USER_KYC_PENDING: User = {
  id: 'mock-2',
  email: 'pending@coride.vn',
  firstName: 'Trần',
  lastName: 'Chờ',
  role: 'USER',
  isDriverVerified: false,
  driverVerification: {
    status: 'PENDING',
    vehicleType: 'BIKE',
    vehiclePlate: '29A-12345',
  },
};

export const MOCK_USER_KYC_REJECTED: User = {
  id: 'mock-3',
  email: 'rejected@coride.vn',
  firstName: 'Lê',
  lastName: 'Sai',
  role: 'USER',
  isDriverVerified: false,
  driverVerification: {
    status: 'REJECTED',
    rejectionReason: 'Ảnh bằng lái bị mờ, vui lòng chụp lại.',
    vehicleType: 'BIKE',
    vehiclePlate: '29A-99999',
  },
};

export const MOCK_USER_KYC_APPROVED: User = {
  id: 'mock-4',
  email: 'approved@coride.vn',
  firstName: 'Hoàng',
  lastName: 'Tài',
  role: 'USER',
  isDriverVerified: true,
  driverVerification: {
    status: 'APPROVED',
    vehicleType: 'CAR',
    vehiclePlate: '30E-12345',
  },
  vehicles: [
    {
      id: 'v1',
      licensePlate: '30E-12345',
      type: 'CAR',
      status: 'ACTIVE',
      color: 'Đen',
    },
  ],
};
