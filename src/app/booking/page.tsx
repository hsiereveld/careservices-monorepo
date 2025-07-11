import { Suspense } from 'react';
import { t } from '@/lib/i18n';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { FranchiseProvider } from '@/shared/providers/FranchiseProvider';
import BookingFlow from '@/components/booking/BookingFlow';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { LanguageSelector } from '@/components/shared/LanguageProvider';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface BookingPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  // Default to Dutch for now
  const locale = 'nl';
  
  // Fetch categories from database with franchise filtering
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: categories, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
  }

  return (
    <FranchiseProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('booking.title', locale)}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('booking.subtitle', locale)}
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex justify-center mb-8">
            <LanguageSelector />
          </div>

          {/* Main Booking Flow */}
          <Card className="max-w-6xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold">
                {t('booking.categories.title', locale)}
              </CardTitle>
              <p className="text-gray-600">
                {t('booking.categories.subtitle', locale)}
              </p>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="text-center py-8">{t('common.loading', locale)}</div>}>
                <BookingFlow 
                  categories={categories || []} 
                  locale={locale}
                />
              </Suspense>
            </CardContent>
          </Card>

          {/* Language Info */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              🌍 <strong>Multi-Language Support:</strong> Deze pagina ondersteunt Nederlands, Engels en Spaans. 
              Gebruik de taal selector hierboven om van taal te wisselen.
            </p>
          </div>
        </div>
      </div>
    </FranchiseProvider>
  );
} 