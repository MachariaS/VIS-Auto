import { API_BASE, serviceImageByCode } from './constants';
import { request as coreRequest } from '@vis/core';

// Re-export all shared logic from core (formatCurrency, profile utils, location utils, etc.)
export * from '@vis/core';

// Web-compatible request: keeps existing call sites unchanged (path first, not baseUrl first)
export function request(path, body, method = 'POST', token, signal) {
  return coreRequest(API_BASE, path, body, method, token, signal);
}

export function getApiUrl(path) {
  return `${API_BASE}${path}`;
}

// getServiceImageUrl is web-specific because it references /assets/ file paths
export function getServiceImageUrl(service) {
  if (!service) {
    return '/assets/other_services.jpeg';
  }
  const code = service.catalogCode || service.serviceCode;
  return (
    service.serviceImageUrl ||
    serviceImageByCode[code] ||
    '/assets/other_services.jpeg'
  );
}
