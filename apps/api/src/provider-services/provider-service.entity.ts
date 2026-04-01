import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'provider_services' })
export class ProviderServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  providerId!: string;

  @Column()
  providerName!: string;

  @Column()
  serviceName!: string;

  @Column({ type: 'varchar' })
  serviceCode!: 'battery_jump' | 'fuel_delivery' | 'tire_change' | 'towing' | 'lockout';

  @Column({ type: 'int' })
  basePriceKsh!: number;

  @Column({ type: 'int' })
  pricePerKmKsh!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  fuelPricing?: {
    gasoline?: {
      regular?: number;
      vpower?: number;
    };
    diesel?: {
      standard?: number;
    };
  };

  @CreateDateColumn()
  createdAt!: Date;
}
