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

  // Must be declared before :id routes to avoid being captured as an ID
  @Get('dispatch-preview')
  async dispatchPreview(
    @Request() req: AuthenticatedRequest,
    @Query('catalogCode') catalogCode: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('vehicleId') vehicleId?: string,
  ) {
    if (!catalogCode || !lat || !lng) return null;
    const scored = await this.roadsideRequestsService.scoreDispatchCandidates(
      catalogCode, [], req.user.sub, Number(lat), Number(lng), vehicleId,
    );
    if (!scored.length) return null;
    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];
    return {
      providerId: top.candidate.providerId,
      providerName: top.candidate.providerName,
      avgRating: top.candidate.avgRating,
      ratingCount: top.candidate.ratingCount,
      distanceKm: Math.round(top.dist * 10) / 10,
      basePriceKsh: top.candidate.basePriceKsh,
      matchBadges: top.matchBadges,
      score: Math.round(top.score),
    };
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
      dto.cancellationReason,
    );
  }

  @Post(':id/decline')
  declineJob(@Request() req: AuthenticatedRequest, @Param('id') requestId: string) {
    return this.roadsideRequestsService.declineByProvider(req.user.sub, requestId);
  }

  @Post(':id/cancel')
  cancelJob(
    @Request() req: AuthenticatedRequest,
    @Param('id') requestId: string,
    @Body() body: { reason?: string },
  ) {
    return this.roadsideRequestsService.cancelByCustomer(req.user.sub, requestId, body?.reason);
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
