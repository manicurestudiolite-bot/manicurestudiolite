export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  instagram?: string;
  notes?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  color?: string;
  qty: number;
  lowStockLimit: number;
  priceCents?: number;
  createdAt: string;
}

export interface StockMove {
  id: string;
  productId: string;
  delta: number;
  reason?: string;
  createdAt: string;
}

export type AppointmentStatus = 'PENDENTE' | 'CONCLUIDO' | 'ANTECIPADO';

export interface Appointment {
  id: string;
  userId?: string;
  clientId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  client?: Client;
  service?: Service;
}

export interface ServiceHistory {
  id: string;
  clientId: string;
  serviceId: string;
  date: string;
  priceCents: number;
  service?: Service;
}

export interface UserSettings {
  userId: string;
  notif24h: boolean;
  notif3h: boolean;
  notif1h: boolean;
  theme: 'light' | 'dark' | 'system';
}
