import { apiClient } from '../api/client';

export interface DriverVehicle {
  id: string;
  licensePlate: string;
  type: 'BIKE' | 'CAR';
  color?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export const vehicleService = {
  async getActiveVehicles(): Promise<DriverVehicle[]> {
    const response = await apiClient.get<DriverVehicle[]>('/vehicles');
    return response.data.filter((vehicle) => vehicle.status === 'ACTIVE');
  },
};
