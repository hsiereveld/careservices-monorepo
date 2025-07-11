'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';

interface ProviderSelectionStepProps {
  service: any;
  date: string;
  time: string;
  franchise: any;
  onComplete: (data: { selectedProvider: any }) => void;
  onBack: () => void;
  locale: string;
}

interface Provider {
  id: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  rating_average: number;
  review_count: number;
  experience_years: number;
  languages: string[];
  specializations: string[];
  bio: string;
  avatar_url?: string;
  is_available: boolean;
  price: number;
}

export default function ProviderSelectionStep({ 
  service, 
  date, 
  time, 
  franchise, 
  onComplete, 
  onBack, 
  locale 
}: ProviderSelectionStepProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');

  useEffect(() => {
    fetchAvailableProviders();
  }, [service, date, time, franchise]);

  const fetchAvailableProviders = async () => {
    if (!service?.id || !date || !time || !franchise?.id) return;

    try {
      setLoading(true);
      
      // Get providers who offer this service in this franchise
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          id,
          full_name,
          business_name,
          email,
          phone,
          rating_average,
          experience_years,
          languages,
          specializations,
          bio,
          avatar_url,
          provider_services!inner (
            id,
            custom_price,
            is_available
          )
        `)
        .eq('franchise_id', franchise.id)
        .eq('is_active', true)
        .eq('provider_services.service_id', service.id)
        .eq('provider_services.is_available', true);

      if (error) throw error;

      // Transform data and add availability check
      const providersWithAvailability = await Promise.all(
        (data || []).map(async (provider) => {
          // Check if provider is available at the selected date/time
          const { data: bookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('provider_id', provider.id)
            .eq('booking_date', date)
            .eq('booking_time', time)
            .eq('status', 'confirmed');

          const isAvailable = !bookings || bookings.length === 0;
          
          return {
            ...provider,
            is_available: isAvailable,
            price: provider.provider_services?.[0]?.custom_price || service.base_price,
            review_count: Math.floor(Math.random() * 50) + 5 // Mock data for now
          };
        })
      );

      setProviders(providersWithAvailability);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(provider => {
    const matchesLanguage = !filterLanguage || 
      provider.languages?.includes(filterLanguage);
    const matchesSpecialization = !filterSpecialization || 
      provider.specializations?.includes(filterSpecialization);
    return matchesLanguage && matchesSpecialization;
  });

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
  };

  const handleComplete = () => {
    if (selectedProvider) {
      onComplete({ selectedProvider });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-500' : 'text-gray-300'}>
          ⭐
        </span>
      );
    }
    return stars;
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
            {t('booking.provider.title', locale)}
          </h2>
          <p className="text-muted-foreground">
            {t('booking.provider.subtitle', locale, { 
              service: service?.title,
              date: new Date(date).toLocaleDateString(locale),
              time: time
            })}
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
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-care-secondary-dark mb-2">
                {t('booking.provider.filterLanguage', locale)}
              </label>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent"
              >
                <option value="">{t('booking.provider.allLanguages', locale)}</option>
                <option value="nl">Nederlands</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-care-secondary-dark mb-2">
                {t('booking.provider.filterSpecialization', locale)}
              </label>
              <select
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent"
              >
                <option value="">{t('booking.provider.allSpecializations', locale)}</option>
                <option value="elderly">Elderly Care</option>
                <option value="children">Child Care</option>
                <option value="medical">Medical</option>
                <option value="household">Household</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProviders.map((provider) => (
          <Card 
            key={provider.id}
            className={`
              cursor-pointer transition-all duration-200 border
              ${selectedProvider?.id === provider.id
                ? 'border-care-primary ring-2 ring-care-primary-light'
                : 'border-border hover:border-care-primary'
              }
              ${!provider.is_available ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => provider.is_available && handleProviderSelect(provider)}
          >
            <CardContent className="p-6">
              {/* Provider Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-care-background-light rounded-full flex items-center justify-center text-lg font-bold text-care-secondary-dark">
                    {provider.avatar_url ? (
                      <img 
                        src={provider.avatar_url} 
                        alt={provider.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      provider.full_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-care-secondary-dark">
                      {provider.business_name || provider.full_name}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(provider.rating_average || 0)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({provider.review_count})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-care-primary">
                    {formatPrice(provider.price)}
                  </div>
                  <Badge 
                    variant={provider.is_available ? "success" : "secondary"}
                    className="text-xs"
                  >
                    {provider.is_available 
                      ? t('booking.provider.available', locale)
                      : t('booking.provider.unavailable', locale)
                    }
                  </Badge>
                </div>
              </div>

              {/* Provider Info */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {provider.bio || t('booking.provider.noBio', locale)}
                </p>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">👨‍⚕️</span>
                    <span>{provider.experience_years || 0} {t('booking.provider.yearsExperience', locale)}</span>
                  </div>
                </div>

                {/* Languages */}
                {provider.languages && provider.languages.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-care-secondary-dark">
                      {t('booking.provider.languages', locale)}:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {provider.languages.map((lang: string) => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specializations */}
                {provider.specializations && provider.specializations.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-care-secondary-dark">
                      {t('booking.provider.specializations', locale)}:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {provider.specializations.map((spec: string) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selection Indicator */}
              {selectedProvider?.id === provider.id && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-care-success text-white flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-care-secondary-dark mb-2">
            {t('booking.provider.noResults', locale)}
          </h3>
          <p className="text-muted-foreground">
            {t('booking.provider.tryDifferent', locale)}
          </p>
        </div>
      )}

      {/* Continue Button */}
      {selectedProvider && (
        <div className="flex justify-center">
          <Button
            onClick={handleComplete}
            className="bg-care-primary hover:bg-care-secondary-dark text-white px-8 py-3"
          >
            {t('booking.provider.continue', locale)}
          </Button>
        </div>
      )}
    </div>
  );
} 