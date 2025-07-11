'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';

interface ProfessionalStats {
  businessName: string;
  totalBookings: number;
  completedBookings: number;
  netEarnings: number;
  avgRating: number;
  totalReviews: number;
  monthlyBookings: number;
  upcomingBookings: number;
}

interface ProfessionalBooking {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'started' | 'completed' | 'cancelled';
  finalPrice: number;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerRating: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    started: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const icons = {
    pending: '🕐',
    confirmed: '✅',
    started: '🚀',
    completed: '✨',
    cancelled: '❌'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
      {icons[status as keyof typeof icons]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const MetricCard = ({ title, value, subtitle, icon }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
}) => (
  <Card className="p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  </Card>
);

export function ProfessionalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [professionalStats, setProfessionalStats] = useState<ProfessionalStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<ProfessionalBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (!user?.id) return;
      
      try {
        // Get service provider info
        const { data: serviceProvider } = await supabase
          .from('service_providers')
          .select('id, business_name, rating_average, total_reviews')
          .eq('user_id', user.id)
          .single();

        if (!serviceProvider) {
          console.log('No service provider found for user');
          setLoading(false);
          return;
        }

        // Get booking stats
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, status, final_price, booking_date, commission_amount')
          .eq('provider_id', serviceProvider.id);

        const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
        const upcomingBookings = bookings?.filter(b => 
          b.status !== 'completed' && 
          b.status !== 'cancelled' &&
          new Date(b.booking_date) >= new Date()
        ) || [];

        // Calculate monthly bookings (current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyBookings = bookings?.filter(b => {
          const bookingDate = new Date(b.booking_date);
          return bookingDate.getMonth() === currentMonth && 
                 bookingDate.getFullYear() === currentYear;
        }).length || 0;

        const totalEarnings = completedBookings.reduce((sum, booking) => 
          sum + ((booking.final_price || 0) - (booking.commission_amount || 0)), 0);

        setProfessionalStats({
          businessName: serviceProvider.business_name || 'Professional Dashboard',
          totalBookings: bookings?.length || 0,
          completedBookings: completedBookings.length,
          netEarnings: totalEarnings,
          avgRating: serviceProvider.rating_average || 0,
          totalReviews: serviceProvider.total_reviews || 0,
          monthlyBookings,
          upcomingBookings: upcomingBookings.length
        });

        // Get recent bookings with customer info
        const { data: recentBookingsData } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            start_time,
            end_time,
            status,
            final_price,
            customer_address,
            special_requirements,
            services(name),
            profiles(first_name, last_name, phone),
            booking_reviews(rating)
          `)
          .eq('provider_id', serviceProvider.id)
          .order('booking_date', { ascending: false })
          .limit(10);

        if (recentBookingsData) {
          const mappedBookings: ProfessionalBooking[] = recentBookingsData.map(booking => ({
            id: booking.id,
            bookingDate: booking.booking_date,
            startTime: booking.start_time,
            endTime: booking.end_time,
            status: booking.status,
            finalPrice: booking.final_price,
            customerAddress: booking.customer_address,
            serviceName: (booking.services as any)?.name || 'Service',
            customerName: booking.profiles ? 
              `${(booking.profiles as any).first_name} ${(booking.profiles as any).last_name}` : 
              'Customer',
            customerPhone: (booking.profiles as any)?.phone || '',
            customerRating: (booking.booking_reviews as any)?.[0]?.rating || 0
          }));
          
          setRecentBookings(mappedBookings);
        }

      } catch (error) {
        console.error('Error fetching professional data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [user?.id]);

  const handleBookingAction = (bookingId: string, action: string) => {
    console.log(`Performing ${action} on booking ${bookingId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!professionalStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Geen Professional Profiel</h2>
          <p className="text-gray-600 mb-4">
            Er is geen professional profiel gevonden voor jouw account.
          </p>
          <Button>Professional Profiel Aanmaken</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {professionalStats.businessName} 💼
            </h1>
            <p className="mt-2 text-gray-600">
              Beheer je diensten, bekijk je inkomsten en volg je prestaties.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: '📈 Dashboard', count: null },
              { id: 'bookings', label: '📅 Boekingen', count: professionalStats.upcomingBookings },
              { id: 'services', label: '🛠️ Mijn Services', count: null },
              { id: 'financial', label: '💰 Financieel', count: null },
              { id: 'reviews', label: '⭐ Reviews', count: professionalStats.totalReviews }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Totaal Boekingen"
                value={professionalStats.totalBookings}
                subtitle={`${professionalStats.monthlyBookings} deze maand`}
                icon="📊"
              />
              <MetricCard
                title="Netto Inkomsten"
                value={`€${professionalStats.netEarnings.toFixed(2)}`}
                subtitle="Totaal verdiend"
                icon="💰"
              />
              <MetricCard
                title="Gemiddelde Rating"
                value={`${professionalStats.avgRating.toFixed(1)}/5`}
                subtitle={`${professionalStats.totalReviews} beoordelingen`}
                icon="⭐"
              />
              <MetricCard
                title="Aankomende Boekingen"
                value={professionalStats.upcomingBookings}
                subtitle="Bevestigd en gepland"
                icon="📅"
              />
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overzicht</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Voltooiingspercentage</span>
                    <span className="text-sm font-medium">
                      {professionalStats.totalBookings > 0 
                        ? Math.round((professionalStats.completedBookings / professionalStats.totalBookings) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gemiddelde Rating</span>
                    <span className="text-sm font-medium">
                      {'⭐'.repeat(Math.round(professionalStats.avgRating))} ({professionalStats.avgRating.toFixed(1)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Totaal Reviews</span>
                    <span className="text-sm font-medium">{professionalStats.totalReviews}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financieel Overzicht</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Netto Inkomsten</span>
                    <span className="font-semibold text-green-600">€{professionalStats.netEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Gem. per Boeking</span>
                    <span className="font-medium">
                      €{professionalStats.completedBookings > 0 
                        ? (professionalStats.netEarnings / professionalStats.completedBookings).toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recente Activiteit</h2>
              <Card className="p-6">
                {recentBookings.length > 0 ? (
                  <div className="space-y-4">
                    {recentBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center space-x-4">
                          <StatusBadge status={booking.status} />
                          <div>
                            <p className="font-medium text-gray-900">{booking.serviceName}</p>
                            <p className="text-sm text-gray-500">
                              {booking.customerName} • {new Date(booking.bookingDate).toLocaleDateString('nl-NL')} {booking.startTime}
                            </p>
                            {booking.customerAddress && (
                              <p className="text-xs text-gray-400">📍 {booking.customerAddress}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">€{booking.finalPrice.toFixed(2)}</p>
                          {booking.customerRating > 0 && (
                            <p className="text-sm text-yellow-600">
                              {'⭐'.repeat(booking.customerRating)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📅</div>
                    <p className="text-gray-500">Nog geen boekingen ontvangen</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Boekingen Beheer</h2>
              <div className="flex space-x-2">
                {['all', 'pending', 'confirmed', 'started', 'completed'].map((filter) => (
                  <Button
                    key={filter}
                    variant="outline"
                    size="sm"
                    className="capitalize"
                  >
                    {filter === 'all' ? 'Alle' : filter}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <StatusBadge status={booking.status} />
                        <h3 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Klant:</strong> {booking.customerName}</p>
                          <p><strong>Telefoon:</strong> {booking.customerPhone}</p>
                          <p><strong>Adres:</strong> {booking.customerAddress}</p>
                        </div>
                        <div>
                          <p><strong>Datum:</strong> {new Date(booking.bookingDate).toLocaleDateString('nl-NL')}</p>
                          <p><strong>Tijd:</strong> {booking.startTime} - {booking.endTime}</p>
                          <p><strong>Prijs:</strong> €{booking.finalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleBookingAction(booking.id, 'accept')}>
                            Accepteren
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleBookingAction(booking.id, 'decline')}>
                            Afwijzen
                          </Button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button size="sm" onClick={() => handleBookingAction(booking.id, 'start')}>
                          Service Starten
                        </Button>
                      )}
                      {booking.status === 'started' && (
                        <Button size="sm" onClick={() => handleBookingAction(booking.id, 'complete')}>
                          Voltooien
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mijn Services</h2>
              <Button>Nieuwe Service Toevoegen</Button>
            </div>
            <Card className="p-6">
              <p className="text-gray-500 text-center">Service management functionaliteit komt hier</p>
            </Card>
          </div>
        )}

        {activeTab === 'financial' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Financieel Dashboard</h2>
            <Card className="p-6">
              <p className="text-gray-500 text-center">Financiële dashboard met inkomsten overzicht komt hier</p>
            </Card>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Klant Beoordelingen</h2>
            <Card className="p-6">
              <p className="text-gray-500 text-center">Review management en rating overzicht komt hier</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 