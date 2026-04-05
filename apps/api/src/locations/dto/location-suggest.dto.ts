import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class LocationSuggestDto {
  @IsString()
  @MaxLength(200)
  query!: string;

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
