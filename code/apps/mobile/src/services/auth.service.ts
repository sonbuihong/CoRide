import { apiClient } from '../api/client';
import { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from '@repo/shared';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  avatarUrl?: string; // Đồng bộ với schema backend
  bio?: string;
  role: string;
  isDriverVerified?: boolean; // Tên chuẩn trong schema
  driverVerification?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    vehicleType: 'BIKE' | 'CAR';
    vehiclePlate: string;
    vehicleModel?: string;
  };
  vehicles?: {
    id: string;
    licensePlate: string;
    type: 'BIKE' | 'CAR';
    color?: string;
    status: 'ACTIVE' | 'INACTIVE';
  }[];
}

export const authService = {
  login: async (data: LoginInput): Promise<{ message: string; user: User; accessToken: string }> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterInput): Promise<{ message: string; user: User }> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordInput): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordInput): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
  
  updateProfile: async (data: { firstName: string; lastName: string; phone: string }): Promise<{ message: string; user: User }> => {
    const response = await apiClient.patch('/users/me', data);
    return response.data;
  },

  uploadAvatar: async (imageUri: string, mimeType: string, fileName: string): Promise<{ message: string; user: User }> => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: mimeType,
      name: fileName,
    } as any);

    const response = await apiClient.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadKycImage: async (imageUri: string, mimeType: string, fileName: string): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: mimeType,
      name: fileName,
    } as any);

    const response = await apiClient.post('/users/upload-kyc', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  submitDriverVerification: async (data: {
    licenseFrontImageUrl: string;
    licenseBackImageUrl: string;
    registrationFrontImageUrl: string;
    registrationBackImageUrl: string;
    vehiclePlate: string;
    vehicleModel: string;
    vehicleType: 'BIKE' | 'CAR';
  }): Promise<{ message: string; data: any }> => {
    const response = await apiClient.post('/users/driver-verification', data);
    return response.data;
  },
};
