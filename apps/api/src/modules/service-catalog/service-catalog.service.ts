import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCatalogEntity } from './service-catalog.entity';
import { seedServiceCatalog } from './service-catalog.seed';

@Injectable()
export class ServiceCatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(ServiceCatalogEntity)
    private readonly repo: Repository<ServiceCatalogEntity>,
  ) {}

  async onModuleInit() {
    await seedServiceCatalog(this.repo);
  }

  async findAll() {
    const entries = await this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    const grouped: Record<string, typeof entries> = {};
    for (const entry of entries) {
      if (!grouped[entry.category]) grouped[entry.category] = [];
      grouped[entry.category].push(entry);
    }

    return Object.entries(grouped).map(([category, services]) => ({
      category,
      services,
    }));
  }

  async findByCode(code: string) {
    return this.repo.findOneBy({ code, isActive: true });
  }

  async findById(id: string) {
    return this.repo.findOneBy({ id });
  }
}
