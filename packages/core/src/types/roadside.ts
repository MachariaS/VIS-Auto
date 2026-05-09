export type RequestStatus =
  | 'searching'
  | 'provider_assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface RoadsideRequest {
  id: string;
  vehicleId: string;
  providerServiceId: string;
  status: RequestStatus;
  distanceKm: number;
  latitude: number | string;
  longitude: number | string;
  address: string;
  landmark?: string;
  notes?: string;
  fuelLitres?: number;
  fuelType?: 'gasoline' | 'diesel';
  gasolineGrade?: 'regular' | 'vpower';
  createdAt: string;
  updatedAt: string;
}

export interface TrackingStatus {
  requestId: string;
  status: RequestStatus;
  providerLat?: number;
  providerLng?: number;
  etaMinutes?: number;
  exhausted?: boolean;
  provider?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface RedispatchMessage {
  requestId: string;
  exhausted: boolean;
  reason?: string;
}
