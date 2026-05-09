// Scoring weights — must sum to 100
export const DISPATCH_WEIGHTS = {
  distance: 40,   // max 40 pts — decays linearly, 0 pts at ≥10 km
  rating:   20,   // max 20 pts — avgRating × 4
  brand:    15,   // flat bonus when provider specialises in customer's vehicle brand
  history:  15,   // flat bonus when customer has rated this provider ≥ 4★ before
  floor:    10,   // bonus when provider meets customer's minProviderRating preference
} as const;

// Maps a vehicle make (lowercase) to the matching spec_* catalog code
export const MAKE_TO_SPEC: Record<string, string> = {
  toyota:         'spec_toyota',
  lexus:          'spec_toyota',
  nissan:         'spec_nissan',
  infiniti:       'spec_nissan',
  datsun:         'spec_nissan',
  subaru:         'spec_subaru',
  bmw:            'spec_bmw',
  mini:           'spec_bmw',
  mercedes:       'spec_mercedes',
  'mercedes-benz':'spec_mercedes',
  'land rover':   'spec_land_rover',
  'range rover':  'spec_land_rover',
  jaguar:         'spec_land_rover',
  volkswagen:     'spec_vw_group',
  vw:             'spec_vw_group',
  audi:           'spec_vw_group',
  skoda:          'spec_vw_group',
  seat:           'spec_vw_group',
  porsche:        'spec_vw_group',
  honda:          'spec_japanese',
  mazda:          'spec_japanese',
  mitsubishi:     'spec_japanese',
  isuzu:          'spec_japanese',
  suzuki:         'spec_japanese',
  daihatsu:       'spec_japanese',
  peugeot:        'spec_european',
  renault:        'spec_european',
  citroen:        'spec_european',
  fiat:           'spec_european',
  opel:           'spec_european',
  volvo:          'spec_european',
  ford:           'spec_european',
  tesla:          'spec_ev',
  rivian:         'spec_ev',
  byd:            'spec_ev',
};
