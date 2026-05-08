import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../shared/auth/jwt-auth.guard';
import { CreateRoadsideRequestDto } from './dto/create-roadside-request.dto';
import { UpdateProviderLocationDto } from './dto/update-provider-location.dto';
import { UpdateRoadsideRequestStatusDto } from './dto/update-roadside-request-status.dto';
import { RoadsideRequestsService } from './roadside-requests.service';

@UseGuards(JwtAuthGuard)
@Controller('roadside-requests')
export class RoadsideRequestsController {
  constructor(private readonly roadsideRequestsService: RoadsideRequestsService) {}

  @Get()
  list(
    @Request() req: AuthenticatedRequest,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.roadsideRequestsService.listByUser(req.user.sub, vehicleId);
  }

  @Get('provider')
  listProvider(@Request() req: AuthenticatedRequest) {
    return this.roadsideRequestsService.listByProvider(req.user.sub);
  }

  @Get(':id/status')
  getTrackingStatus(@Request() req: AuthenticatedRequest, @Param('id') requestId: string) {
    return this.roadsideRequestsService.getTrackingStatus(req.user.sub, requestId);
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateRoadsideRequestDto) {
    return this.roadsideRequestsService.create(req.user.sub, dto);
  }

  @Patch(':id/status')
  updateProviderStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id') requestId: string,
    @Body() dto: UpdateRoadsideRequestStatusDto,
  ) {
    return this.roadsideRequestsService.updateStatusByProvider(
      req.user.sub,
      requestId,
      dto.status,
    );
  }

  @Post(':id/decline')
  declineJob(@Request() req: AuthenticatedRequest, @Param('id') requestId: string) {
    return this.roadsideRequestsService.declineByProvider(req.user.sub, requestId);
  }

  @Patch(':id/provider-location')
  updateProviderLocation(
    @Request() req: AuthenticatedRequest,
    @Param('id') requestId: string,
    @Body() dto: UpdateProviderLocationDto,
  ) {
    return this.roadsideRequestsService.updateProviderLocation(req.user.sub, requestId, dto);
  }
}
