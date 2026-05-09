import { request } from './client';
import type { ProviderService } from '../types/provider';

export function listProviderServices(baseUrl: string, token: string) {
  return request<ProviderService[]>(baseUrl, '/provider-services', undefined, 'GET', token);
}

export function getServiceCatalog(baseUrl: string, token: string, query?: Record<string, string>) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  return request<ProviderService[]>(baseUrl, `/provider-services/catalog${qs}`, undefined, 'GET', token);
}

export function createProviderService(
  baseUrl: string,
  token: string,
  body: Partial<ProviderService>,
) {
  return request<ProviderService>(baseUrl, '/provider-services', body, 'POST', token);
}

export function bulkCreateProviderServices(
  baseUrl: string,
  token: string,
  serviceCatalogIds: string[],
) {
  return request(baseUrl, '/provider-services/bulk', { serviceCatalogIds }, 'POST', token);
}

export function updateProviderService(
  baseUrl: string,
  token: string,
  serviceId: string,
  body: Partial<ProviderService>,
) {
  return request<ProviderService>(baseUrl, `/provider-services/${serviceId}`, body, 'PUT', token);
}

export function deleteProviderService(baseUrl: string, token: string, serviceId: string) {
  return request(baseUrl, `/provider-services/${serviceId}`, undefined, 'DELETE', token);
}
