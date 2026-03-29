import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateRoadsideRequestDto } from './dto/create-roadside-request.dto';

export interface RoadsideRequest {
  id: string;
  userId: string;
  vehicleId: string;
  issueType: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  notes?: string;
  status: 'searching' | 'provider_assigned' | 'in_progress' | 'completed';
  etaMinutes: number;
  estimatedPriceKsh: number;
  createdAt: string;
}

@Injectable()
export class RoadsideRequestsService {
  private readonly requests = new Map<string, RoadsideRequest[]>();

  constructor(private readonly vehiclesService: VehiclesService) {}

  listByUser(userId: string) {
    return (this.requests.get(userId) ?? []).slice().reverse();
  }

  create(userId: string, dto: CreateRoadsideRequestDto) {
    const userVehicles = this.vehiclesService.listByUser(userId);
    const vehicle = userVehicles.find((item) => item.id === dto.vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found for this user.');
    }

    const request: RoadsideRequest = {
      id: randomUUID(),
      userId,
      vehicleId: dto.vehicleId,
      issueType: dto.issueType,
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address.trim(),
      landmark: dto.landmark?.trim() || undefined,
      notes: dto.notes?.trim() || undefined,
      status: 'searching',
      etaMinutes: this.estimateEta(dto.issueType),
      estimatedPriceKsh: this.estimatePrice(dto.issueType),
      createdAt: new Date().toISOString(),
    };

    const current = this.requests.get(userId) ?? [];
    current.push(request);
    this.requests.set(userId, current);

    return request;
  }

  private estimateEta(issueType: string) {
    const normalized = issueType.toLowerCase();

    if (normalized === 'towing') return 35;
    if (normalized === 'fuel delivery') return 24;
    return 18;
  }

  private estimatePrice(issueType: string) {
    const normalized = issueType.toLowerCase();

    if (normalized === 'towing') return 4500;
    if (normalized === 'fuel delivery') return 1800;
    if (normalized === 'battery jump') return 1500;
    return 1200;
  }
}
