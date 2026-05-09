export function normalizeLocationQuery(query = ''): string {
  return query.trim().replace(/[\s,]+/g, ' ');
}

export function shouldLookupAfterWord(input = ''): boolean {
  return /[\s,]$/.test(input) && normalizeLocationQuery(input).length >= 3;
}

export function parseAddressParts(
  addressValue = '',
  placeName = '',
): { road: string; town: string } {
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

export interface LocationSuggestion {
  name: string;
  address: string;
  lat: string;
  lng: string;
  town: string;
  road: string;
  landmark: string;
}

async function lookupNominatim(
  query: string,
  countryCode: string,
): Promise<any[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
  });
  if (countryCode) {
    params.set('countrycodes', countryCode.toLowerCase());
  }
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
  );
  if (!response.ok) return [];
  return response.json();
}

export async function fallbackLocationSuggestions(
  query: string,
  countryCode = 'KE',
): Promise<LocationSuggestion[]> {
  const normalized = normalizeLocationQuery(query || '');
  const segments = normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const candidateQueries = [
    normalized,
    segments[0] || '',
    segments.slice(1).join(', '),
    normalized
      .replace(/\b(garage|limited|ltd|company|consultants?)\b/gi, '')
      .trim(),
  ].filter((value, index, arr) => value && arr.indexOf(value) === index);

  let resolved: any[] = [];

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
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.address?.suburb ||
      item.address?.county ||
      '',
    road:
      item.address?.road ||
      item.address?.pedestrian ||
      item.address?.path ||
      '',
    landmark:
      item.address?.attraction ||
      item.address?.building ||
      item.address?.amenity ||
      item.address?.shop ||
      '',
  }));
}

export function extractGoogleMapsQuery(
  mapUrl = '',
): { query: string } | { latitude: string; longitude: string } | null {
  if (!mapUrl || typeof mapUrl !== 'string') return null;
  try {
    const url = new URL(mapUrl.trim());
    const q = url.searchParams.get('q') || url.searchParams.get('query');
    if (q) return { query: decodeURIComponent(q) };
    const atSegment = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atSegment) {
      return { latitude: atSegment[1], longitude: atSegment[2] };
    }
  } catch {
    return null;
  }
  return null;
}
