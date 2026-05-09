// Types
export type { AccountType, User } from './types/user';
export type { Vehicle } from './types/vehicle';
export type { RequestStatus, RoadsideRequest, TrackingStatus, RedispatchMessage } from './types/roadside';
export type { FuelPricing, ProviderService, DispatchPreview } from './types/provider';
export type { Notification } from './types/notification';
export type { Rating } from './types/rating';

// Constants
export { SERVICE_CATEGORY_ORDER, CATEGORY_BY_CODE, serviceTypeOptions } from './constants/services';
export { VEHICLE_MAKES, VEHICLE_MODELS, VEHICLE_YEARS, vehicleData } from './constants/vehicles';
export { MAKE_TO_SPEC, FUEL_BRANDS, DISPATCH_WEIGHTS } from './constants/dispatch';
export { providerServiceCatalogOptions, providerVehicleTypeOptions } from './constants/catalog';
export {
  initialVehicle,
  initialRoadsideRequest,
  initialProviderService,
  initialRegister,
  initialLogin,
  initialVerify,
  initialPasswordForm,
} from './constants/forms';

// Utils
export { formatCurrency } from './utils/currency';
export { haversineKm, estimateEtaMinutes } from './utils/haversine';
export { getSelectedFuelLitres, getFuelUnitPrice } from './utils/fuel';
export {
  normalizeLocationQuery,
  shouldLookupAfterWord,
  parseAddressParts,
  fallbackLocationSuggestions,
  extractGoogleMapsQuery,
} from './utils/location';
export type { LocationSuggestion } from './utils/location';
export {
  mergeUniqueList,
  toVendorId,
  getDefaultProfile,
  mergeProfileSettings,
} from './utils/profile';

// API
export { request } from './api/client';
export type { ApiError } from './api/client';
export * as authApi from './api/auth';
export * as roadsideApi from './api/roadside';
export * as vehiclesApi from './api/vehicles';
export * as providersApi from './api/providers';
export * as notificationsApi from './api/notifications';
export * as ratingsApi from './api/ratings';
export * as locationsApi from './api/locations';

// Hooks
export { useSocket } from './hooks/useSocket';
export { useRequestTracking } from './hooks/useRequestTracking';
export { useCustomerDashboardState } from './hooks/useCustomerDashboardState';
export { useProviderDashboardState } from './hooks/useProviderDashboardState';
