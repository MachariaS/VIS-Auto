import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ServiceVisibility = 'public' | 'estimation_only' | 'private';

@Index(['providerId'])
@Entity({ name: 'provider_services' })
export class ProviderServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  providerId!: string;

  @Column()
  providerName!: string;

  @Column({ nullable: true })
  serviceCatalogId?: string;

  @Column({ nullable: true })
  catalogCode?: string;

  @Column()
  serviceName!: string;

  @Column({ type: 'varchar', default: 'public' })
  visibility!: ServiceVisibility;

  @Column({ default: true })
  useForEstimation!: boolean;

  @Column({ default: true })
  isAcceptingJobs!: boolean;

  @Column({ type: 'int', nullable: true })
  maxRadiusKm?: number;

  @Column({ type: 'int' })
  basePriceKsh!: number;

  @Column({ type: 'int' })
  pricePerKmKsh!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  serviceCategory?: string;

  @Column({ type: 'text', nullable: true })
  serviceImageUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  fuelPricing?: {
    gasoline?: { regular?: number; vpower?: number };
    diesel?: { standard?: number };
  };

  @CreateDateColumn()
  createdAt!: Date;
}
