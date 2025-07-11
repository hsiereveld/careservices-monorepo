// Consolidated Booking Types - Single Source of Truth
// This file contains all booking-related types used across the platform

export interface Booking {
  id: string;
  provider_id: string;
  service_id: string;
  customer_id: string;
  booking_date: string;
  booking_time: string;
  duration_hours: number;
  final_price: number;
  notes?: string;
  emergency_booking: boolean;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface BookingWithRelations extends Booking {
  service_providers: {
    id: string;
    user_id: string;
    business_name: string;
    rating_average: number;
    total_bookings: number;
  };
  services: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_hours: number;
  };
  customers: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateBookingRequest {
  provider_id: string;
  service_id: string;
  customer_id?: string; // Optional for customer endpoints (auto-filled)
  booking_date: string;
  booking_time: string;
  duration_hours?: number;
  notes?: string;
  emergency_booking?: boolean;
}

export interface BookingResponse {
  booking: BookingWithRelations;
  message?: string;
}

export interface BookingsListResponse {
  bookings: BookingWithRelations[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AvailabilitySlot {
  time: string;
  is_available: boolean;
  is_emergency: boolean;
}

export interface AvailabilityResponse {
  availability_slots: AvailabilitySlot[];
  professional_id: string;
  date: string;
  service_id?: string;
  total_slots: number;
  available_slots: number;
}

export interface AvailabilityCheckRequest {
  professional_id: string;
  service_id?: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface AvailabilityCheckResponse {
  available: boolean;
  conflicts: any[];
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

// Frontend compatibility types (for backward compatibility)
export interface BookingForFrontend {
  id: string;
  professional_id: string; // Maps to provider_id
  service_id: string;
  customer_id: string;
  scheduled_date: string; // Maps to booking_date
  scheduled_time: string; // Maps to booking_time
  start_time: string; // Maps to booking_time
  end_time: string; // Calculated from booking_time + duration
  duration_hours: number;
  total_amount: number; // Maps to final_price
  notes?: string;
  emergency_booking: boolean;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  // Related data
  service?: {
    name: string;
    description: string;
    price: number;
  };
  professional?: {
    business_name: string;
    rating_average: number;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Utility functions for type conversion
export function transformBookingForFrontend(booking: BookingWithRelations): BookingForFrontend {
  const endTime = new Date(`2000-01-01T${booking.booking_time}:00`);
  endTime.setHours(endTime.getHours() + booking.duration_hours);
  
  return {
    id: booking.id,
    professional_id: booking.provider_id,
    service_id: booking.service_id,
    customer_id: booking.customer_id,
    scheduled_date: booking.booking_date,
    scheduled_time: booking.booking_time,
    start_time: booking.booking_time,
    end_time: endTime.toTimeString().slice(0, 5),
    duration_hours: booking.duration_hours,
    total_amount: booking.final_price,
    notes: booking.notes,
    emergency_booking: booking.emergency_booking,
    status: booking.status,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
    service: {
      name: booking.services.name,
      description: booking.services.description,
      price: booking.services.price,
    },
    professional: {
      business_name: booking.service_providers.business_name,
      rating_average: booking.service_providers.rating_average,
    },
    customer: {
      first_name: booking.customers.first_name,
      last_name: booking.customers.last_name,
      email: booking.customers.email,
    },
  };
}

export function transformFrontendToBackend(booking: Partial<BookingForFrontend>): Partial<CreateBookingRequest> {
  return {
    provider_id: booking.professional_id,
    service_id: booking.service_id,
    booking_date: booking.scheduled_date,
    booking_time: booking.scheduled_time || booking.start_time,
    duration_hours: booking.duration_hours,
    notes: booking.notes,
    emergency_booking: booking.emergency_booking,
  };
}