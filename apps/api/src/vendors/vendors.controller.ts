import { Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { VendorsService } from './vendors.service';

@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  listMine(@Request() req: AuthenticatedRequest) {
    return this.vendorsService.listByProvider(req.user.sub);
  }

  @Post('requests/:requestId/accept')
  accept(@Request() req: AuthenticatedRequest, @Param('requestId') requestId: string) {
    return this.vendorsService.acceptRequest(req.user.sub, requestId);
  }

  @Delete('requests/:requestId')
  reject(@Request() req: AuthenticatedRequest, @Param('requestId') requestId: string) {
    return this.vendorsService.rejectRequest(req.user.sub, requestId);
  }
}
