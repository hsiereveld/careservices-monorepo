'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';

interface ServiceSelectionStepProps {
  category: any;
  franchise: any;
  onComplete: (data: { selectedService: any }) => void;
  onBack: () => void;
  locale: string;
}

interface ServiceWithProvider {
  id: string;
  title: string;
  description: string;
  base_price: number;
  duration_hours: number;
  service_providers: {
    id: string;
    full_name: string;
    business_name: string;
    rating_average: number;
  };
}

export default function ServiceSelectionStep({ 
  category, 
  franchise, 
  onComplete, 
  onBack, 
  locale 
}: ServiceSelectionStepProps) {
  const [services, setServices] = useState<ServiceWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  useEffect(() => {
    fetchServices();
  }, [category, franchise]);

  const fetchServices = async () => {
    if (!category?.id || !franchise?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          base_price,
          duration_hours,
          service_providers!inner (
            id,
            full_name,
            business_name,
            rating_average
          )
        `)
        .eq('category_id', category.id)
        .eq('franchise_id', franchise.id)
        .eq('is_active', true)
        .eq('service_providers.is_active', true)
        .order('base_price', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = service.base_price >= priceRange[0] && service.base_price <= priceRange[1];
    return matchesSearch && matchesPrice;
  });

  const handleServiceSelect = (service: ServiceWithProvider) => {
    onComplete({ selectedService: service });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDuration = (hours: number) => {
    if (hours === 1) return t('booking.duration.hour', locale);
    return t('booking.duration.hours', locale, { hours });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-care-secondary-dark">
            {category?.name}
          </h2>
          <p className="text-muted-foreground">
            {t('booking.services.selectFrom', locale, { count: services.length })}
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={onBack}
          className="bg-care-background-light text-care-secondary-dark hover:bg-care-primary-light hover:text-white"
        >
          ← {t('common.back', locale)}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('booking.search.services', locale)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              🔍
            </div>
          </div>

          {/* Price Range */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {t('booking.price.range', locale)}:
            </span>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm font-medium text-care-secondary-dark">
              €{priceRange[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredServices.map((service) => (
          <Card 
            key={service.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 border border-border hover:border-care-primary"
            onClick={() => handleServiceSelect(service)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-care-secondary-dark group-hover:text-care-primary transition-colors mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {service.description}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xl font-bold text-care-primary">
                    {formatPrice(service.base_price)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDuration(service.duration_hours)}
                  </div>
                </div>
              </div>

              {/* Provider Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-care-background-light rounded-full flex items-center justify-center text-sm font-medium text-care-secondary-dark">
                    {service.service_providers.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-care-secondary-dark">
                      {service.service_providers.business_name || service.service_providers.full_name}
                    </p>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-xs text-muted-foreground">
                        {service.service_providers.rating_average?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {t('booking.click.to.select', locale)}
                </Badge>
                <div className="w-6 h-6 rounded-full bg-care-primary text-white flex items-center justify-center text-xs font-bold">
                  →
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-care-secondary-dark mb-2">
            {t('booking.services.noResults', locale)}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t('booking.services.tryDifferent', locale)}
          </p>
          <Button 
            variant="secondary" 
            onClick={() => {
              setSearchTerm('');
              setPriceRange([0, 1000]);
            }}
            className="bg-care-background-light text-care-secondary-dark"
          >
            {t('booking.services.clearFilters', locale)}
          </Button>
        </div>
      )}
    </div>
  );
} 