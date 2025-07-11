// Service Catalog & Booking System Types
// Extends the existing Supabase types with comprehensive service management

export interface ServiceCategory {
  id: string;
  name: string;
  name_nl: string;
  name_en: string;
  name_es: string;
  description?: string;
  description_nl?: string;
  description_en?: string;
  description_es?: string;
  icon?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceTemplate {
  id: string;
  category_id: string;
  name: string;
  name_nl: string;
  name_en: string;
  name_es: string;
  description?: string;
  description_nl?: string;
  description_en?: string;
  description_es?: string;
  base_price: number;
  price_unit: 'hour' | 'day' | 'visit' | 'km';
  minimum_duration: number; // in minutes
  call_out_fee: number;
  emergency_premium: number;
  is_emergency_available: boolean;
  languages: string[];
  requirements?: string[];
  inclusions?: string[];
  exclusions?: string[];
  faq?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalService {
  id: string;
  professional_id: string;
  template_id?: string;
  custom_name?: string;
  custom_description?: string;
  custom_price?: number;
  custom_minimum_duration?: number;
  custom_call_out_fee?: number;
  custom_emergency_premium?: number;
  is_emergency_available: boolean;
  languages?: string[];
  specializations?: string[];
  certifications?: string[];
  is_active: boolean;
  is_approved: boolean;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalAvailability {
  id: string;
  professional_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_emergency_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalBlockedDate {
  id: string;
  professional_id: string;
  blocked_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  is_all_day: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  professional_id: string;
  professional_service_id: string;
  
  // Booking details
  booking_date: string;
  start_time: string;
  end_time: string;
  duration: number; // in minutes
  total_amount: number;
  base_amount: number;
  call_out_fee: number;
  emergency_premium: number;
  discount_amount: number;
  
  // Service location
  service_address?: string;
  service_city?: string;
  service_postal_code?: string;
  service_instructions?: string;
  
  // Customer requirements
  special_requirements?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  access_instructions?: string;
  language_preference: string;
  
  // Booking status
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  cancellation_reason?: string;
  cancellation_fee: number;
  
  // Recurring booking
  is_recurring: boolean;
  recurring_pattern?: 'weekly' | 'bi_weekly' | 'monthly';
  recurring_end_date?: string;
  parent_booking_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  payment_method: 'credit_card' | 'ideal' | 'bancontact' | 'paypal' | 'bank_transfer' | 'cash';
  payment_provider?: string;
  transaction_id?: string;
  refund_amount: number;
  refund_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_name: string;
  discount_percentage: number;
  monthly_fee: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relationships
export interface ServiceTemplateWithCategory extends ServiceTemplate {
  category: ServiceCategory;
}

export interface ProfessionalServiceWithTemplate extends ProfessionalService {
  template?: ServiceTemplate;
  professional?: {
    id: string;
    first_name: string;
    last_name: string;
    business_name?: string;
    hourly_rate?: number;
  };
}

export interface BookingWithDetails extends Booking {
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  professional?: {
    id: string;
    first_name: string;
    last_name: string;
    business_name?: string;
    phone?: string;
  };
  professional_service?: ProfessionalServiceWithTemplate;
  payment?: Payment;
}

// API Request/Response types
export interface ServiceSearchParams {
  category?: string;
  location?: string;
  search?: string;
  price_min?: number;
  price_max?: number;
  availability?: string; // 'today', 'tomorrow', 'this_week'
  language?: string;
  emergency?: boolean;
  page?: number;
  limit?: number;
}

export interface ServiceSearchResponse {
  services: ProfessionalServiceWithTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AvailabilityCheckParams {
  professional_id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface AvailabilityCheckResponse {
  is_available: boolean;
  conflicts?: Array<{
    type: 'booking' | 'blocked_date' | 'unavailable';
    message: string;
  }>;
}

export interface CreateBookingRequest {
  professional_service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  service_address?: string;
  service_city?: string;
  service_postal_code?: string;
  service_instructions?: string;
  special_requirements?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  access_instructions?: string;
  language_preference?: string;
  is_recurring?: boolean;
  recurring_pattern?: 'weekly' | 'bi_weekly' | 'monthly';
  recurring_end_date?: string;
}

export interface CreateBookingResponse {
  booking: BookingWithDetails;
  payment_required: boolean;
  payment_amount?: number;
}

export interface PaymentRequest {
  booking_id: string;
  payment_method: 'credit_card' | 'ideal' | 'bancontact' | 'paypal' | 'bank_transfer' | 'cash';
  amount: number;
}

// UI Component types
export interface ServiceCategoryCard {
  category: ServiceCategory;
  service_count: number;
  featured_services: ProfessionalServiceWithTemplate[];
}

export interface ProviderCard {
  professional: {
    id: string;
    first_name: string;
    last_name: string;
    business_name?: string;
    rating: number;
    review_count: number;
    distance?: number;
    languages: string[];
  };
  services: ProfessionalServiceWithTemplate[];
  availability: {
    next_available: string;
    today_available: boolean;
    emergency_available: boolean;
  };
}

export interface BookingCalendarSlot {
  date: string;
  time: string;
  is_available: boolean;
  is_emergency: boolean;
  price: number;
}

export interface BookingFormData {
  // Step 1: Service & Provider Selection
  service_id: string;
  professional_id: string;
  
  // Step 2: Date & Time Selection
  booking_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  
  // Step 3: Service Details
  service_address: string;
  service_city: string;
  service_postal_code: string;
  service_instructions: string;
  
  // Step 4: Customer Requirements
  special_requirements: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  access_instructions: string;
  language_preference: string;
  
  // Step 5: Recurring Options
  is_recurring: boolean;
  recurring_pattern?: 'weekly' | 'bi_weekly' | 'monthly';
  recurring_end_date?: string;
  
  // Step 6: Payment
  payment_method: 'credit_card' | 'ideal' | 'bancontact' | 'paypal' | 'bank_transfer' | 'cash';
  accept_terms: boolean;
}

// Pricing calculation types
export interface PricingBreakdown {
  base_amount: number;
  duration_hours: number;
  call_out_fee: number;
  emergency_premium: number;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
}

// Emergency booking types
export interface EmergencyBookingRequest {
  service_category: string;
  location: {
    address: string;
    city: string;
    postal_code: string;
  };
  urgency_level: 'high' | 'medium' | 'low';
  description: string;
  contact_phone: string;
  preferred_language: string;
}

// Multi-language content types
export interface LocalizedContent {
  nl: string;
  en: string;
  es: string;
}

export interface ServiceLocalizedContent {
  name: LocalizedContent;
  description: LocalizedContent;
  requirements?: LocalizedContent[];
  inclusions?: LocalizedContent[];
  exclusions?: LocalizedContent[];
}

// Filter and search types
export interface ServiceFilters {
  categories: string[];
  price_range: [number, number];
  availability: string[];
  languages: string[];
  emergency_only: boolean;
  rating_min: number;
  distance_max: number;
}

export interface SearchSuggestion {
  type: 'service' | 'category' | 'provider';
  id: string;
  name: string;
  name_nl: string;
  name_en: string;
  name_es: string;
  relevance: number;
} 