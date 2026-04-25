import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type VendorIntegrationStatus = 'pending' | 'accepted' | 'rejected';

@Index(['providerId'])
@Index(['vendorProviderId'])
@Entity({ name: 'vendor_integrations' })
export class VendorIntegrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  providerId!: string;

  @Column()
  vendorProviderId!: string;

  @Column()
  vendorName!: string;

  @Column({ type: 'text', nullable: true })
  vendorCategory?: string;

  @Column({ type: 'text', nullable: true })
  vendorImageUrl?: string;

  @Column({ type: 'text', nullable: true })
  vendorEmail?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: VendorIntegrationStatus;

  @CreateDateColumn()
  requestedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
