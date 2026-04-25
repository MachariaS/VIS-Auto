import type { ServiceCatalogEntity } from './service-catalog.entity';
import type { Repository } from 'typeorm';

const CATALOG_ENTRIES: Omit<ServiceCatalogEntity, 'id' | 'createdAt'>[] = [
  // ── Roadside emergency ─────────────────────────────────────────────────────
  { code: 'towing', name: 'Towing', category: 'Roadside emergency', description: 'Vehicle tow to garage or customer-specified destination', isActive: true, sortOrder: 1 },
  { code: 'battery_jump_start', name: 'Battery jump start', category: 'Roadside emergency', description: 'Jump start a flat battery on site', isActive: true, sortOrder: 2 },
  { code: 'tyre_change', name: 'Tyre change', category: 'Roadside emergency', description: 'Swap a flat tyre with the vehicle spare', isActive: true, sortOrder: 3 },
  { code: 'lockout_assistance', name: 'Lockout assistance', category: 'Roadside emergency', description: 'Unlock vehicle when keys are locked inside', isActive: true, sortOrder: 4 },
  { code: 'fuel_delivery', name: 'Fuel delivery', category: 'Roadside emergency', description: 'Deliver fuel to a stranded vehicle', isActive: true, sortOrder: 5 },
  { code: 'winching', name: 'Winching', category: 'Roadside emergency', description: 'Pull a vehicle from a ditch, mud, or off-road position', isActive: true, sortOrder: 6 },

  // ── Fuel & fluids ──────────────────────────────────────────────────────────
  { code: 'fuel_petrol_regular', name: 'Petrol — regular', category: 'Fuel & fluids', description: 'Dispense or deliver regular unleaded petrol', isActive: true, sortOrder: 10 },
  { code: 'fuel_petrol_premium', name: 'Petrol — premium', category: 'Fuel & fluids', description: 'Dispense or deliver premium/V-Power petrol', isActive: true, sortOrder: 11 },
  { code: 'fuel_diesel', name: 'Diesel', category: 'Fuel & fluids', description: 'Dispense or deliver diesel', isActive: true, sortOrder: 12 },
  { code: 'fluid_top_up', name: 'Fluid top-up', category: 'Fuel & fluids', description: 'Refill oil, coolant, brake fluid, or windscreen wash', isActive: true, sortOrder: 13 },

  // ── Mechanical & repairs ───────────────────────────────────────────────────
  { code: 'on_site_diagnosis', name: 'On-site diagnosis', category: 'Mechanical & repairs', description: 'OBD scan and fault code reading at customer location', isActive: true, sortOrder: 20 },
  { code: 'oil_change', name: 'Oil change', category: 'Mechanical & repairs', description: 'Engine oil and filter replacement', isActive: true, sortOrder: 21 },
  { code: 'minor_repairs', name: 'Minor repairs', category: 'Mechanical & repairs', description: 'Small repairs performed at the customer location', isActive: true, sortOrder: 22 },
  { code: 'tyre_fitting', name: 'Tyre fitting', category: 'Mechanical & repairs', description: 'Mount and balance new tyres', isActive: true, sortOrder: 23 },
  { code: 'brake_pad_replacement', name: 'Brake pad replacement', category: 'Mechanical & repairs', description: 'Brake pads replaced on one or both axles', isActive: true, sortOrder: 24 },
  { code: 'brake_disc_replacement', name: 'Brake disc replacement', category: 'Mechanical & repairs', description: 'Brake disc/rotor replacement', isActive: true, sortOrder: 25 },
  { code: 'brake_fluid_flush', name: 'Brake fluid flush', category: 'Mechanical & repairs', description: 'Full brake system fluid replacement', isActive: true, sortOrder: 26 },
  { code: 'clutch_replacement', name: 'Clutch replacement', category: 'Mechanical & repairs', description: 'Clutch disc, pressure plate, and release bearing', isActive: true, sortOrder: 27 },
  { code: 'gearbox_service', name: 'Gearbox service', category: 'Mechanical & repairs', description: 'Gearbox oil change and internal inspection', isActive: true, sortOrder: 28 },
  { code: 'cv_joint_replacement', name: 'CV joint replacement', category: 'Mechanical & repairs', description: 'Constant velocity joint replacement', isActive: true, sortOrder: 29 },
  { code: 'timing_belt_service', name: 'Timing belt service', category: 'Mechanical & repairs', description: 'Timing belt, tensioner, and water pump replacement', isActive: true, sortOrder: 30 },
  { code: 'radiator_service', name: 'Radiator service', category: 'Mechanical & repairs', description: 'Coolant flush, radiator repair or replacement', isActive: true, sortOrder: 31 },

  // ── Engine & tuning ────────────────────────────────────────────────────────
  { code: 'full_engine_service', name: 'Full engine service', category: 'Engine & tuning', description: 'Comprehensive engine inspection, plugs, filters, and service', isActive: true, sortOrder: 40 },
  { code: 'ecu_remap', name: 'ECU remapping', category: 'Engine & tuning', description: 'Performance or economy engine management tuning', isActive: true, sortOrder: 41 },
  { code: 'turbo_service', name: 'Turbo / supercharger service', category: 'Engine & tuning', description: 'Turbocharger or supercharger inspection, service and repair', isActive: true, sortOrder: 42 },
  { code: 'exhaust_service', name: 'Exhaust system service', category: 'Engine & tuning', description: 'Exhaust repair, replacement or performance upgrade', isActive: true, sortOrder: 43 },
  { code: 'air_intake_service', name: 'Intake & air filter service', category: 'Engine & tuning', description: 'Performance air intake fitting or air filter replacement', isActive: true, sortOrder: 44 },
  { code: 'engine_rebuild', name: 'Engine rebuild', category: 'Engine & tuning', description: 'Partial or full engine rebuild', isActive: true, sortOrder: 45 },

  // ── Electrical & electronics ───────────────────────────────────────────────
  { code: 'electrical_diagnosis', name: 'Electrical diagnosis', category: 'Electrical & electronics', description: 'Full electrical system scan and fault finding', isActive: true, sortOrder: 50 },
  { code: 'battery_replacement', name: 'Battery replacement', category: 'Electrical & electronics', description: 'Source and fit a new battery', isActive: true, sortOrder: 51 },
  { code: 'alternator_repair', name: 'Alternator / starter repair', category: 'Electrical & electronics', description: 'Charging and starting system diagnosis and repair', isActive: true, sortOrder: 52 },
  { code: 'car_audio_install', name: 'Car audio installation', category: 'Electrical & electronics', description: 'Head unit, speakers, subwoofer and amplifier fitting', isActive: true, sortOrder: 53 },
  { code: 'camera_alarm_install', name: 'Camera & alarm fitting', category: 'Electrical & electronics', description: 'Reverse camera, dashcam, or alarm and immobiliser system', isActive: true, sortOrder: 54 },
  { code: 'lighting_upgrade', name: 'Lighting upgrade', category: 'Electrical & electronics', description: 'LED/HID headlight, DRL, or interior lighting installation', isActive: true, sortOrder: 55 },

  // ── Body & paint ───────────────────────────────────────────────────────────
  { code: 'dent_repair', name: 'Dent repair (PDR)', category: 'Body & paint', description: 'Paintless dent removal — no filler, no repainting', isActive: true, sortOrder: 60 },
  { code: 'scratch_repair', name: 'Scratch & touch-up', category: 'Body & paint', description: 'Touch-up paint and blending for minor scratches', isActive: true, sortOrder: 61 },
  { code: 'panel_beating', name: 'Panel beating', category: 'Body & paint', description: 'Structural body panel repair after impact or collision', isActive: true, sortOrder: 62 },
  { code: 'full_respray', name: 'Full respray', category: 'Body & paint', description: 'Complete vehicle repaint — single colour or custom', isActive: true, sortOrder: 63 },
  { code: 'windscreen_service', name: 'Windscreen repair / replacement', category: 'Body & paint', description: 'Chip repair or full windscreen replacement', isActive: true, sortOrder: 64 },
  { code: 'rust_treatment', name: 'Rust treatment', category: 'Body & paint', description: 'Rust removal, treatment and undercoating', isActive: true, sortOrder: 65 },

  // ── Suspension & alignment ─────────────────────────────────────────────────
  { code: 'wheel_alignment', name: 'Wheel alignment', category: 'Suspension & alignment', description: 'Four-wheel alignment using laser or computerised equipment', isActive: true, sortOrder: 70 },
  { code: 'wheel_balancing', name: 'Wheel balancing', category: 'Suspension & alignment', description: 'Dynamic wheel balance on all four corners', isActive: true, sortOrder: 71 },
  { code: 'shock_absorber_service', name: 'Shock absorber service', category: 'Suspension & alignment', description: 'Shock absorber and strut inspection and replacement', isActive: true, sortOrder: 72 },
  { code: 'suspension_service', name: 'Suspension service', category: 'Suspension & alignment', description: 'Bushings, ball joints, tie rods, and linkage service', isActive: true, sortOrder: 73 },
  { code: 'rim_repair', name: 'Rim repair', category: 'Suspension & alignment', description: 'Alloy wheel repair, straightening and refinishing', isActive: true, sortOrder: 74 },

  // ── Air conditioning ───────────────────────────────────────────────────────
  { code: 'ac_regas', name: 'AC regas & service', category: 'Air conditioning', description: 'Refrigerant top-up and full AC system health check', isActive: true, sortOrder: 80 },
  { code: 'ac_repair', name: 'AC repair', category: 'Air conditioning', description: 'Compressor, condenser, evaporator or pipe repair', isActive: true, sortOrder: 81 },
  { code: 'cabin_filter_replacement', name: 'Cabin filter replacement', category: 'Air conditioning', description: 'Pollen and cabin air filter replacement', isActive: true, sortOrder: 82 },

  // ── Cleaning & detailing ───────────────────────────────────────────────────
  { code: 'car_wash_exterior', name: 'Car wash (exterior)', category: 'Cleaning & detailing', description: 'Full exterior wash at customer location or station', isActive: true, sortOrder: 90 },
  { code: 'car_wash_full', name: 'Car wash (full)', category: 'Cleaning & detailing', description: 'Interior and exterior wash', isActive: true, sortOrder: 91 },
  { code: 'detailing', name: 'Detailing', category: 'Cleaning & detailing', description: 'Deep clean, polish, wax and interior detailing', isActive: true, sortOrder: 92 },
  { code: 'engine_bay_clean', name: 'Engine bay clean', category: 'Cleaning & detailing', description: 'Engine compartment degreasing and cleaning', isActive: true, sortOrder: 93 },
  { code: 'ceramic_coating', name: 'Ceramic coating', category: 'Cleaning & detailing', description: 'Professional paint protection ceramic coating application', isActive: true, sortOrder: 94 },
  { code: 'ppf_wrap', name: 'Paint protection film / wrap', category: 'Cleaning & detailing', description: 'PPF or vinyl wrap installation for paint protection', isActive: true, sortOrder: 95 },

  // ── Vehicle inspection ─────────────────────────────────────────────────────
  { code: 'pre_purchase_inspection', name: 'Pre-purchase inspection', category: 'Vehicle inspection', description: 'Thorough mechanical and body inspection before buying', isActive: true, sortOrder: 100 },
  { code: 'roadworthy_inspection', name: 'Roadworthy inspection', category: 'Vehicle inspection', description: 'Annual safety and compliance inspection', isActive: true, sortOrder: 101 },
  { code: 'insurance_inspection', name: 'Insurance inspection', category: 'Vehicle inspection', description: 'Inspection report for insurance or valuation purposes', isActive: true, sortOrder: 102 },

  // ── Vehicle specialisation ─────────────────────────────────────────────────
  { code: 'spec_toyota', name: 'Toyota / Lexus specialist', category: 'Vehicle specialisation', description: 'Specialist servicing for Toyota and Lexus models', isActive: true, sortOrder: 110 },
  { code: 'spec_nissan', name: 'Nissan / Infiniti specialist', category: 'Vehicle specialisation', description: 'Specialist servicing for Nissan and Infiniti models', isActive: true, sortOrder: 111 },
  { code: 'spec_subaru', name: 'Subaru specialist', category: 'Vehicle specialisation', description: 'Specialist servicing for Subaru all-wheel-drive vehicles', isActive: true, sortOrder: 112 },
  { code: 'spec_bmw', name: 'BMW / Mini specialist', category: 'Vehicle specialisation', description: 'Specialist servicing for BMW and Mini models', isActive: true, sortOrder: 113 },
  { code: 'spec_mercedes', name: 'Mercedes-Benz / AMG specialist', category: 'Vehicle specialisation', description: 'Specialist servicing for Mercedes-Benz and AMG models', isActive: true, sortOrder: 114 },
  { code: 'spec_land_rover', name: 'Land Rover / Range Rover specialist', category: 'Vehicle specialisation', description: 'Specialist servicing for Land Rover and Range Rover', isActive: true, sortOrder: 115 },
  { code: 'spec_vw_group', name: 'VW Group specialist', category: 'Vehicle specialisation', description: 'Specialist for VW, Audi, Skoda, and SEAT vehicles', isActive: true, sortOrder: 116 },
  { code: 'spec_japanese', name: 'Japanese vehicles (general)', category: 'Vehicle specialisation', description: 'All Japanese makes — Toyota, Honda, Mazda, Mitsubishi, Suzuki', isActive: true, sortOrder: 117 },
  { code: 'spec_european', name: 'European vehicles (general)', category: 'Vehicle specialisation', description: 'All European makes — Peugeot, Renault, Volvo, Fiat, and more', isActive: true, sortOrder: 118 },
  { code: 'spec_ev', name: 'Electric vehicle (EV) specialist', category: 'Vehicle specialisation', description: 'EV and hybrid vehicle diagnostics and servicing', isActive: true, sortOrder: 119 },
];

export async function seedServiceCatalog(repo: Repository<ServiceCatalogEntity>) {
  for (const entry of CATALOG_ENTRIES) {
    const existing = await repo.findOneBy({ code: entry.code });
    if (!existing) {
      await repo.save(repo.create(entry));
    }
  }
}
