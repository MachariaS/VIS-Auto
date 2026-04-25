import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../shared/auth/jwt-auth.guard';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.vehiclesService.listByUser(req.user.sub);
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(req.user.sub, dto);
  }
}
