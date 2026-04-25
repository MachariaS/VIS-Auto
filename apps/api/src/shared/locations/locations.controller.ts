import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LocationResolveDto } from './dto/location-resolve.dto';
import { LocationSuggestDto } from './dto/location-suggest.dto';
import { LocationsService } from './locations.service';

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
}
