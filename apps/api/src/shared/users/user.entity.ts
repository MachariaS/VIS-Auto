import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['accountType'])
@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'varchar' })
  accountType!: 'car_owner' | 'provider';

  @Column({ type: 'jsonb', nullable: true })
  profile?: Record<string, unknown>;

  @Column({ default: false })
  isOnline!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  availabilityChangedAt?: Date;

  @Column({ type: 'float', nullable: true })
  baseLat?: number;

  @Column({ type: 'float', nullable: true })
  baseLng?: number;

  @Column()
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
