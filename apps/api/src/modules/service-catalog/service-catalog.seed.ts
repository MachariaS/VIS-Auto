import type { ServiceCatalogEntity } from './service-catalog.entity';
import type { Repository } from 'typeorm';

const CATALOG_ENTRIES: Omit<ServiceCatalogEntity, 'id' | 'createdAt'>[] = [
  { code: 'towing', name: 'Towing', category: 'Roadside emergency', description: 'Vehicle tow to garage or customer-specified destination', isActive: true, sortOrder: 1 },
  { code: 'battery_jump_start', name: 'Battery jump start', category: 'Roadside emergency', description: 'Jump start a flat battery on site', isActive: true, sortOrder: 2 },
  { code: 'tyre_change', name: 'Tyre change', category: 'Roadside emergency', description: 'Swap a flat tyre with the vehicle spare', isActive: true, sortOrder: 3 },
  { code: 'lockout_assistance', name: 'Lockout assistance', category: 'Roadside emergency', description: 'Unlock vehicle when keys are locked inside', isActive: true, sortOrder: 4 },
  { code: 'fuel_delivery', name: 'Fuel delivery', category: 'Roadside emergency', description: 'Deliver fuel to a stranded vehicle', isActive: true, sortOrder: 5 },
  { code: 'winching', name: 'Winching', category: 'Roadside emergency', description: 'Pull a vehicle from a ditch, mud, or off-road position', isActive: true, sortOrder: 6 },
  { code: 'fuel_petrol_regular', name: 'Petrol — regular', category: 'Fuel & fluids', description: 'Dispense or deliver regular unleaded petrol', isActive: true, sortOrder: 7 },
  { code: 'fuel_petrol_premium', name: 'Petrol — premium', category: 'Fuel & fluids', description: 'Dispense or deliver premium/V-Power petrol', isActive: true, sortOrder: 8 },
  { code: 'fuel_diesel', name: 'Diesel', category: 'Fuel & fluids', description: 'Dispense or deliver diesel', isActive: true, sortOrder: 9 },
  { code: 'fluid_top_up', name: 'Fluid top-up', category: 'Fuel & fluids', description: 'Refill oil, coolant, brake fluid, or windscreen wash', isActive: true, sortOrder: 10 },
  { code: 'car_wash_exterior', name: 'Car wash (exterior)', category: 'Cleaning & detailing', description: 'Full exterior wash at customer location or station', isActive: true, sortOrder: 11 },
  { code: 'car_wash_full', name: 'Car wash (full)', category: 'Cleaning & detailing', description: 'Interior and exterior wash', isActive: true, sortOrder: 12 },
  { code: 'detailing', name: 'Detailing', category: 'Cleaning & detailing', description: 'Deep clean, polish, wax and interior detailing', isActive: true, sortOrder: 13 },
  { code: 'engine_bay_clean', name: 'Engine bay clean', category: 'Cleaning & detailing', description: 'Engine compartment cleaning', isActive: true, sortOrder: 14 },
  { code: 'on_site_diagnosis', name: 'On-site diagnosis', category: 'Mechanical & repairs', description: 'OBD scan and fault code reading at customer location', isActive: true, sortOrder: 15 },
  { code: 'minor_repairs', name: 'Minor repairs', category: 'Mechanical & repairs', description: 'Small repairs performed at the customer location', isActive: true, sortOrder: 16 },
  { code: 'tyre_fitting', name: 'Tyre fitting', category: 'Mechanical & repairs', description: 'Mount and balance new tyres', isActive: true, sortOrder: 17 },
  { code: 'oil_change', name: 'Oil change', category: 'Mechanical & repairs', description: 'Engine oil and filter replacement', isActive: true, sortOrder: 18 },
];

export async function seedServiceCatalog(repo: Repository<ServiceCatalogEntity>) {
  for (const entry of CATALOG_ENTRIES) {
    const existing = await repo.findOneBy({ code: entry.code });
    if (!existing) {
      await repo.save(repo.create(entry));
    }
  }
}
