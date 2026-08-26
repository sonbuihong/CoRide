import { apiClient } from "../api/client";

export interface CarpoolPriceEstimate {
  vehicleType: "BIKE" | "CAR";
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedPrice: number;
  recommendedPricePerSeat: number;
  minimumPricePerSeat: number;
  maximumPricePerSeat: number;
  routePolyline?: string;
}

export interface CarpoolPriceParams {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  vehicleType: "BIKE" | "CAR";
  offeredSeats: number;
  waypoints?: { latitude: number; longitude: number }[];
  routePolyline?: string;
}

export const pricingService = {
  async estimateCarpool(
    params: CarpoolPriceParams,
  ): Promise<CarpoolPriceEstimate> {
    const response = await apiClient.post<{
      success: boolean;
      data: CarpoolPriceEstimate;
    }>("/pricing/carpool-estimate", params);
    return response.data.data;
  },
};
