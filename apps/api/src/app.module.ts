import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './shared/auth/auth.module';
import { OtpChallengeEntity } from './shared/auth/otp-challenge.entity';
import { PasswordResetEntity } from './shared/auth/password-reset.entity';
import { ProviderServicesModule } from './modules/roadside/services/provider-services.module';
import { ProviderServiceEntity } from './modules/roadside/services/provider-service.entity';
import { RoadsideRequestEntity } from './modules/roadside/roadside-request.entity';
import { VehiclesModule } from './shared/vehicles/vehicles.module';
import { RoadsideRequestsModule } from './modules/roadside/roadside-requests.module';
import { LocationsModule } from './shared/locations/locations.module';
import { UsersModule } from './shared/users/users.module';
import { UserEntity } from './shared/users/user.entity';
import { VehicleEntity } from './shared/vehicles/vehicle.entity';
import { VendorIntegrationEntity } from './modules/vendors/vendor-integration.entity';
import { VendorsModule } from './modules/vendors/vendors.module';
import { MailModule } from './shared/mail/mail.module';
import { ServiceCatalogModule } from './modules/service-catalog/service-catalog.module';
import { ServiceCatalogEntity } from './modules/service-catalog/service-catalog.entity';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { NotificationEntity } from './modules/notifications/notification.entity';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '.env'), join(process.cwd(), '.env')],
    }),
    TypeOrmModule.forRoot(
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            entities: [
              UserEntity, VehicleEntity, ProviderServiceEntity,
              RoadsideRequestEntity, OtpChallengeEntity, PasswordResetEntity,
              ServiceCatalogEntity, VendorIntegrationEntity, NotificationEntity,
            ],
            synchronize: (process.env.DB_SYNCHRONIZE ?? 'false') === 'true',
          }
        : {
            type: 'postgres',
            host: process.env.DB_HOST || '127.0.0.1',
            port: Number(process.env.DB_PORT || 5432),
            username: process.env.DB_USER || 'vis_user',
            password: process.env.DB_PASSWORD || 'vis_password',
            database: process.env.DB_NAME || 'vis_assist',
            entities: [
              UserEntity, VehicleEntity, ProviderServiceEntity,
              RoadsideRequestEntity, OtpChallengeEntity, PasswordResetEntity,
              ServiceCatalogEntity, VendorIntegrationEntity, NotificationEntity,
            ],
            synchronize: (process.env.DB_SYNCHRONIZE ?? 'false') === 'true',
          },
    ),
    UsersModule,
    AuthModule,
    ProviderServicesModule,
    LocationsModule,
    VehiclesModule,
    RoadsideRequestsModule,
    VendorsModule,
    MailModule,
    ServiceCatalogModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
