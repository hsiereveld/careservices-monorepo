'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import BookingManagement from './BookingManagement';

interface CustomerStats {
  firstName: string;
  totalBookings: number;
  completedServices: number;
  totalSpent: number;
  upcomingBookings: number;
}

interface Booking {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'started' | 'completed' | 'cancelled';
  finalPrice: number;
  serviceName: string;
  providerName: string;
  myRating: number;
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

const QuickActionCard = ({ icon, title, description, onClick }: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
    <div className="flex items-center space-x-3">
      <div className="text-2xl">{icon}</div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  </Card>
);

export function CustomerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomerData = async () => {
    if (!user?.id) return;
    
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      // Get basic booking stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, status, final_price, booking_date')
        .eq('customer_id', user.id);

      const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
      const upcomingBookings = bookings?.filter(b => 
        b.status !== 'completed' && 
        b.status !== 'cancelled' &&
        new Date(b.booking_date) >= new Date()
      ) || [];
      
      const totalSpent = completedBookings.reduce((sum, booking) => sum + (booking.final_price || 0), 0);

      setCustomerStats({
        firstName: profile?.first_name || 'Customer',
        totalBookings: bookings?.length || 0,
        completedServices: completedBookings.length,
        totalSpent,
        upcomingBookings: upcomingBookings.length
      });

      // Get recent bookings with service info
      const { data: recentBookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          final_price,
          services(name),
          service_providers(business_name),
          booking_reviews(rating)
        `)
        .eq('customer_id', user.id)
        .order('booking_date', { ascending: false })
        .limit(10);

      if (recentBookingsData) {
        const mappedBookings: Booking[] = recentBookingsData.map(booking => ({
          id: booking.id,
          bookingDate: booking.booking_date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          status: booking.status,
          finalPrice: booking.final_price,
          serviceName: (booking.services as any)?.name || 'Service',
          providerName: (booking.service_providers as any)?.business_name || 'Provider',
          myRating: (booking.booking_reviews as any)?.[0]?.rating || 0
        }));
        
        setRecentBookings(mappedBookings);
      }

    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [user?.id]);

  const handleQuickAction = (action: string) => {
    if (action === 'book-service') {
      window.location.href = '/my/booking';
    } else {
      setActiveTab(action);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welkom terug, {customerStats?.firstName || 'Customer'}! 👋
            </h1>
            <p className="mt-2 text-gray-600">
              Beheer je boekingen, bekijk je favoriete dienstverleners en ontdek nieuwe services.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: '🏠 Dashboard', count: null },
              { id: 'bookings', label: '📅 Mijn Boekingen', count: customerStats?.totalBookings },
              { id: 'services', label: '🔍 Services', count: null },
              { id: 'reviews', label: '⭐ Reviews', count: null },
              { id: 'financial', label: '💰 Financieel', count: null },
              { id: 'settings', label: '⚙️ Instellingen', count: null }
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
                {tab.count !== null && tab.count !== undefined && tab.count > 0 && (
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📊</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Totaal Boekingen</p>
                    <p className="text-2xl font-semibold text-gray-900">{customerStats?.totalBookings || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">✅</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Voltooide Services</p>
                    <p className="text-2xl font-semibold text-gray-900">{customerStats?.completedServices || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">💰</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Totaal Uitgegeven</p>
                    <p className="text-2xl font-semibold text-gray-900">€{customerStats?.totalSpent?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📅</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Aankomende Boekingen</p>
                    <p className="text-2xl font-semibold text-gray-900">{customerStats?.upcomingBookings || 0}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Snelle Acties</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard
                  icon="🔍"
                  title="Boek Nieuwe Service"
                  description="Ontdek en boek beschikbare diensten"
                  onClick={() => handleQuickAction('book-service')}
                />
                <QuickActionCard
                  icon="📅"
                  title="Mijn Boekingen"
                  description="Bekijk aankomende en recente afspraken"
                  onClick={() => handleQuickAction('bookings')}
                />
                <QuickActionCard
                  icon="⭐"
                  title="Beoordeel Services"
                  description="Geef feedback op je ervaring"
                  onClick={() => handleQuickAction('reviews')}
                />
              </div>
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
                              {booking.providerName} • {new Date(booking.bookingDate).toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">€{booking.finalPrice.toFixed(2)}</p>
                          {booking.myRating > 0 && (
                            <p className="text-sm text-yellow-600">
                              {'⭐'.repeat(booking.myRating)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📅</div>
                    <p className="text-gray-500">Nog geen boekingen geplaatst</p>
                    <Button 
                      className="mt-4"
                      onClick={() => handleQuickAction('book-service')}
                    >
                      Boek je eerste service
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mijn Boekingen</h2>
            <BookingManagement onBookingUpdated={() => fetchCustomerData()} />
          </div>
        )}

        {/* Other tabs */}
        {activeTab === 'services' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Discovery</h2>
            <div className="space-y-6">
              {/* Quick Book Action */}
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ontdek & Boek Services</h3>
                  <p className="text-gray-600 mb-6">
                    Bekijk beschikbare diensten in jouw regio en maak direct een afspraak
                  </p>
                  <Button 
                    className="bg-accent-600 hover:bg-accent-700 text-white px-8 py-3 text-lg"
                    onClick={() => window.location.href = '/my/booking'}
                  >
                    Start Booking Process
                  </Button>
                </div>
              </Card>

              {/* Service Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: '🏠', title: 'Schoonmaak & Onderhoud', description: 'Professionele huisschoonmaak en onderhoudsdiensten' },
                  { icon: '🍳', title: 'Koken & Maaltijdbereiding', description: 'Gepersonaliseerde maaltijdbereiding en kookservices' },
                  { icon: '🏥', title: 'Verpleging & Medische Ondersteuning', description: 'Erkende verpleegkundige zorg en medische assistentie' },
                  { icon: '🌿', title: 'Tuinonderhoud', description: 'Tuinverzorging en landschapsonderhoud' },
                  { icon: '🔧', title: 'Vastgoedonderhoud', description: 'Reparaties en onderhoud van vastgoed' },
                  { icon: '🏠', title: 'Huisdierverzorging', description: 'Professionele zorg voor huisdieren' }
                ].map((category, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/my/booking'}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <h4 className="font-medium text-gray-900 mb-1">{category.title}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews & Beoordelingen</h2>
            <Card className="p-6">
              <p className="text-gray-500 text-center">Review management functionaliteit komt hier</p>
            </Card>
          </div>
        )}

        {activeTab === 'financial' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Financieel Overzicht</h2>
            <Card className="p-6">
              <p className="text-gray-500 text-center">Financiële geschiedenis en abonnementen komen hier</p>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Instellingen</h2>
            <Card className="p-6">
              <p className="text-gray-500 text-center">Profiel instellingen en privacy opties komen hier</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 