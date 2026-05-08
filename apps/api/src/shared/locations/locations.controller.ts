import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IsNumber, Max, Min } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { LocationResolveDto } from './dto/location-resolve.dto';
import { LocationSuggestDto } from './dto/location-suggest.dto';
import { LocationsService } from './locations.service';

class ReverseGeocodeDto {
  @IsNumber() @Min(-90) @Max(90)  lat!: number;
  @IsNumber() @Min(-180) @Max(180) lng!: number;
}

@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('suggest')
  suggest(@Body() dto: LocationSuggestDto) {
    return this.locationsService.suggest(dto);
  }

  @Post('resolve')
  resolve(@Body() dto: LocationResolveDto) {
    return this.locationsService.resolve(dto);
  }

  @Post('reverse')
  @HttpCode(HttpStatus.OK)
  reverse(@Body() dto: ReverseGeocodeDto) {
    return this.locationsService.reverseGeocode(dto.lat, dto.lng);
  }
}
