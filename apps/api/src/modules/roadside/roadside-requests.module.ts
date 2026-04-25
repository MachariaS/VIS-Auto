import { Module } from '@nestjs/common';
import { AuthModule } from '../../shared/auth/auth.module';
import { ProviderServicesModule } from './services/provider-services.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../../shared/users/users.module';
import { VehiclesModule } from '../../shared/vehicles/vehicles.module';
import { RoadsideRequestsController } from './roadside-requests.controller';
import { RoadsideRequestEntity } from './roadside-request.entity';
import { RoadsideRequestsService } from './roadside-requests.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    VehiclesModule,
    ProviderServicesModule,
    TypeOrmModule.forFeature([RoadsideRequestEntity]),
  ],
  controllers: [RoadsideRequestsController],
  providers: [RoadsideRequestsService],
})
export class RoadsideRequestsModule {}
