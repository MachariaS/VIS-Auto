import {
  IsIn,
  IsNumber,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoadsideRequestDto {
  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  providerServiceId!: string;

  @IsNumber()
  @Min(0.1)
  distanceKm!: number;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsString()
  @MinLength(4)
  address!: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  fuelLitres?: number;

  @IsOptional()
  @IsIn(['gasoline', 'diesel'])
  fuelType?: 'gasoline' | 'diesel';

  @IsOptional()
  @IsIn(['regular', 'vpower'])
  gasolineGrade?: 'regular' | 'vpower';
}
