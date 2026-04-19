import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProviderServicesModule } from '../provider-services/provider-services.module';
import { UsersModule } from '../users/users.module';
import { VendorIntegrationEntity } from './vendor-integration.entity';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ProviderServicesModule,
    TypeOrmModule.forFeature([VendorIntegrationEntity]),
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
