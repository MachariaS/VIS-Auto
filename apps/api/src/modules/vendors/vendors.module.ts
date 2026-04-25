import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../shared/auth/auth.module';
import { ProviderServicesModule } from '../roadside/services/provider-services.module';
import { UsersModule } from '../../shared/users/users.module';
import { VendorIntegrationEntity } from './vendor-integration.entity';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ProviderServicesModule,
    NotificationsModule,
    TypeOrmModule.forFeature([VendorIntegrationEntity]),
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
