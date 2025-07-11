// Care & Service Complete TypeScript Types
// Generated for the franchise model and multi-regional expansion

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          language: string
          user_type: 'customer' | 'professional' | 'franchise_partner' | 'admin'
          business_name: string | null
          business_description: string | null
          services: string[] | null
          experience: string | null
          certifications: string | null
          hourly_rate: number | null
          availability: Json | null
          franchise_location_id: string | null
          franchise_role: 'owner' | 'manager' | 'staff' | null
          marketing_consent: boolean
          background_check_consent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          language?: string
          user_type: 'customer' | 'professional' | 'franchise_partner' | 'admin'
          business_name?: string | null
          business_description?: string | null
          services?: string[] | null
          experience?: string | null
          certifications?: string | null
          hourly_rate?: number | null
          availability?: Json | null
          franchise_location_id?: string | null
          franchise_role?: 'owner' | 'manager' | 'staff' | null
          marketing_consent?: boolean
          background_check_consent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          language?: string
          user_type?: 'customer' | 'professional' | 'franchise_partner' | 'admin'
          business_name?: string | null
          business_description?: string | null
          services?: string[] | null
          experience?: string | null
          certifications?: string | null
          hourly_rate?: number | null
          availability?: Json | null
          franchise_location_id?: string | null
          franchise_role?: 'owner' | 'manager' | 'staff' | null
          marketing_consent?: boolean
          background_check_consent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'client' | 'professional' | 'admin' | 'backoffice' | 'franchise_owner' | 'franchise_manager'
          is_primary_role: boolean
          role_assigned_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'client' | 'professional' | 'admin' | 'backoffice' | 'franchise_owner' | 'franchise_manager'
          is_primary_role?: boolean
          role_assigned_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'client' | 'professional' | 'admin' | 'backoffice' | 'franchise_owner' | 'franchise_manager'
          is_primary_role?: boolean
          role_assigned_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      regions: {
        Row: {
          id: string
          name: string
          display_name: string
          country: string
          currency: string
          languages: string[]
          timezone: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          country?: string
          currency?: string
          languages?: string[]
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          country?: string
          currency?: string
          languages?: string[]
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      franchise_locations: {
        Row: {
          id: string
          region_id: string
          name: string
          display_name: string
          subdomain: string
          domain: string | null
          address: string | null
          city: string
          postal_code: string | null
          phone: string | null
          email: string | null
          franchise_type: 'company_owned' | 'franchise_partner' | 'joint_venture'
          franchise_owner_id: string | null
          franchise_fee: number | null
          royalty_percentage: number
          marketing_fee_percentage: number
          status: 'setup' | 'active' | 'suspended' | 'closed'
          launch_date: string | null
          monthly_target: number | null
          current_month_revenue: number
          total_revenue: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          region_id: string
          name: string
          display_name: string
          subdomain: string
          domain?: string | null
          address?: string | null
          city: string
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          franchise_type: 'company_owned' | 'franchise_partner' | 'joint_venture'
          franchise_owner_id?: string | null
          franchise_fee?: number | null
          royalty_percentage?: number
          marketing_fee_percentage?: number
          status?: 'setup' | 'active' | 'suspended' | 'closed'
          launch_date?: string | null
          monthly_target?: number | null
          current_month_revenue?: number
          total_revenue?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          region_id?: string
          name?: string
          display_name?: string
          subdomain?: string
          domain?: string | null
          address?: string | null
          city?: string
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          franchise_type?: 'company_owned' | 'franchise_partner' | 'joint_venture'
          franchise_owner_id?: string | null
          franchise_fee?: number | null
          royalty_percentage?: number
          marketing_fee_percentage?: number
          status?: 'setup' | 'active' | 'suspended' | 'closed'
          launch_date?: string | null
          monthly_target?: number | null
          current_month_revenue?: number
          total_revenue?: number
          created_at?: string
          updated_at?: string
        }
      }
      franchise_partners: {
        Row: {
          id: string
          profile_id: string
          location_id: string
          role: 'owner' | 'manager' | 'staff'
          investment_amount: number | null
          ownership_percentage: number | null
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          location_id: string
          role: 'owner' | 'manager' | 'staff'
          investment_amount?: number | null
          ownership_percentage?: number | null
          start_date: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          location_id?: string
          role?: 'owner' | 'manager' | 'staff'
          investment_amount?: number | null
          ownership_percentage?: number | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      service_categories: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          icon: string | null
          color: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      regional_service_categories: {
        Row: {
          id: string
          region_id: string
          category_id: string
          is_active: boolean
          custom_name: string | null
          custom_description: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          region_id: string
          category_id: string
          is_active?: boolean
          custom_name?: string | null
          custom_description?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          region_id?: string
          category_id?: string
          is_active?: boolean
          custom_name?: string | null
          custom_description?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          category_id: string
          professional_id: string
          location_id: string
          name: string
          description: string | null
          price: number
          duration: number | null
          currency: string
          is_active: boolean
          is_featured: boolean
          max_distance: number | null
          requires_quote: boolean
          rating: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          professional_id: string
          location_id: string
          name: string
          description?: string | null
          price: number
          duration?: number | null
          currency?: string
          is_active?: boolean
          is_featured?: boolean
          max_distance?: number | null
          requires_quote?: boolean
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          professional_id?: string
          location_id?: string
          name?: string
          description?: string | null
          price?: number
          duration?: number | null
          currency?: string
          is_active?: boolean
          is_featured?: boolean
          max_distance?: number | null
          requires_quote?: boolean
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          booking_number: string
          customer_id: string
          professional_id: string
          service_id: string
          location_id: string
          booking_date: string
          booking_time: string
          duration: number | null
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          service_price: number
          platform_fee: number
          total_amount: number
          currency: string
          service_address: string | null
          service_city: string | null
          service_postal_code: string | null
          customer_notes: string | null
          professional_notes: string | null
          customer_rating: number | null
          customer_review: string | null
          review_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_number?: string
          customer_id: string
          professional_id: string
          service_id: string
          location_id: string
          booking_date: string
          booking_time: string
          duration?: number | null
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          service_price: number
          platform_fee: number
          total_amount: number
          currency?: string
          service_address?: string | null
          service_city?: string | null
          service_postal_code?: string | null
          customer_notes?: string | null
          professional_notes?: string | null
          customer_rating?: number | null
          customer_review?: string | null
          review_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_number?: string
          customer_id?: string
          professional_id?: string
          service_id?: string
          location_id?: string
          booking_date?: string
          booking_time?: string
          duration?: number | null
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          service_price?: number
          platform_fee?: number
          total_amount?: number
          currency?: string
          service_address?: string | null
          service_city?: string | null
          service_postal_code?: string | null
          customer_notes?: string | null
          professional_notes?: string | null
          customer_rating?: number | null
          customer_review?: string | null
          review_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          location_id: string
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          payment_method: string | null
          payment_provider: string | null
          external_payment_id: string | null
          platform_revenue: number
          franchise_revenue: number
          professional_revenue: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          location_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          payment_provider?: string | null
          external_payment_id?: string | null
          platform_revenue: number
          franchise_revenue: number
          professional_revenue: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          location_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          payment_provider?: string | null
          external_payment_id?: string | null
          platform_revenue?: number
          franchise_revenue?: number
          professional_revenue?: number
          created_at?: string
          updated_at?: string
        }
      }
      monthly_performance: {
        Row: {
          id: string
          location_id: string
          year: number
          month: number
          total_bookings: number
          total_revenue: number
          platform_revenue: number
          franchise_revenue: number
          new_customers: number
          returning_customers: number
          customer_satisfaction: number
          active_professionals: number
          new_professionals: number
          average_rating: number
          completion_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          year: number
          month: number
          total_bookings?: number
          total_revenue?: number
          platform_revenue?: number
          franchise_revenue?: number
          new_customers?: number
          returning_customers?: number
          customer_satisfaction?: number
          active_professionals?: number
          new_professionals?: number
          average_rating?: number
          completion_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          year?: number
          month?: number
          total_bookings?: number
          total_revenue?: number
          platform_revenue?: number
          franchise_revenue?: number
          new_customers?: number
          returning_customers?: number
          customer_satisfaction?: number
          active_professionals?: number
          new_professionals?: number
          average_rating?: number
          completion_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      quality_audits: {
        Row: {
          id: string
          booking_id: string
          location_id: string
          audit_type: 'mystery_shopping' | 'customer_survey' | 'provider_evaluation' | 'compliance_check'
          auditor_id: string
          overall_score: number
          communication_score: number
          quality_score: number
          punctuality_score: number
          notes: string | null
          recommendations: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          location_id: string
          audit_type: 'mystery_shopping' | 'customer_survey' | 'provider_evaluation' | 'compliance_check'
          auditor_id: string
          overall_score: number
          communication_score: number
          quality_score: number
          punctuality_score: number
          notes?: string | null
          recommendations?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          location_id?: string
          audit_type?: 'mystery_shopping' | 'customer_survey' | 'provider_evaluation' | 'compliance_check'
          auditor_id?: string
          overall_score?: number
          communication_score?: number
          quality_score?: number
          punctuality_score?: number
          notes?: string | null
          recommendations?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_role: {
        Args: {
          user_uuid?: string
        }
        Returns: string
      }
      assign_user_role_simple: {
        Args: {
          target_user_id: string
          new_role: string
        }
        Returns: boolean
      }
      get_dashboard_redirect: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_booking_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      calculate_revenue_sharing: {
        Args: {
          total_amount: number
          location_id: string
        }
        Returns: {
          platform_revenue: number
          franchise_revenue: number
          professional_revenue: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Additional type definitions for the application
export type UserRole = Database['public']['Tables']['user_roles']['Row']['role']
export type UserType = Database['public']['Tables']['profiles']['Row']['user_type']
export type BookingStatus = Database['public']['Tables']['bookings']['Row']['status']
export type PaymentStatus = Database['public']['Tables']['payments']['Row']['status']
export type FranchiseType = Database['public']['Tables']['franchise_locations']['Row']['franchise_type']
export type LocationStatus = Database['public']['Tables']['franchise_locations']['Row']['status']
export type AuditType = Database['public']['Tables']['quality_audits']['Row']['audit_type']

// Helper types for common operations
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserRoleRow = Database['public']['Tables']['user_roles']['Row']
export type FranchiseLocation = Database['public']['Tables']['franchise_locations']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Region = Database['public']['Tables']['regions']['Row']
export type ServiceCategory = Database['public']['Tables']['service_categories']['Row'] 