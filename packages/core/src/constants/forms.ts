export const initialVehicle = {
  nickname: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  registrationNumber: '',
  color: '',
  notes: '',
};

export const initialRoadsideRequest = {
  vehicleId: '',
  providerServiceId: '',
  distanceKm: '8',
  latitude: '',
  longitude: '',
  address: '',
  landmark: '',
  notes: '',
  fuelLitres: '10',
  customFuelLitres: '',
  fuelType: 'gasoline',
  gasolineGrade: 'regular',
};

export const initialProviderService = {
  serviceName: '',
  serviceCode: 'battery_jump',
  basePriceKsh: '1500',
  pricePerKmKsh: '150',
  description: '',
  gasolineRegularPrice: '',
  gasolineVPowerPrice: '',
  dieselPrice: '',
};

export const initialRegister = {
  name: '',
  email: '',
  phone: '',
  accountType: 'car_owner',
  password: '',
};

export const initialLogin = {
  email: '',
  password: '',
};

export const initialVerify = {
  email: '',
  otp: '',
};

export const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
