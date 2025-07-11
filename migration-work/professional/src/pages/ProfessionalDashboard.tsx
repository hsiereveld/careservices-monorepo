import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Star, 
  Settings,
  Briefcase,
  Euro,
  User,
  Home,
  Loader2,
  Plus,
  Filter,
  Search,
  ArrowRight,
  MessageSquare,
  ChevronRight,
  Award,
  Clipboard,
  CheckSquare,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  BarChart2,
  PieChart,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, ServiceProvider, ProviderService, BookingWithDetails, Service } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';
import { AvailabilityManager } from '../components/professional/AvailabilityManager';
import { useProviderBookings } from '../hooks/useProviderBookings';
import { BookingList } from '../components/professional/BookingList';
import { BookingStats } from '../components/professional/BookingStats';
import { ProfessionalServiceManager } from '../components/professional/ProfessionalServiceManager';
import { ProfileCompletionCard } from '../components/professional/ProfileCompletionCard';

export function ProfessionalDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useAdmin();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'services' | 'availability' | 'analytics'>('overview');
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Use the provider bookings hook
  const { 
    bookings, 
    pendingBookings, 
    confirmedBookings,
    inProgressBookings,
    completedBookings,
    loading: bookingsLoading, 
    error: bookingsError,
    updateBookingStatus,
    refetch: refreshBookings
  } = useProviderBookings();

  useEffect(() => {
    if (user) {
      fetchProviderData();
      fetchAvailableServices();
    }
  }, [user]);

  const fetchAvailableServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, category:service_categories(*)')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching available services:', error);
        return;
      }

      setAvailableServices(data || []);
    } catch (err) {
      console.error('Error fetching available services:', err);
    }
  };

  const fetchProviderData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      console.log('🔍 Fetching provider data for user:', user.id);

      // First, get the service provider record
      const { data: providerData, error: providerError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (providerError) {
        console.error('❌ Error fetching service provider:', providerError);
        if (providerError.code === 'PGRST116') {
          setError('Je hebt nog geen service provider profiel. Maak eerst je profiel aan.');
        } else {
          setError('Fout bij het laden van provider gegevens: ' + providerError.message);
        }
        return;
      }

      console.log('✅ Service provider found:', providerData);
      setProvider(providerData);

      // Check if the provider profile is complete
      const requiredFields = [
        'business_name',
        'description',
        'phone',
        'email',
        'hourly_rate',
        'bank_account_number'
      ];
      
      const completedFields = requiredFields.filter(field => 
        providerData[field] !== null && 
        providerData[field] !== undefined && 
        providerData[field] !== ''
      );
      
      const completionPercentage = (completedFields.length / requiredFields.length) * 100;
      
      setIsProfileComplete(completionPercentage >= 70);
      setShowProfilePrompt(completionPercentage < 70);

      // Now fetch provider services with service details including pricing tiers
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select(`
          *,
          service:services(*, pricing_tiers(*))
        `)
        .eq('provider_id', providerData.id);

      if (servicesError) {
        console.error('❌ Error fetching provider services:', servicesError);
        setError('Fout bij het laden van diensten: ' + servicesError.message);
        return;
      }

      console.log('✅ Provider services found:', servicesData);
      setProviderServices(servicesData || []);

    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError('Er is een fout opgetreden: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string, notes?: string) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await updateBookingStatus(bookingId, status as any, notes);

      if (error) throw error;

      setSuccess(`Boeking status bijgewerkt naar ${getStatusLabel(status)}! 🎉`);
      refreshBookings();
    } catch (err: any) {
      setError('Fout bij het bijwerken van boeking: ' + err.message);
    }
  };

  const handleEditProfile = () => {
    // Navigate to profile page
    window.location.href = '/profile';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'In afwachting';
      case 'confirmed': return 'Bevestigd';
      case 'in_progress': return 'In uitvoering';
      case 'completed': return 'Voltooid';
      case 'cancelled': return 'Geannuleerd';
      case 'rescheduled': return 'Verzet';
      default: return status;
    }
  };

  // Calculate earnings by month for the last 6 months
  const getMonthlyEarnings = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        month: month.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }),
        date: month
      });
    }
    
    return months.map(monthData => {
      const monthStart = new Date(monthData.date);
      const monthEnd = new Date(monthData.date.getFullYear(), monthData.date.getMonth() + 1, 0);
      
      const monthlyBookings = completedBookings.filter(booking => {
        const bookingDate = new Date(booking.completed_at || booking.booking_date);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });
      
      const earnings = monthlyBookings.reduce((sum, booking) => 
        sum + (booking.final_price || booking.estimated_price || 0), 0);
      
      return {
        month: monthData.month,
        earnings
      };
    });
  };

  if (authLoading || loading || roleLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div className="text-text-primary text-xl font-medium">Professional dashboard laden...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate href="/login" replace />;
  }

  // Verify user role
  if (userRole !== 'professional') {
    return <Navigate href="/dashboard" replace />;
  }

  // If user is not a provider yet, show onboarding
  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-xl p-8 border border-primary-200/50">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">
                Welkom bij het Professional Dashboard
              </h1>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                Je account is aangemaakt, maar we moeten nog een professional profiel voor je aanmaken.
                Dit gebeurt automatisch, vernieuw de pagina over enkele seconden.
              </p>
            </div>

            <div className="text-center">
              <button 
                onClick={() => window.location.reload()}
                className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Pagina vernieuwen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Professional Dashboard
          </h1>
          <p className="text-text-secondary text-lg">
            Beheer je diensten en boekingen
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center space-x-3 mb-6">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Profile Completion Card */}
        {showProfilePrompt && provider && (
          <ProfileCompletionCard provider={provider} />
        )}

        {/* Provider Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50 mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {provider.business_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                {provider.business_name || 'Professional'}
              </h2>
              <p className="text-text-secondary mb-3">{provider.description || 'Service Provider'}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-text-light" />
                  <span>{provider.city}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-text-light" />
                  <span>{provider.phone || 'Niet ingesteld'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-text-light" />
                  <span>{provider.email || user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{provider.rating_average || '0.0'} ({provider.total_reviews || 0} reviews)</span>
                </div>
              </div>
            </div>
            <div>
              <button 
                onClick={handleEditProfile}
                className="px-4 py-2 bg-accent-100 hover:bg-accent-200 text-accent-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Profiel Bewerken</span>
              </button>
            </div>
          </div>
        </div>

        {/* Booking Stats */}
        <BookingStats 
          bookings={bookings}
          pendingCount={pendingBookings.length}
          confirmedCount={confirmedBookings.length}
          inProgressCount={inProgressBookings.length}
          completedCount={completedBookings.length}
        />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-primary-200/50 my-8">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overzicht', icon: Home },
              { id: 'bookings', label: 'Boekingen', icon: Calendar },
              { id: 'services', label: 'Mijn Diensten', icon: Briefcase },
              { id: 'availability', label: 'Beschikbaarheid', icon: Clock },
              { id: 'analytics', label: 'Statistieken', icon: BarChart2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-accent-500 text-white shadow-lg'
                      : 'text-text-secondary hover:text-text-primary hover:bg-accent-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Quick Help */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50 md:col-span-2">
                <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-primary-600" />
                  <span>Snelle Hulp</span>
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center space-x-2">
                      <BookSquare className="w-4 h-4" />
                      <span>Boekingen Beheren</span>
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Bekijk en beheer al je boekingen. Accepteer nieuwe aanvragen, start diensten en markeer ze als voltooid.
                    </p>
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>Naar boekingen</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-xl">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Diensten & Prijzen</span>
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                      Beheer welke diensten je aanbiedt en stel je eigen prijzen in. Maak diensten beschikbaar of onbeschikbaar.
                    </p>
                    <button 
                      onClick={() => setActiveTab('services')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>Diensten beheren</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <h4 className="font-medium text-purple-800 mb-2 flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Beschikbaarheid</span>
                    </h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Stel in wanneer je beschikbaar bent voor boekingen. Klanten kunnen alleen boeken op tijden dat je beschikbaar bent.
                    </p>
                    <button 
                      onClick={() => setActiveTab('availability')}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>Beschikbaarheid instellen</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pending Bookings */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
                <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center justify-between">
                  <span>Nieuwe Aanvragen</span>
                  {pendingBookings.length > 0 && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                      {pendingBookings.length} nieuw
                    </span>
                  )}
                </h3>
                {pendingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {pendingBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-text-primary">{booking.service?.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-700 border-yellow-200`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-3">
                          {new Date(booking.booking_date).toLocaleDateString('nl-NL')} om {booking.booking_time}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-text-secondary mb-3">
                          <User className="w-4 h-4" />
                          <span>{booking.customer?.first_name} {booking.customer?.last_name}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Accepteren
                          </button>
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Weigeren
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingBookings.length > 3 && (
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="w-full text-center text-accent-600 hover:text-accent-700 font-medium py-2"
                      >
                        Bekijk alle {pendingBookings.length} aanvragen →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-text-secondary">Geen nieuwe aanvragen</p>
                  </div>
                )}
              </div>

              {/* Services Overview */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
                <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center justify-between">
                  <span>Mijn Diensten</span>
                  <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded-full text-xs font-medium">
                    {providerServices.length} diensten
                  </span>
                </h3>
                {providerServices.length > 0 ? (
                  <div className="space-y-4">
                    {providerServices.slice(0, 3).map((service) => (
                      <div key={service.id} className="p-4 bg-accent-50 rounded-xl border border-accent-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-text-primary">
                            {service.custom_name || service.service?.name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            service.is_available 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {service.is_available ? 'Beschikbaar' : 'Niet beschikbaar'}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">
                          {service.custom_short_description || service.service?.short_description}
                        </p>
                        <div className="flex items-center space-x-2 text-sm">
                          <Euro className="w-4 h-4 text-accent-600" />
                          <span className="font-medium text-accent-700">
                            €{service.custom_price || 0} 
                            {service.custom_price_unit && ` ${
                              service.custom_price_unit === 'per_hour' ? 'per uur' :
                              service.custom_price_unit === 'per_day' ? 'per dag' :
                              service.custom_price_unit === 'per_service' ? 'per service' :
                              service.custom_price_unit === 'per_km' ? 'per km' :
                              service.custom_price_unit === 'per_item' ? 'per stuk' :
                              service.custom_price_unit === 'per_month' ? 'per maand' :
                              service.custom_price_unit === 'per_week' ? 'per week' : ''
                            }`}
                          </span>
                        </div>
                      </div>
                    ))}
                    {providerServices.length > 3 && (
                      <button
                        onClick={() => setActiveTab('services')}
                        className="w-full text-center text-accent-600 hover:text-accent-700 font-medium py-2"
                      >
                        Bekijk alle {providerServices.length} diensten →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-text-secondary mb-4">Je hebt nog geen diensten toegevoegd</p>
                    <button
                      onClick={() => setActiveTab('services')}
                      className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Dienst toevoegen</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
              <h3 className="text-2xl font-bold text-text-primary mb-6">Boekingenbeheer</h3>
              <BookingList 
                bookings={bookings}
                loading={bookingsLoading}
                error={bookingsError}
                onUpdateStatus={handleUpdateBookingStatus}
              />
            </div>
          )}

          {activeTab === 'services' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
              {provider && (
                <ProfessionalServiceManager 
                  providerId={provider.id} 
                  onServiceUpdated={fetchProviderData}
                />
              )}
            </div>
          )}

          {activeTab === 'availability' && (
            <AvailabilityManager />
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
              <h3 className="text-2xl font-bold text-text-primary mb-6">Statistieken & Inzichten</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Monthly Earnings Chart */}
                <div className="bg-primary-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <span>Maandelijkse Inkomsten</span>
                  </h4>
                  
                  <div className="h-64 flex items-end space-x-2">
                    {getMonthlyEarnings().map((data, index) => {
                      const maxEarnings = Math.max(...getMonthlyEarnings().map(d => d.earnings));
                      const height = maxEarnings > 0 ? (data.earnings / maxEarnings) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex justify-center mb-2">
                            <div 
                              className="w-full bg-primary-200 rounded-t-lg relative group"
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white p-2 rounded shadow text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                €{data.earnings.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                            {data.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Service Distribution */}
                <div className="bg-primary-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-primary-600" />
                    <span>Diensten Verdeling</span>
                  </h4>
                  
                  <div className="h-64 flex items-center justify-center">
                    {bookings.length > 0 ? (
                      <div className="text-center">
                        <p className="text-text-secondary">Diensten verdeling grafiek komt hier</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-text-secondary">Nog geen boekingen om te analyseren</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="bg-primary-50 rounded-xl p-6 md:col-span-2">
                  <h4 className="text-lg font-semibold text-text-primary mb-4">Prestatie Metrics</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-text-secondary mb-1">Acceptatiegraad</p>
                      <p className="text-2xl font-bold text-text-primary">
                        {bookings.length > 0 
                          ? `${Math.round((confirmedBookings.length + completedBookings.length) / bookings.length * 100)}%` 
                          : '0%'}
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-text-secondary mb-1">Voltooiingsgraad</p>
                      <p className="text-2xl font-bold text-text-primary">
                        {(confirmedBookings.length + completedBookings.length) > 0 
                          ? `${Math.round(completedBookings.length / (confirmedBookings.length + completedBookings.length) * 100)}%` 
                          : '0%'}
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-text-secondary mb-1">Gem. Beoordeling</p>
                      <div className="flex items-center">
                        <p className="text-2xl font-bold text-text-primary mr-2">
                          {provider.rating_average || '0.0'}
                        </p>
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-text-secondary mb-1">Totaal Uren</p>
                      <p className="text-2xl font-bold text-text-primary">
                        {bookings.reduce((sum, booking) => sum + (booking.duration_hours || 0), 0).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// BookSquare component for the icon
function BookSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.342a2 2 0 0 0-.602-1.43l-4.44-4.342A2 2 0 0 0 13.56 2H6a2 2 0 0 0-2 2z" />
      <path d="M9 13h6" />
      <path d="M9 17h3" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}