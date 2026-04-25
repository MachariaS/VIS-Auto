import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCatalogController } from './service-catalog.controller';
import { ServiceCatalogEntity } from './service-catalog.entity';
import { ServiceCatalogService } from './service-catalog.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCatalogEntity])],
  controllers: [ServiceCatalogController],
  providers: [ServiceCatalogService],
  exports: [ServiceCatalogService],
})
export class ServiceCatalogModule {}
