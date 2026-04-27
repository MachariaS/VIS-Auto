import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCatalogService } from '../../service-catalog/service-catalog.service';
import { UsersService } from '../../../shared/users/users.service';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { ProviderServiceEntity, ServiceVisibility } from './provider-service.entity';
import { UserEntity } from '../../../shared/users/user.entity';

export interface ProviderService {
  id: string;
  providerId: string;
  providerName: string;
  serviceCatalogId?: string;
  catalogCode?: string;
  serviceCode?: string;
  providerBaseLat?: number | null;
  providerBaseLng?: number | null;
  serviceName: string;
  serviceCategory?: string;
  serviceImageUrl?: string;
  visibility: ServiceVisibility;
  useForEstimation: boolean;
  isAcceptingJobs: boolean;
  maxRadiusKm?: number;
  basePriceKsh: number;
  pricePerKmKsh: number;
  description?: string;
  fuelPricing?: { gasoline?: { regular?: number; vpower?: number }; diesel?: { standard?: number } };
  createdAt: string;
}

@Injectable()
export class ProviderServicesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly catalogService: ServiceCatalogService,
    @InjectRepository(ProviderServiceEntity)
    private readonly repo: Repository<ProviderServiceEntity>,
  ) {}

  async listByProvider(providerId: string) {
    const services = await this.repo.find({ where: { providerId }, order: { createdAt: 'DESC' } });
    return services.map((s) => this.toDto(s));
  }

  private readonly logger = new Logger(ProviderServicesService.name);

  async listAll(customerLat?: number, customerLng?: number) {
    try {
      const services = await this.repo
        .createQueryBuilder('ps')
        .innerJoin(UserEntity, 'u', 'u.id = ps."providerId"')
        .where('u."isOnline" = true')
        .andWhere('ps."isAcceptingJobs" = true')
        .andWhere('ps.visibility = :v', { v: 'public' })
        .andWhere('ps."basePriceKsh" > 0')
        .orderBy('ps."createdAt"', 'DESC')
        .getMany();

      // Batch-load provider base locations for radius filtering
      const providerIds = [...new Set(services.map((s) => s.providerId))];
      const providers = await this.usersService.findByIds(providerIds);
      const providerMap = new Map(providers.map((p) => [p.id, p as unknown as { baseLat?: number; baseLng?: number }]));

      const dtos = services.map((s) => {
        const prov = providerMap.get(s.providerId);
        return this.toDto(s, prov?.baseLat ?? null, prov?.baseLng ?? null);
      });

      // Radius filter: only exclude if provider has a base location AND customer is outside maxRadius
      if (customerLat && customerLng) {
        return dtos.filter((s) => {
          if (!s.providerBaseLat || !s.providerBaseLng || !s.maxRadiusKm) return true;
          const dist = this.haversineKm(customerLat, customerLng, s.providerBaseLat, s.providerBaseLng);
          return dist <= s.maxRadiusKm;
        });
      }

      return dtos;
    } catch (err) {
      this.logger.warn('listAll JOIN failed, using fallback filter', err?.message);
      const services = await this.repo.find({
        where: { isAcceptingJobs: true, visibility: 'public' as ServiceVisibility },
        order: { createdAt: 'DESC' },
      });
      return services.filter((s) => s.basePriceKsh > 0).map((s) => this.toDto(s));
    }
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }

  async bulkCreate(providerId: string, serviceCatalogIds: string[]) {
    const provider = await this.validateProviderAccount(providerId);
    if (!serviceCatalogIds.length) throw new BadRequestException('At least one service must be selected.');

    const existing = await this.repo.find({ where: { providerId } });
    const existingCatalogIds = new Set(existing.map((s) => s.serviceCatalogId).filter(Boolean));

    const results: ProviderService[] = [];

    for (const catalogId of serviceCatalogIds) {
      if (existingCatalogIds.has(catalogId)) continue;

      const catalogEntry = await this.catalogService.findById(catalogId);
      if (!catalogEntry) throw new NotFoundException(`Catalog entry ${catalogId} not found.`);

      const service = this.repo.create({
        providerId,
        providerName: provider.name,
        serviceCatalogId: catalogId,
        catalogCode: catalogEntry.code,
        serviceName: catalogEntry.name,
        serviceCategory: catalogEntry.category,
        basePriceKsh: 0,
        pricePerKmKsh: 0,
        visibility: 'public',
        useForEstimation: true,
        isAcceptingJobs: true,
      });

      const saved = await this.repo.save(service);
      results.push(this.toDto(saved));
    }

    return results;
  }

  async create(providerId: string, dto: CreateProviderServiceDto) {
    const provider = await this.validateProviderAccount(providerId);
    this.validateFuelPricing(dto);

    const service = this.repo.create({
      providerId,
      providerName: provider.name,
      catalogCode: dto.serviceCode,
      serviceName: dto.serviceName.trim(),
      serviceCategory: dto.serviceCategory?.trim() || undefined,
      serviceImageUrl: dto.serviceImageUrl?.trim() || undefined,
      basePriceKsh: dto.basePriceKsh,
      pricePerKmKsh: dto.pricePerKmKsh,
      description: dto.description?.trim() || undefined,
      fuelPricing: dto.fuelPricing,
      visibility: 'public',
      useForEstimation: true,
      isAcceptingJobs: true,
    });

    const saved = await this.repo.save(service);
    return this.toDto(saved);
  }

  async update(providerId: string, serviceId: string, dto: CreateProviderServiceDto) {
    await this.validateProviderAccount(providerId);
    this.validateFuelPricing(dto);

    const existing = await this.repo.findOneBy({ id: serviceId, providerId });
    if (!existing) throw new NotFoundException('Provider service not found.');

    const updated = this.repo.merge(existing, {
      serviceName: dto.serviceName.trim(),
      serviceCategory: dto.serviceCategory?.trim() || undefined,
      serviceImageUrl: dto.serviceImageUrl?.trim() || undefined,
      basePriceKsh: dto.basePriceKsh,
      pricePerKmKsh: dto.pricePerKmKsh,
      description: dto.description?.trim() || undefined,
      fuelPricing: dto.fuelPricing,
    });

    return this.toDto(await this.repo.save(updated));
  }

  async updateVisibility(providerId: string, serviceId: string, visibility: ServiceVisibility) {
    const service = await this.repo.findOneBy({ id: serviceId, providerId });
    if (!service) throw new NotFoundException('Provider service not found.');
    service.visibility = visibility;
    return this.toDto(await this.repo.save(service));
  }

  async updateAvailability(providerId: string, serviceId: string, isAcceptingJobs: boolean) {
    const service = await this.repo.findOneBy({ id: serviceId, providerId });
    if (!service) throw new NotFoundException('Provider service not found.');
    service.isAcceptingJobs = isAcceptingJobs;
    return this.toDto(await this.repo.save(service));
  }

  async delete(providerId: string, serviceId: string) {
    await this.validateProviderAccount(providerId);
    const existing = await this.repo.findOneBy({ id: serviceId, providerId });
    if (!existing) throw new NotFoundException('Provider service not found.');
    await this.repo.remove(existing);
    return { id: serviceId, deleted: true };
  }

  async findById(serviceId: string) {
    const service = await this.repo.findOneBy({ id: serviceId });
    return service ? this.toDto(service) : null;
  }

  private async validateProviderAccount(providerId: string) {
    const provider = await this.usersService.findById(providerId);
    if (!provider) throw new NotFoundException('Provider account not found.');
    if (provider.accountType !== 'provider') throw new ForbiddenException('Only provider accounts can manage services.');
    return provider;
  }

  private validateFuelPricing(dto: CreateProviderServiceDto) {
    if (!dto.fuelPricing) return;
    const prices = [
      dto.fuelPricing.gasoline?.regular,
      dto.fuelPricing.gasoline?.vpower,
      dto.fuelPricing.diesel?.standard,
    ].filter((v) => v !== undefined);
    if (prices.some((v) => Number(v) < 0)) throw new BadRequestException('Fuel prices must be zero or higher.');
  }

  private toDto(service: ProviderServiceEntity, baseLat: number | null = null, baseLng: number | null = null): ProviderService {
    return {
      ...service,
      serviceCode: service.catalogCode,
      providerBaseLat: baseLat,
      providerBaseLng: baseLng,
      serviceImageUrl: service.serviceImageUrl || '/assets/other_services.jpeg',
      createdAt: service.createdAt.toISOString(),
    };
  }
}
