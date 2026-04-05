import { useEffect, useMemo, useRef, useState } from 'react';
import VisLandingPage from './VisLandingPage';

const API_BASE = 'http://localhost:4000';
const SESSION_STORAGE_KEY = 'vis-assist-session';
const THEME_STORAGE_KEY = 'vis-assist-theme';
const PROFILE_STORAGE_KEY = 'vis-assist-profile';

const serviceTypeOptions = [
  { code: 'battery_jump', label: 'Battery Jump', short: 'Power restart' },
  { code: 'fuel_delivery', label: 'Fuel Delivery', short: 'Fuel plus delivery' },
  { code: 'tire_change', label: 'Tire Change', short: 'Wheel support' },
  { code: 'towing', label: 'Towing', short: 'Recovery move' },
  { code: 'lockout', label: 'Lockout', short: 'Entry support' },
];

const providerServiceCatalogOptions = [
  'General Service',
  'Paint and Body Works',
  'Engine Diagnostics',
  'Brake Service',
  'Electrical Repairs',
  'Suspension and Alignment',
  'AC and Climate Service',
  'Car Detailing',
];

const providerVehicleTypeOptions = [
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

const countryOptions = [
  { code: 'KE', label: 'Kenya' },
  { code: 'UG', label: 'Uganda' },
  { code: 'TZ', label: 'Tanzania' },
  { code: 'RW', label: 'Rwanda' },
  { code: 'BI', label: 'Burundi' },
  { code: 'SS', label: 'South Sudan' },
];

const branchTypeOptions = ['Main Branch', 'Satellite Branch', 'Affiliate Branch'];

const serviceImageByCode = {
  battery_jump: '/assets/battery_jumpstart.jpeg',
  fuel_delivery: '/assets/fuel_delivery.jpeg',
  tire_change: '/assets/tire_chang.jpeg',
  towing: '/assets/car_towing.jpeg',
  lockout: '/assets/lockout.jpeg',
};

const futureCustomerModules = [
  { title: 'Diagnostics', meta: 'Coming next', detail: 'Fault alerts and probable causes.' },
  { title: 'Live Fuel', meta: 'Planned', detail: 'Consumption trends and refill history.' },
  { title: 'Next Service', meta: 'Planned', detail: 'Mileage-based maintenance reminders.' },
  { title: 'Car History', meta: 'Planned', detail: 'Service, parts, and ownership logs.' },
];

const futureProviderModules = [
  { title: 'Live Jobs', meta: 'Next phase', detail: 'Incoming roadside dispatch and job flow.' },
  { title: 'Coverage', meta: 'Planned', detail: 'Zones, service radius, and hours.' },
  { title: 'Payouts', meta: 'Planned', detail: 'Cash and M-Pesa provider earnings.' },
  { title: 'Reviews', meta: 'Planned', detail: 'Ratings, complaints, and quality metrics.' },
];

const fuelLiterOptions = [5, 10, 20, 30];

const staticNotifications = [
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

const initialRegister = {
  name: '',
  email: '',
  accountType: 'customer',
  password: '',
};

const initialLogin = {
  email: '',
  password: '',
};

const initialVerify = {
  email: '',
  otp: '',
};

const initialVehicle = {
  nickname: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  registrationNumber: '',
  color: '',
  notes: '',
};

const initialProviderService = {
  serviceName: '',
  serviceCode: 'battery_jump',
  basePriceKsh: '1500',
  pricePerKmKsh: '150',
  description: '',
  gasolineRegularPrice: '',
  gasolineVPowerPrice: '',
  dieselPrice: '',
};

const initialRoadsideRequest = {
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

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

async function request(path, body, method = 'POST', token) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message);
  }

  return data;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getSelectedFuelLitres(form) {
  return form.fuelLitres === 'custom'
    ? Number(form.customFuelLitres || 0)
    : Number(form.fuelLitres || 0);
}

function getFuelUnitPrice(service, form) {
  if (!service || service.serviceCode !== 'fuel_delivery') {
    return 0;
  }

  if (form.fuelType === 'diesel') {
    return service.fuelPricing?.diesel?.standard ?? 0;
  }

  return form.gasolineGrade === 'vpower'
    ? service.fuelPricing?.gasoline?.vpower ?? 0
    : service.fuelPricing?.gasoline?.regular ?? 0;
}

function getServiceImageUrl(service) {
  if (!service) {
    return '/assets/other_services.jpeg';
  }

  return service.serviceImageUrl || serviceImageByCode[service.serviceCode] || '/assets/other_services.jpeg';
}

function mergeUniqueList(list = [], additions = []) {
  return Array.from(new Set([...(list || []), ...(additions || [])])).filter(Boolean);
}

function normalizeLocationQuery(query = '') {
  return query.trim().replace(/[\s,]+/g, ' ');
}

function shouldLookupAfterWord(input = '') {
  return /[\s,]$/.test(input) && normalizeLocationQuery(input).length >= 3;
}

function parseAddressParts(addressValue = '', placeName = '') {
  const parts = (addressValue || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { road: '', town: '' };
  }

  const road = parts.find((part) => part !== placeName) || '';
  const town = parts.length >= 2 ? parts[parts.length - 2] : '';

  return { road, town };
}

async function fallbackLocationSuggestions(query, countryCode = 'KE') {
  const normalized = normalizeLocationQuery(query || '');
  const segments = normalized.split(',').map((item) => item.trim()).filter(Boolean);

  const candidateQueries = [
    normalized,
    segments[0] || '',
    segments.slice(1).join(', '),
    normalized.replace(/\b(garage|limited|ltd|company|consultants?)\b/gi, '').trim(),
  ].filter((value, index, arr) => value && arr.indexOf(value) === index);

  async function lookupNominatim(candidateQuery, scopedCountryCode) {
    const params = new URLSearchParams({
      q: candidateQuery,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '6',
    });

    if (scopedCountryCode) {
      params.set('countrycodes', scopedCountryCode.toLowerCase());
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    if (!response.ok) {
      return [];
    }

    return response.json();
  }

  let resolved = [];

  for (const candidate of candidateQueries) {
    const countryResults = await lookupNominatim(candidate, countryCode || 'KE');
    if (Array.isArray(countryResults) && countryResults.length > 0) {
      resolved = countryResults;
      break;
    }

    const globalResults = await lookupNominatim(candidate, '');
    if (Array.isArray(globalResults) && globalResults.length > 0) {
      resolved = globalResults;
      break;
    }
  }

  return (resolved || []).map((item) => ({
    name: item.name || item.display_name || '',
    address: item.display_name || '',
    lat: item.lat || '',
    lng: item.lon || '',
    town:
      item.address?.city
      || item.address?.town
      || item.address?.village
      || item.address?.suburb
      || item.address?.county
      || '',
    road: item.address?.road || item.address?.pedestrian || item.address?.path || '',
    landmark:
      item.address?.attraction
      || item.address?.building
      || item.address?.amenity
      || item.address?.shop
      || '',
  }));
}

function extractGoogleMapsQuery(mapUrl = '') {
  if (!mapUrl || typeof mapUrl !== 'string') {
    return null;
  }

  try {
    const url = new URL(mapUrl.trim());
    const q = url.searchParams.get('q') || url.searchParams.get('query');
    if (q) {
      return { query: decodeURIComponent(q) };
    }

    const atSegment = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atSegment) {
      return {
        latitude: atSegment[1],
        longitude: atSegment[2],
      };
    }
  } catch {
    return null;
  }

  return null;
}

function getDefaultProfile(user) {
  return {
    account: {
      displayName: user?.name ?? '',
      email: user?.email ?? '',
      phone: '',
      company: user?.accountType === 'provider' ? user?.name ?? '' : '',
      location: 'Nairobi, Kenya',
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: true,
      pushAlerts: true,
      marketing: false,
    },
    preferences: {
      theme: 'dark',
      language: 'English',
      compactMode: false,
    },
    subscription: {
      plan: user?.accountType === 'provider' ? 'Provider Starter' : 'Driver Starter',
      status: 'Trial active',
      renewalDate: '2026-05-15',
      billingEmail: user?.email ?? '',
    },
    business: {
      brief: '',
      locations: [
        {
          branchName: 'Main Branch',
          address: 'Nairobi, Kenya',
          countryCode: 'KE',
          town: 'Nairobi',
          road: '',
          landmark: '',
          mapUrl: '',
          latitude: '',
          longitude: '',
        },
      ],
      offeredServices: ['General Service', 'Paint and Body Works'],
      supportedVehicleTypes: ['Sedan', 'SUV'],
      kyc: {
        kraPin: '',
        certificateOfIncorporation: '',
        businessPermitNumber: '',
        taxComplianceCertificate: '',
      },
      contacts: {
        primaryPhone: '',
        supportPhone: '',
        supportEmail: user?.email ?? '',
        website: '',
        whatsapp: '',
        instagram: '',
        facebook: '',
        linkedin: '',
        x: '',
      },
    },
    vendors: {
      requestPolicy: 'approval_required',
      pendingRequests: [],
      activePartners: [],
    },
  };
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 4H5v16h4" />
      <path d="M16 7l5 5-5 5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState('entry');
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [verifyForm, setVerifyForm] = useState(initialVerify);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [providerServices, setProviderServices] = useState([]);
  const [providerCatalog, setProviderCatalog] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(initialVehicle);
  const [providerServiceForm, setProviderServiceForm] = useState(initialProviderService);
  const [editingProviderServiceId, setEditingProviderServiceId] = useState('');
  const [showProviderServiceComposer, setShowProviderServiceComposer] = useState(false);
  const [roadsideForm, setRoadsideForm] = useState(initialRoadsideRequest);
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [serviceFilter, setServiceFilter] = useState('battery_jump');
  const [theme, setTheme] = useState('dark');
  const [profileSettings, setProfileSettings] = useState(getDefaultProfile(null));
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [brandLogoError, setBrandLogoError] = useState(false);
  const [locationResolvingIndex, setLocationResolvingIndex] = useState(null);
  const [locationSearchingIndex, setLocationSearchingIndex] = useState(null);
  const [locationSuggestionsByIndex, setLocationSuggestionsByIndex] = useState({});
  const [lastSuggestionQueryByIndex, setLastSuggestionQueryByIndex] = useState({});
  const [locationBias, setLocationBias] = useState({ latitude: null, longitude: null });
  const locationSuggestionTimeoutsRef = useRef({});

  const providerBrandName = 'VIS Auto';
  const providerBrandLogo = '/assets/vis-auto-logo.png';
  const providerBrandInitials = 'VIS';

  const topbarLabel = useMemo(() => {
    if (user?.accountType === 'provider') {
      return {
        overview: 'Provider overview',
        services: 'Published services',
        pricing: editingProviderServiceId ? 'Edit service' : 'Add service',
        profile: 'My profile',
        settings: 'Settings',
      }[dashboardTab] || 'Provider dashboard';
    }

    return {
      overview: 'Driver overview',
      request: 'Request roadside help',
      vehicles: 'Vehicle profiles',
      history: 'Request history',
      profile: 'Profile and settings',
    }[dashboardTab] || 'Driver dashboard';
  }, [dashboardTab, editingProviderServiceId, user?.accountType]);

  const requestStats = useMemo(
    () => ({
      active: requests.filter((item) => item.status !== 'completed').length,
      vehicles: vehicles.length,
      providers: providerCatalog.length,
      services: providerServices.length,
    }),
    [providerCatalog.length, providerServices.length, requests, vehicles.length],
  );

  const filteredProviderOptions = providerCatalog.filter((item) => item.serviceCode === serviceFilter);
  const selectedProviderService = providerCatalog.find(
    (item) => item.id === roadsideForm.providerServiceId,
  );
  const selectedFuelLitres = getSelectedFuelLitres(roadsideForm);
  const deliveryEstimate = selectedProviderService
    ? Number(roadsideForm.distanceKm || 0) * selectedProviderService.pricePerKmKsh +
      selectedProviderService.basePriceKsh
    : 0;
  const fuelEstimate =
    selectedProviderService?.serviceCode === 'fuel_delivery'
      ? getFuelUnitPrice(selectedProviderService, roadsideForm) * selectedFuelLitres
      : 0;
  const totalEstimate = deliveryEstimate + fuelEstimate;

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => {
        setHealth({
          status: 'offline',
          service: 'vis-assist-api',
        });
      });
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }

    if (storedProfile) {
      try {
        const parsedProfile = JSON.parse(storedProfile);
        setProfileSettings((current) => ({
          ...getDefaultProfile(null),
          ...current,
          ...parsedProfile,
          account: {
            ...getDefaultProfile(null).account,
            ...current.account,
            ...parsedProfile.account,
          },
          notifications: {
            ...getDefaultProfile(null).notifications,
            ...current.notifications,
            ...parsedProfile.notifications,
          },
          preferences: {
            ...getDefaultProfile(null).preferences,
            ...current.preferences,
            ...parsedProfile.preferences,
          },
          subscription: {
            ...getDefaultProfile(null).subscription,
            ...current.subscription,
            ...parsedProfile.subscription,
          },
          business: {
            ...getDefaultProfile(null).business,
            ...current.business,
            ...parsedProfile.business,
            kyc: {
              ...getDefaultProfile(null).business.kyc,
              ...current.business?.kyc,
              ...parsedProfile.business?.kyc,
            },
            contacts: {
              ...getDefaultProfile(null).business.contacts,
              ...current.business?.contacts,
              ...parsedProfile.business?.contacts,
            },
            locations:
              parsedProfile.business?.locations?.length > 0
                ? parsedProfile.business.locations
                : current.business?.locations || getDefaultProfile(null).business.locations,
            offeredServices: mergeUniqueList(
              getDefaultProfile(null).business.offeredServices,
              parsedProfile.business?.offeredServices || current.business?.offeredServices,
            ),
            supportedVehicleTypes: mergeUniqueList(
              getDefaultProfile(null).business.supportedVehicleTypes,
              parsedProfile.business?.supportedVehicleTypes ||
                current.business?.supportedVehicleTypes,
            ),
          },
          vendors: {
            ...getDefaultProfile(null).vendors,
            ...current.vendors,
            ...parsedProfile.vendors,
          },
        }));
      } catch {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }

    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed.token && parsed.user) {
          setToken(parsed.token);
          setUser(parsed.user);
          setMode('login');
          setStep(parsed.step ?? 'dashboard');
          setDashboardTab(parsed.dashboardTab ?? 'overview');
          setVerifyForm({ email: parsed.user.email, otp: '' });
        }
      } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    setSessionReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (sessionReady) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [sessionReady, theme]);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    if (token && user) {
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          token,
          user,
          step,
          dashboardTab,
        }),
      );
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [dashboardTab, sessionReady, step, token, user]);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileSettings));
  }, [profileSettings, sessionReady]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileSettings((current) => ({
      ...current,
      account: {
        ...current.account,
        displayName: current.account.displayName || user.name || '',
        email: current.account.email || user.email || '',
        company:
          current.account.company || (user.accountType === 'provider' ? user.name || '' : ''),
      },
      subscription: {
        ...current.subscription,
        plan:
          current.subscription.plan ||
          (user.accountType === 'provider' ? 'Provider Starter' : 'Driver Starter'),
        billingEmail: current.subscription.billingEmail || user.email || '',
      },
      preferences: {
        ...current.preferences,
        theme,
      },
    }));
  }, [theme, user]);

  useEffect(() => {
    const filtered = providerCatalog.filter((item) => item.serviceCode === serviceFilter);

    if (filtered.length === 0) {
      if (roadsideForm.providerServiceId) {
        setRoadsideForm((current) => ({ ...current, providerServiceId: '' }));
      }
      return;
    }

    const current = filtered.find((item) => item.id === roadsideForm.providerServiceId);

    if (!current) {
      setRoadsideForm((existing) => ({
        ...existing,
        providerServiceId: filtered[0].id,
      }));
    }
  }, [providerCatalog, roadsideForm.providerServiceId, serviceFilter]);

  useEffect(() => {
    if (user?.accountType !== 'provider' || providerServices.length === 0) {
      return;
    }

    const apiServiceNames = providerServices.map((item) => item.serviceName).filter(Boolean);

    setProfileSettings((current) => {
      const merged = mergeUniqueList(current.business?.offeredServices || [], apiServiceNames);
      const currentKey = (current.business?.offeredServices || []).join('||');
      const mergedKey = merged.join('||');

      if (currentKey === mergedKey) {
        return current;
      }

      return {
        ...current,
        business: {
          ...current.business,
          offeredServices: merged,
        },
      };
    });
  }, [providerServices, user?.accountType]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationBias({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => {
        setLocationBias({ latitude: null, longitude: null });
      },
      {
        enableHighAccuracy: false,
        timeout: 6000,
      },
    );
  }, []);

  useEffect(() => () => {
    Object.values(locationSuggestionTimeoutsRef.current).forEach((timerId) => {
      clearTimeout(timerId);
    });
  }, []);

  useEffect(() => {
    if (!sessionReady || !token || !user || step !== 'dashboard') {
      return;
    }

    if (user.accountType === 'provider') {
      void loadProviderDashboard(token);
      return;
    }

    void loadCustomerDashboard(token);
  }, [sessionReady, step, token, user]);

  async function loadCustomerDashboard(accessToken) {
    const [vehicleData, requestData, catalogData] = await Promise.all([
      request('/vehicles', undefined, 'GET', accessToken),
      request('/roadside-requests', undefined, 'GET', accessToken),
      request('/provider-services/catalog', undefined, 'GET', accessToken),
    ]);

    setVehicles(vehicleData);
    setRequests(requestData);
    setProviderCatalog(catalogData);
    setProviderServices([]);

    if (vehicleData.length > 0) {
      setRoadsideForm((current) => ({
        ...current,
        vehicleId: current.vehicleId || vehicleData[0].id,
      }));
    }

    if (catalogData.length > 0) {
      setServiceFilter(catalogData[0].serviceCode);
      setRoadsideForm((current) => ({
        ...current,
        providerServiceId: current.providerServiceId || catalogData[0].id,
      }));
    }
  }

  async function loadProviderDashboard(accessToken) {
    const serviceData = await request('/provider-services', undefined, 'GET', accessToken);
    setProviderServices(serviceData);
    setProviderCatalog([]);
    setVehicles([]);
    setRequests([]);
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await request('/auth/register', registerForm);
      setMode('login');
      setLoginForm({
        email: data.user.email,
        password: registerForm.password,
      });
      setVerifyForm({ email: data.user.email, otp: '' });
      setMessage(`Account ready. Sign in to continue as ${data.user.accountType}.`);
      setRegisterForm(initialRegister);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await request('/auth/login', loginForm);
      setDevOtp(data.devOtp ?? '');
      setStep('otp');
      setToken('');
      setUser(null);
      setVehicles([]);
      setRequests([]);
      setProviderServices([]);
      setProviderCatalog([]);
      setVerifyForm({ email: loginForm.email, otp: '' });
      setMessage(data.devOtp ? 'OTP sent. Use the code below for local testing.' : 'OTP sent.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await request('/auth/verify-otp', verifyForm);
      setToken(data.accessToken);
      setUser(data.user);
      setDevOtp('');
      setStep('dashboard');
      setDashboardTab('overview');
      setMessage(`Signed in as ${data.user.email}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddVehicle(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const newVehicle = await request('/vehicles', vehicleForm, 'POST', token);
      setVehicles((current) => [...current, newVehicle]);
      setVehicleForm(initialVehicle);
      setRoadsideForm((current) => ({ ...current, vehicleId: newVehicle.id }));
      setDashboardTab('vehicles');
      setMessage(`Vehicle saved: ${newVehicle.nickname}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProviderService(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        serviceName: providerServiceForm.serviceName,
        serviceCode: providerServiceForm.serviceCode,
        basePriceKsh: Number(providerServiceForm.basePriceKsh),
        pricePerKmKsh: Number(providerServiceForm.pricePerKmKsh),
        description: providerServiceForm.description,
        fuelPricing:
          providerServiceForm.serviceCode === 'fuel_delivery'
            ? {
                gasoline: {
                  regular: providerServiceForm.gasolineRegularPrice
                    ? Number(providerServiceForm.gasolineRegularPrice)
                    : undefined,
                  vpower: providerServiceForm.gasolineVPowerPrice
                    ? Number(providerServiceForm.gasolineVPowerPrice)
                    : undefined,
                },
                diesel: {
                  standard: providerServiceForm.dieselPrice
                    ? Number(providerServiceForm.dieselPrice)
                    : undefined,
                },
              }
            : undefined,
      };

      const savedService = editingProviderServiceId
        ? await request(`/provider-services/${editingProviderServiceId}`, payload, 'PUT', token)
        : await request('/provider-services', payload, 'POST', token);

      setProviderServices((current) =>
        editingProviderServiceId
          ? current.map((service) =>
              service.id === editingProviderServiceId ? savedService : service,
            )
          : [savedService, ...current],
      );

      setProviderServiceForm({
        ...initialProviderService,
        serviceCode: providerServiceForm.serviceCode,
      });
      setEditingProviderServiceId('');
      setShowProviderServiceComposer(false);
      setDashboardTab('services');
      setMessage(
        editingProviderServiceId
          ? `Service updated: ${savedService.serviceName}`
          : `Service published: ${savedService.serviceName}`,
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitRoadsideRequest(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        vehicleId: roadsideForm.vehicleId,
        providerServiceId: roadsideForm.providerServiceId,
        distanceKm: Number(roadsideForm.distanceKm),
        latitude: Number(roadsideForm.latitude),
        longitude: Number(roadsideForm.longitude),
        address: roadsideForm.address,
        landmark: roadsideForm.landmark,
        notes: roadsideForm.notes,
        fuelLitres:
          selectedProviderService?.serviceCode === 'fuel_delivery' ? selectedFuelLitres : undefined,
        fuelType:
          selectedProviderService?.serviceCode === 'fuel_delivery'
            ? roadsideForm.fuelType
            : undefined,
        gasolineGrade:
          selectedProviderService?.serviceCode === 'fuel_delivery' &&
          roadsideForm.fuelType === 'gasoline'
            ? roadsideForm.gasolineGrade
            : undefined,
      };

      const newRequest = await request('/roadside-requests', payload, 'POST', token);
      setRequests((current) => [newRequest, ...current]);
      setRoadsideForm((current) => ({
        ...initialRoadsideRequest,
        vehicleId: current.vehicleId,
        providerServiceId: current.providerServiceId,
      }));
      setDashboardTab('history');
      setMessage(`Request created. Estimated total ${formatCurrency(newRequest.estimatedPriceKsh)}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported in this browser.');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRoadsideForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setMessage('Location captured.');
        setLoading(false);
      },
      () => {
        setMessage('Unable to capture location. Enter coordinates manually.');
        setLoading(false);
      },
    );
  }

  function handleForgotPassword() {
    setMessage('Forgot password email delivery will be connected next.');
  }

  function handleSocialLogin(provider) {
    setMessage(`${provider} sign-in will be connected after the core auth flow is stable.`);
  }

  function handleProfileFieldChange(section, field, value) {
    setProfileSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  function handleBusinessNestedFieldChange(group, field, value) {
    setProfileSettings((current) => ({
      ...current,
      business: {
        ...current.business,
        [group]: {
          ...current.business[group],
          [field]: value,
        },
      },
    }));
  }

  function toggleBusinessListField(field, value) {
    setProfileSettings((current) => {
      const existing = current.business[field] || [];
      const nextValues = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];

      return {
        ...current,
        business: {
          ...current.business,
          [field]: nextValues,
        },
      };
    });
  }

  function addBusinessLocation() {
    setProfileSettings((current) => ({
      ...current,
      business: {
        ...current.business,
        locations: [
          ...(current.business.locations || []),
          {
            branchName: 'Satellite Branch',
            address: '',
            countryCode: 'KE',
            town: '',
            road: '',
            landmark: '',
            mapUrl: '',
            latitude: '',
            longitude: '',
          },
        ],
      },
    }));
  }

  function updateBusinessLocation(index, field, value) {
    setProfileSettings((current) => ({
      ...current,
      business: {
        ...current.business,
        locations: (current.business.locations || []).map((location, position) =>
          position === index ? { ...location, [field]: value } : location,
        ),
      },
    }));
  }

  function removeBusinessLocation(index) {
    setProfileSettings((current) => {
      const locations = current.business.locations || [];
      if (locations.length <= 1) {
        return current;
      }

      return {
        ...current,
        business: {
          ...current.business,
          locations: locations.filter((_, position) => position !== index),
        },
      };
    });
  }

  async function searchBusinessLocationSuggestions(index, query) {
    const trimmed = normalizeLocationQuery(query || '');

    if (trimmed.length < 3) {
      setLocationSuggestionsByIndex((current) => ({
        ...current,
        [index]: [],
      }));
      return;
    }

    if (lastSuggestionQueryByIndex[index] === trimmed) {
      return;
    }

    setLocationSearchingIndex(index);

    try {
      const branch = profileSettings.business.locations?.[index];
      const countryCode = branch?.countryCode || 'KE';

      let results = [];

      try {
        results = await request('/locations/suggest', {
          query: trimmed,
          countryCode,
          nearLat: locationBias.latitude ?? undefined,
          nearLng: locationBias.longitude ?? undefined,
        });

        if (!Array.isArray(results) || results.length === 0) {
          results = await fallbackLocationSuggestions(trimmed, countryCode);
        }
      } catch {
        results = await fallbackLocationSuggestions(trimmed, countryCode);
      }

      const mapped = (results || []).map((item) => ({
        name: item.name || '',
        formattedAddress: item.address || '',
        label:
          item.name && item.road
            ? `${item.name}, ${item.road}`
            : item.name || item.address || '',
        latitude: item.lat || '',
        longitude: item.lng || '',
        town: item.town || '',
        road: item.road || '',
        landmark: item.landmark || '',
        mapUrl:
          item.lat && item.lng
            ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`
            : '',
      }));

      setLocationSuggestionsByIndex((current) => ({
        ...current,
        [index]: mapped,
      }));

      if (mapped.length === 0) {
        setMessage('No location suggestions found. Try a shorter name or correct spelling.');
      }

      setLastSuggestionQueryByIndex((current) => ({
        ...current,
        [index]: trimmed,
      }));
    } catch (error) {
      setMessage(error.message || 'Unable to fetch location suggestions.');

      setLastSuggestionQueryByIndex((current) => ({
        ...current,
        [index]: '',
      }));
    } finally {
      setLocationSearchingIndex((current) => (current === index ? null : current));
    }
  }

  function scheduleBusinessLocationSuggestions(index, query) {
    const trimmed = normalizeLocationQuery(query || '');
    const existingTimer = locationSuggestionTimeoutsRef.current[index];

    if (existingTimer) {
      clearTimeout(existingTimer);
      delete locationSuggestionTimeoutsRef.current[index];
    }

    if (trimmed.length < 3) {
      setLocationSuggestionsByIndex((current) => ({
        ...current,
        [index]: [],
      }));
      setLastSuggestionQueryByIndex((current) => ({
        ...current,
        [index]: '',
      }));
      return;
    }

    if (shouldLookupAfterWord(query || '')) {
      void searchBusinessLocationSuggestions(index, query);
      return;
    }

    locationSuggestionTimeoutsRef.current[index] = setTimeout(() => {
      void searchBusinessLocationSuggestions(index, query);
      delete locationSuggestionTimeoutsRef.current[index];
    }, 500);
  }

  function selectBusinessLocationSuggestion(index, suggestion) {
    const addressValue = suggestion.label || suggestion.formattedAddress || suggestion.name || '';
    const parsedAddress = parseAddressParts(suggestion.formattedAddress || addressValue, suggestion.name || '');
    const landmarkValue = suggestion.landmark || suggestion.name || '';

    updateBusinessLocation(index, 'address', addressValue);
    updateBusinessLocation(index, 'town', suggestion.town || parsedAddress.town || '');
    updateBusinessLocation(index, 'road', suggestion.road || parsedAddress.road || '');
    updateBusinessLocation(index, 'landmark', landmarkValue);
    updateBusinessLocation(index, 'latitude', suggestion.latitude || '');
    updateBusinessLocation(index, 'longitude', suggestion.longitude || '');

    if (suggestion.mapUrl) {
      updateBusinessLocation(
        index,
        'mapUrl',
        suggestion.mapUrl,
      );
    }

    setLocationSuggestionsByIndex((current) => ({
      ...current,
      [index]: [],
    }));

    setLastSuggestionQueryByIndex((current) => ({
      ...current,
      [index]: normalizeLocationQuery(addressValue),
    }));

    setMessage('Location details auto-filled from search suggestion.');
  }

  async function resolveBusinessLocation(index) {
    const location = profileSettings.business.locations?.[index];
    if (!location) {
      return;
    }

    setLocationResolvingIndex(index);

    try {
      const composedQuery =
        [location.address, location.road, location.town, location.landmark].filter(Boolean).join(', ');

      if (!composedQuery && !location.mapUrl) {
        setMessage('Add a map link or address details first so we can resolve location.');
        return;
      }

      const bestMatch = await request('/locations/resolve', {
        query: composedQuery || undefined,
        mapUrl: location.mapUrl || undefined,
        countryCode: location.countryCode || 'KE',
        nearLat: locationBias.latitude ?? undefined,
        nearLng: locationBias.longitude ?? undefined,
      });

      if (!bestMatch) {
        setMessage('No map match found. Try adding town, road, and a nearby landmark.');
        return;
      }

      updateBusinessLocation(index, 'latitude', bestMatch.lat || '');
      updateBusinessLocation(index, 'longitude', bestMatch.lng || '');
      updateBusinessLocation(index, 'address', bestMatch.address || location.address);
      updateBusinessLocation(index, 'town', bestMatch.town || location.town);
      updateBusinessLocation(index, 'road', bestMatch.road || location.road);
      updateBusinessLocation(index, 'landmark', bestMatch.landmark || location.landmark);

      if (bestMatch.lat && bestMatch.lng) {
        updateBusinessLocation(
          index,
          'mapUrl',
          `https://www.google.com/maps/search/?api=1&query=${bestMatch.lat},${bestMatch.lng}`,
        );
      }

      setMessage('Location resolved for heatmap and branch details.');
    } catch (error) {
      setMessage(error.message || 'Unable to resolve location at the moment.');
    } finally {
      setLocationResolvingIndex(null);
    }
  }


  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setProfileSettings((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        theme: nextTheme,
      },
    }));
  }

  function openLogin() {
    setMode('login');
    setStep('auth');
    setShowAccountMenu(false);
    setShowNotifications(false);
  }

  function openRegister(accountType = 'customer') {
    setMode('register');
    setStep('auth');
    setRegisterForm((current) => ({
      ...current,
      accountType,
    }));
    setShowAccountMenu(false);
    setShowNotifications(false);
  }

  function handlePreferenceThemeChange(nextTheme) {
    setTheme(nextTheme);
    handleProfileFieldChange('preferences', 'theme', nextTheme);
  }

  function handleSaveProfile(event) {
    event.preventDefault();
    setMessage('Profile settings saved locally for this MVP session.');
  }

  function handlePasswordReset(event) {
    event.preventDefault();
    setMessage('Secure password reset will connect to backend email delivery next.');
    setPasswordForm(initialPasswordForm);
  }

  function resetFlow(nextMode = 'login') {
    setMode(nextMode);
    setStep('auth');
    setDevOtp('');
    setVerifyForm(initialVerify);
    setMessage('');
    setShowAccountMenu(false);
    setShowNotifications(false);
  }

  function signOut() {
    setToken('');
    setUser(null);
    setVehicles([]);
    setRequests([]);
    setProviderServices([]);
    setProviderCatalog([]);
    setVehicleForm(initialVehicle);
    setProviderServiceForm(initialProviderService);
    setEditingProviderServiceId('');
    setShowProviderServiceComposer(false);
    setRoadsideForm(initialRoadsideRequest);
    setDashboardTab('overview');
    setServiceFilter('battery_jump');
    setVerifyForm(initialVerify);
    setPasswordForm(initialPasswordForm);
    setShowAccountMenu(false);
    setShowNotifications(false);
    setMessage('');
    setStep('entry');
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  function openDashboard(tab = 'overview') {
    setDashboardTab(tab);
    setStep('dashboard');
    setShowNotifications(false);
    setShowAccountMenu(false);
    setMessage('');
  }

  function renderLandingPanel() {
    return (
      <VisLandingPage
        isLoggedIn={Boolean(token && user)}
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenLogin={openLogin}
        onOpenRegister={openRegister}
        onOpenDashboard={() => openDashboard()}
        onOpenProfile={() => openDashboard('profile')}
        onSignOut={signOut}
        health={health}
      />
    );
  }

  function renderAuthPanel() {
    if (step === 'otp') {
      return (
        <form className="auth-shell" id="auth" onSubmit={handleVerify}>
          <div className="auth-head">
            <span className="mini-pill">OTP</span>
            <h2>Verify sign in</h2>
            <p className="auth-copy">Enter the code sent to your email or SMS.</p>
          </div>
          <label>
            <span>Code</span>
            <input
              placeholder="123456"
              value={verifyForm.otp}
              onChange={(event) => setVerifyForm({ ...verifyForm, otp: event.target.value })}
            />
          </label>
          {devOtp ? <div className="otp-box">Dev OTP: {devOtp}</div> : null}
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Continue'}
          </button>
          <button className="ghost-button" type="button" onClick={() => resetFlow('login')}>
            Back
          </button>
          {message ? <div className="status-banner">{message}</div> : null}
        </form>
      );
    }

    return (
      <div className="auth-shell" id="auth">
        <div className="auth-head">
          <span className="mini-pill">Access</span>
          <h2>{mode === 'register' ? 'Join fast' : 'Welcome back'}</h2>
          <p className="auth-copy">
            {mode === 'register'
              ? 'Create a new VIS Auto account to get started.'
              : 'Use your existing VIS Auto account to continue.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'switch-active' : 'switch-idle'}
            type="button"
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            className={mode === 'register' ? 'switch-active' : 'switch-idle'}
            type="button"
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>

        {mode === 'register' ? (
          <form className="stack" onSubmit={handleRegister}>
            <div className="auth-head">
              <span className="mini-pill">Account</span>
              <h2>Join fast</h2>
            </div>
            <label>
              <span>Name</span>
              <input
                placeholder="Jane Doe"
                value={registerForm.name}
                onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                placeholder="you@example.com"
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, email: event.target.value })
                }
              />
            </label>
            <label>
              <span>Role</span>
              <select
                value={registerForm.accountType}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, accountType: event.target.value })
                }
              >
                <option value="customer">Customer</option>
                <option value="provider">Provider</option>
              </select>
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, password: event.target.value })
                }
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        ) : (
          <form className="stack" onSubmit={handleLogin}>
            <div className="auth-head">
              <span className="mini-pill">Access</span>
              <h2>Welcome back</h2>
            </div>
            <label>
              <span>Email</span>
              <input
                placeholder="you@example.com"
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                placeholder="Your password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Log in'}
            </button>
            <div className="inline-actions">
              <button className="link-button" type="button" onClick={handleForgotPassword}>
                Forgot password
              </button>
            </div>
          </form>
        )}

        <div className="social-stack">
          <button className="social-button" type="button" onClick={() => handleSocialLogin('Google')}>
            Continue with Google
          </button>
          <button className="social-button" type="button" onClick={() => handleSocialLogin('Apple')}>
            Continue with Apple ID
          </button>
        </div>

        {message ? <div className="status-banner">{message}</div> : null}

        <button className="ghost-button" type="button" onClick={() => setStep('entry')}>
          Back to home
        </button>
      </div>
    );
  }

  function renderDashboardTopbar() {
    return (
      <header className="dashboard-topbar">
        <div className="topbar-brand">
          <button className="brand-inline" type="button" onClick={() => setStep('entry')}>
            VIS
          </button>
          <div className="topbar-copy">
            <strong>{topbarLabel}</strong>
            <span>{user?.accountType === 'provider' ? 'Provider workspace' : 'Driver workspace'}</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className="icon-button notification-button"
            type="button"
            onClick={() => {
              setShowNotifications((current) => !current);
              setShowAccountMenu(false);
            }}
            aria-label="Notifications"
          >
            <BellIcon />
            <span className="notification-count">3</span>
          </button>
          <div className="account-menu-wrap">
            <button
              className="account-button"
              type="button"
              onClick={() => {
                setShowAccountMenu((current) => !current);
                setShowNotifications(false);
              }}
            >
              <span className="avatar-badge">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
              <div className="account-text">
                <strong>{user?.name}</strong>
                <span>{user?.accountType === 'provider' ? 'Provider' : 'Customer'}</span>
              </div>
            </button>
            {showAccountMenu ? (
              <div className="dropdown-menu">
                <div className="dropdown-head">
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
                <button type="button" onClick={() => openDashboard('overview')}>
                  <UserIcon />
                  Dashboard
                </button>
                <button type="button" onClick={() => openDashboard('profile')}>
                  <UserIcon />
                  Profile
                </button>
                <button type="button" onClick={signOut}>
                  <LogoutIcon />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  function renderNotificationsTray() {
    if (!showNotifications) {
      return null;
    }

    return (
      <section className="floating-panel">
        <div className="panel-head compact">
          <div>
            <p className="eyebrow">Notifications</p>
            <h3>Recent updates</h3>
          </div>
        </div>
        <div className="notification-list">
          {staticNotifications.map((item) => (
            <article className="notification-item" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderCustomerDashboard() {
    return (
      <section className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="sidebar-head">
            <p className="eyebrow">Customer</p>
            <h2>VIS Garage</h2>
            <span>{user?.name}</span>
          </div>
          <nav className="sidebar-nav">
            {[
              ['overview', 'Overview'],
              ['request', 'Request'],
              ['vehicles', 'Vehicles'],
              ['history', 'History'],
              ['profile', 'Profile'],
            ].map(([id, label]) => (
              <button
                key={id}
                className={dashboardTab === id ? 'nav-active' : 'nav-idle'}
                type="button"
                onClick={() => setDashboardTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="sidebar-metrics">
            <div className="metric-card">
              <span>Active</span>
              <strong>{requestStats.active}</strong>
            </div>
            <div className="metric-card">
              <span>Vehicles</span>
              <strong>{requestStats.vehicles}</strong>
            </div>
          </div>
        </aside>

        <div className="dashboard-main">
          {renderDashboardTopbar()}
          {renderNotificationsTray()}
          {dashboardTab === 'overview' ? renderCustomerOverview() : null}
          {dashboardTab === 'request' ? renderRequestPanel() : null}
          {dashboardTab === 'vehicles' ? renderVehiclePanel() : null}
          {dashboardTab === 'history' ? renderHistoryPanel() : null}
          {dashboardTab === 'profile' ? renderProfilePanel() : null}
        </div>
      </section>
    );
  }

  function renderProviderDashboard() {
    const sidebarItems = [
      { id: 'overview', label: 'Dashboard' },
      { id: 'services', label: 'Manage Services' },
      { id: 'services', label: 'Manage Vendors' },
      { id: 'services', label: 'Order History' },
      { id: 'services', label: 'Ratings & Reviews' },
      { id: 'overview', label: 'Heat Map' },
      { id: 'profile', label: 'My Profile' },
      { id: 'settings', label: 'Settings' },
    ];

    return (
      <section className="provider-shell-v2">
        <aside className="provider-sidebar-v2">
          <button
            className="provider-brand-v2 provider-brand-home-v2"
            type="button"
            onClick={() => {
              setStep('entry');
              setShowAccountMenu(false);
              setShowNotifications(false);
            }}
          >
            <div className="provider-brand-logo-v2">
              {!brandLogoError ? (
                <img
                  src={providerBrandLogo}
                  alt={`${providerBrandName} logo`}
                  onError={() => setBrandLogoError(true)}
                />
              ) : (
                <span>{providerBrandInitials || 'VIS'}</span>
              )}
            </div>
            <div>
              <strong>{providerBrandName}</strong>
            </div>
          </button>

          <nav className="provider-nav-v2">
            {sidebarItems.map((item) => (
              <button
                key={`${item.id || 'na'}-${item.label}`}
                className={dashboardTab === item.id ? 'provider-nav-active-v2' : 'provider-nav-idle-v2'}
                type="button"
                onClick={() => setDashboardTab(item.id)}
              >
                {item.label}
              </button>
            ))}
            <button className="provider-nav-idle-v2" type="button" onClick={signOut}>
              Logout
            </button>
          </nav>

          <div className="provider-upgrade-v2">
            <strong>Upgrade Membership</strong>
            <p>Upgrade your membership in $500 for next 5 years.</p>
            <button className="secondary-cta" type="button">
              Upgrade now
            </button>
          </div>
        </aside>

        <div className="provider-main-v2">
          <header className="provider-topbar-v2">
            <div className="provider-topbar-search-v2">
              <input type="search" placeholder="Search projects here..." aria-label="Search projects" />
            </div>

            <div className="provider-topbar-actions-v2">
              <button
                className="icon-button notification-button"
                type="button"
                onClick={() => {
                  setShowNotifications((current) => !current);
                  setShowAccountMenu(false);
                }}
                aria-label="Notifications"
              >
                <BellIcon />
                <span className="notification-count">3</span>
              </button>

              <div className="account-menu-wrap">
                <button
                  className="provider-profile-chip-v2"
                  type="button"
                  onClick={() => {
                    setShowAccountMenu((current) => !current);
                    setShowNotifications(false);
                  }}
                >
                  <span className="avatar-badge">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                  <span>{user?.name || 'Provider'}</span>
                </button>
                {showAccountMenu ? (
                  <div className="dropdown-menu">
                    <div className="dropdown-head">
                      <strong>{user?.name}</strong>
                      <span>{user?.email}</span>
                    </div>
                    <button type="button" onClick={() => setDashboardTab('overview')}>
                      Dashboard
                    </button>
                    <button type="button" onClick={() => setDashboardTab('profile')}>
                      Profile
                    </button>
                    <button type="button" onClick={signOut}>
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="provider-content-v2">
            {renderNotificationsTray()}
            {dashboardTab === 'overview' ? renderProviderOverview() : null}
            {dashboardTab === 'services' ? renderProviderServiceList() : null}
            {dashboardTab === 'pricing' ? renderProviderServicePanel() : null}
            {dashboardTab === 'profile' ? renderProfilePanel() : null}
            {dashboardTab === 'settings' ? renderSettingsPanel() : null}
          </div>
        </div>
      </section>
    );
  }

  function renderCustomerOverview() {
    return (
      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Overview</p>
            <h3>Clean entry point</h3>
          </div>
          <button className="primary-cta" type="button" onClick={() => setDashboardTab('request')}>
            New roadside request
          </button>
        </div>

        <div className="hero-grid">
          <article className="spotlight-card">
            <span>Roadside</span>
            <strong>Fast request flow</strong>
            <p>Fuel, towing, battery, tire change, and lockout.</p>
          </article>
          <article className="spotlight-card alt">
            <span>Vehicle profile</span>
            <strong>Data foundation</strong>
            <p>Save your car once and build maintenance history over time.</p>
          </article>
        </div>

        <div className="module-grid">
          {futureCustomerModules.map((module) => (
            <article className="module-card" key={module.title}>
              <span>{module.meta}</span>
              <strong>{module.title}</strong>
              <p>{module.detail}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderProviderOverview() {
    const dashboardStatCards = [
      { value: '365', label: 'Registered Users', icon: '◉', tone: 'violet' },
      { value: '86%', label: 'Total Increase Revenue', icon: '$', tone: 'orange' },
      { value: '02', label: 'Pending Orders', icon: '▦', tone: 'gold' },
      { value: '136', label: 'Completed Orders', icon: '✓', tone: 'green' },
    ];

    const orderStats = [
      { value: '25', label: 'Completed Services', percent: 78, color: '#22c55e' },
      { value: '$214', label: 'Total Earnings', percent: 66, color: '#f97316' },
      { value: '4.5', label: 'Ratings', percent: 82, color: '#eab308' },
      { value: '2', label: 'User Joined', percent: 40, color: '#a855f7' },
    ];

    const orderRows = [
      {
        code: '#ABC0036',
        title: 'House-help room cleaning',
        meta: 'Cleaning',
        date: '08-04-2022',
        amount: '$36.00',
        status: 'Ongoing',
        tone: 'ongoing',
      },
      {
        code: '#ABC0035',
        title: 'Hair cutting & colour',
        meta: 'Salon',
        date: '07-04-2022',
        amount: '$20.00',
        status: 'Completed',
        tone: 'completed',
      },
      {
        code: '#ABC0033',
        title: 'Full body massage with checkup',
        meta: 'Spa',
        date: '03-04-2022',
        amount: '$55.00',
        status: 'Pending',
        tone: 'pending',
      },
    ];

    const showcaseServices =
      providerServices.length > 0
        ? providerServices.slice(0, 4).map((service, index) => ({
            id: service.id,
            title: service.serviceName,
            provider: user?.name || 'Your Team',
            serviceCode: service.serviceCode,
            serviceImageUrl: service.serviceImageUrl,
            rating: (4.1 + index * 0.2).toFixed(1),
            price: formatCurrency(service.basePriceKsh),
            tone: ['peach', 'mint', 'sky', 'sand'][index % 4],
          }))
        : [
            {
              id: 'demo-1',
              title: 'Beauty',
              provider: 'George & Albert Pvt. Ltd',
              serviceCode: 'battery_jump',
              serviceImageUrl: '/assets/other_services.jpeg',
              rating: '4.5',
              price: '$36.00',
              tone: 'peach',
            },
            {
              id: 'demo-2',
              title: 'Painter',
              provider: 'Sebastian & Co workers',
              serviceCode: 'tire_change',
              serviceImageUrl: '/assets/other_services.jpeg',
              rating: '4.4',
              price: '$44.00',
              tone: 'mint',
            },
            {
              id: 'demo-3',
              title: 'Car Wash',
              provider: 'Shift Car Studio',
              serviceCode: 'towing',
              serviceImageUrl: '/assets/other_services.jpeg',
              rating: '4.7',
              price: '$18.00',
              tone: 'sky',
            },
            {
              id: 'demo-4',
              title: 'Drain Cleaning',
              provider: 'Swift Fix Team',
              serviceCode: 'lockout',
              serviceImageUrl: '/assets/other_services.jpeg',
              rating: '4.3',
              price: '$24.00',
              tone: 'sand',
            },
          ];

    return (
      <section className="provider-home-v2">
        <div className="provider-home-head-v2">
          <div>
            <p>Welcome to</p>
            <h3>StarShine</h3>
          </div>
          <button
            className="primary-cta"
            type="button"
            onClick={() => {
              setDashboardTab('services');
              setEditingProviderServiceId('');
              setProviderServiceForm(initialProviderService);
              setShowProviderServiceComposer(true);
            }}
          >
            Add Service
          </button>
        </div>

        <div className="provider-stat-strip-v2">
          {dashboardStatCards.map((card) => (
            <article className={`provider-stat-card-v2 ${card.tone}`} key={card.label}>
              <div>
                <strong>{card.value}</strong>
                <span>{card.label}</span>
              </div>
              <div className="provider-stat-icon-v2">{card.icon}</div>
            </article>
          ))}
        </div>

        <div className="provider-grid-v2">
          <section className="provider-orders-stats-v2">
            <div className="provider-section-head-v2">
              <h4>Orders Statistics</h4>
              <span>Monthly</span>
            </div>

            <div className="provider-ring-grid-v2">
              {orderStats.map((item) => (
                <article className="provider-ring-card-v2" key={item.label}>
                  <div
                    className="provider-ring-v2"
                    style={{
                      background: `conic-gradient(${item.color} ${item.percent}%, rgba(148, 163, 184, 0.22) ${item.percent}% 100%)`,
                    }}
                  >
                    <span>{item.value}</span>
                  </div>
                  <p>{item.label}</p>
                </article>
              ))}
            </div>

            <div className="provider-popular-v2">
              <div className="provider-section-head-v2">
                <h4>Popular Services</h4>
                <button className="ghost-button" type="button" onClick={() => setDashboardTab('services')}>
                  Manage
                </button>
              </div>

              <div className="provider-service-grid-v2">
                {showcaseServices.map((service) => (
                  <article className={`provider-service-card-v2 ${service.tone}`} key={service.id}>
                    <div
                      className="provider-service-art-v2"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0.46)), url(${getServiceImageUrl(service)})`,
                      }}
                    />
                    <strong>{service.title}</strong>
                    <p>{service.provider}</p>
                    <div className="provider-service-meta-v2">
                      <span>★ {service.rating} Reviews</span>
                      <strong>{service.price}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="provider-orders-v2">
            <div className="provider-section-head-v2">
              <h4>Orders</h4>
            </div>
            <div className="provider-order-tabs-v2">
              {['All', 'Ongoing', 'Pending', 'Completed', 'Cancelled'].map((tab, index) => (
                <button key={tab} className={index === 0 ? 'provider-order-tab-active-v2' : 'provider-order-tab-v2'} type="button">
                  {tab}
                </button>
              ))}
            </div>

            <div className="provider-order-list-v2">
              {orderRows.map((order) => (
                <article className="provider-order-card-v2" key={order.code}>
                  <div className="provider-order-thumb-v2" />
                  <div className="provider-order-content-v2">
                    <div className="provider-order-head-v2">
                      <strong>{order.code}</strong>
                      <span>{order.amount}</span>
                    </div>
                    <p>{order.title}</p>
                    <div className="provider-order-meta-v2">
                      <span>{order.meta}</span>
                      <span>{order.date}</span>
                    </div>
                    <div className={`provider-order-status-v2 ${order.tone}`}>{order.status}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {providerServices.length === 0 ? (
          <article className="provider-note-v2">
            <strong>No services published yet.</strong>
            <p>Use Add Service to publish your first offering and start appearing in customer requests.</p>
          </article>
        ) : null}

        <div className="module-grid">
          {futureProviderModules.map((module) => (
            <article className="module-card" key={module.title}>
              <span>{module.meta}</span>
              <strong>{module.title}</strong>
              <p>{module.detail}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderVehiclePanel() {
    return (
      <form className="dashboard-panel stack" onSubmit={handleAddVehicle}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Vehicle</p>
            <h3>Add a car</h3>
          </div>
        </div>
        <div className="form-grid">
          <label>
            <span>Nickname</span>
            <input
              value={vehicleForm.nickname}
              onChange={(event) => setVehicleForm({ ...vehicleForm, nickname: event.target.value })}
            />
          </label>
          <label>
            <span>Make</span>
            <input
              value={vehicleForm.make}
              onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })}
            />
          </label>
          <label>
            <span>Model</span>
            <input
              value={vehicleForm.model}
              onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })}
            />
          </label>
          <label>
            <span>Year</span>
            <input
              type="number"
              value={vehicleForm.year}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, year: Number(event.target.value) })
              }
            />
          </label>
          <label>
            <span>Registration</span>
            <input
              value={vehicleForm.registrationNumber}
              onChange={(event) =>
                setVehicleForm({ ...vehicleForm, registrationNumber: event.target.value })
              }
            />
          </label>
          <label>
            <span>Color</span>
            <input
              value={vehicleForm.color}
              onChange={(event) => setVehicleForm({ ...vehicleForm, color: event.target.value })}
            />
          </label>
        </div>
        <label>
          <span>Notes</span>
          <textarea
            value={vehicleForm.notes}
            onChange={(event) => setVehicleForm({ ...vehicleForm, notes: event.target.value })}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save vehicle'}
        </button>
      </form>
    );
  }

  function renderProviderServicePanel() {
    const isFuelDelivery = providerServiceForm.serviceCode === 'fuel_delivery';

    return (
      <form className="dashboard-panel stack" onSubmit={handleAddProviderService}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Service pricing</p>
            <h3>{editingProviderServiceId ? 'Edit service' : 'Add service'}</h3>
          </div>
        </div>

        {message ? <div className="status-banner">{message}</div> : null}

        <div className="form-grid">
          <label>
            <span>Name</span>
            <input
              value={providerServiceForm.serviceName}
              onChange={(event) =>
                setProviderServiceForm({ ...providerServiceForm, serviceName: event.target.value })
              }
            />
          </label>
          <label>
            <span>Type</span>
            <select
              value={providerServiceForm.serviceCode}
              onChange={(event) =>
                setProviderServiceForm({ ...providerServiceForm, serviceCode: event.target.value })
              }
            >
              {serviceTypeOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Base charge</span>
            <input
              type="number"
              min="0"
              value={providerServiceForm.basePriceKsh}
              onChange={(event) =>
                setProviderServiceForm({ ...providerServiceForm, basePriceKsh: event.target.value })
              }
            />
          </label>
          <label>
            <span>Charge per km</span>
            <input
              type="number"
              min="0"
              value={providerServiceForm.pricePerKmKsh}
              onChange={(event) =>
                setProviderServiceForm({
                  ...providerServiceForm,
                  pricePerKmKsh: event.target.value,
                })
              }
            />
          </label>
        </div>
        <label>
          <span>Description</span>
          <textarea
            value={providerServiceForm.description}
            onChange={(event) =>
              setProviderServiceForm({ ...providerServiceForm, description: event.target.value })
            }
          />
        </label>

        {isFuelDelivery ? (
          <div className="soft-block">
            <div className="panel-head compact">
              <div>
                <p className="eyebrow">Fuel</p>
                <h3>Per litre pricing</h3>
              </div>
            </div>
            <div className="form-grid">
              <label>
                <span>Gasoline regular</span>
                <input
                  type="number"
                  min="0"
                  value={providerServiceForm.gasolineRegularPrice}
                  onChange={(event) =>
                    setProviderServiceForm({
                      ...providerServiceForm,
                      gasolineRegularPrice: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Gasoline V-Power</span>
                <input
                  type="number"
                  min="0"
                  value={providerServiceForm.gasolineVPowerPrice}
                  onChange={(event) =>
                    setProviderServiceForm({
                      ...providerServiceForm,
                      gasolineVPowerPrice: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Diesel</span>
                <input
                  type="number"
                  min="0"
                  value={providerServiceForm.dieselPrice}
                  onChange={(event) =>
                    setProviderServiceForm({
                      ...providerServiceForm,
                      dieselPrice: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          </div>
        ) : null}

        <div className="form-actions">
          <button className="primary-cta service-submit-button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : editingProviderServiceId ? 'Update service' : 'Publish service'}
          </button>
          {editingProviderServiceId ? (
            <button
              className="ghost-button service-cancel-button"
              type="button"
              onClick={() => {
                setEditingProviderServiceId('');
                setProviderServiceForm(initialProviderService);
                setShowProviderServiceComposer(false);
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>
    );
  }

  function renderRequestPanel() {
    if (vehicles.length === 0) {
      return <div className="dashboard-panel empty-state">Add a vehicle first.</div>;
    }

    if (providerCatalog.length === 0) {
      return <div className="dashboard-panel empty-state">No provider services are live yet.</div>;
    }

    if (filteredProviderOptions.length === 0) {
      return (
        <div className="dashboard-panel empty-state">
          No providers currently offer{' '}
          {serviceTypeOptions.find((item) => item.code === serviceFilter)?.label.toLowerCase()}.
        </div>
      );
    }

    return (
      <form className="dashboard-panel stack" onSubmit={handleSubmitRoadsideRequest}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Roadside request</p>
            <h3>Simple, fast request</h3>
          </div>
        </div>

        <div className="service-toggle-row">
          {serviceTypeOptions.map((option) => (
            <button
              key={option.code}
              className={serviceFilter === option.code ? 'chip-active' : 'chip'}
              type="button"
              onClick={() => setServiceFilter(option.code)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label>
            <span>Vehicle</span>
            <select
              value={roadsideForm.vehicleId}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, vehicleId: event.target.value })
              }
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.nickname} • {vehicle.registrationNumber}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Provider</span>
            <select
              value={roadsideForm.providerServiceId}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, providerServiceId: event.target.value })
              }
            >
              {filteredProviderOptions.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.providerName} • {service.serviceName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Distance km</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={roadsideForm.distanceKm}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, distanceKm: event.target.value })
              }
            />
          </label>
          <label>
            <span>Address</span>
            <input
              value={roadsideForm.address}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, address: event.target.value })
              }
            />
          </label>
          <label>
            <span>Latitude</span>
            <input
              value={roadsideForm.latitude}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, latitude: event.target.value })
              }
            />
          </label>
          <label>
            <span>Longitude</span>
            <input
              value={roadsideForm.longitude}
              onChange={(event) =>
                setRoadsideForm({ ...roadsideForm, longitude: event.target.value })
              }
            />
          </label>
        </div>

        <section className="provider-option-grid">
          {filteredProviderOptions.map((service) => (
            <button
              key={service.id}
              type="button"
              className={
                roadsideForm.providerServiceId === service.id
                  ? 'provider-option-card provider-option-card-active'
                  : 'provider-option-card'
              }
              onClick={() =>
                setRoadsideForm({
                  ...roadsideForm,
                  providerServiceId: service.id,
                })
              }
            >
              <div
                className="provider-option-media"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0.48)), url(${getServiceImageUrl(service)})`,
                }}
              >
                <span>{serviceTypeOptions.find((item) => item.code === service.serviceCode)?.label}</span>
              </div>
              <div className="provider-option-copy">
                <strong>{service.providerName}</strong>
                <p>{service.serviceName}</p>
                <div className="provider-option-price">
                  <span>{formatCurrency(service.basePriceKsh)}</span>
                  <span>{formatCurrency(service.pricePerKmKsh)}/km</span>
                </div>
              </div>
            </button>
          ))}
        </section>

        <button className="ghost-button" type="button" onClick={handleUseCurrentLocation}>
          Use current location
        </button>

        {selectedProviderService?.serviceCode === 'fuel_delivery' ? (
          <div className="soft-block">
            <div className="service-toggle-row">
              {fuelLiterOptions.map((litres) => (
                <button
                  key={litres}
                  className={roadsideForm.fuelLitres === String(litres) ? 'chip-active' : 'chip'}
                  type="button"
                  onClick={() =>
                    setRoadsideForm({
                      ...roadsideForm,
                      fuelLitres: String(litres),
                      customFuelLitres: '',
                    })
                  }
                >
                  {litres}L
                </button>
              ))}
              <button
                className={roadsideForm.fuelLitres === 'custom' ? 'chip-active' : 'chip'}
                type="button"
                onClick={() => setRoadsideForm({ ...roadsideForm, fuelLitres: 'custom' })}
              >
                Custom
              </button>
            </div>

            {roadsideForm.fuelLitres === 'custom' ? (
              <label>
                <span>Custom litres</span>
                <input
                  type="number"
                  min="1"
                  value={roadsideForm.customFuelLitres}
                  onChange={(event) =>
                    setRoadsideForm({ ...roadsideForm, customFuelLitres: event.target.value })
                  }
                />
              </label>
            ) : null}

            <div className="form-grid">
              <label>
                <span>Fuel type</span>
                <select
                  value={roadsideForm.fuelType}
                  onChange={(event) =>
                    setRoadsideForm({ ...roadsideForm, fuelType: event.target.value })
                  }
                >
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                </select>
              </label>
              {roadsideForm.fuelType === 'gasoline' ? (
                <label>
                  <span>Grade</span>
                  <select
                    value={roadsideForm.gasolineGrade}
                    onChange={(event) =>
                      setRoadsideForm({ ...roadsideForm, gasolineGrade: event.target.value })
                    }
                  >
                    <option value="regular">Regular</option>
                    <option value="vpower">V-Power</option>
                  </select>
                </label>
              ) : null}
            </div>
          </div>
        ) : null}

        <label>
          <span>Landmark</span>
          <input
            value={roadsideForm.landmark}
            onChange={(event) => setRoadsideForm({ ...roadsideForm, landmark: event.target.value })}
          />
        </label>
        <label>
          <span>Notes</span>
          <textarea
            value={roadsideForm.notes}
            onChange={(event) => setRoadsideForm({ ...roadsideForm, notes: event.target.value })}
          />
        </label>

        <div className="estimate-band">
          <span>Estimated total</span>
          <strong>{formatCurrency(totalEstimate || deliveryEstimate)}</strong>
          <p>
            {selectedProviderService?.serviceCode === 'fuel_delivery'
              ? `Fuel ${formatCurrency(fuelEstimate)} + delivery ${formatCurrency(deliveryEstimate)}`
              : `Base ${formatCurrency(selectedProviderService?.basePriceKsh)} + ${formatCurrency(selectedProviderService?.pricePerKmKsh)}/km`}
          </p>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit request'}
        </button>
      </form>
    );
  }

  function renderProviderServiceList() {
    return (
      <section className="dashboard-panel stack">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Published</p>
            <h3>Service catalog</h3>
          </div>
          <button
            className="primary-cta"
            type="button"
            onClick={() => {
              setEditingProviderServiceId('');
              setProviderServiceForm(initialProviderService);
              setShowProviderServiceComposer((current) => !current);
            }}
          >
            {showProviderServiceComposer ? 'Hide form' : 'Add service'}
          </button>
        </div>

        {showProviderServiceComposer ? (
          <div className="provider-service-composer">{renderProviderServicePanel()}</div>
        ) : null}

        {providerServices.length === 0 ? (
          <div className="empty-state">No services published yet. Click Add service to create your first service.</div>
        ) : (
          <div className="provider-manage-grid">
            {providerServices.map((service) => (
              <article className="provider-manage-card" key={service.id}>
                <div
                  className="provider-manage-card-media"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.42)), url(${getServiceImageUrl(service)})`,
                  }}
                >
                  <span className="provider-manage-pill">
                    {serviceTypeOptions.find((option) => option.code === service.serviceCode)?.label}
                  </span>
                </div>

                <div className="provider-manage-card-copy">
                  <div className="provider-manage-card-head">
                    <strong>{service.serviceName}</strong>
                    <div className="provider-manage-prices">
                      <span>Base {formatCurrency(service.basePriceKsh)}</span>
                      <span>{formatCurrency(service.pricePerKmKsh)}/km</span>
                    </div>
                  </div>

                  <p>{service.description || 'No description yet.'}</p>

                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setEditingProviderServiceId(service.id);
                      setProviderServiceForm({
                        serviceName: service.serviceName,
                        serviceCode: service.serviceCode,
                        basePriceKsh: String(service.basePriceKsh),
                        pricePerKmKsh: String(service.pricePerKmKsh),
                        description: service.description ?? '',
                        gasolineRegularPrice: service.fuelPricing?.gasoline?.regular
                          ? String(service.fuelPricing.gasoline.regular)
                          : '',
                        gasolineVPowerPrice: service.fuelPricing?.gasoline?.vpower
                          ? String(service.fuelPricing.gasoline.vpower)
                          : '',
                        dieselPrice: service.fuelPricing?.diesel?.standard
                          ? String(service.fuelPricing.diesel.standard)
                          : '',
                      });
                      setShowProviderServiceComposer(true);
                      setMessage(`Editing ${service.serviceName}.`);
                    }}
                  >
                    Edit service
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderHistoryPanel() {
    if (requests.length === 0) {
      return <div className="dashboard-panel empty-state">No requests yet.</div>;
    }

    return (
      <section className="dashboard-panel stack">
        <div className="panel-head">
          <div>
            <p className="eyebrow">History</p>
            <h3>Request timeline</h3>
          </div>
        </div>
        <div className="card-list">
          {requests.map((roadsideRequest) => (
            <article className="info-card" key={roadsideRequest.id}>
              <div className="info-top">
                <strong>{roadsideRequest.issueType}</strong>
                <span className="mini-pill">{roadsideRequest.status.replaceAll('_', ' ')}</span>
              </div>
              <p>{roadsideRequest.address}</p>
              <div className="info-meta">
                <span>{roadsideRequest.providerName}</span>
                <span>{roadsideRequest.distanceKm} km</span>
                <span>{roadsideRequest.etaMinutes} min ETA</span>
                <span>{formatCurrency(roadsideRequest.estimatedPriceKsh)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderProfilePanel() {
    if (user?.accountType !== 'provider') {
      return (
        <section className="profile-grid">
          <form className="dashboard-panel stack" onSubmit={handleSaveProfile}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">Profile</p>
                <h3>Account details</h3>
              </div>
            </div>
            <div className="form-grid">
              <label>
                <span>Display name</span>
                <input
                  value={profileSettings.account.displayName}
                  onChange={(event) =>
                    handleProfileFieldChange('account', 'displayName', event.target.value)
                  }
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  value={profileSettings.account.email}
                  onChange={(event) =>
                    handleProfileFieldChange('account', 'email', event.target.value)
                  }
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  placeholder="+254..."
                  value={profileSettings.account.phone}
                  onChange={(event) =>
                    handleProfileFieldChange('account', 'phone', event.target.value)
                  }
                />
              </label>
              <label>
                <span>Location</span>
                <input
                  value={profileSettings.account.location}
                  onChange={(event) =>
                    handleProfileFieldChange('account', 'location', event.target.value)
                  }
                />
              </label>
            </div>
            <button className="primary-cta" type="submit">
              Save profile
            </button>
          </form>
        </section>
      );
    }

    return (
      <section className="profile-stack-v2">
        <form className="dashboard-panel stack" onSubmit={handleSaveProfile}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">My profile</p>
              <h3>Business identity and operations</h3>
            </div>
          </div>
          {message ? <div className="status-banner">{message}</div> : null}

          <div className="form-grid">
            <label>
              <span>Business display name</span>
              <input
                value={profileSettings.account.displayName}
                onChange={(event) =>
                  handleProfileFieldChange('account', 'displayName', event.target.value)
                }
              />
            </label>
            <label>
              <span>Business legal name</span>
              <input
                value={profileSettings.account.company}
                onChange={(event) =>
                  handleProfileFieldChange('account', 'company', event.target.value)
                }
              />
            </label>
            <label>
              <span>Primary email</span>
              <input
                value={profileSettings.account.email}
                onChange={(event) => handleProfileFieldChange('account', 'email', event.target.value)}
              />
            </label>
            <label>
              <span>Primary phone</span>
              <input
                placeholder="+254..."
                value={profileSettings.business.contacts.primaryPhone}
                onChange={(event) =>
                  handleBusinessNestedFieldChange('contacts', 'primaryPhone', event.target.value)
                }
              />
            </label>
          </div>

          <label>
            <span>Business brief</span>
            <textarea
              value={profileSettings.business.brief}
              placeholder="Describe your garage, specialties, and why drivers trust you."
              onChange={(event) => handleProfileFieldChange('business', 'brief', event.target.value)}
            />
          </label>

          <section className="soft-block profile-soft-block">
            <div className="panel-head compact">
              <div>
                <p className="eyebrow">Locations</p>
                <h3>Business geolocation points</h3>
              </div>
              <button className="secondary-cta" type="button" onClick={addBusinessLocation}>
                Add location
              </button>
            </div>

            <div className="location-grid-v2">
              {(profileSettings.business.locations || []).map((location, index) => (
                <article className="location-card-v2" key={`${location.branchName}-${index}`}>
                  <div className="form-grid">
                    <label>
                      <span>Branch type</span>
                      <select
                        value={location.branchName}
                        onChange={(event) =>
                          updateBusinessLocation(index, 'branchName', event.target.value)
                        }
                      >
                        {branchTypeOptions.map((branchType) => (
                          <option key={branchType} value={branchType}>
                            {branchType}
                          </option>
                        ))}
                        {!branchTypeOptions.includes(location.branchName) ? (
                          <option value={location.branchName}>{location.branchName}</option>
                        ) : null}
                      </select>
                    </label>
                    <label>
                      <span>Country</span>
                      <select
                        value={location.countryCode || 'KE'}
                        onChange={(event) =>
                          updateBusinessLocation(index, 'countryCode', event.target.value)
                        }
                      >
                        {countryOptions.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Address</span>
                      <div className="location-autocomplete-v2">
                        <input
                          placeholder="Search business or building name"
                          value={location.address}
                          onChange={(event) => {
                            const value = event.target.value;
                            updateBusinessLocation(index, 'address', value);
                            scheduleBusinessLocationSuggestions(index, value);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              const existingTimer = locationSuggestionTimeoutsRef.current[index];
                              if (existingTimer) {
                                clearTimeout(existingTimer);
                                delete locationSuggestionTimeoutsRef.current[index];
                              }
                              void searchBusinessLocationSuggestions(index, event.currentTarget.value);
                            }
                          }}
                        />
                        {locationSearchingIndex === index ? (
                          <div className="location-hint-v2">Searching location...</div>
                        ) : null}
                        {(locationSuggestionsByIndex[index] || []).length > 0 ? (
                          <div className="location-suggestions-v2" role="listbox">
                            {(locationSuggestionsByIndex[index] || []).map((suggestion) => (
                              <button
                                key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}
                                type="button"
                                className="location-suggestion-item-v2"
                                onClick={() => selectBusinessLocationSuggestion(index, suggestion)}
                              >
                                <span>{suggestion.label}</span>
                                {suggestion.formattedAddress ? (
                                  <small>{suggestion.formattedAddress}</small>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </label>
                    <label>
                      <span>Town</span>
                      <input
                        value={location.town || ''}
                        onChange={(event) =>
                          updateBusinessLocation(index, 'town', event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Road</span>
                      <input
                        value={location.road || ''}
                        onChange={(event) =>
                          updateBusinessLocation(index, 'road', event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Nearest landmark</span>
                      <input
                        value={location.landmark || ''}
                        onChange={(event) =>
                          updateBusinessLocation(index, 'landmark', event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Google Maps link</span>
                      <input
                        placeholder="https://maps.app.goo.gl/..."
                        value={location.mapUrl || ''}
                        onChange={(event) =>
                          updateBusinessLocation(index, 'mapUrl', event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div className="location-actions-v2">
                    <button
                      className="secondary-cta"
                      type="button"
                      disabled={locationResolvingIndex === index}
                      onClick={() => resolveBusinessLocation(index)}
                    >
                      {locationResolvingIndex === index ? 'Resolving...' : 'Resolve location from map'}
                    </button>
                    {location.latitude && location.longitude ? (
                      <span className="location-meta-v2">
                        Heatmap point ready: {location.latitude}, {location.longitude}
                      </span>
                    ) : (
                      <span className="location-meta-v2">Heatmap point will auto-fill after resolve.</span>
                    )}
                  </div>
                  {(profileSettings.business.locations || []).length > 1 ? (
                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() => removeBusinessLocation(index)}
                    >
                      Remove location
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="soft-block profile-soft-block">
            <div className="panel-head compact">
              <div>
                <p className="eyebrow">Capabilities</p>
                <h3>Services and supported vehicles</h3>
              </div>
            </div>

            <div className="tag-cloud-v2">
              {providerServiceCatalogOptions.map((service) => (
                <button
                  key={service}
                  type="button"
                  className={
                    profileSettings.business.offeredServices.includes(service)
                      ? 'chip-active'
                      : 'chip'
                  }
                  onClick={() => toggleBusinessListField('offeredServices', service)}
                >
                  {service}
                </button>
              ))}
            </div>

            <div className="tag-cloud-v2">
              {providerVehicleTypeOptions.map((vehicleType) => (
                <button
                  key={vehicleType}
                  type="button"
                  className={
                    profileSettings.business.supportedVehicleTypes.includes(vehicleType)
                      ? 'chip-active'
                      : 'chip'
                  }
                  onClick={() => toggleBusinessListField('supportedVehicleTypes', vehicleType)}
                >
                  {vehicleType}
                </button>
              ))}
            </div>
          </section>

          <section className="soft-block profile-soft-block">
            <div className="panel-head compact">
              <div>
                <p className="eyebrow">KYC</p>
                <h3>Registration and compliance documents</h3>
              </div>
            </div>
            <div className="form-grid">
              <label>
                <span>KRA PIN</span>
                <input
                  value={profileSettings.business.kyc.kraPin}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('kyc', 'kraPin', event.target.value)
                  }
                />
              </label>
              <label>
                <span>Certificate of incorporation</span>
                <input
                  value={profileSettings.business.kyc.certificateOfIncorporation}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange(
                      'kyc',
                      'certificateOfIncorporation',
                      event.target.value,
                    )
                  }
                />
              </label>
              <label>
                <span>Business permit number</span>
                <input
                  value={profileSettings.business.kyc.businessPermitNumber}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('kyc', 'businessPermitNumber', event.target.value)
                  }
                />
              </label>
              <label>
                <span>Tax compliance certificate</span>
                <input
                  value={profileSettings.business.kyc.taxComplianceCertificate}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange(
                      'kyc',
                      'taxComplianceCertificate',
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section className="soft-block profile-soft-block">
            <div className="panel-head compact">
              <div>
                <p className="eyebrow">Contacts and socials</p>
                <h3>Reachability and channels</h3>
              </div>
            </div>
            <div className="form-grid">
              <label>
                <span>Support phone</span>
                <input
                  value={profileSettings.business.contacts.supportPhone}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('contacts', 'supportPhone', event.target.value)
                  }
                />
              </label>
              <label>
                <span>Support email</span>
                <input
                  value={profileSettings.business.contacts.supportEmail}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('contacts', 'supportEmail', event.target.value)
                  }
                />
              </label>
              <label>
                <span>Website</span>
                <input
                  value={profileSettings.business.contacts.website}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('contacts', 'website', event.target.value)
                  }
                />
              </label>
              <label>
                <span>WhatsApp</span>
                <input
                  value={profileSettings.business.contacts.whatsapp}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('contacts', 'whatsapp', event.target.value)
                  }
                />
              </label>
              <label>
                <span>Instagram</span>
                <input
                  value={profileSettings.business.contacts.instagram}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('contacts', 'instagram', event.target.value)
                  }
                />
              </label>
              <label>
                <span>Facebook</span>
                <input
                  value={profileSettings.business.contacts.facebook}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('contacts', 'facebook', event.target.value)
                  }
                />
              </label>
              <label>
                <span>LinkedIn</span>
                <input
                  value={profileSettings.business.contacts.linkedin}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('contacts', 'linkedin', event.target.value)
                  }
                />
              </label>
              <label>
                <span>X (Twitter)</span>
                <input
                  value={profileSettings.business.contacts.x}
                  onChange={(event) =>
                    handleBusinessNestedFieldChange('contacts', 'x', event.target.value)
                  }
                />
              </label>
            </div>
          </section>

          <section className="soft-block profile-soft-block">
            <div className="panel-head compact">
              <div>
                <p className="eyebrow">Vendor network</p>
                <h3>Provider-to-provider subcontracting workflow</h3>
              </div>
            </div>
            <label>
              <span>Request policy</span>
              <select
                value={profileSettings.vendors.requestPolicy}
                onChange={(event) => handleProfileFieldChange('vendors', 'requestPolicy', event.target.value)}
              >
                <option value="approval_required">Approval required (recommended)</option>
                <option value="auto_approve">Auto-approve trusted providers</option>
              </select>
            </label>
            <div className="billing-strip">
              <article className="billing-card">
                <span>Pending vendor requests</span>
                <strong>{profileSettings.vendors.pendingRequests.length}</strong>
              </article>
              <article className="billing-card">
                <span>Active vendor partners</span>
                <strong>{profileSettings.vendors.activePartners.length}</strong>
              </article>
              <article className="billing-card">
                <span>Subcontractor mode</span>
                <strong>
                  {profileSettings.vendors.requestPolicy === 'approval_required'
                    ? 'Manual approval'
                    : 'Auto approval'}
                </strong>
              </article>
            </div>
            <p className="section-note">
              Next step recommendation: allow providers to send vendor requests to other providers,
              then permit job subcontracting only after explicit acceptance and KYC checks.
            </p>
          </section>

          <button className="primary-cta" type="submit">
            Save my profile
          </button>
        </form>
      </section>
    );
  }

  function renderSettingsPanel() {
    return (
      <section className="settings-grid-v2">
        <section className="dashboard-panel stack">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Notifications</p>
              <h3>Alert settings</h3>
            </div>
          </div>
          <div className="toggle-list">
            {[
              ['emailAlerts', 'Email alerts'],
              ['smsAlerts', 'SMS alerts'],
              ['pushAlerts', 'Push alerts'],
              ['marketing', 'Product updates'],
            ].map(([key, label]) => (
              <label className="toggle-row" key={key}>
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={profileSettings.notifications[key]}
                  onChange={(event) =>
                    handleProfileFieldChange('notifications', key, event.target.checked)
                  }
                />
              </label>
            ))}
          </div>
        </section>

        <section className="dashboard-panel stack">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Preferences</p>
              <h3>Experience and theme</h3>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>Theme</span>
              <select
                value={profileSettings.preferences.theme}
                onChange={(event) => handlePreferenceThemeChange(event.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
            <label>
              <span>Language</span>
              <select
                value={profileSettings.preferences.language}
                onChange={(event) =>
                  handleProfileFieldChange('preferences', 'language', event.target.value)
                }
              >
                <option value="English">English</option>
                <option value="Swahili">Swahili</option>
              </select>
            </label>
          </div>
          <label className="toggle-row">
            <span>Compact mode</span>
            <input
              type="checkbox"
              checked={profileSettings.preferences.compactMode}
              onChange={(event) =>
                handleProfileFieldChange('preferences', 'compactMode', event.target.checked)
              }
            />
          </label>
        </section>

        <form className="dashboard-panel stack" onSubmit={handlePasswordReset}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">Security</p>
              <h3>Password reset</h3>
            </div>
          </div>
          <label>
            <span>Current password</span>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
              }
            />
          </label>
          <label>
            <span>New password</span>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm({ ...passwordForm, newPassword: event.target.value })
              }
            />
          </label>
          <label>
            <span>Confirm password</span>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
              }
            />
          </label>
          <button type="submit">Update password</button>
        </form>

        <section className="dashboard-panel stack">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Billing</p>
              <h3>Subscription and invoices</h3>
            </div>
          </div>
          <div className="billing-strip">
            <article className="billing-card">
              <span>Plan</span>
              <strong>{profileSettings.subscription.plan}</strong>
            </article>
            <article className="billing-card">
              <span>Status</span>
              <strong>{profileSettings.subscription.status}</strong>
            </article>
            <article className="billing-card">
              <span>Renewal</span>
              <strong>{profileSettings.subscription.renewalDate}</strong>
            </article>
          </div>
          <label>
            <span>Billing email</span>
            <input
              value={profileSettings.subscription.billingEmail}
              onChange={(event) =>
                handleProfileFieldChange('subscription', 'billingEmail', event.target.value)
              }
            />
          </label>
          <div className="billing-note">
            <strong>Invoices and payment methods</strong>
            <p>Recurring billing, receipts, and active subscriptions will connect here next.</p>
          </div>
        </section>
      </section>
    );
  }

  return (
    <main className="app-shell">
      {step === 'dashboard' && user ? (
        user.accountType === 'provider' ? renderProviderDashboard() : renderCustomerDashboard()
      ) : step === 'auth' || step === 'otp' ? (
        <section className="auth-page">{renderAuthPanel()}</section>
      ) : (
        <div className="entry-layout landing-entry">
          {renderLandingPanel()}
        </div>
      )}
    </main>
  );
}
