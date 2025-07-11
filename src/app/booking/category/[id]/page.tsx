import { Suspense } from 'react';
import { t } from '@/lib/i18n';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Clock, Euro } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const locale = 'nl'; // Default for now
  const t = await getI18n();
  
  const supabase = createRouteHandlerClient({ cookies });
  
  // Fetch category details
  const { data: category, error: categoryError } = await supabase
    .from('service_categories')
    .select('*')
    .eq('id', params.id)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  // Fetch services in this category
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select(`
      *,
      service_providers (
        id,
        business_name,
        rating_average,
        experience_years
      )
    `)
    .eq('category_id', params.id)
    .order('name');

  if (servicesError) {
    console.error('Error fetching services:', servicesError);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/booking">
            <Button variant="ghost" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.back', locale)}</span>
            </Button>
          </Link>
        </div>

        {/* Category Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {category.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {category.description}
          </p>
        </div>

        {/* Services Grid */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {t('booking.services.title', locale)}
          </h2>
          
          {services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} locale={locale} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500 text-lg">
                  Geen diensten beschikbaar in deze categorie
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Service Card Component
function ServiceCard({ service, locale }: { service: any; locale: string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {service.name}
        </CardTitle>
        <p className="text-gray-600">
          {service.description}
        </p>
      </CardHeader>
      <CardContent>
        {/* Service Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Euro className="w-4 h-4 text-green-600" />
              <span className="font-semibold">€{service.price}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{service.duration_minutes} min</span>
            </div>
          </div>
          
          {service.service_providers && service.service_providers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">
                {service.service_providers[0].rating_average || 0} / 5
              </span>
            </div>
          )}
        </div>

        {/* Book Button */}
        <Link href={`/booking/service/${service.id}`}>
          <Button className="w-full">
            {t('booking.services.bookNow', locale)}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
} 