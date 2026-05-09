import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ServiceCatalogService } from '../../service-catalog/service-catalog.service';
import { UsersService } from '../../../shared/users/users.service';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { ProviderServiceEntity, ServiceVisibility } from './provider-service.entity';
import { UserEntity } from '../../../shared/users/user.entity';
import { RatingEntity } from '../../ratings/rating.entity';
import { MAKE_TO_SPEC } from '../dispatch-score.constants';

export interface ProviderService {
  id: string;
  providerId: string;
  providerName: string;
  serviceCatalogId?: string;
  catalogCode?: string;
  serviceCode?: string;
  providerBaseLat?: number | null;
  providerBaseLng?: number | null;
  avgRating?: number | null;
  ratingCount?: number;
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
  matchReasons?: string[];
  createdAt: string;
}

@Injectable()
export class ProviderServicesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly catalogService: ServiceCatalogService,
    @InjectRepository(ProviderServiceEntity)
    private readonly repo: Repository<ProviderServiceEntity>,
    @InjectRepository(RatingEntity)
    private readonly ratingsRepo: Repository<RatingEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async listByProvider(providerId: string) {
    const services = await this.repo.find({ where: { providerId }, order: { createdAt: 'DESC' } });
    return services.map((s) => this.toDto(s));
  }

  private readonly logger = new Logger(ProviderServicesService.name);

  async listAll(customerLat?: number, customerLng?: number, customerId?: string, vehicleId?: string) {
    try {
      const services = await this.repo
        .createQueryBuilder('ps')
        .innerJoin(UserEntity, 'u', 'u.id::text = ps."providerId"')
        .where('u."isOnline" = true')
        .andWhere('ps."isAcceptingJobs" = true')
        .andWhere('ps.visibility = :v', { v: 'public' })
        .orderBy('ps."createdAt"', 'DESC')
        .getMany();

      const providerIds = [...new Set(services.map((s) => s.providerId))];

      // Batch-load provider base locations + aggregate ratings in parallel
      const [providers, ratingRows] = await Promise.all([
        this.usersService.findByIds(providerIds),
        providerIds.length > 0
          ? this.ratingsRepo
              .createQueryBuilder('r')
              .select('r."providerId"', 'providerId')
              .addSelect('AVG(r.score)', 'avgRating')
              .addSelect('COUNT(r.id)', 'ratingCount')
              .where('r."providerId" IN (:...ids)', { ids: providerIds })
              .groupBy('r."providerId"')
              .getRawMany()
          : [],
      ]);

      const providerMap = new Map(providers.map((p) => [p.id, p as unknown as { baseLat?: number; baseLng?: number }]));
      const ratingMap = new Map<string, { avgRating: number | null; ratingCount: number }>();
      for (const r of ratingRows as { providerId: string; avgRating: string; ratingCount: string }[]) {
        ratingMap.set(r.providerId, {
          avgRating: r.avgRating ? Math.round(Number(r.avgRating) * 10) / 10 : null,
          ratingCount: Number(r.ratingCount),
        });
      }

      const dtos = services.map((s) => {
        const prov = providerMap.get(s.providerId);
        const rating = ratingMap.get(s.providerId);
        return this.toDto(s, prov?.baseLat ?? null, prov?.baseLng ?? null, rating?.avgRating ?? null, rating?.ratingCount ?? 0);
      });

      // Radius filter
      const radiusFiltered = (customerLat && customerLng)
        ? dtos.filter((s) => {
            if (!s.providerBaseLat || !s.providerBaseLng || !s.maxRadiusKm) return true;
            return this.haversineKm(customerLat, customerLng, s.providerBaseLat, s.providerBaseLng) <= s.maxRadiusKm;
          })
        : dtos;

      // Personalised match reasons — only when customer context is provided
      if (!customerId || !providerIds.length) return radiusFiltered;

      const [vehicleRows, specRows, historyRows] = await Promise.all([
        vehicleId
          ? this.dataSource.query(`SELECT make FROM vehicles WHERE id = $1 LIMIT 1`, [vehicleId])
          : Promise.resolve([]),
        this.dataSource.query(
          `SELECT DISTINCT "providerId" FROM provider_services WHERE "isAcceptingJobs" = true AND "providerId" = ANY($1) AND "catalogCode" LIKE 'spec_%'`,
          [providerIds],
        ),
        this.dataSource.query(
          `SELECT DISTINCT "providerId" FROM ratings WHERE "customerId" = $1 AND "providerId" = ANY($2)`,
          [customerId, providerIds],
        ),
      ]);

      const vehicleMake: string | null = vehicleRows[0]?.make?.toLowerCase() ?? null;
      const specCode = vehicleMake ? (MAKE_TO_SPEC[vehicleMake] ?? null) : null;

      // Which providers have the customer's vehicle spec?
      const specProviderIds = specCode
        ? new Set(
            ((await this.dataSource.query(
              `SELECT "providerId" FROM provider_services WHERE "catalogCode" = $1 AND "isAcceptingJobs" = true AND "providerId" = ANY($2)`,
              [specCode, providerIds],
            )) as { providerId: string }[]).map((r) => r.providerId),
          )
        : new Set<string>();

      const pastProviderIds = new Set((historyRows as { providerId: string }[]).map((r) => r.providerId));

      return radiusFiltered.map((s) => {
        const reasons: string[] = [];
        if ((s.avgRating ?? 0) >= 4.5) reasons.push('Top rated');
        if (specProviderIds.has(s.providerId) && vehicleMake) {
          const label = vehicleMake.charAt(0).toUpperCase() + vehicleMake.slice(1);
          reasons.push(`${label} specialist`);
        }
        if (pastProviderIds.has(s.providerId)) reasons.push('Served you before');
        return reasons.length ? { ...s, matchReasons: reasons } : s;
      });
    } catch (err) {
      this.logger.warn('listAll JOIN failed, using fallback filter', err?.message);
      const services = await this.repo.find({
        where: { isAcceptingJobs: true, visibility: 'public' as ServiceVisibility },
        order: { createdAt: 'DESC' },
      });
      return services.map((s) => this.toDto(s));
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

  async findByCatalogCode(catalogCode: string, excludeProviderIds: string[] = []): Promise<ProviderService[]> {
    const services = await this.repo
      .createQueryBuilder('ps')
      .innerJoin(UserEntity, 'u', 'u.id::text = ps."providerId"')
      .where('ps."catalogCode" = :code', { code: catalogCode })
      .andWhere('u."isOnline" = true')
      .andWhere('ps."isAcceptingJobs" = true')
      .andWhere('ps.visibility = :v', { v: 'public' })
      .getMany();

    const filtered = excludeProviderIds.length
      ? services.filter((s) => !excludeProviderIds.includes(s.providerId))
      : services;

    const providerIds = [...new Set(filtered.map((s) => s.providerId))];
    const [providers, ratingRows] = await Promise.all([
      this.usersService.findByIds(providerIds),
      providerIds.length > 0
        ? this.ratingsRepo
            .createQueryBuilder('r')
            .select('r."providerId"', 'providerId')
            .addSelect('AVG(r.score)', 'avgRating')
            .addSelect('COUNT(r.id)', 'ratingCount')
            .where('r."providerId" IN (:...ids)', { ids: providerIds })
            .groupBy('r."providerId"')
            .getRawMany()
        : [],
    ]);

    const providerMap = new Map(providers.map((p) => [p.id, p as unknown as { baseLat?: number; baseLng?: number }]));
    const ratingMap = new Map<string, { avgRating: number | null; ratingCount: number }>();
    for (const r of ratingRows as { providerId: string; avgRating: string; ratingCount: string }[]) {
      ratingMap.set(r.providerId, {
        avgRating: r.avgRating ? Math.round(Number(r.avgRating) * 10) / 10 : null,
        ratingCount: Number(r.ratingCount),
      });
    }

    return filtered.map((s) => {
      const prov = providerMap.get(s.providerId);
      const rating = ratingMap.get(s.providerId);
      return this.toDto(s, prov?.baseLat ?? null, prov?.baseLng ?? null, rating?.avgRating ?? null, rating?.ratingCount ?? 0);
    });
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

  private toDto(
    service: ProviderServiceEntity,
    baseLat: number | null = null,
    baseLng: number | null = null,
    avgRating: number | null = null,
    ratingCount = 0,
    matchReasons?: string[],
  ): ProviderService {
    return {
      ...service,
      serviceCode: service.catalogCode,
      providerBaseLat: baseLat,
      providerBaseLng: baseLng,
      avgRating,
      ratingCount,
      matchReasons,
      serviceImageUrl: service.serviceImageUrl || '/assets/other_services.jpeg',
      createdAt: service.createdAt.toISOString(),
    };
  }
}
