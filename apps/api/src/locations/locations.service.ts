import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationResolveDto } from './dto/location-resolve.dto';
import { LocationSuggestDto } from './dto/location-suggest.dto';

type NormalizedLocation = {
  name: string;
  address: string;
  town: string;
  road: string;
  landmark: string;
  lat: string;
  lng: string;
  placeId: string;
  source: 'google' | 'nominatim';
};

type GooglePredictionTerm = {
  value?: string;
};

type GooglePrediction = {
  description?: string;
  place_id?: string;
  structured_formatting?: {
    main_text?: string;
  };
  terms?: GooglePredictionTerm[];
};

type GoogleAddressComponent = {
  long_name?: string;
  types?: string[];
};

type GooglePlaceDetails = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  address_components?: GoogleAddressComponent[];
};

type NominatimAddress = {
  shop?: string;
  building?: string;
  attraction?: string;
  amenity?: string;
  town?: string;
  city?: string;
  county?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
};

type NominatimResultItem = {
  display_name?: string;
  lat?: string | number;
  lon?: string | number;
  place_id?: string | number;
  address?: NominatimAddress;
};

type SuggestionCacheEntry = {
  expiresAt: number;
  value: NormalizedLocation[];
};

const LOCATION_SUGGESTION_CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class LocationsService {
  private readonly suggestionCache = new Map<string, SuggestionCacheEntry>();

  private readonly inflightSuggestionCache = new Map<
    string,
    Promise<NormalizedLocation[]>
  >();

  constructor(private readonly configService: ConfigService) {}

  async suggest(dto: LocationSuggestDto) {
    const query = this.normalizeQuery(dto.query);
    if (!query || query.length < 3) {
      return [];
    }

    const mode = this.getLocationLookupMode();
    const cacheKey = this.buildSuggestionCacheKey(dto, query, mode);
    const cachedResult = this.getCachedSuggestions(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const inflightRequest = this.inflightSuggestionCache.get(cacheKey);
    if (inflightRequest) {
      return inflightRequest;
    }

    const suggestionPromise = this.computeSuggestions(dto, query, mode);
    this.inflightSuggestionCache.set(cacheKey, suggestionPromise);

    try {
      const suggestions = await suggestionPromise;
      this.setCachedSuggestions(cacheKey, suggestions);
      return suggestions;
    } finally {
      this.inflightSuggestionCache.delete(cacheKey);
    }
  }

  async resolve(dto: LocationResolveDto) {
    const googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    const expandedMapUrl = dto.mapUrl
      ? await this.expandShortMapUrl(dto.mapUrl)
      : undefined;

    const mapDerived = this.extractFromMapUrl(
      expandedMapUrl || dto.mapUrl || '',
    );
    const query = mapDerived.query || dto.query?.trim() || '';

    if (!query && !(mapDerived.lat && mapDerived.lng)) {
      return null;
    }

    if (mapDerived.lat && mapDerived.lng) {
      return {
        name: '',
        address: query || '',
        town: '',
        road: '',
        landmark: '',
        lat: mapDerived.lat,
        lng: mapDerived.lng,
        placeId: '',
        source: 'google',
      } as NormalizedLocation;
    }

    let suggestions: NormalizedLocation[] = [];
    const mode = this.getLocationLookupMode();

    if (googleApiKey && mode !== 'free') {
      suggestions = await this.suggestWithGoogle(
        query,
        googleApiKey,
        dto.countryCode,
        dto.nearLat,
        dto.nearLng,
        1,
      );
    }

    if (suggestions.length === 0) {
      suggestions = await this.suggestWithNominatim(
        query,
        dto.countryCode,
        dto.nearLat,
        dto.nearLng,
        1,
      );
    }

    return suggestions[0] || null;
  }

  private async computeSuggestions(
    dto: LocationSuggestDto,
    query: string,
    mode: 'free' | 'hybrid',
  ) {
    const googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (googleApiKey && mode !== 'free') {
      const googleResults = await this.suggestWithGoogle(
        query,
        googleApiKey,
        dto.countryCode,
        dto.nearLat,
        dto.nearLng,
      );

      if (googleResults.length > 0) {
        return googleResults;
      }
    }

    return this.suggestWithNominatim(
      query,
      dto.countryCode,
      dto.nearLat,
      dto.nearLng,
    );
  }

  private getLocationLookupMode(): 'free' | 'hybrid' {
    const configuredMode =
      this.configService.get<string>('LOCATION_LOOKUP_MODE')?.trim().toLowerCase() ||
      'hybrid';

    return configuredMode === 'free' ? 'free' : 'hybrid';
  }

  private normalizeQuery(query?: string) {
    return (query || '').trim().replace(/[\s,]+/g, ' ');
  }

  private buildSuggestionCacheKey(
    dto: LocationSuggestDto,
    query: string,
    mode: 'free' | 'hybrid',
  ) {
    return JSON.stringify({
      query: query.toLowerCase(),
      countryCode: (dto.countryCode || '').toUpperCase(),
      nearLat: this.roundCoordinate(dto.nearLat),
      nearLng: this.roundCoordinate(dto.nearLng),
      mode,
    });
  }

  private roundCoordinate(value?: number) {
    return typeof value === 'number' ? Number(value.toFixed(2)) : null;
  }

  private getCachedSuggestions(cacheKey: string) {
    const cachedEntry = this.suggestionCache.get(cacheKey);
    if (!cachedEntry) {
      return null;
    }

    if (cachedEntry.expiresAt <= Date.now()) {
      this.suggestionCache.delete(cacheKey);
      return null;
    }

    return cachedEntry.value;
  }

  private setCachedSuggestions(cacheKey: string, value: NormalizedLocation[]) {
    this.pruneExpiredSuggestionCache();
    this.suggestionCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + LOCATION_SUGGESTION_CACHE_TTL_MS,
    });
  }

  private pruneExpiredSuggestionCache() {
    const now = Date.now();
    for (const [cacheKey, entry] of this.suggestionCache.entries()) {
      if (entry.expiresAt <= now) {
        this.suggestionCache.delete(cacheKey);
      }
    }
  }

  private async suggestWithGoogle(
    query: string,
    key: string,
    countryCode?: string,
    nearLat?: number,
    nearLng?: number,
    limit = 5,
  ): Promise<NormalizedLocation[]> {
    const baseParams = new URLSearchParams({
      input: query,
      key,
      language: 'en',
    });

    if (countryCode) {
      baseParams.set('components', `country:${countryCode.toUpperCase()}`);
    }

    if (nearLat !== undefined && nearLng !== undefined) {
      baseParams.set('location', `${nearLat},${nearLng}`);
      baseParams.set('radius', '50000');
    }

    let predictions = await this.fetchGooglePredictions(
      baseParams,
      limit,
      'establishment',
    );

    // Fallback to broader matching when a strict business-only lookup returns nothing.
    if (predictions.length === 0) {
      predictions = await this.fetchGooglePredictions(baseParams, limit);
    }

    const detailedResults = await Promise.all(
      predictions.map(async (prediction) => {
        const details = await this.fetchGooglePlaceDetails(
          prediction.place_id || '',
          key,
        );

        if (!details) {
          return {
            name:
              prediction.structured_formatting?.main_text ||
              prediction.description ||
              query,
            address: prediction.description || '',
            town: this.extractTownFromPrediction(prediction),
            road: this.extractRoadFromPrediction(prediction),
            landmark: prediction.structured_formatting?.main_text || '',
            lat: '',
            lng: '',
            placeId: prediction.place_id || '',
            source: 'google',
          } as NormalizedLocation;
        }

        const getComponent = (kind: string) =>
          details.address_components?.find((part) => part.types?.includes(kind))
            ?.long_name || '';

        const parsedAddress = this.parseFormattedAddress(
          details.formatted_address || '',
          details.name || '',
        );
        const town =
          getComponent('locality') ||
          getComponent('postal_town') ||
          getComponent('administrative_area_level_3') ||
          getComponent('sublocality_level_1') ||
          getComponent('administrative_area_level_2') ||
          parsedAddress.town ||
          this.extractTownFromPrediction(prediction);

        const road =
          getComponent('route') ||
          getComponent('street_address') ||
          getComponent('premise') ||
          parsedAddress.road ||
          this.extractRoadFromPrediction(prediction);

        const landmark =
          getComponent('point_of_interest') ||
          getComponent('establishment') ||
          getComponent('premise') ||
          getComponent('subpremise') ||
          getComponent('neighborhood') ||
          getComponent('sublocality_level_1') ||
          details.name ||
          prediction.structured_formatting?.main_text ||
          '';

        return {
          name:
            details.name ||
            getComponent('premise') ||
            getComponent('establishment') ||
            prediction.structured_formatting?.main_text ||
            query,
          address: details.formatted_address || prediction.description || '',
          town,
          road,
          landmark,
          lat: String(details.geometry?.location?.lat || ''),
          lng: String(details.geometry?.location?.lng || ''),
          placeId: details.place_id || prediction.place_id || '',
          source: 'google',
        } as NormalizedLocation;
      }),
    );

    return detailedResults;
  }

  private async fetchGooglePredictions(
    baseParams: URLSearchParams,
    limit: number,
    type?: string,
  ): Promise<GooglePrediction[]> {
    const params = new URLSearchParams(baseParams.toString());
    if (type) {
      params.set('types', type);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const payload: unknown = await response.json();
      if (!this.isRecord(payload)) {
        return [];
      }

      const status = this.getString(payload, 'status');
      if (status !== 'OK' && status !== 'ZERO_RESULTS') {
        return [];
      }

      const predictions = payload['predictions'];
      if (!Array.isArray(predictions)) {
        return [];
      }

      return predictions
        .filter((prediction): prediction is Record<string, unknown> =>
          this.isRecord(prediction),
        )
        .map((prediction) => this.toGooglePrediction(prediction))
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  private async fetchGooglePlaceDetails(placeId: string, key: string) {
    if (!placeId) {
      return null;
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key,
      fields: 'place_id,name,formatted_address,geometry,address_components',
    });

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
      );

      if (!response.ok) {
        return null;
      }

      const payload: unknown = await response.json();
      if (!this.isRecord(payload)) {
        return null;
      }

      const status = this.getString(payload, 'status');
      if (status !== 'OK') {
        return null;
      }

      const result = payload['result'];
      if (!this.isRecord(result)) {
        return null;
      }

      return this.toGooglePlaceDetails(result);
    } catch {
      return null;
    }
  }

  private extractTownFromPrediction(prediction: GooglePrediction) {
    const terms = Array.isArray(prediction?.terms) ? prediction.terms : [];
    if (terms.length >= 2) {
      return terms[terms.length - 2]?.value || '';
    }

    return terms[0]?.value || '';
  }

  private extractRoadFromPrediction(prediction: GooglePrediction) {
    const terms = Array.isArray(prediction?.terms) ? prediction.terms : [];
    return terms.length > 0 ? terms[0]?.value || '' : '';
  }

  private parseFormattedAddress(formattedAddress: string, placeName: string) {
    const normalized = (formattedAddress || '').trim();
    if (!normalized) {
      return { road: '', town: '' };
    }

    const parts = normalized
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      return { road: '', town: '' };
    }

    const roadCandidate = parts.find((part) => part !== placeName) || '';
    const townCandidate = parts.length >= 2 ? parts[parts.length - 2] : '';

    return {
      road: roadCandidate,
      town: townCandidate,
    };
  }

  private async suggestWithNominatim(
    query: string,
    countryCode?: string,
    nearLat?: number,
    nearLng?: number,
    limit = 5,
  ): Promise<NormalizedLocation[]> {
    const params = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      limit: String(limit),
      q: query,
    });

    if (countryCode) {
      params.set('countrycodes', countryCode.toLowerCase());
    }

    if (nearLat !== undefined && nearLng !== undefined) {
      params.set(
        'viewbox',
        `${nearLng - 0.6},${nearLat + 0.6},${nearLng + 0.6},${nearLat - 0.6}`,
      );
      params.set('bounded', '0');
    }

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'vis-assist-locations/1.0 (support@visauto.app)',
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .filter((item): item is Record<string, unknown> => this.isRecord(item))
      .map((item) => {
        const nominatimItem = this.toNominatimResultItem(item);
        const address = nominatimItem.address || {};

        return {
          name:
            address.shop ||
            address.building ||
            address.attraction ||
            address.amenity ||
            query,
          address: nominatimItem.display_name || '',
          town: address.town || address.city || address.county || '',
          road: address.road || '',
          landmark:
            address.suburb ||
            address.neighbourhood ||
            address.amenity ||
            address.attraction ||
            '',
          lat: String(nominatimItem.lat || ''),
          lng: String(nominatimItem.lon || ''),
          placeId: String(nominatimItem.place_id || ''),
          source: 'nominatim',
        } as NormalizedLocation;
      });
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getString(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    return typeof value === 'string' ? value : '';
  }

  private getNumber(
    source: Record<string, unknown>,
    key: string,
  ): number | undefined {
    const value = source[key];
    return typeof value === 'number' ? value : undefined;
  }

  private getStringArray(
    source: Record<string, unknown>,
    key: string,
  ): string[] {
    const value = source[key];
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private toGooglePrediction(
    prediction: Record<string, unknown>,
  ): GooglePrediction {
    const structuredFormatting = this.isRecord(
      prediction['structured_formatting'],
    )
      ? prediction['structured_formatting']
      : undefined;

    const terms = Array.isArray(prediction['terms'])
      ? prediction['terms']
          .filter((term): term is Record<string, unknown> =>
            this.isRecord(term),
          )
          .map((term) => ({ value: this.getString(term, 'value') }))
      : undefined;

    return {
      description: this.getString(prediction, 'description'),
      place_id: this.getString(prediction, 'place_id'),
      structured_formatting: structuredFormatting
        ? {
            main_text: this.getString(structuredFormatting, 'main_text'),
          }
        : undefined,
      terms,
    };
  }

  private toGooglePlaceDetails(
    result: Record<string, unknown>,
  ): GooglePlaceDetails {
    const geometry = this.isRecord(result['geometry'])
      ? result['geometry']
      : undefined;
    const location =
      geometry && this.isRecord(geometry['location'])
        ? geometry['location']
        : undefined;

    const components = Array.isArray(result['address_components'])
      ? result['address_components']
          .filter((item): item is Record<string, unknown> =>
            this.isRecord(item),
          )
          .map((item) => ({
            long_name: this.getString(item, 'long_name'),
            types: this.getStringArray(item, 'types'),
          }))
      : undefined;

    return {
      place_id: this.getString(result, 'place_id'),
      name: this.getString(result, 'name'),
      formatted_address: this.getString(result, 'formatted_address'),
      geometry: location
        ? {
            location: {
              lat: this.getNumber(location, 'lat'),
              lng: this.getNumber(location, 'lng'),
            },
          }
        : undefined,
      address_components: components,
    };
  }

  private toNominatimResultItem(
    item: Record<string, unknown>,
  ): NominatimResultItem {
    const addressRecord = this.isRecord(item['address'])
      ? item['address']
      : undefined;
    const address: NominatimAddress | undefined = addressRecord
      ? {
          shop: this.getString(addressRecord, 'shop'),
          building: this.getString(addressRecord, 'building'),
          attraction: this.getString(addressRecord, 'attraction'),
          amenity: this.getString(addressRecord, 'amenity'),
          town: this.getString(addressRecord, 'town'),
          city: this.getString(addressRecord, 'city'),
          county: this.getString(addressRecord, 'county'),
          road: this.getString(addressRecord, 'road'),
          suburb: this.getString(addressRecord, 'suburb'),
          neighbourhood: this.getString(addressRecord, 'neighbourhood'),
        }
      : undefined;

    const latRaw = item['lat'];
    const lonRaw = item['lon'];
    const placeIdRaw = item['place_id'];

    return {
      display_name: this.getString(item, 'display_name'),
      lat:
        typeof latRaw === 'string' || typeof latRaw === 'number'
          ? latRaw
          : undefined,
      lon:
        typeof lonRaw === 'string' || typeof lonRaw === 'number'
          ? lonRaw
          : undefined,
      place_id:
        typeof placeIdRaw === 'string' || typeof placeIdRaw === 'number'
          ? placeIdRaw
          : undefined,
      address,
    };
  }
  private async expandShortMapUrl(mapUrl: string) {
    try {
      const response = await fetch(mapUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      return response.url || mapUrl;
    } catch {
      return mapUrl;
    }
  }

  private extractFromMapUrl(mapUrl: string) {
    if (!mapUrl) {
      return { query: '', lat: '', lng: '' };
    }

    try {
      const parsed = new URL(mapUrl.trim());
      const q =
        parsed.searchParams.get('q') || parsed.searchParams.get('query') || '';
      const atMatch = parsed.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

      return {
        query: q ? decodeURIComponent(q) : '',
        lat: atMatch?.[1] || '',
        lng: atMatch?.[2] || '',
      };
    } catch {
      return { query: '', lat: '', lng: '' };
    }
  }
}
