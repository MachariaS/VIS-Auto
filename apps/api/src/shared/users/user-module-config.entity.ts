import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Index(['userId'])
@Entity({ name: 'user_module_configs' })
export class UserModuleConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column({ type: 'jsonb', default: '{}' })
  config!: Record<string, unknown>;

  @UpdateDateColumn()
  updatedAt!: Date;
}
