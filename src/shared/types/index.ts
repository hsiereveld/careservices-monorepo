export * from './auth'
export * from './booking'
export * from './service'
export * from './user'
export * from './payment'

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  role: 'customer' | 'professional' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number; // in minutes
  images: string[];
  professional_id: string;
  professional?: Professional;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Professional {
  id: string;
  user_id: string;
  user?: User;
  business_name: string;
  description: string;
  services: Service[];
  rating: number;
  reviews_count: number;
  location: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  customer?: User;
  professional_id: string;
  professional?: Professional;
  service_id: string;
  service?: Service;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  booking?: Booking;
  customer_id: string;
  customer?: User;
  professional_id: string;
  professional?: Professional;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  booking?: Booking;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  stripe_payment_id?: string;
  created_at: string;
  updated_at: string;
}

// Dashboard types
export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  avgRating: number;
  completedServices: number;
  growthRate: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface BookingFormData {
  service_id: string;
  booking_date: string;
  booking_time: string;
  notes?: string;
}

export interface ServiceFormData {
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  images?: File[];
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  avatar?: File;
}

// Constants
export const SERVICE_CATEGORIES = [
  'Limpieza',
  'Jardinería',
  'Reparaciones',
  'Cuidado Personal',
  'Tecnología',
  'Otros'
] as const;

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled'
] as const;

export const USER_ROLES = [
  'customer',
  'professional',
  'admin'
] as const; 