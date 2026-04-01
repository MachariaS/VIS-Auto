import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar' })
  accountType!: 'customer' | 'provider';

  @Column()
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
