import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RoadsideRequestsModule } from './roadside-requests/roadside-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    VehiclesModule,
    RoadsideRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
