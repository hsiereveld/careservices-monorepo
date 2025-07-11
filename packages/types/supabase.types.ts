// Dit bestand bevat de Supabase types voor jouw Care & Service database met franchise ondersteuning.
// Overschrijf dit bestand met de output van:
// npx supabase gen types typescript --project-id <project-id> --schema public > packages/types/supabase.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      franchises: {
        Row: {
          id: string
          name: string
          slug: string
          display_name: string
          region: string
          country: string
          is_active: boolean
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          commission_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          display_name: string
          region: string
          country?: string
          is_active?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          commission_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          display_name?: string
          region?: string
          country?: string
          is_active?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          commission_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      service_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
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
          language: string
          user_type: 'customer' | 'professional'
          franchise_id: string | null
          business_name: string | null
          business_description: string | null
          services: string[] | null
          experience: string | null
          certifications: string | null
          hourly_rate: number | null
          availability: Json | null
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
          language?: string
          user_type: 'customer' | 'professional'
          franchise_id?: string | null
          business_name?: string | null
          business_description?: string | null
          services?: string[] | null
          experience?: string | null
          certifications?: string | null
          hourly_rate?: number | null
          availability?: Json | null
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
          language?: string
          user_type?: 'customer' | 'professional'
          franchise_id?: string | null
          business_name?: string | null
          business_description?: string | null
          services?: string[] | null
          experience?: string | null
          certifications?: string | null
          hourly_rate?: number | null
          availability?: Json | null
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
          role: 'client' | 'professional' | 'admin' | 'backoffice'
          is_primary_role: boolean
          role_assigned_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'client' | 'professional' | 'admin' | 'backoffice'
          is_primary_role?: boolean
          role_assigned_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'client' | 'professional' | 'admin' | 'backoffice'
          is_primary_role?: boolean
          role_assigned_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string | null
          franchise_id: string
          professional_id: string
          base_price: number
          commission_rate: number
          final_price: number
          duration: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category_id?: string | null
          franchise_id: string
          professional_id: string
          base_price: number
          commission_rate?: number
          final_price?: number
          duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category_id?: string | null
          franchise_id?: string
          professional_id?: string
          base_price?: number
          commission_rate?: number
          final_price?: number
          duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      commission_requests: {
        Row: {
          id: string
          professional_id: string
          service_id: string
          franchise_id: string
          current_commission_rate: number
          requested_commission_rate: number
          reason: string
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          service_id: string
          franchise_id: string
          current_commission_rate: number
          requested_commission_rate: number
          reason: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          service_id?: string
          franchise_id?: string
          current_commission_rate?: number
          requested_commission_rate?: number
          reason?: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          professional_id: string
          service_id: string
          franchise_id: string
          booking_date: string
          booking_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          base_amount: number
          commission_amount: number
          total_amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          professional_id: string
          service_id: string
          franchise_id: string
          booking_date: string
          booking_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          base_amount: number
          commission_amount: number
          total_amount: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          professional_id?: string
          service_id?: string
          franchise_id?: string
          booking_date?: string
          booking_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          base_amount?: number
          commission_amount?: number
          total_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          customer_id: string
          professional_id: string
          franchise_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          customer_id: string
          professional_id: string
          franchise_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          customer_id?: string
          professional_id?: string
          franchise_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          franchise_id: string
          amount: number
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: string | null
          stripe_payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          franchise_id: string
          amount: number
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          stripe_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          franchise_id?: string
          amount?: number
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          stripe_payment_id?: string | null
          created_at?: string
          updated_at?: string
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
          user_uuid: string
          role_name: string
        }
        Returns: void
      }
      get_dashboard_redirect: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_franchise: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_franchise_by_slug: {
        Args: {
          franchise_slug: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 