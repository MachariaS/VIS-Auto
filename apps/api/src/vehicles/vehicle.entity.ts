import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'vehicles' })
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  nickname!: string;

  @Column()
  make!: string;

  @Column()
  model!: string;

  @Column({ type: 'int' })
  year!: number;

  @Column()
  registrationNumber!: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
