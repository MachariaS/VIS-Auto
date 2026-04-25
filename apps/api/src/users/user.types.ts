export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  accountType: 'car_owner' | 'provider';
  profile?: Record<string, unknown>;
  passwordHash: string;
  createdAt: string;
}
