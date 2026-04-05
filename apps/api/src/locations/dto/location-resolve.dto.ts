import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class LocationResolveDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  query?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  mapUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @IsOptional()
  @IsNumber()
  nearLat?: number;

  @IsOptional()
  @IsNumber()
  nearLng?: number;
}
