import { request } from './client';

export interface LocationSuggestBody {
  query: string;
  countryCode?: string;
}

export interface LocationResolveBody {
  latitude?: number | string;
  longitude?: number | string;
  query?: string;
}

export function suggestLocations(
  baseUrl: string,
  token: string,
  body: LocationSuggestBody,
) {
  return request(baseUrl, '/locations/suggest', body, 'POST', token);
}

export function resolveLocation(
  baseUrl: string,
  token: string,
  body: LocationResolveBody,
) {
  return request(baseUrl, '/locations/resolve', body, 'POST', token);
}
