import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service';

@Controller('service-catalog')
export class ServiceCatalogController {
  constructor(private readonly service: ServiceCatalogService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':code')
  async findByCode(@Param('code') code: string) {
    const entry = await this.service.findByCode(code);
    if (!entry) throw new NotFoundException(`Service catalog entry '${code}' not found.`);
    return entry;
  }
}
