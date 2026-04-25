import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationType = 'job_update' | 'vendor' | 'auth' | 'system';

@Index(['userId', 'createdAt'])
@Index(['userId', 'isRead'])
@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'varchar', default: 'system' })
  type!: NotificationType;

  @Column({ type: 'varchar', nullable: true })
  refId?: string;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
