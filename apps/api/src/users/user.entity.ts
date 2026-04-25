import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column()
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
