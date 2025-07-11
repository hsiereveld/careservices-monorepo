import { createClient } from '@supabase/supabase-js';

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
    }
  },
  db: {
    schema: 'public'
  }
});

// Test connection function with better error reporting
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
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

// Type definitions
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

export type ServiceCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  image_url?: string;
  color_scheme?: string;
  commission_rate: number;
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

export type ServiceWithDetails = Service & {
  category?: ServiceCategory;
  details?: any[];
  pricing_tiers?: PricingTier[];
  availability?: any[];
  requirements?: any[];
  client_types?: any[];
};

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

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
export type UrgencyLevel = 'normal' | 'urgent' | 'flexible';

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
  
  // Bundle
  bundle_id?: string | null;
  
  // Recurring bookings
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  parent_booking_id?: string | null;
};

export type BookingWithDetails = Booking & {
  customer?: Profile;
  provider?: ServiceProvider;
  service?: Service;
  status_history?: any[];
  review?: any;
  professional_earning?: number;
  service_price?: number;
  service_price_unit?: PriceUnitType;
};

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
  discount_type?: DiscountType;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  included_hours: number;
  discount_percentage: number;
  admin_percentage: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  price_unit: PriceUnitType;
  created_at: string;
  updated_at: string;
};

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
  services?: BundleService[];
};

export type BundleService = {
  id: string;
  bundle_id: string;
  service_id: string;
  custom_price: number | null;
  discount_percentage: number | null;
  created_at: string;
  service?: Service;
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
  async getAppSettings(): Promise<{ data: any | null; error: any }> {
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