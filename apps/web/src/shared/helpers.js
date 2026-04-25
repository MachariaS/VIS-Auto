import { API_BASE, serviceImageByCode } from './constants';

export function getApiUrl(path) {
  return `${API_BASE}${path}`;
}

export async function request(path, body, method = 'POST', token, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      Array.isArray(data.message) ? data.message.join(', ') : data.message,
    );
    error.status = response.status;
    error.path = path;
    throw error;
  }

  return data;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function getSelectedFuelLitres(form) {
  return form.fuelLitres === 'custom'
    ? Number(form.customFuelLitres || 0)
    : Number(form.fuelLitres || 0);
}

export function getFuelUnitPrice(service, form) {
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

export function getServiceImageUrl(service) {
  if (!service) {
    return '/assets/other_services.jpeg';
  }

  return service.serviceImageUrl || serviceImageByCode[service.serviceCode] || '/assets/other_services.jpeg';
}

export function mergeUniqueList(list = [], additions = []) {
  return Array.from(new Set([...(list || []), ...(additions || [])])).filter(Boolean);
}

export function toVendorId(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeLocationQuery(query = '') {
  return query.trim().replace(/[\s,]+/g, ' ');
}

export function shouldLookupAfterWord(input = '') {
  return /[\s,]$/.test(input) && normalizeLocationQuery(input).length >= 3;
}

export function parseAddressParts(addressValue = '', placeName = '') {
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

export async function fallbackLocationSuggestions(query, countryCode = 'KE') {
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

export function extractGoogleMapsQuery(mapUrl = '') {
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

export function getDefaultProfile(user) {
  return {
    account: {
      displayName: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
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
      rejectedRequests: [],
    },
  };
}

export function mergeProfileSettings(user, ...sources) {
  const baseProfile = getDefaultProfile(user);
  const normalizedSources = sources.filter(Boolean);

  return normalizedSources.reduce(
    (current, nextSource) => ({
      ...current,
      ...nextSource,
      account: {
        ...baseProfile.account,
        ...current.account,
        ...nextSource.account,
      },
      notifications: {
        ...baseProfile.notifications,
        ...current.notifications,
        ...nextSource.notifications,
      },
      preferences: {
        ...baseProfile.preferences,
        ...current.preferences,
        ...nextSource.preferences,
      },
      subscription: {
        ...baseProfile.subscription,
        ...current.subscription,
        ...nextSource.subscription,
      },
      business: {
        ...baseProfile.business,
        ...current.business,
        ...nextSource.business,
        kyc: {
          ...baseProfile.business.kyc,
          ...current.business?.kyc,
          ...nextSource.business?.kyc,
        },
        contacts: {
          ...baseProfile.business.contacts,
          ...current.business?.contacts,
          ...nextSource.business?.contacts,
        },
        locations:
          nextSource.business?.locations?.length > 0
            ? nextSource.business.locations
            : current.business?.locations || baseProfile.business.locations,
        offeredServices: mergeUniqueList(
          baseProfile.business.offeredServices,
          nextSource.business?.offeredServices || current.business?.offeredServices,
        ),
        supportedVehicleTypes: mergeUniqueList(
          baseProfile.business.supportedVehicleTypes,
          nextSource.business?.supportedVehicleTypes || current.business?.supportedVehicleTypes,
        ),
      },
      vendors: {
        ...baseProfile.vendors,
        ...current.vendors,
        ...nextSource.vendors,
      },
    }),
    baseProfile,
  );
}
