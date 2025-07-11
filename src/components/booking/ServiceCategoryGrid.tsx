'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Define types based on actual database structure
interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_scheme?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceCategoryWithCount extends ServiceCategory {
  service_count: number;
  featured_services: any[];
}

export default function ServiceCategoryGrid() {
  const [categories, setCategories] = useState<ServiceCategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching categories with provider counts...');
      
      // Fetch categories with service counts from the actual database structure
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      console.log('📋 Categories fetched:', { categoriesData, categoriesError });

      if (categoriesError) {
        console.error('❌ Categories error:', categoriesError);
        throw categoriesError;
      }

      // Get provider counts per category using the correct table names
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          try {
            // Count providers that offer services in this category
            const { data: providersInCategory, error: providerError } = await supabase
              .from('provider_services')
              .select(`
                provider_id,
                service_providers!inner (
                  id,
                  is_active
                )
              `)
              .eq('service_providers.is_active', true)
              .eq('is_available', true);

            // Filter by category through services
            const { data: servicesInCategory, error: serviceError } = await supabase
              .from('services')
              .select('id')
              .eq('category_id', category.id)
              .eq('is_active', true);

            if (serviceError) {
              console.error(`Service error for category ${category.name}:`, serviceError);
            }

            // Count unique providers offering services in this category
            const serviceIds = (servicesInCategory || []).map(s => s.id);
            const uniqueProviders = new Set();

            if (providersInCategory && serviceIds.length > 0) {
              // Get provider services that match this category's services
              const { data: categoryProviders, error: catProvError } = await supabase
                .from('provider_services')
                .select('provider_id, service_id')
                .in('service_id', serviceIds)
                .eq('is_available', true);

              if (catProvError) {
                console.error(`Category provider error:`, catProvError);
              } else {
                (categoryProviders || []).forEach(cp => uniqueProviders.add(cp.provider_id));
              }
            }

            const providerCount = uniqueProviders.size;
            console.log(`📊 Category ${category.name}: ${providerCount} providers`);

            return {
              ...category,
              service_count: providerCount,
              featured_services: []
            };
          } catch (error) {
            console.error(`❌ Error counting for category ${category.name}:`, error);
            return {
              ...category,
              service_count: 0,
              featured_services: []
            };
          }
        })
      );

      console.log('✅ Categories with provider counts:', categoriesWithCounts);
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setError('Er is een fout opgetreden bij het ophalen van de categorieën.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (icon: string) => {
    const iconMap: Record<string, string> = {
      medical: '🏥',
      care: '👥',
      household: '🏠',
      technical: '🔧',
      admin: '📋',
      emergency: '🚨'
    };
    return iconMap[icon] || '📋';
  };

  const getPriceRange = (services: any[]) => {
    if (services.length === 0) return '€0';
    
    const prices = services.map(service => {
      const price = service.custom_price || service.template?.base_price || 0;
      return price;
    });
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `€${minPrice.toFixed(2)}`;
    }
    return `€${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchCategories}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Link 
          key={category.id} 
          href={`/booking/category/${category.id}`}
          className="group bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-accent-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${category.color_scheme || '#4a9b8e'}20`, color: category.color_scheme || '#4a9b8e' }}
              >
                {getCategoryIcon(category.icon || 'default')}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-accent-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {category.service_count} professionals beschikbaar
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-accent-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {category.description}
          </p>

          {category.featured_services.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Uitgelichte Diensten
              </p>
              {category.featured_services.slice(0, 2).map((service) => (
                <div key={service.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate">
                    {service.custom_name || service.template?.name_nl}
                  </span>
                  <span className="text-accent-600 font-medium">
                    €{(service.custom_price || service.template?.base_price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Vanaf {getPriceRange(category.featured_services)}
            </span>
            <span className="text-accent-600 text-sm font-medium group-hover:text-accent-700 transition-colors">
              Bekijk alle diensten →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
} 