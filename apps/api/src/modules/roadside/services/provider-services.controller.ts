import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsIn, IsString } from 'class-validator';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../../shared/auth/jwt-auth.guard';
import type { ServiceVisibility } from './provider-service.entity';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { ProviderServicesService } from './provider-services.service';

class BulkCreateDto {
  @IsArray()
  @IsString({ each: true })
  serviceCatalogIds!: string[];
}

class UpdateVisibilityDto {
  @IsIn(['public', 'estimation_only', 'private'])
  visibility!: ServiceVisibility;
}

class UpdateAvailabilityDto {
  @IsBoolean()
  isAcceptingJobs!: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('provider-services')
export class ProviderServicesController {
  constructor(private readonly providerServicesService: ProviderServicesService) {}

  @Get()
  listMine(@Request() req: AuthenticatedRequest) {
    return this.providerServicesService.listByProvider(req.user.sub);
  }

  @Get('catalog')
  listCatalog(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const customerLat = lat ? Number(lat) : undefined;
    const customerLng = lng ? Number(lng) : undefined;
    return this.providerServicesService.listAll(customerLat, customerLng);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(@Request() req: AuthenticatedRequest, @Body() dto: BulkCreateDto) {
    return this.providerServicesService.bulkCreate(req.user.sub, dto.serviceCatalogIds);
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateProviderServiceDto) {
    return this.providerServicesService.create(req.user.sub, dto);
  }

  @Put(':serviceId')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateProviderServiceDto,
  ) {
    return this.providerServicesService.update(req.user.sub, serviceId, dto);
  }

  @Patch(':serviceId/visibility')
  updateVisibility(
    @Request() req: AuthenticatedRequest,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateVisibilityDto,
  ) {
    return this.providerServicesService.updateVisibility(req.user.sub, serviceId, dto.visibility);
  }

  @Patch(':serviceId/availability')
  updateAvailability(
    @Request() req: AuthenticatedRequest,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.providerServicesService.updateAvailability(req.user.sub, serviceId, dto.isAcceptingJobs);
  }

  @Delete(':serviceId')
  delete(@Request() req: AuthenticatedRequest, @Param('serviceId') serviceId: string) {
    return this.providerServicesService.delete(req.user.sub, serviceId);
  }
}
