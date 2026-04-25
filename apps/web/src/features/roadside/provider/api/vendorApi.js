import { request } from '../../../../shared/helpers';

export function fetchVendorNetwork(token) {
  return request('/vendors', undefined, 'GET', token);
}

export function acceptVendorRequest(token, requestId) {
  return request(`/vendors/requests/${requestId}/accept`, undefined, 'POST', token);
}

export function rejectVendorRequest(token, requestId) {
  return request(`/vendors/requests/${requestId}`, undefined, 'DELETE', token);
}
