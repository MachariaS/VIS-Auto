import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Unique(['roadsideRequestId'])
@Index(['providerId'])
@Index(['customerId'])
@Entity({ name: 'ratings' })
export class RatingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  roadsideRequestId!: string;

  @Column()
  customerId!: string;

  @Column()
  providerId!: string;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
