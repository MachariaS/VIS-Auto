import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesController } from './vehicles.controller';
import { VehicleEntity } from './vehicle.entity';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([VehicleEntity])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
