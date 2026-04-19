import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'roadside_requests' })
export class RoadsideRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  vehicleId!: string;

  @Column()
  providerServiceId!: string;

  @Column()
  providerId!: string;

  @Column()
  providerName!: string;

  @Column()
  issueType!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  distanceKm!: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  latitude!: number;

  @Column({ type: 'numeric', precision: 10, scale: 6 })
  longitude!: number;

  @Column()
  address!: string;

  @Column({ nullable: true })
  landmark?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  fuelDetails?: {
    fuelType: 'gasoline' | 'diesel';
    litres: number;
    gasolineGrade?: 'regular' | 'vpower';
    fuelCostKsh: number;
    deliveryCostKsh: number;
  };

  @Column({ type: 'varchar' })
  status!: 'searching' | 'provider_assigned' | 'in_progress' | 'completed' | 'cancelled';

  @Column({ type: 'int' })
  etaMinutes!: number;

  @Column({ type: 'int' })
  estimatedPriceKsh!: number;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true })
  providerLatitude?: number;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true })
  providerLongitude?: number;

  @Column({ type: 'timestamp', nullable: true })
  providerLocationUpdatedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
