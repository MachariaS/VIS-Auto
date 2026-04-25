import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from '../../shared/mail/mail.service';
import { NotificationEntity, NotificationType } from './notification.entity';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  refId?: string;
  email?: string;
  emailSubject?: string;
  emailHtml?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
    private readonly mailService: MailService,
  ) {}

  async create(input: CreateNotificationInput): Promise<NotificationEntity> {
    const notification = this.repo.create({
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      refId: input.refId,
      isRead: false,
    });

    const saved = await this.repo.save(notification);

    if (input.email && input.emailHtml) {
      void this.mailService.sendNotification(
        input.email,
        input.emailSubject ?? input.title,
        input.emailHtml,
      );
    }

    return saved;
  }

  async listForUser(userId: string, limit = 50): Promise<NotificationEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.repo.update({ id, userId }, { isRead: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }
}
