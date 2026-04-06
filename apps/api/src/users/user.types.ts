export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  accountType: 'customer' | 'provider';
  passwordHash: string;
  createdAt: string;
}
