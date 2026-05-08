import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateRoadsideRequestStatusDto {
  @IsIn(['provider_assigned', 'in_progress', 'completed', 'cancelled'])
  status!: 'provider_assigned' | 'in_progress' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
