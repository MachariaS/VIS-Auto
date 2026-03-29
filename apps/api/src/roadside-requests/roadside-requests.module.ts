import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { RoadsideRequestsController } from './roadside-requests.controller';
import { RoadsideRequestsService } from './roadside-requests.service';

@Module({
  imports: [AuthModule, VehiclesModule],
  controllers: [RoadsideRequestsController],
  providers: [RoadsideRequestsService],
})
export class RoadsideRequestsModule {}
