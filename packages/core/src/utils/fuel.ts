import type { ProviderService } from '../types/provider';

interface FuelForm {
  fuelLitres?: string | number;
  customFuelLitres?: string | number;
  fuelType?: string;
  gasolineGrade?: string;
}

export function getSelectedFuelLitres(form: FuelForm): number {
  return form.fuelLitres === 'custom'
    ? Number(form.customFuelLitres || 0)
    : Number(form.fuelLitres || 0);
}

export function getFuelUnitPrice(service: ProviderService | null | undefined, form: FuelForm): number {
  if (!service || service.serviceCode !== 'fuel_delivery') {
    return 0;
  }
  if (form.fuelType === 'diesel') {
    return service.fuelPricing?.diesel?.standard ?? 0;
  }
  return form.gasolineGrade === 'vpower'
    ? service.fuelPricing?.gasoline?.vpower ?? 0
    : service.fuelPricing?.gasoline?.regular ?? 0;
}
