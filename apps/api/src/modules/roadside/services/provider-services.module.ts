import { Module } from '@nestjs/common';
import { AuthModule } from '../../../shared/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../../../shared/users/users.module';
import { ServiceCatalogModule } from '../../service-catalog/service-catalog.module';
import { ProviderServicesController } from './provider-services.controller';
import { ProviderServiceEntity } from './provider-service.entity';
import { ProviderServicesService } from './provider-services.service';

@Module({
  imports: [AuthModule, UsersModule, ServiceCatalogModule, TypeOrmModule.forFeature([ProviderServiceEntity])],
  controllers: [ProviderServicesController],
  providers: [ProviderServicesService],
  exports: [ProviderServicesService],
})
export class ProviderServicesModule {}
