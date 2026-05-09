import { request } from './client';
import type { RoadsideRequest, TrackingStatus } from '../types/roadside';

export function listCustomerRequests(baseUrl: string, token: string) {
  return request<RoadsideRequest[]>(baseUrl, '/roadside-requests', undefined, 'GET', token);
}

export function listProviderRequests(baseUrl: string, token: string) {
  return request<RoadsideRequest[]>(baseUrl, '/roadside-requests/provider', undefined, 'GET', token);
}

export function createRequest(
  baseUrl: string,
  token: string,
  body: Partial<RoadsideRequest>,
) {
  return request<RoadsideRequest>(baseUrl, '/roadside-requests', body, 'POST', token);
}

export function getRequestStatus(
  baseUrl: string,
  token: string,
  requestId: string,
  signal?: AbortSignal,
) {
  return request<TrackingStatus>(
    baseUrl,
    `/roadside-requests/${requestId}/status`,
    undefined,
    'GET',
    token,
    signal,
  );
}

export function updateRequestStatus(
  baseUrl: string,
  token: string,
  requestId: string,
  body: { status: string },
) {
  return request(baseUrl, `/roadside-requests/${requestId}/status`, body, 'PATCH', token);
}
