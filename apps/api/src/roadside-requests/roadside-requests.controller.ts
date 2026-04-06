import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateRoadsideRequestDto } from './dto/create-roadside-request.dto';
import { UpdateRoadsideRequestStatusDto } from './dto/update-roadside-request-status.dto';
import { RoadsideRequestsService } from './roadside-requests.service';

@UseGuards(JwtAuthGuard)
@Controller('roadside-requests')
export class RoadsideRequestsController {
  constructor(private readonly roadsideRequestsService: RoadsideRequestsService) {}

  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.roadsideRequestsService.listByUser(req.user.sub);
  }

  @Get('provider')
  listProvider(@Request() req: AuthenticatedRequest) {
    return this.roadsideRequestsService.listByProvider(req.user.sub);
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
}
