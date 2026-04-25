import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MinLength(2)
  nickname!: string;

  @IsString()
  @MinLength(2)
  make!: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsInt()
  @Min(1980)
  @Max(2100)
  year!: number;

  @IsString()
  @MinLength(4)
  registrationNumber!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
