import { request } from './client';
import type { Vehicle } from '../types/vehicle';

export function listVehicles(baseUrl: string, token: string) {
  return request<Vehicle[]>(baseUrl, '/vehicles', undefined, 'GET', token);
}

export function createVehicle(baseUrl: string, token: string, body: Partial<Vehicle>) {
  return request<Vehicle>(baseUrl, '/vehicles', body, 'POST', token);
}

export function updateVehicle(
  baseUrl: string,
  token: string,
  vehicleId: string,
  body: Partial<Vehicle>,
) {
  return request<Vehicle>(baseUrl, `/vehicles/${vehicleId}`, body, 'PATCH', token);
}

export function deleteVehicle(baseUrl: string, token: string, vehicleId: string) {
  return request(baseUrl, `/vehicles/${vehicleId}`, undefined, 'DELETE', token);
}
