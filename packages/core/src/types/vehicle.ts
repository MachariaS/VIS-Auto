export interface Vehicle {
  id: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  color: string;
  notes?: string;
  userId?: string;
}
