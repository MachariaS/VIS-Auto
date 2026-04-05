import { Body, Controller, Post } from '@nestjs/common';
import { LocationResolveDto } from './dto/location-resolve.dto';
import { LocationSuggestDto } from './dto/location-suggest.dto';
import { LocationsService } from './locations.service';

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
