import { createClient } from '@supabase/supabase-js';
import { calculateEstimatedPrice } from '../utils/bookingPriceCalculator';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced error checking and logging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseAnonKey ? 'Present' : 'Missing',
    env: import.meta.env
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format and ensure it's a proper Supabase URL
try {
  const url = new URL(supabaseUrl);
  if (!url.hostname.includes('supabase.co')) {
    throw new Error('Invalid Supabase URL format');
  }
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in .env file.');
}

// Create Supabase client with enhanced configuration for better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    },
    fetch: (url, options = {}) => {
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId);
      }).catch((error) => {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your internet connection');
        }
        throw error;
      });
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection function with better error reporting
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key present:', !!supabaseAnonKey);
    
    const { data, error: fetchError } = await supabase
      .from('service_categories')
      .select('count')
      .limit(1);
    
    if (fetchError) {
      console.error('Supabase connection test failed:', fetchError);
      return { success: false, error: fetchError };
    }
    
    console.log('Supabase connection test successful');
    return { success: true, data };
  } catch (error) {
    console.error('Supabase connection test error:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        success: false, 
        error: {
          message: 'Network error - unable to reach Supabase. Please check your internet connection and Supabase URL.',
          details: error.message
        }
      };
    }
    
    return { success: false, error };
  }
};

// Initialize connection test on module load
testConnection().catch(console.error);

type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  bio: string | null;
  avatar_url: string | null;
  instroom_completed?: boolean;
  created_at: string;
  updated_at: string;
};

type UserRole = {
  id: string;
  user_id: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
};

type AdminUserOverview = {
  id: string;
  email: string;
  user_created_at: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'user' | 'admin';
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
};

type AdminTaskOverview = Task & {
  user_email: string;
  first_name: string | null;
  last_name: string | null;
  user_display_name: string;
};

// Service Management Types - Updated to match actual database schema
export type ClientType = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ServiceCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  image_url?: string;
  color_scheme?: string;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  name: string;
  short_description: string;
  full_description: string;
  category_id: string | null;
  target_audience: string;
  is_active: boolean;
  is_featured?: boolean;
  sort_order: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
  category?: ServiceCategory;
};

export type ServiceDetail = {
  id: string;
  service_id: string;
  detail_type: string;
  detail_value: string;
  created_at: string;
  updated_at: string;
};

// Price unit type for pricing tiers
export type PriceUnitType = 'per_hour' | 'per_day' | 'per_service' | 'per_km' | 'per_item' | 'per_month' | 'per_week';

export type PricingTier = {
  id: string;
  service_id: string;
  tier_name: string;
  price: number;
  duration_minutes: number;
  description: string;
  is_active: boolean;
  cost_price?: number;
  admin_percentage?: number;
  vat_rate?: number;
  margin_percentage?: number;
  price_unit: PriceUnitType;
  created_at: string;
  updated_at: string;
};

type ServiceAvailability = {
  id: string;
  service_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceRequirement = {
  id: string;
  service_id: string;
  requirement_type: string;
  requirement_value: string;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceClientType = {
  id: string;
  service_id: string;
  client_type_id: string;
  created_at: string;
};

// Extended types with relationships
export type ServiceWithDetails = Service & {
  category?: ServiceCategory;
  details?: ServiceDetail[];
  pricing_tiers?: PricingTier[];
  availability?: ServiceAvailability[];
  requirements?: ServiceRequirement[];
  client_types?: (ServiceClientType & { client_type: ClientType })[];
};

type CategoryWithServices = ServiceCategory & {
  services?: Service[];
  subcategories?: ServiceCategory[];
};

// Homepage Content Types
type HomepageImage = {
  id: string;
  section: string;
  image_type: string;
  image_url: string;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Testimonial = {
  id: string;
  content: string;
  author_name: string;
  author_role: string | null;
  author_image_url: string | null;
  rating: number;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type HomepageStat = {
  id: string;
  name: string;
  value: string;
  icon: string | null;
  color: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// NEW: Booking System Types
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
type UrgencyLevel = 'normal' | 'urgent' | 'flexible';

export type ServiceProvider = {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
  postal_code: string | null;
  service_radius_km: number;
  hourly_rate: number | null;
  is_active: boolean;
  is_verified: boolean;
  rating_average: number;
  total_reviews: number;
  total_bookings: number;
  joined_at: string;
  created_at: string;
  updated_at: string;
  // New fields for professional onboarding
  bank_account_number?: string;
  vat_number?: string;
  company_registration_number?: string;
  payment_terms?: string;
};

export type ProviderService = {
  id: string;
  provider_id: string;
  service_id: string;
  custom_price: number | null;
  is_available: boolean;
  created_at: string;
  service?: Service;
  provider?: ServiceProvider;
  // Custom fields
  custom_name?: string;
  custom_short_description?: string;
  custom_full_description?: string;
  custom_price_unit?: PriceUnitType;
  custom_duration_minutes?: number;
  custom_target_audience?: string;
  custom_image_url?: string;
  // Review fields
  review_status?: 'pending_review' | 'approved' | 'rejected';
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  display_category_id?: string;
  display_category?: ServiceCategory;
  // Commission rate override
  commission_rate_override?: number | null;
};

export type Booking = {
  id: string;
  customer_id: string;
  provider_id: string | null;
  service_id: string;
  
  // Booking details
  booking_date: string;
  booking_time: string;
  duration_hours: number;
  estimated_price: number | null;
  final_price: number | null;
  
  // Status and workflow
  status: BookingStatus;
  urgency: UrgencyLevel;
  
  // Customer information
  customer_notes: string;
  special_requirements: string;
  customer_address: string | null;
  customer_phone: string | null;
  
  // Provider information
  provider_notes: string;
  provider_arrival_time: string | null;
  provider_completion_time: string | null;
  
  // Timestamps
  requested_at: string;
  confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  
  created_at: string;
  updated_at: string;
  
  // Additional fields
  booking_start_date?: string;
  booking_start_time?: string;
  booking_end_date?: string;
  booking_end_time?: string;
  duration_days?: number;
  
  // Discount and subscription
  discount_id?: string | null;
  discount_amount?: number;
  subscription_id?: string | null;
  subscription_hours_used?: number;
  
  // Recurring bookings
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  parent_booking_id?: string | null;
  
  // Bundle
  bundle_id?: string | null;
};

type BookingStatusHistory = {
  id: string;
  booking_id: string;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  changed_by: string | null;
  change_reason: string | null;
  notes: string | null;
  created_at: string;
};

type BookingReview = {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  
  rating: number;
  review_text: string | null;
  would_recommend: boolean;
  
  // Review categories
  punctuality_rating: number | null;
  quality_rating: number | null;
  communication_rating: number | null;
  
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

// Extended types with relationships
export type BookingWithDetails = Booking & {
  customer?: Profile;
  provider?: ServiceProvider;
  service?: Service;
  status_history?: BookingStatusHistory[];
  review?: BookingReview;
  professional_earning?: number; // Added field for professional earnings
  service_price?: number; // Added field for service base price
  service_price_unit?: PriceUnitType; // Added field for service price unit
};

type ServiceProviderWithDetails = ServiceProvider & {
  user?: Profile;
  services?: (ProviderService & { service: Service })[];
  reviews?: BookingReview[];
  bookings?: Booking[];
};

// App Settings Type
type AppSettings = {
  id: string;
  admin_percentage_default: number;
  created_at: string;
  updated_at: string;
};

// Subscription Plan Types
export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  included_hours: number;
  discount_percentage: number;
  admin_percentage: number;
  features: string[]; // Assuming this is stored as JSONB array of strings
  is_active: boolean;
  sort_order: number;
  price_unit: PriceUnitType; // New field for price unit
  created_at: string;
  updated_at: string;
};

type UserSubscription = {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_auto_renew: boolean;
  hours_used: number;
  hours_remaining: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  last_payment_date: string | null;
  next_payment_date: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan; // Optional relation
};

// Discount Types
export type DiscountType = {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Discount = {
  id: string;
  discount_type_id: string | null;
  user_id: string | null;
  code: string | null;
  description: string;
  amount: number | null;
  percentage: number | null;
  is_percentage: boolean;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  discount_type?: DiscountType; // Optional relation
};

// Service Bundle Types
export type ServiceBundle = {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_percentage: number;
  admin_percentage: number;
  is_active: boolean;
  sort_order: number;
  price_unit: PriceUnitType;
  created_at: string;
  updated_at: string;
  services?: BundleService[]; // Optional relation
};

export type BundleService = {
  id: string;
  bundle_id: string;
  service_id: string;
  custom_price: number | null;
  discount_percentage: number | null;
  created_at: string;
  service?: Service; // Optional relation
};

// Availability Types
type ProviderAvailability = {
  id: string;
  provider_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  time_slot: string; // 'morning', 'afternoon', 'evening'
  is_active: boolean;
  start_time?: string;
  end_time?: string;
  availability_type?: string; // 'general', 'specific', 'blocked'
  created_at: string;
  updated_at: string;
};

type ProviderAvailabilitySlot = {
  id: string;
  provider_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  slot_type: 'regular' | 'custom' | 'holiday';
  notes?: string;
  created_at: string;
  updated_at: string;
};

type ProviderBlockedDate = {
  id: string;
  provider_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  is_recurring: boolean;
  recurrence_pattern?: 'yearly' | 'monthly' | 'weekly';
  created_at: string;
  updated_at: string;
};

// App Settings API Functions
export const appSettingsAPI = {
  // Get the global admin percentage
  async getGlobalAdminPercentage(): Promise<{ data: number | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_admin_percentage');
      
      if (error) {
        console.error('Error getting global admin percentage:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error getting global admin percentage:', error);
      return { data: null, error };
    }
  },

  // Update the global admin percentage
  async updateGlobalAdminPercentage(percentage: number): Promise<{ success: boolean; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('update_global_admin_percentage', { new_percentage: percentage });
      
      if (error) {
        console.error('Error updating global admin percentage:', error);
        return { success: false, error };
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error updating global admin percentage:', error);
      return { success: false, error };
    }
  },

  // Get all app settings
  async getAppSettings(): Promise<{ data: AppSettings | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error getting app settings:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error getting app settings:', error);
      return { data: null, error };
    }
  }
};

// Booking API Functions - Enhanced with better error handling
export const bookingAPI = {
  // Create a new booking
  async createBooking(bookingData: Partial<Booking>) {
    try {
      console.log('Creating booking with data:', bookingData);
      
      // Remove any fields that don't exist in the database schema
      const { discount_code, ...validBookingData } = bookingData as any;
      
      // Calculate estimated price if not provided
      if (!validBookingData.estimated_price && validBookingData.service_id) {
        try {
          // First check if there's a provider service with custom price
          if (validBookingData.provider_id) {
            const { data: providerServices } = await supabase
              .from('provider_services')
              .select('custom_price, custom_price_unit')
              .eq('provider_id', validBookingData.provider_id)
              .eq('service_id', validBookingData.service_id)
              .eq('is_available', true)
              .single();
              
            if (providerServices && providerServices.custom_price) {
              // Use the provider's custom price
              validBookingData.estimated_price = calculateEstimatedPrice(
                providerServices.custom_price,
                providerServices.custom_price_unit,
                validBookingData.booking_start_date,
                validBookingData.booking_start_time,
                validBookingData.booking_end_date,
                validBookingData.booking_end_time
              );
              
              console.log('Calculated estimated price from provider custom price:', validBookingData.estimated_price);
            }
          }
          
          // If no provider custom price, fall back to service pricing tier
          if (!validBookingData.estimated_price) {
            // Get the service pricing tier
            const { data: pricingTiers } = await supabase
              .from('pricing_tiers')
              .select('*')
              .eq('service_id', validBookingData.service_id)
              .order('price', { ascending: true })
              .limit(1);
              
            if (pricingTiers && pricingTiers.length > 0) {
              const pricingTier = pricingTiers[0];
              
              // Calculate estimated price based on duration and price unit
              validBookingData.estimated_price = calculateEstimatedPrice(
                pricingTier.price,
                pricingTier.price_unit,
                validBookingData.booking_start_date,
                validBookingData.booking_start_time,
                validBookingData.booking_end_date,
                validBookingData.booking_end_time
              );
              
              console.log('Calculated estimated price from pricing tier:', validBookingData.estimated_price);
            }
          }
        } catch (priceError) {
          console.error('Error calculating estimated price:', priceError);
        }
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([validBookingData])
        .select(`
          *,
          service:services(*)
        `)
        .single();
      
      if (error) {
        console.error('Error creating booking:', error);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected error creating booking:', error);
      return { data: null, error };
    }
  },

  // Get bookings for a customer - Enhanced with error handling
  async getCustomerBookings(customerId: string) {
    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(*),
          provider:service_providers(*),
          status_history:booking_status_history(*),
          review:booking_reviews(*)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching customer bookings:', fetchError);
        return { data: null, error: fetchError };
      }

      // Fetch customer profile separately if needed
      let customerProfile = null;
      if (data && data.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', customerId)
          .maybeSingle();
        customerProfile = profile;
      }

      // Process each booking to ensure estimated price is calculated correctly
      const bookingsWithDetails = await Promise.all((data || []).map(async (booking) => {
        // First check if there's a provider service with custom price
        let customPrice = null;
        let customPriceUnit = null;
        
        if (booking.provider_id && booking.service_id) {
          const { data: providerService } = await supabase
            .from('provider_services')
            .select('custom_price, custom_price_unit')
            .eq('provider_id', booking.provider_id)
            .eq('service_id', booking.service_id)
            .maybeSingle();
            
          if (providerService && providerService.custom_price) {
            customPrice = providerService.custom_price;
            customPriceUnit = providerService.custom_price_unit;
          }
        }
        
        // If no provider custom price, get the service pricing tier
        let pricingTier = null;
        if (!customPrice && booking.service_id) {
          const { data: pricingTiers } = await supabase
            .from('pricing_tiers')
            .select('*')
            .eq('service_id', booking.service_id)
            .order('price', { ascending: true })
            .limit(1);
            
          if (pricingTiers && pricingTiers.length > 0) {
            pricingTier = pricingTiers[0];
          }
        }
        
        // Calculate estimated price if needed
        let estimatedPrice = booking.estimated_price;
        if ((customPrice || pricingTier) && (estimatedPrice === null || estimatedPrice === 0)) {
          estimatedPrice = calculateEstimatedPrice(
            customPrice || (pricingTier?.price || 0),
            customPriceUnit || (pricingTier?.price_unit || 'per_hour'),
            booking.booking_start_date || booking.booking_date,
            booking.booking_start_time || booking.booking_time,
            booking.booking_end_date,
            booking.booking_end_time,
            booking.duration_hours,
            booking.duration_days
          );
        }
        
        return {
          ...booking,
          customer: customerProfile,
          estimated_price: estimatedPrice,
          service_price: customPrice || pricingTier?.price,
          service_price_unit: customPriceUnit || pricingTier?.price_unit
        };
      }));
      
      return { data: bookingsWithDetails, error: null };
    } catch (error) {
      console.error('Unexpected error fetching customer bookings:', error);
      return { data: null, error };
    }
  },

  // Get bookings for a provider - Enhanced with error handling
  async getProviderBookings(providerId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(*),
          status_history:booking_status_history(*),
          review:booking_reviews(*)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching provider bookings:', error);
        return { data: null, error };
      }

      // Fetch customer profiles separately for each booking
      const bookingsWithCustomers = await Promise.all(
        (data || []).map(async (booking) => {
          try {
            const { data: customerProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', booking.customer_id)
              .maybeSingle();
            
            // Check if there's a provider service with custom price
            let customPrice = null;
            let customPriceUnit = null;
            
            if (booking.service_id) {
              const { data: providerService } = await supabase
                .from('provider_services')
                .select('custom_price, custom_price_unit')
                .eq('provider_id', providerId)
                .eq('service_id', booking.service_id)
                .maybeSingle();
                
              if (providerService && providerService.custom_price) {
                customPrice = providerService.custom_price;
                customPriceUnit = providerService.custom_price_unit;
              }
            }
            
            // If no provider custom price, get the service pricing tier
            let pricingTier = null;
            if (!customPrice && booking.service_id) {
              const { data: pricingTiers } = await supabase
                .from('pricing_tiers')
                .select('*')
                .eq('service_id', booking.service_id)
                .order('price', { ascending: true })
                .limit(1);
                
              if (pricingTiers && pricingTiers.length > 0) {
                pricingTier = pricingTiers[0];
              }
            }
            
            // Calculate estimated price if needed
            let estimatedPrice = booking.estimated_price;
            if ((customPrice || pricingTier) && (estimatedPrice === null || estimatedPrice === 0)) {
              estimatedPrice = calculateEstimatedPrice(
                customPrice || (pricingTier?.price || 0),
                customPriceUnit || (pricingTier?.price_unit || 'per_hour'),
                booking.booking_start_date || booking.booking_date,
                booking.booking_start_time || booking.booking_time,
                booking.booking_end_date,
                booking.booking_end_time,
                booking.duration_hours,
                booking.duration_days
              );
            }
            
            return {
              ...booking,
              customer: customerProfile,
              estimated_price: estimatedPrice,
              service_price: customPrice || pricingTier?.price,
              service_price_unit: customPriceUnit || pricingTier?.price_unit
            };
          } catch (err) {
            console.warn('Error processing booking customer:', err);
            return booking;
          }
        })
      );
      
      return { data: bookingsWithCustomers, error: null };
    } catch (error) {
      console.error('Unexpected error fetching provider bookings:', error);
      return { data: null, error };
    }
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: BookingStatus, notes?: string) {
    try {
      const updateData: Partial<Booking> = { 
        status,
        provider_notes: notes || ''
      };

      // Add timestamp based on status
      const now = new Date().toISOString();
      switch (status) {
        case 'confirmed':
          updateData.confirmed_at = now;
          break;
        case 'in_progress':
          updateData.started_at = now;
          break;
        case 'completed':
          updateData.completed_at = now;
          break;
        case 'cancelled':
          updateData.cancelled_at = now;
          break;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating booking status:', error);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected error updating booking status:', error);
      return { data: null, error };
    }
  },

  // Add a review
  async addReview(reviewData: Partial<BookingReview>) {
    try {
      const { data, error } = await supabase
        .from('booking_reviews')
        .insert([reviewData])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding review:', error);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected error adding review:', error);
      return { data: null, error };
    }
  },

  // Get customer profile separately if needed
  async getCustomerProfile(customerId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching customer profile:', error);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected error fetching customer profile:', error);
      return { data: null, error };
    }
  },

  // Get available services for booking
  async getAvailableServices() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(*),
          pricing_tiers(*)
        `)
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) {
        console.error('Error fetching available services:', error);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected error fetching available services:', error);
      return { data: null, error };
    }
  },

  // Get service providers for a specific service
  async getServiceProviders(serviceId: string) {
    try {
      const { data, error } = await supabase
        .from('provider_services')
        .select(`
          *,
          provider:service_providers(*)
        `)
        .eq('service_id', serviceId)
        .eq('is_available', true)
        .eq('review_status', 'approved');
      
      if (error) {
        console.error('Error fetching service providers:', error);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected error fetching service providers:', error);
      return { data: null, error };
    }
  },

  // Check provider availability for a specific time slot
  async checkProviderAvailability(providerId: string, startDatetime: string, endDatetime: string) {
    try {
      const { data, error } = await supabase
        .rpc('check_provider_availability', {
          p_provider_id: providerId,
          p_start_datetime: startDatetime,
          p_end_datetime: endDatetime
        });
      
      if (error) {
        console.error('Error checking provider availability:', error);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected error checking provider availability:', error);
      return { data: null, error };
    }
  },

  // Create a booking with availability check
  async createBookingWithAvailabilityCheck(bookingData: {
    customer_id: string;
    provider_id: string;
    service_id: string;
    start_datetime: string;
    end_datetime: string;
    customer_notes?: string;
    customer_address?: string;
    customer_phone?: string;
    urgency?: UrgencyLevel;
  }) {
    try {
      const { data, error } = await supabase
        .rpc('create_booking_with_availability_check', {
          p_customer_id: bookingData.customer_id,
          p_provider_id: bookingData.provider_id,
          p_service_id: bookingData.service_id,
          p_start_datetime: bookingData.start_datetime,
          p_end_datetime: bookingData.end_datetime,
          p_customer_notes: bookingData.customer_notes || null,
          p_customer_address: bookingData.customer_address || null,
          p_customer_phone: bookingData.customer_phone || null,
          p_urgency: bookingData.urgency || 'normal'
        });
      
      if (error) {
        console.error('Error creating booking with availability check:', error);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Unexpected error creating booking with availability check:', error);
      return { data: null, error };
    }
  }
};