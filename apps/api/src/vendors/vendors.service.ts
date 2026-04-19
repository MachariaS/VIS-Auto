import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderServicesService } from '../provider-services/provider-services.service';
import { UsersService } from '../users/users.service';
import { VendorIntegrationEntity } from './vendor-integration.entity';

export interface VendorPartnerSummary {
  id: string;
  name: string;
  category: string;
  joinDate: string;
  completedOrders: number;
  rating: number;
  demand: string;
  imageUrl?: string;
  bio: string;
}

export interface VendorRequestSummary {
  id: string;
  name: string;
  category: string;
  requestedAt: string;
  submittedBy: string;
  notes: string;
  reviewedAt?: string;
}

export interface VendorNetworkSummary {
  activePartners: VendorPartnerSummary[];
  pendingRequests: VendorRequestSummary[];
  rejectedRequests: VendorRequestSummary[];
}

@Injectable()
export class VendorsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly providerServicesService: ProviderServicesService,
    @InjectRepository(VendorIntegrationEntity)
    private readonly vendorIntegrationsRepository: Repository<VendorIntegrationEntity>,
  ) {}

  async listByProvider(providerId: string): Promise<VendorNetworkSummary> {
    await this.ensureProviderAccount(providerId);
    await this.ensureGeneratedRequests(providerId);

    const records = await this.vendorIntegrationsRepository.find({
      where: { providerId },
      order: { requestedAt: 'DESC' },
    });

    return this.toVendorNetworkSummary(records);
  }

  async acceptRequest(providerId: string, requestId: string) {
    const request = await this.getOwnedRequest(providerId, requestId);

    if (request.status === 'accepted') {
      return this.toVendorPartner(request);
    }

    if (request.status === 'rejected') {
      throw new BadRequestException('Rejected requests cannot be accepted.');
    }

    request.status = 'accepted';
    request.reviewedAt = new Date();

    const saved = await this.vendorIntegrationsRepository.save(request);

    return this.toVendorPartner(saved);
  }

  async rejectRequest(providerId: string, requestId: string) {
    const request = await this.getOwnedRequest(providerId, requestId);

    if (request.status === 'accepted') {
      throw new BadRequestException('Accepted partners cannot be rejected from this action.');
    }

    if (request.status === 'rejected') {
      return this.toVendorRequest(request);
    }

    request.status = 'rejected';
    request.reviewedAt = new Date();

    const saved = await this.vendorIntegrationsRepository.save(request);

    return this.toVendorRequest(saved);
  }

  private async getOwnedRequest(providerId: string, requestId: string) {
    await this.ensureProviderAccount(providerId);

    const request = await this.vendorIntegrationsRepository.findOneBy({
      id: requestId,
      providerId,
    });

    if (!request) {
      throw new NotFoundException('Vendor request not found.');
    }

    return request;
  }

  private async ensureProviderAccount(providerId: string) {
    const provider = await this.usersService.findById(providerId);

    if (!provider) {
      throw new NotFoundException('Provider account not found.');
    }

    if (provider.accountType !== 'provider') {
      throw new ForbiddenException('Only provider accounts can manage vendors.');
    }

    return provider;
  }

  private async ensureGeneratedRequests(providerId: string) {
    const [catalog, existingRecords] = await Promise.all([
      this.providerServicesService.listAll(),
      this.vendorIntegrationsRepository.find({
        where: { providerId },
      }),
    ]);

    const knownVendorIds = new Set(existingRecords.map((record) => record.vendorProviderId));
    const candidatesByVendorId = new Map<
      string,
      {
        vendorProviderId: string;
        vendorName: string;
        vendorCategory?: string;
        vendorImageUrl?: string;
      }
    >();

    for (const service of catalog) {
      if (!service.providerId || service.providerId === providerId || knownVendorIds.has(service.providerId)) {
        continue;
      }

      if (!candidatesByVendorId.has(service.providerId)) {
        candidatesByVendorId.set(service.providerId, {
          vendorProviderId: service.providerId,
          vendorName: service.providerName,
          vendorCategory: service.serviceCategory || service.serviceName || 'General Service',
          vendorImageUrl: service.serviceImageUrl,
        });
      }
    }

    if (candidatesByVendorId.size === 0) {
      return;
    }

    const additions: VendorIntegrationEntity[] = [];

    for (const candidate of candidatesByVendorId.values()) {
      const vendorUser = await this.usersService.findById(candidate.vendorProviderId);
      const record = this.vendorIntegrationsRepository.create({
        providerId,
        vendorProviderId: candidate.vendorProviderId,
        vendorName: candidate.vendorName,
        vendorCategory: candidate.vendorCategory,
        vendorImageUrl: candidate.vendorImageUrl,
        vendorEmail: vendorUser?.email,
        notes: 'Auto-generated from the provider services catalog.',
        status: 'pending',
      });
      additions.push(record);
    }

    if (additions.length > 0) {
      await this.vendorIntegrationsRepository.save(additions);
    }
  }

  private toVendorNetworkSummary(records: VendorIntegrationEntity[]): VendorNetworkSummary {
    return {
      activePartners: records
        .filter((record) => record.status === 'accepted')
        .map((record) => this.toVendorPartner(record)),
      pendingRequests: records
        .filter((record) => record.status === 'pending')
        .map((record) => this.toVendorRequest(record)),
      rejectedRequests: records
        .filter((record) => record.status === 'rejected')
        .map((record) => this.toVendorRequest(record)),
    };
  }

  private toVendorPartner(record: VendorIntegrationEntity): VendorPartnerSummary {
    return {
      id: record.id,
      name: record.vendorName,
      category: record.vendorCategory || 'General Service',
      joinDate: this.toDateString(record.reviewedAt || record.requestedAt),
      completedOrders: 0,
      rating: 0,
      demand: 'New integration',
      imageUrl: record.vendorImageUrl,
      bio: record.notes || 'Recently approved vendor integration.',
    };
  }

  private toVendorRequest(record: VendorIntegrationEntity): VendorRequestSummary {
    return {
      id: record.id,
      name: record.vendorName,
      category: record.vendorCategory || 'General Service',
      requestedAt: this.toDateString(record.requestedAt),
      submittedBy: record.vendorEmail || 'Not shared',
      notes: record.notes || '',
      reviewedAt: record.reviewedAt ? this.toDateString(record.reviewedAt) : undefined,
    };
  }

  private toDateString(value: Date) {
    return value.toISOString().slice(0, 10);
  }
}
