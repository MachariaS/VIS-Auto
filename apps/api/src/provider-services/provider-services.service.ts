import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { ProviderServiceEntity } from './provider-service.entity';

export interface ProviderService {
  id: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  serviceCategory?: string;
  serviceImageUrl?: string;
  serviceCode: 'battery_jump' | 'fuel_delivery' | 'tire_change' | 'towing' | 'lockout';
  basePriceKsh: number;
  pricePerKmKsh: number;
  description?: string;
  fuelPricing?: {
    gasoline?: {
      regular?: number;
      vpower?: number;
    };
    diesel?: {
      standard?: number;
    };
  };
  createdAt: string;
}

@Injectable()
export class ProviderServicesService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(ProviderServiceEntity)
    private readonly providerServicesRepository: Repository<ProviderServiceEntity>,
  ) {}

  async listByProvider(providerId: string) {
    const services = await this.providerServicesRepository.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
    });

    return services.map((service) => this.toProviderService(service));
  }

  async listAll() {
    const services = await this.providerServicesRepository.find({
      order: { createdAt: 'DESC' },
    });

    return services.map((service) => this.toProviderService(service));
  }

  async create(providerId: string, dto: CreateProviderServiceDto) {
    const provider = await this.validateProviderAccount(providerId);
    this.validateServicePayload(dto);

    const service = this.providerServicesRepository.create({
      providerId,
      providerName: provider.name,
      serviceName: dto.serviceName.trim(),
      serviceCategory: dto.serviceCategory?.trim() || undefined,
      serviceImageUrl: dto.serviceImageUrl?.trim() || undefined,
      serviceCode: dto.serviceCode,
      basePriceKsh: dto.basePriceKsh,
      pricePerKmKsh: dto.pricePerKmKsh,
      description: dto.description?.trim() || undefined,
      fuelPricing: dto.fuelPricing,
    });

    const saved = await this.providerServicesRepository.save(service);

    return this.toProviderService(saved);
  }

  async findById(serviceId: string) {
    const service = await this.providerServicesRepository.findOneBy({ id: serviceId });
    return service ? this.toProviderService(service) : null;
  }

  async delete(providerId: string, serviceId: string) {
    await this.validateProviderAccount(providerId);

    const existing = await this.providerServicesRepository.findOneBy({
      id: serviceId,
      providerId,
    });

    if (!existing) {
      throw new NotFoundException('Provider service not found.');
    }

    await this.providerServicesRepository.remove(existing);

    return { id: serviceId, deleted: true };
  }

  async update(providerId: string, serviceId: string, dto: CreateProviderServiceDto) {
    await this.validateProviderAccount(providerId);
    this.validateServicePayload(dto);

    const existing = await this.providerServicesRepository.findOneBy({
      id: serviceId,
      providerId,
    });

    if (!existing) {
      throw new NotFoundException('Provider service not found.');
    }

    const updated = this.providerServicesRepository.merge(existing, {
      serviceName: dto.serviceName.trim(),
      serviceCategory: dto.serviceCategory?.trim() || undefined,
      serviceImageUrl: dto.serviceImageUrl?.trim() || undefined,
      serviceCode: dto.serviceCode,
      basePriceKsh: dto.basePriceKsh,
      pricePerKmKsh: dto.pricePerKmKsh,
      description: dto.description?.trim() || undefined,
      fuelPricing: dto.fuelPricing,
    });

    const saved = await this.providerServicesRepository.save(updated);

    return this.toProviderService(saved);
  }

  private async validateProviderAccount(providerId: string) {
    const provider = await this.usersService.findById(providerId);

    if (!provider) {
      throw new NotFoundException('Provider account not found.');
    }

    if (provider.accountType !== 'provider') {
      throw new ForbiddenException('Only provider accounts can manage services.');
    }

    return provider;
  }

  private validateServicePayload(dto: CreateProviderServiceDto) {
    if (dto.serviceCode !== 'fuel_delivery' && dto.fuelPricing) {
      throw new BadRequestException('Fuel pricing is only supported for fuel delivery.');
    }

    this.validateFuelPricing(dto);
  }

  private validateFuelPricing(dto: CreateProviderServiceDto) {
    if (dto.serviceCode !== 'fuel_delivery' || !dto.fuelPricing) {
      return;
    }

    const prices = [
      dto.fuelPricing.gasoline?.regular,
      dto.fuelPricing.gasoline?.vpower,
      dto.fuelPricing.diesel?.standard,
    ].filter((value) => value !== undefined);

    if (prices.some((value) => Number(value) < 0)) {
      throw new BadRequestException('Fuel prices must be zero or higher.');
    }
  }

  private toProviderService(service: ProviderServiceEntity): ProviderService {
    return {
      ...service,
      createdAt: service.createdAt.toISOString(),
    };
  }
}
