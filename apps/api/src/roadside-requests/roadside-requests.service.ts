import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderServicesService } from '../provider-services/provider-services.service';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateRoadsideRequestDto } from './dto/create-roadside-request.dto';
import { RoadsideRequestEntity } from './roadside-request.entity';

export interface RoadsideRequest {
  id: string;
  userId: string;
  vehicleId: string;
  providerServiceId: string;
  providerId: string;
  providerName: string;
  issueType: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  notes?: string;
  fuelDetails?: {
    fuelType: 'gasoline' | 'diesel';
    litres: number;
    gasolineGrade?: 'regular' | 'vpower';
    fuelCostKsh: number;
    deliveryCostKsh: number;
  };
  status: 'searching' | 'provider_assigned' | 'in_progress' | 'completed' | 'cancelled';
  etaMinutes: number;
  estimatedPriceKsh: number;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  vehicle?: {
    id: string;
    nickname: string;
    make: string;
    model: string;
    registrationNumber: string;
    year: number;
  };
  createdAt: string;
}

type ProviderManagedStatus =
  | 'provider_assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

@Injectable()
export class RoadsideRequestsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly vehiclesService: VehiclesService,
    private readonly providerServicesService: ProviderServicesService,
    @InjectRepository(RoadsideRequestEntity)
    private readonly roadsideRequestsRepository: Repository<RoadsideRequestEntity>,
  ) {}

  async listByUser(userId: string) {
    const requests = await this.roadsideRequestsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(requests.map((request) => this.toRoadsideRequest(request)));
  }

  async listByProvider(providerId: string) {
    const requests = await this.roadsideRequestsRepository.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(requests.map((request) => this.toRoadsideRequest(request, true)));
  }

  async updateStatusByProvider(
    providerId: string,
    requestId: string,
    status: ProviderManagedStatus,
  ) {
    const request = await this.roadsideRequestsRepository.findOneBy({ id: requestId });

    if (!request) {
      throw new NotFoundException('Roadside request not found.');
    }

    if (request.providerId !== providerId) {
      throw new NotFoundException('Roadside request not found for this provider.');
    }

    if (request.status === status) {
      return this.toRoadsideRequest(request, true);
    }

    const allowedTransitions: Record<RoadsideRequestEntity['status'], ProviderManagedStatus[]> = {
      searching: ['provider_assigned', 'cancelled'],
      provider_assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[request.status].includes(status)) {
      throw new BadRequestException(
        `Invalid transition from ${request.status} to ${status}.`,
      );
    }

    request.status = status;

    const saved = await this.roadsideRequestsRepository.save(request);

    return this.toRoadsideRequest(saved, true);
  }

  async create(userId: string, dto: CreateRoadsideRequestDto) {
    const userVehicles = await this.vehiclesService.listByUser(userId);
    const vehicle = userVehicles.find((item) => item.id === dto.vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found for this user.');
    }

    const providerService = await this.providerServicesService.findById(dto.providerServiceId);

    if (!providerService) {
      throw new NotFoundException('Provider service not found.');
    }

    const fuelDetails = this.buildFuelDetails(dto, providerService);
    const estimatedPriceKsh =
      providerService.basePriceKsh +
      providerService.pricePerKmKsh * dto.distanceKm +
      (fuelDetails?.fuelCostKsh ?? 0);

    const request = this.roadsideRequestsRepository.create({
      userId,
      vehicleId: dto.vehicleId,
      providerServiceId: providerService.id,
      providerId: providerService.providerId,
      providerName: providerService.providerName,
      issueType: providerService.serviceName,
      distanceKm: dto.distanceKm,
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address.trim(),
      landmark: dto.landmark?.trim() || undefined,
      notes: dto.notes?.trim() || undefined,
      fuelDetails,
      status: 'searching',
      etaMinutes: this.estimateEta(providerService.serviceCode, dto.distanceKm),
      estimatedPriceKsh: Math.round(estimatedPriceKsh),
    });

    const saved = await this.roadsideRequestsRepository.save(request);

    return this.toRoadsideRequest(saved);
  }

  private estimateEta(serviceCode: string, distanceKm: number) {
    const distanceFactor = Math.ceil(distanceKm * 1.8);

    if (serviceCode === 'towing') return 24 + distanceFactor;
    if (serviceCode === 'fuel_delivery') return 18 + distanceFactor;
    return 12 + distanceFactor;
  }

  private buildFuelDetails(dto: CreateRoadsideRequestDto, providerService: ProviderServiceLike) {
    if (providerService.serviceCode !== 'fuel_delivery') {
      return undefined;
    }

    if (!dto.fuelLitres || !dto.fuelType) {
      throw new BadRequestException('Fuel litres and fuel type are required for fuel delivery.');
    }

    const fuelPrice =
      dto.fuelType === 'diesel'
        ? providerService.fuelPricing?.diesel?.standard
        : dto.gasolineGrade === 'vpower'
          ? providerService.fuelPricing?.gasoline?.vpower
          : providerService.fuelPricing?.gasoline?.regular;

    if (fuelPrice === undefined) {
      throw new BadRequestException('The selected fuel option is not available for this provider.');
    }

    if (dto.fuelType === 'gasoline' && !dto.gasolineGrade) {
      throw new BadRequestException('Gasoline grade is required for gasoline fuel requests.');
    }

    return {
      fuelType: dto.fuelType,
      litres: dto.fuelLitres,
      gasolineGrade: dto.fuelType === 'gasoline' ? dto.gasolineGrade : undefined,
      fuelCostKsh: Math.round(fuelPrice * dto.fuelLitres),
      deliveryCostKsh: Math.round(
        providerService.basePriceKsh + providerService.pricePerKmKsh * dto.distanceKm,
      ),
    };
  }

  private async toRoadsideRequest(
    request: RoadsideRequestEntity,
    includeCustomerAndVehicle = false,
  ): Promise<RoadsideRequest> {
    const normalizedRequest: RoadsideRequest = {
      ...request,
      distanceKm: Number(request.distanceKm),
      latitude: Number(request.latitude),
      longitude: Number(request.longitude),
      createdAt: request.createdAt.toISOString(),
    };

    if (!includeCustomerAndVehicle) {
      return normalizedRequest;
    }

    const [customer, vehicle] = await Promise.all([
      this.usersService.findById(request.userId),
      this.vehiclesService.findById(request.vehicleId),
    ]);

    return {
      ...normalizedRequest,
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          }
        : undefined,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            nickname: vehicle.nickname,
            make: vehicle.make,
            model: vehicle.model,
            registrationNumber: vehicle.registrationNumber,
            year: vehicle.year,
          }
        : undefined,
    };
  }
}

interface ProviderServiceLike {
  serviceCode: string;
  basePriceKsh: number;
  pricePerKmKsh: number;
  fuelPricing?: {
    gasoline?: {
      regular?: number;
      vpower?: number;
    };
    diesel?: {
      standard?: number;
    };
  };
}
