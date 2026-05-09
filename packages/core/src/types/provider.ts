export interface FuelPricing {
  diesel?: { standard: number };
  gasoline?: { regular: number; vpower: number };
}

export interface ProviderService {
  id: string;
  serviceName: string;
  serviceCode: string;
  catalogCode?: string;
  basePriceKsh: number;
  pricePerKmKsh: number;
  description?: string;
  serviceImageUrl?: string;
  fuelPricing?: FuelPricing;
}

export interface DispatchPreview {
  providerId: string;
  providerName: string;
  distanceKm: number;
  estimatedPrice: number;
  etaMinutes: number;
}
