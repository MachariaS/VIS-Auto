import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OtpChallengeEntity } from './auth/otp-challenge.entity';
import { PasswordResetEntity } from './auth/password-reset.entity';
import { ProviderServicesModule } from './provider-services/provider-services.module';
import { ProviderServiceEntity } from './provider-services/provider-service.entity';
import { RoadsideRequestEntity } from './roadside-requests/roadside-request.entity';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RoadsideRequestsModule } from './roadside-requests/roadside-requests.module';
import { LocationsModule } from './locations/locations.module';
import { UsersModule } from './users/users.module';
import { UserEntity } from './users/user.entity';
import { VehicleEntity } from './vehicles/vehicle.entity';
import { VendorIntegrationEntity } from './vendors/vendor-integration.entity';
import { VendorsModule } from './vendors/vendors.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '.env'), join(process.cwd(), '.env')],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [
        UserEntity,
        VehicleEntity,
        ProviderServiceEntity,
        RoadsideRequestEntity,
        OtpChallengeEntity,
        PasswordResetEntity,
        VendorIntegrationEntity,
      ],
      synchronize: (process.env.DB_SYNCHRONIZE || 'true') === 'true',
    }),
    UsersModule,
    AuthModule,
    ProviderServicesModule,
    LocationsModule,
    VehiclesModule,
    RoadsideRequestsModule,
    VendorsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
