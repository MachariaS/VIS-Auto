import { IsLatitude, IsLongitude, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateProviderLocationDto {
  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  etaMinutes?: number;
}
