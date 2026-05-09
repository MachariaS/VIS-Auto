export const MAKE_TO_SPEC: Record<string, string> = {
  Toyota: 'spec_toyota',
  Lexus: 'spec_toyota',
  Nissan: 'spec_nissan',
  Infiniti: 'spec_nissan',
  Subaru: 'spec_subaru',
  BMW: 'spec_bmw',
  Mini: 'spec_bmw',
  'Mercedes-Benz': 'spec_mercedes',
  'Land Rover': 'spec_land_rover',
  Jaguar: 'spec_land_rover',
  Volkswagen: 'spec_vw_group',
  Audi: 'spec_vw_group',
  Porsche: 'spec_vw_group',
  Skoda: 'spec_vw_group',
  Honda: 'spec_japanese',
  Mazda: 'spec_japanese',
  Mitsubishi: 'spec_japanese',
  Isuzu: 'spec_japanese',
  Daihatsu: 'spec_japanese',
  Suzuki: 'spec_japanese',
  Citroën: 'spec_european',
  Peugeot: 'spec_european',
  Renault: 'spec_european',
  Fiat: 'spec_european',
  Volvo: 'spec_european',
  Tesla: 'spec_ev',
  BYD: 'spec_ev',
};

export const FUEL_BRANDS = ['Shell', 'Total', 'Kenol', 'Kobil', 'Rubis', 'Hass'];

export const DISPATCH_WEIGHTS = {
  distance: 0.4,
  rating: 0.3,
  speed: 0.2,
  price: 0.1,
};
