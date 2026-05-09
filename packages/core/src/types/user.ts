export type AccountType = 'car_owner' | 'provider' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
  isVerified?: boolean;
  isAvailable?: boolean;
}
