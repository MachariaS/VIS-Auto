import { Controller, Get, HttpCode, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common';
import { Request } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../shared/auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.listForUser(req.user.sub);
  }

  @Get('unread-count')
  async unreadCount(@Request() req: AuthenticatedRequest) {
    const count = await this.notificationsService.countUnread(req.user.sub);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.sub, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.markAllRead(req.user.sub);
  }
}
