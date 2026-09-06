import { apiClient } from "../api/client";

export interface CarpoolPriceEstimate {
  vehicleType: "BIKE" | "CAR";
  pricingPolicy: "FIXED_PER_SEAT";
  offeredSeats: number;
  costShareSeats: number;
  totalCostShares: number;
  bookedSeats: number;
  driverPriceAdjustmentRate: number;
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedPrice: number;
  recommendedPricePerSeat: number;
  minimumPricePerSeat: number;
  maximumPricePerSeat: number;
  pricePerSeat: number;
  totalPrice: number;
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

export interface RideHailingPriceEstimate {
  vehicleType: "BIKE" | "CAR";
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedPrice: number;
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
}

export const pricingService = {
  async estimateRideHailing(params: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    vehicleType: "BIKE" | "CAR";
  }): Promise<RideHailingPriceEstimate> {
    const response = await apiClient.get<{ success: boolean; data: RideHailingPriceEstimate }>(
      "/pricing/estimate",
      { params },
    );
    return response.data.data;
  },
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
