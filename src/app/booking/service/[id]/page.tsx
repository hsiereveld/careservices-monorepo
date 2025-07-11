import { Suspense } from 'react';
import { t } from '@/lib/i18n';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Clock, Euro, MapPin, User } from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ServicePageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ServicePage({ params, searchParams }: ServicePageProps) {
  const locale = 'nl'; // Default for now
  
  const supabase = createRouteHandlerClient({ cookies });
  
  // Fetch service details with providers
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select(`
      *,
      service_categories (
        id,
        name,
        description
      ),
      service_providers (
        id,
        business_name,
        rating_average,
        experience_years,
        location,
        bio
      )
    `)
    .eq('id', params.id)
    .single();

  if (serviceError || !service) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href={`/booking/category/${service.category_id}`}>
            <Button variant="ghost" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.back', locale)}</span>
            </Button>
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Service Details */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold">
                    {service.name}
                  </CardTitle>
                  <p className="text-gray-600 text-lg">
                    {service.description}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Service Info */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Euro className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-semibold">€{service.price}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span>{service.duration_minutes} minuten</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Categorie: {service.service_categories?.name}
                    </div>
                  </div>

                  {/* Available Providers */}
                  {service.service_providers && service.service_providers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        {t('booking.providers.title', locale)}
                      </h3>
                      <div className="space-y-3">
                        {service.service_providers.map((provider: any) => (
                          <ProviderCard key={provider.id} provider={provider} />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold">
                    {t('booking.form.title', locale)}
                  </CardTitle>
                  <p className="text-gray-600">
                    {t('booking.form.subtitle', locale)}
                  </p>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="text-center py-8">{t('common.loading', locale)}</div>}>
                    <BookingForm 
                      serviceId={service.id}
                      serviceName={service.name}
                      servicePrice={service.price}
                      locale={locale}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Provider Card Component
function ProviderCard({ provider }: { provider: any }) {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">{provider.business_name}</h4>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm">{provider.rating_average || 0}</span>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        {provider.location && (
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>{provider.location}</span>
          </div>
        )}
        
        {provider.experience_years && (
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>{provider.experience_years} jaar ervaring</span>
          </div>
        )}
      </div>
      
      {provider.bio && (
        <p className="text-sm text-gray-500 mt-2">{provider.bio}</p>
      )}
    </div>
  );
} 