import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderServicesService } from './services/provider-services.service';
import { UsersService } from '../../shared/users/users.service';
import { VehiclesService } from '../../shared/vehicles/vehicles.service';
import { CreateRoadsideRequestDto } from './dto/create-roadside-request.dto';
import { RoadsideRequestEntity } from './roadside-request.entity';
import { UpdateProviderLocationDto } from './dto/update-provider-location.dto';
import { NotificationsService } from '../notifications/notifications.service';

const JOB_STATUS_COPY: Record<string, { title: string; body: string }> = {
  provider_assigned: {
    title: 'Provider on the way',
    body: 'A provider has accepted your request and is heading to you.',
  },
  in_progress: {
    title: 'Service in progress',
    body: 'Your provider has arrived and the service has started.',
  },
  completed: {
    title: 'Service completed',
    body: 'Your service is complete. Thank you for using VIS Auto.',
  },
  cancelled: {
    title: 'Request cancelled',
    body: 'Your roadside request has been cancelled.',
  },
};

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
  providerLatitude?: number;
  providerLongitude?: number;
  providerLocationUpdatedAt?: string;
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

export interface RoadsideRequestTrackingStatus {
  id: string;
  userId: string;
  providerId: string;
  status: RoadsideRequest['status'];
  etaMinutes: number;
  address: string;
  latitude: number;
  longitude: number;
  providerName: string;
  issueType: string;
  providerBaseLat?: number;
  providerBaseLng?: number;
  providerLocation: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;
  updatedAt: string | null;
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
    private readonly notificationsService: NotificationsService,
    @InjectRepository(RoadsideRequestEntity)
    private readonly roadsideRequestsRepository: Repository<RoadsideRequestEntity>,
  ) {}

  async listByUser(userId: string) {
    const requests = await this.roadsideRequestsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return Promise.all(requests.map((request) => this.toRoadsideRequest(request)));
  }

  async listByProvider(providerId: string) {
    const requests = await this.roadsideRequestsRepository.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    if (requests.length === 0) return [];

    const userIds = [...new Set(requests.map((r) => r.userId))];
    const vehicleIds = [...new Set(requests.map((r) => r.vehicleId))];

    const [users, vehicles] = await Promise.all([
      this.usersService.findByIds(userIds),
      this.vehiclesService.findByIds(vehicleIds),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

    return requests.map((request) => this.toRoadsideRequestBatched(request, userMap, vehicleMap));
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

    const copy = JOB_STATUS_COPY[status];
    if (copy) {
      const customer = await this.usersService.findById(request.userId);
      void this.notificationsService.create({
        userId: request.userId,
        title: copy.title,
        body: `${copy.body} — ${request.issueType}`,
        type: 'job_update',
        refId: request.id,
        email: customer?.email,
        emailSubject: `VIS Auto — ${copy.title}`,
        emailHtml: buildJobStatusEmail(copy.title, copy.body, request.issueType),
      });
    }

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
      etaMinutes: this.estimateEta(providerService.catalogCode ?? '', dto.distanceKm),
      estimatedPriceKsh: Math.round(estimatedPriceKsh),
    });

    // Snapshot provider base location so the tracking map shows it immediately
    const providerUser = await this.usersService.findById(providerService.providerId);
    if (providerUser?.baseLat && providerUser?.baseLng) {
      request.providerBaseLat = Number(providerUser.baseLat);
      request.providerBaseLng = Number(providerUser.baseLng);
    }

    const saved = await this.roadsideRequestsRepository.save(request);

    // Fire-and-forget — do not await so the response returns immediately
    void this.usersService.findById(providerService.providerId).then((provider) =>
      this.notificationsService.create({
        userId: providerService.providerId,
        title: 'New job request',
        body: `${providerService.serviceName} — ${dto.address.trim()}`,
        type: 'job_update',
        refId: saved.id,
        email: provider?.email,
        emailSubject: 'VIS Auto — New job request',
        emailHtml: buildJobStatusEmail(
          'New job request',
          `A customer has requested ${providerService.serviceName} at ${dto.address.trim()}.`,
          providerService.serviceName,
        ),
      }),
    );

    return this.toRoadsideRequest(saved);
  }

  async getTrackingStatus(actorUserId: string, requestId: string): Promise<RoadsideRequestTrackingStatus> {
    const request = await this.roadsideRequestsRepository.findOneBy({ id: requestId });

    if (!request) {
      throw new NotFoundException('Roadside request not found.');
    }

    if (request.userId !== actorUserId && request.providerId !== actorUserId) {
      throw new NotFoundException('Roadside request not found.');
    }

    return this.toTrackingStatus(request);
  }

  async updateProviderLocation(
    providerId: string,
    requestId: string,
    dto: UpdateProviderLocationDto,
  ) {
    const request = await this.roadsideRequestsRepository.findOneBy({ id: requestId });

    if (!request) {
      throw new NotFoundException('Roadside request not found.');
    }

    if (request.providerId !== providerId) {
      throw new NotFoundException('Roadside request not found for this provider.');
    }

    if (request.status === 'completed' || request.status === 'cancelled') {
      throw new BadRequestException('Location updates are only available for active requests.');
    }

    request.providerLatitude = dto.latitude;
    request.providerLongitude = dto.longitude;
    request.providerLocationUpdatedAt = new Date();

    // Recalculate ETA from current provider position to customer (30 km/h avg city speed)
    if (
      request.latitude !== null && request.latitude !== undefined &&
      request.longitude !== null && request.longitude !== undefined
    ) {
      const remainingKm = this.haversineKm(
        dto.latitude,
        dto.longitude,
        Number(request.latitude),
        Number(request.longitude),
      );
      const freshEta = Math.max(1, Math.ceil(remainingKm * 2)); // 30 km/h ≈ 2 min/km
      request.etaMinutes = freshEta;
    } else if (dto.etaMinutes !== undefined) {
      request.etaMinutes = Math.round(dto.etaMinutes);
    }

    const saved = await this.roadsideRequestsRepository.save(request);

    return this.toTrackingStatus(saved);
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }

  private estimateEta(serviceCode: string, distanceKm: number) {
    const distanceFactor = Math.ceil(distanceKm * 1.8);

    if (serviceCode === 'towing') return 24 + distanceFactor;
    if (serviceCode === 'fuel_delivery') return 18 + distanceFactor;
    return 12 + distanceFactor;
  }

  private buildFuelDetails(dto: CreateRoadsideRequestDto, providerService: ProviderServiceLike) {
    const code = providerService.catalogCode ?? providerService.serviceCode ?? '';
    if (code !== 'fuel_delivery') {
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
      providerLatitude:
        request.providerLatitude === null || request.providerLatitude === undefined
          ? undefined
          : Number(request.providerLatitude),
      providerLongitude:
        request.providerLongitude === null || request.providerLongitude === undefined
          ? undefined
          : Number(request.providerLongitude),
      providerLocationUpdatedAt: request.providerLocationUpdatedAt?.toISOString(),
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

  private toRoadsideRequestBatched(
    request: RoadsideRequestEntity,
    userMap: Map<string, { id: string; name: string; email: string; phone?: string }>,
    vehicleMap: Map<string, { id: string; nickname: string; make: string; model: string; registrationNumber: string; year: number }>,
  ): RoadsideRequest {
    const base = {
      ...request,
      distanceKm: Number(request.distanceKm),
      latitude: Number(request.latitude),
      longitude: Number(request.longitude),
      providerLatitude: request.providerLatitude == null ? undefined : Number(request.providerLatitude),
      providerLongitude: request.providerLongitude == null ? undefined : Number(request.providerLongitude),
      providerLocationUpdatedAt: request.providerLocationUpdatedAt?.toISOString(),
      createdAt: request.createdAt.toISOString(),
    };
    const customer = userMap.get(request.userId);
    const vehicle = vehicleMap.get(request.vehicleId);
    return {
      ...base,
      customer: customer ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } : undefined,
      vehicle: vehicle ? { id: vehicle.id, nickname: vehicle.nickname, make: vehicle.make, model: vehicle.model, registrationNumber: vehicle.registrationNumber, year: vehicle.year } : undefined,
    };
  }

  private toTrackingStatus(request: RoadsideRequestEntity): RoadsideRequestTrackingStatus {
    return {
      id: request.id,
      userId: request.userId,
      providerId: request.providerId,
      status: request.status,
      etaMinutes: Number(request.etaMinutes),
      address: request.address,
      latitude: Number(request.latitude),
      longitude: Number(request.longitude),
      providerName: request.providerName,
      issueType: request.issueType,
      providerBaseLat: request.providerBaseLat ? Number(request.providerBaseLat) : undefined,
      providerBaseLng: request.providerBaseLng ? Number(request.providerBaseLng) : undefined,
      providerLocation:
        request.providerLatitude === null ||
        request.providerLatitude === undefined ||
        request.providerLongitude === null ||
        request.providerLongitude === undefined ||
        !request.providerLocationUpdatedAt
          ? null
          : {
              latitude: Number(request.providerLatitude),
              longitude: Number(request.providerLongitude),
              updatedAt: request.providerLocationUpdatedAt.toISOString(),
            },
      updatedAt: request.providerLocationUpdatedAt?.toISOString() || null,
    };
  }
}

interface ProviderServiceLike {
  serviceCode?: string;
  catalogCode?: string;
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

function buildJobStatusEmail(title: string, body: string, jobType: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="font-size:20px;color:#1f2f25;margin:0 0 8px">${title}</h2>
      <p style="color:#5b6c62;margin:0 0 16px">${body}</p>
      <div style="background:#f6f8f6;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#8a9a90">Service type</p>
        <strong style="color:#1f2f25">${jobType}</strong>
      </div>
      <p style="color:#8a9a90;font-size:13px;margin:0">
        Open the VIS Auto app to view full details or contact your provider.
      </p>
    </div>
  `;
}
