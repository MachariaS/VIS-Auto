import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { UpdateMyPasswordDto } from './dto/update-my-password.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  getMyProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Patch('me/profile')
  updateMyProfile(
    @Request() req: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    return this.usersService.updateProfile(req.user.sub, body);
  }

  @Post('me/password')
  updateMyPassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateMyPasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.sub, dto);
  }
}
