import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OtpChallengeEntity } from './auth/otp-challenge.entity';
import { ProviderServicesModule } from './provider-services/provider-services.module';
import { ProviderServiceEntity } from './provider-services/provider-service.entity';
import { RoadsideRequestEntity } from './roadside-requests/roadside-request.entity';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RoadsideRequestsModule } from './roadside-requests/roadside-requests.module';
import { LocationsModule } from './locations/locations.module';
import { UsersModule } from './users/users.module';
import { UserEntity } from './users/user.entity';
import { VehicleEntity } from './vehicles/vehicle.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '.env'), join(process.cwd(), '.env')],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'vis_user',
      password: process.env.DB_PASSWORD || 'vis_password',
      database: process.env.DB_NAME || 'vis_assist',
      entities: [
        UserEntity,
        VehicleEntity,
        ProviderServiceEntity,
        RoadsideRequestEntity,
        OtpChallengeEntity,
      ],
      synchronize: (process.env.DB_SYNCHRONIZE || 'true') === 'true',
    }),
    UsersModule,
    AuthModule,
    ProviderServicesModule,
    LocationsModule,
    VehiclesModule,
    RoadsideRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
