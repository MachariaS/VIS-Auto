import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { ProviderServicesController } from './provider-services.controller';
import { ProviderServiceEntity } from './provider-service.entity';
import { ProviderServicesService } from './provider-services.service';

@Module({
  imports: [AuthModule, UsersModule, TypeOrmModule.forFeature([ProviderServiceEntity])],
  controllers: [ProviderServicesController],
  providers: [ProviderServicesService],
  exports: [ProviderServicesService],
})
export class ProviderServicesModule {}
