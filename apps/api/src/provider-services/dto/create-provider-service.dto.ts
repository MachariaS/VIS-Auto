import { IsIn, IsNumber, IsObject, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProviderServiceDto {
  @IsString()
  @MinLength(2)
  serviceName!: string;

  @IsOptional()
  @IsString()
  serviceCategory?: string;

  @IsOptional()
  @IsString()
  serviceImageUrl?: string;

  @IsIn(['battery_jump', 'fuel_delivery', 'tire_change', 'towing', 'lockout'])
  serviceCode!: 'battery_jump' | 'fuel_delivery' | 'tire_change' | 'towing' | 'lockout';

  @IsNumber()
  @Min(0)
  basePriceKsh!: number;

  @IsNumber()
  @Min(0)
  pricePerKmKsh!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  fuelPricing?: {
    gasoline?: {
      regular?: number;
      vpower?: number;
    };
    diesel?: {
      standard?: number;
    };
  };
}
