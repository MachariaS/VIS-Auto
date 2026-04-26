import { Body, Controller, Get, IsInt, IsOptional, IsString, Max, Min, Param, Post, Request, UseGuards } from '@nestjs/common';
import { IsInt as IsIntV, Max as MaxV, Min as MinV } from 'class-validator';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../shared/auth/jwt-auth.guard';
import { RatingsService } from './ratings.service';
import { RoadsideRequestsService } from '../roadside/roadside-requests.service';

class SubmitRatingDto {
  @IsIntV()
  @MinV(1)
  @MaxV(5)
  score!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class RatingsController {
  constructor(
    private readonly ratingsService: RatingsService,
    private readonly roadsideRequestsService: RoadsideRequestsService,
  ) {}

  @Post('ratings/:requestId')
  async submit(
    @Request() req: AuthenticatedRequest,
    @Param('requestId') requestId: string,
    @Body() dto: SubmitRatingDto,
  ) {
    const tracking = await this.roadsideRequestsService.getTrackingStatus(req.user.sub, requestId);
    return this.ratingsService.submit(
      req.user.sub,
      requestId,
      dto.score,
      dto.comment,
      tracking.providerId,
      tracking.userId,
      tracking.status,
    );
  }

  @Get('providers/:providerId/ratings')
  getForProvider(@Param('providerId') providerId: string) {
    return this.ratingsService.getForProvider(providerId);
  }

  @Get('ratings/:requestId/check')
  hasRated(@Request() req: AuthenticatedRequest, @Param('requestId') requestId: string) {
    return this.ratingsService.hasRated(req.user.sub, requestId);
  }
}
