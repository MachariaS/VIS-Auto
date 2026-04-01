import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { ProviderServicesService } from './provider-services.service';

@UseGuards(JwtAuthGuard)
@Controller('provider-services')
export class ProviderServicesController {
  constructor(private readonly providerServicesService: ProviderServicesService) {}

  @Get()
  listMine(@Request() req: AuthenticatedRequest) {
    return this.providerServicesService.listByProvider(req.user.sub);
  }

  @Get('catalog')
  listCatalog() {
    return this.providerServicesService.listAll();
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
}
