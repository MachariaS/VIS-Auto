export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
export const SESSION_STORAGE_KEY = 'vis-assist-session';
export const THEME_STORAGE_KEY = 'vis-assist-theme';
export const PROFILE_STORAGE_KEY = 'vis-assist-profile';

export const serviceTypeOptions = [
  { code: 'battery_jump', label: 'Battery Jump', short: 'Power restart' },
  { code: 'fuel_delivery', label: 'Fuel Delivery', short: 'Fuel plus delivery' },
  { code: 'tire_change', label: 'Tire Change', short: 'Wheel support' },
  { code: 'towing', label: 'Towing', short: 'Recovery move' },
  { code: 'lockout', label: 'Lockout', short: 'Entry support' },
];

export const providerServiceCatalogOptions = [
  'General Service',
  'Paint and Body Works',
  'Engine Diagnostics',
  'Brake Service',
  'Electrical Repairs',
  'Suspension and Alignment',
  'AC and Climate Service',
  'Car Detailing',
];

export const SERVICE_CATEGORY_ORDER = [
  'Roadside emergency',
  'Mechanical & repairs',
  'Engine & tuning',
  'Electrical & electronics',
  'Suspension & alignment',
  'Body & paint',
  'Air conditioning',
  'Cleaning & detailing',
  'Fuel & fluids',
  'Vehicle inspection',
  'Vehicle specialisation',
];

export const CATEGORY_BY_CODE = {
  towing: 'Roadside emergency',
  battery_jump_start: 'Roadside emergency',
  tyre_change: 'Roadside emergency',
  lockout_assistance: 'Roadside emergency',
  fuel_delivery: 'Roadside emergency',
  winching: 'Roadside emergency',
  fuel_petrol_regular: 'Fuel & fluids',
  fuel_petrol_premium: 'Fuel & fluids',
  fuel_diesel: 'Fuel & fluids',
  fluid_top_up: 'Fuel & fluids',
  on_site_diagnosis: 'Mechanical & repairs',
  oil_change: 'Mechanical & repairs',
  minor_repairs: 'Mechanical & repairs',
  tyre_fitting: 'Mechanical & repairs',
  brake_pad_replacement: 'Mechanical & repairs',
  brake_disc_replacement: 'Mechanical & repairs',
  brake_fluid_flush: 'Mechanical & repairs',
  clutch_replacement: 'Mechanical & repairs',
  gearbox_service: 'Mechanical & repairs',
  cv_joint_replacement: 'Mechanical & repairs',
  timing_belt_service: 'Mechanical & repairs',
  radiator_service: 'Mechanical & repairs',
  full_engine_service: 'Engine & tuning',
  ecu_remap: 'Engine & tuning',
  turbo_service: 'Engine & tuning',
  exhaust_service: 'Engine & tuning',
  air_intake_service: 'Engine & tuning',
  engine_rebuild: 'Engine & tuning',
  electrical_diagnosis: 'Electrical & electronics',
  battery_replacement: 'Electrical & electronics',
  alternator_repair: 'Electrical & electronics',
  car_audio_install: 'Electrical & electronics',
  camera_alarm_install: 'Electrical & electronics',
  lighting_upgrade: 'Electrical & electronics',
  dent_repair: 'Body & paint',
  scratch_repair: 'Body & paint',
  panel_beating: 'Body & paint',
  full_respray: 'Body & paint',
  windscreen_service: 'Body & paint',
  rust_treatment: 'Body & paint',
  wheel_alignment: 'Suspension & alignment',
  wheel_balancing: 'Suspension & alignment',
  shock_absorber_service: 'Suspension & alignment',
  suspension_service: 'Suspension & alignment',
  rim_repair: 'Suspension & alignment',
  ac_regas: 'Air conditioning',
  ac_repair: 'Air conditioning',
  cabin_filter_replacement: 'Air conditioning',
  car_wash_exterior: 'Cleaning & detailing',
  car_wash_full: 'Cleaning & detailing',
  detailing: 'Cleaning & detailing',
  engine_bay_clean: 'Cleaning & detailing',
  ceramic_coating: 'Cleaning & detailing',
  ppf_wrap: 'Cleaning & detailing',
  pre_purchase_inspection: 'Vehicle inspection',
  roadworthy_inspection: 'Vehicle inspection',
  insurance_inspection: 'Vehicle inspection',
  spec_toyota: 'Vehicle specialisation',
  spec_nissan: 'Vehicle specialisation',
  spec_subaru: 'Vehicle specialisation',
  spec_bmw: 'Vehicle specialisation',
  spec_mercedes: 'Vehicle specialisation',
  spec_land_rover: 'Vehicle specialisation',
  spec_vw_group: 'Vehicle specialisation',
  spec_japanese: 'Vehicle specialisation',
  spec_european: 'Vehicle specialisation',
  spec_ev: 'Vehicle specialisation',
};

export const providerVehicleTypeOptions = [
  'Sedan',
  'Hatchback',
  'SUV',
  'Van',
  'Pickup',
  'Truck',
  'Bus',
  'Motorcycle',
  'EV',
  'Hybrid',
];

export const countryOptions = [
  { code: 'KE', label: 'Kenya' },
  { code: 'UG', label: 'Uganda' },
  { code: 'TZ', label: 'Tanzania' },
  { code: 'RW', label: 'Rwanda' },
  { code: 'BI', label: 'Burundi' },
  { code: 'SS', label: 'South Sudan' },
];

export const branchTypeOptions = ['Main Branch', 'Satellite Branch', 'Affiliate Branch'];

export const serviceImageByCode = {
  battery_jump: '/assets/battery_jumpstart.jpeg',
  fuel_delivery: '/assets/fuel_delivery.jpeg',
  tire_change: '/assets/tire_chang.jpeg',
  towing: '/assets/car_towing.jpeg',
  lockout: '/assets/lockout.jpeg',
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

export const initialRegister = {
  name: '',
  email: '',
  phone: '',
  accountType: 'car_owner',
  password: '',
};

export const initialLogin = {
  email: '',
  password: '',
};

export const initialVerify = {
  email: '',
  otp: '',
};

export const initialVehicle = {
  nickname: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  registrationNumber: '',
  color: '',
  notes: '',
};

export const initialProviderService = {
  serviceName: '',
  serviceCode: 'battery_jump',
  basePriceKsh: '1500',
  pricePerKmKsh: '150',
  description: '',
  gasolineRegularPrice: '',
  gasolineVPowerPrice: '',
  dieselPrice: '',
};

export const initialRoadsideRequest = {
  vehicleId: '',
  providerServiceId: '',
  distanceKm: '8',
  latitude: '',
  longitude: '',
  address: '',
  landmark: '',
  notes: '',
  fuelLitres: '10',
  customFuelLitres: '',
  fuelType: 'gasoline',
  gasolineGrade: 'regular',
};

export const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
