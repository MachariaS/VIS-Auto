export const API_BASE = 'http://localhost:4000';
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

export const staticNotifications = [
  {
    id: 'eta',
    title: 'Provider ETA updated',
    body: 'Roadside ETA cards will appear here once dispatch becomes live.',
  },
  {
    id: 'billing',
    title: 'Billing summary ready',
    body: 'Subscription invoices and receipts will live under profile and billing.',
  },
  {
    id: 'reminder',
    title: 'Maintenance reminder',
    body: 'Next-service reminders will surface in this notification tray.',
  },
];

export const demoIntegratedVendors = [
  {
    id: 'vendor-shoreline-garage',
    name: 'Shoreline Garage',
    category: 'Engine Diagnostics',
    joinDate: '2024-08-12',
    completedOrders: 148,
    rating: 4.7,
    demand: 'High demand',
    imageUrl: '/assets/battery_jumpstart.jpeg',
    bio: 'Certified diagnostics and electrical fault tracing for passenger vehicles.',
  },
  {
    id: 'vendor-torque-works',
    name: 'Torque Works',
    category: 'Suspension & Alignment',
    joinDate: '2024-11-03',
    completedOrders: 92,
    rating: 4.5,
    demand: 'Steady demand',
    imageUrl: '/assets/tire_chang.jpeg',
    bio: 'Wheel alignment, suspension checks, and steering-system balancing.',
  },
  {
    id: 'vendor-urban-detailers',
    name: 'Urban Detailers',
    category: 'Detailing',
    joinDate: '2025-01-20',
    completedOrders: 77,
    rating: 4.3,
    demand: 'Low demand',
    imageUrl: '/assets/other_services.jpeg',
    bio: 'Interior and exterior detailing services for post-repair handover quality.',
  },
  {
    id: 'vendor-pulse-roadside',
    name: 'Pulse Roadside Team',
    category: 'Fuel & Rescue',
    joinDate: '2025-03-09',
    completedOrders: 134,
    rating: 4.8,
    demand: 'High demand',
    imageUrl: '/assets/fuel_delivery.jpeg',
    bio: 'Fast fuel response and roadside emergency recovery in urban and peri-urban routes.',
  },
];

export const demoPendingIntegrationRequests = [
  {
    id: 'req-ridgeway-auto-care',
    name: 'Ridgeway Auto Care',
    category: 'Brake Service',
    requestedAt: '2026-04-04',
    submittedBy: 'operations@ridgewayauto.co.ke',
    notes: 'Requested onboarding for brake pads, rotor replacement, and emergency checks.',
  },
  {
    id: 'req-kinetic-mobile-tech',
    name: 'Kinetic Mobile Tech',
    category: 'Roadside Electrical',
    requestedAt: '2026-04-05',
    submittedBy: 'admin@kineticmobile.tech',
    notes: 'Wants integration for battery tests, alternator diagnostics, and jump-start support.',
  },
];

export const vendorStatusCopy = {
  pending: 'Pending Review',
  integrated: 'Newly Integrated',
};

export const orderHistoryTabs = [
  { id: 'all', label: 'All Order' },
  { id: 'summary', label: 'Summary' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const orderStatusCopy = {
  delivered: 'Delivered',
  collected: 'Collected',
  cancelled: 'Cancelled',
  processing: 'In Progress',
};

export const initialRegister = {
  name: '',
  email: '',
  phone: '',
  accountType: 'customer',
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
