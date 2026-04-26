import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleEntity } from './vehicle.entity';

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
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehiclesRepository: Repository<VehicleEntity>,
  ) {}

  async listByUser(userId: string) {
    const vehicles = await this.vehiclesRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    return vehicles.map((vehicle) => ({
      ...vehicle,
      createdAt: vehicle.createdAt.toISOString(),
    }));
  }

  async create(userId: string, dto: CreateVehicleDto) {
    const vehicle = this.vehiclesRepository.create({
      userId,
      nickname: dto.nickname.trim(),
      make: dto.make.trim(),
      model: dto.model.trim(),
      year: dto.year,
      registrationNumber: dto.registrationNumber.trim().toUpperCase(),
      color: dto.color?.trim() || undefined,
      notes: dto.notes?.trim() || undefined,
    });

    const saved = await this.vehiclesRepository.save(vehicle);

    return {
      ...saved,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async findById(vehicleId: string) {
    return this.vehiclesRepository.findOneBy({ id: vehicleId });
  }

  async findByIds(vehicleIds: string[]) {
    if (vehicleIds.length === 0) return [];
    return this.vehiclesRepository.findBy({ id: In(vehicleIds) });
  }

  async updateProfile(userId: string, vehicleId: string, profile: Record<string, unknown>) {
    const vehicle = await this.vehiclesRepository.findOneBy({ id: vehicleId, userId });
    if (!vehicle) throw new Error('Vehicle not found.');
    vehicle.profile = profile;
    const saved = await this.vehiclesRepository.save(vehicle);
    return { ...saved, createdAt: saved.createdAt.toISOString() };
  }
}
