import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

export interface Vehicle {
  id: string;
  userId: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  color?: string;
  notes?: string;
  createdAt: string;
}

@Injectable()
export class VehiclesService {
  private readonly vehicles = new Map<string, Vehicle[]>();

  listByUser(userId: string) {
    return this.vehicles.get(userId) ?? [];
  }

  create(userId: string, dto: CreateVehicleDto) {
    const vehicle: Vehicle = {
      id: randomUUID(),
      userId,
      nickname: dto.nickname.trim(),
      make: dto.make.trim(),
      model: dto.model.trim(),
      year: dto.year,
      registrationNumber: dto.registrationNumber.trim().toUpperCase(),
      color: dto.color?.trim() || undefined,
      notes: dto.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const current = this.vehicles.get(userId) ?? [];
    current.push(vehicle);
    this.vehicles.set(userId, current);

    return vehicle;
  }
}
