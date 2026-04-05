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

@Injectable()
export class LocationsService {
  constructor(private readonly configService: ConfigService) {}

  async suggest(dto: LocationSuggestDto) {
    const query = dto.query?.trim();
    if (!query || query.length < 3) {
      return [];
    }

    const googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (googleApiKey) {
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

    return this.suggestWithNominatim(query, dto.countryCode, dto.nearLat, dto.nearLng);
  }

  async resolve(dto: LocationResolveDto) {
    const googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    const expandedMapUrl = dto.mapUrl ? await this.expandShortMapUrl(dto.mapUrl) : undefined;

    const mapDerived = this.extractFromMapUrl(expandedMapUrl || dto.mapUrl || '');
    const query =
      mapDerived.query ||
      dto.query?.trim() ||
      '';

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

    if (googleApiKey) {
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
      suggestions = await this.suggestWithNominatim(query, dto.countryCode, dto.nearLat, dto.nearLng, 1);
    }

    return suggestions[0] || null;
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

    let predictions = await this.fetchGooglePredictions(baseParams, limit, 'establishment');

    // Fallback to broader matching when a strict business-only lookup returns nothing.
    if (predictions.length === 0) {
      predictions = await this.fetchGooglePredictions(baseParams, limit);
    }

    const detailedResults = await Promise.all(
      predictions.map(async (prediction: any) => {
        const details = await this.fetchGooglePlaceDetails(prediction.place_id, key);

        if (!details) {
          return {
            name: prediction.structured_formatting?.main_text || prediction.description || query,
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
          details.address_components?.find((part: any) => part.types?.includes(kind))?.long_name || '';

        const parsedAddress = this.parseFormattedAddress(details.formatted_address || '', details.name || '');
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
  ) {
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

      const data = await response.json();
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return [];
      }

      return Array.isArray(data.predictions) ? data.predictions.slice(0, limit) : [];
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

      const data = await response.json();
      if (data.status !== 'OK' || !data.result) {
        return null;
      }

      return data.result;
    } catch {
      return null;
    }
  }

  private extractTownFromPrediction(prediction: any) {
    const terms = Array.isArray(prediction?.terms) ? prediction.terms : [];
    if (terms.length >= 2) {
      return terms[terms.length - 2]?.value || '';
    }

    return terms[0]?.value || '';
  }

  private extractRoadFromPrediction(prediction: any) {
    const terms = Array.isArray(prediction?.terms) ? prediction.terms : [];
    return terms.length > 0 ? terms[0]?.value || '' : '';
  }

  private parseFormattedAddress(formattedAddress: string, placeName: string) {
    const normalized = (formattedAddress || '').trim();
    if (!normalized) {
      return { road: '', town: '' };
    }

    const parts = normalized.split(',').map((item) => item.trim()).filter(Boolean);
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
      params.set('viewbox', `${nearLng - 0.6},${nearLat + 0.6},${nearLng + 0.6},${nearLat - 0.6}`);
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

    const results = await response.json();

    return (results || []).map((item: any) => {
      const address = item.address || {};
      return {
        name:
          address.shop ||
          address.building ||
          address.attraction ||
          address.amenity ||
          query,
        address: item.display_name || '',
        town: address.town || address.city || address.county || '',
        road: address.road || '',
        landmark:
          address.suburb ||
          address.neighbourhood ||
          address.amenity ||
          address.attraction ||
          '',
        lat: String(item.lat || ''),
        lng: String(item.lon || ''),
        placeId: String(item.place_id || ''),
        source: 'nominatim',
      } as NormalizedLocation;
    });
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
      const q = parsed.searchParams.get('q') || parsed.searchParams.get('query') || '';
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
