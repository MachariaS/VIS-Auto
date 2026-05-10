// Core constants: serviceTypeOptions, CATEGORY_BY_CODE, SERVICE_CATEGORY_ORDER,
// providerServiceCatalogOptions, providerVehicleTypeOptions,
// VEHICLE_MAKES/MODELS/YEARS, all initial form states, utils, types
export * from '@vis/core';

// ── Web-only ──────────────────────────────────────────────────────────────────
export const API_BASE =
  import.meta.env.VITE_STAGING_API_BASE_URL ??
  import.meta.env.VITE_PROD_API_BASE_URL ??
  '';
export const SESSION_STORAGE_KEY = 'vis-assist-session';
export const THEME_STORAGE_KEY = 'vis-assist-theme';

export const serviceImageByCode = {
  battery_jump: '/assets/battery_jumpstart.jpeg',
  fuel_delivery: '/assets/fuel_delivery.jpeg',
  tire_change: '/assets/tire_chang.jpeg',
  towing: '/assets/car_towing.jpeg',
  lockout: '/assets/lockout.jpeg',
};

export const vehicleBrandLogoByCode = null;

export const vehicleBrandConfig = {
  spec_toyota:     { bg: '#EB0A1E', text: '#fff', label: 'TOYOTA' },
  spec_nissan:     { bg: '#C3002F', text: '#fff', label: 'NISSAN' },
  spec_subaru:     { bg: '#003399', text: '#fff', label: 'SUBARU' },
  spec_bmw:        { bg: '#1C69D4', text: '#fff', label: 'BMW' },
  spec_mercedes:   { bg: '#1A1A1A', text: '#fff', label: 'MERCEDES' },
  spec_land_rover: { bg: '#005A2B', text: '#fff', label: 'LAND ROVER' },
  spec_vw_group:   { bg: '#001E50', text: '#fff', label: 'VW GROUP' },
  spec_japanese:   { bg: '#BC002D', text: '#fff', label: 'JDM' },
  spec_european:   { bg: '#003399', text: '#fff', label: 'EU AUTO' },
  spec_ev:         { bg: '#1F2937', text: '#10b981', label: '⚡ EV' },
};

export const futureCustomerModules = [
  { title: 'Diagnostics', meta: 'Coming next', detail: 'Fault alerts and probable causes.' },
  { title: 'Live Fuel', meta: 'Planned', detail: 'Consumption trends and refill history.' },
  { title: 'Next Service', meta: 'Planned', detail: 'Mileage-based maintenance reminders.' },
  { title: 'Car History', meta: 'Planned', detail: 'Service, parts, and ownership logs.' },
];

export const futureProviderModules = [
  { title: 'Live Jobs', meta: 'Next phase', detail: 'Incoming roadside dispatch and job flow.' },
  { title: 'Coverage', meta: 'Planned', detail: 'Zones, service radius, and hours.' },
  { title: 'Payouts', meta: 'Planned', detail: 'Cash and M-Pesa provider earnings.' },
  { title: 'Reviews', meta: 'Planned', detail: 'Ratings, complaints, and quality metrics.' },
];

export const fuelLiterOptions = [5, 10, 20, 30];

export const vendorStatusCopy = {
  pending: 'Pending Review',
  integrated: 'Newly Integrated',
};

export const orderHistoryTabs = [
  { id: 'all', label: 'All Requests' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const orderStatusCopy = {
  searching: 'Queued',
  provider_assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const countryOptions = [
  { code: 'KE', label: 'Kenya',        phoneCode: '+254' },
  { code: 'UG', label: 'Uganda',       phoneCode: '+256' },
  { code: 'TZ', label: 'Tanzania',     phoneCode: '+255' },
  { code: 'RW', label: 'Rwanda',       phoneCode: '+250' },
  { code: 'BI', label: 'Burundi',      phoneCode: '+257' },
  { code: 'SS', label: 'South Sudan',  phoneCode: '+211' },
  { code: 'ET', label: 'Ethiopia',     phoneCode: '+251' },
  { code: 'SO', label: 'Somalia',      phoneCode: '+252' },
  { code: 'NG', label: 'Nigeria',      phoneCode: '+234' },
  { code: 'GH', label: 'Ghana',        phoneCode: '+233' },
  { code: 'ZA', label: 'South Africa', phoneCode: '+27'  },
  { code: 'GB', label: 'UK',           phoneCode: '+44'  },
  { code: 'US', label: 'USA',          phoneCode: '+1'   },
  { code: 'IN', label: 'India',        phoneCode: '+91'  },
  { code: 'CN', label: 'China',        phoneCode: '+86'  },
];

export const branchTypeOptions = ['Main Branch', 'Satellite Branch', 'Affiliate Branch'];
