import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../shared/auth/auth.module';
import { RatingEntity } from './rating.entity';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { RoadsideRequestsModule } from '../roadside/roadside-requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RatingEntity]),
    AuthModule,
    RoadsideRequestsModule,
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
