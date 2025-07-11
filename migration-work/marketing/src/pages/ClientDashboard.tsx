import React, { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
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
  RefreshCw,
  Download,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, ServiceProvider, ProviderService, BookingWithDetails, Service } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';
import { useBookings } from '../hooks/useBookings';
import { ReviewForm } from '../components/client/ReviewForm';
import { DiscountManager } from '../components/client/DiscountManager';
import { SubscriptionManager } from '../components/client/SubscriptionManager';
import { ServiceBundleManager } from '../components/client/ServiceBundleManager';
import { InvoiceManager } from '../components/client/InvoiceManager';

export function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'invoices' | 'discounts' | 'subscriptions' | 'bundles'>('overview');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<BookingWithDetails | null>(null);

  // Use the bookings hook
  const { 
    bookings, 
    upcomingBookings, 
    completedBookings, 
    loading: bookingsLoading, 
    error: bookingsError,
    updateBookingStatus,
    addReview,
    refetch: refreshBookings
  } = useBookings();

  useEffect(() => {
    if (user) {
      fetchProfile();
      
      // Check if there's a review parameter in the URL
      const reviewBookingId = searchParams.get('review');
      if (reviewBookingId) {
        const bookingToReview = bookings.find(b => b.id === reviewBookingId);
        if (bookingToReview && bookingToReview.status === 'completed' && !bookingToReview.review) {
          setSelectedBookingForReview(bookingToReview);
          setShowReviewForm(true);
        }
      }
    }
  }, [user, bookings, searchParams]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(data);
    } catch (err: any) {
      setError('Fout bij het laden van profiel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await updateBookingStatus(bookingId, 'cancelled');

      if (error) throw error;

      setSuccess('Boeking succesvol geannuleerd!');
      refreshBookings();
    } catch (err: any) {
      setError('Fout bij het annuleren van boeking: ' + err.message);
    }
  };

  const handleSubmitReview = async (bookingId: string, rating: number, reviewText?: string) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await addReview(bookingId, rating, reviewText);

      if (error) throw error;

      setSuccess('Beoordeling succesvol toegevoegd!');
      setShowReviewForm(false);
      setSelectedBookingForReview(null);
      
      // Remove the review parameter from the URL
      searchParams.delete('review');
      setSearchParams(searchParams);
      
      refreshBookings();
    } catch (err: any) {
      setError('Fout bij het toevoegen van beoordeling: ' + err.message);
      throw err;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'rescheduled': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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

  if (authLoading || loading || roleLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="text-text-primary text-xl font-medium">Client dashboard laden...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate href="/login" replace />;
  }

  // Verify user role
  if (userRole !== 'client' && userRole !== 'admin' && userRole !== 'backoffice') {
    return <Navigate href="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Client Dashboard
          </h1>
          <p className="text-text-secondary text-lg">
            Beheer je boekingen en diensten
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

        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50 mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile?.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                {profile?.first_name && profile?.last_name 
                  ? `${profile.first_name} ${profile.last_name}` 
                  : 'Klant'}
              </h2>
              <p className="text-text-secondary mb-3">{user.email}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {profile?.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-text-light" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-text-light" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
            <div>
              <Link 
                href="/profile"
                className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Profiel Bewerken</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Booking Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-8">
          <div className="bg-white rounded-xl p-4 border border-primary-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Aankomende Boekingen</p>
                <p className="text-2xl font-bold text-text-primary">{upcomingBookings.length}</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-primary-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Voltooide Boekingen</p>
                <p className="text-2xl font-bold text-text-primary">{completedBookings.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-primary-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Totaal Boekingen</p>
                <p className="text-2xl font-bold text-text-primary">{bookings.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clipboard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-primary-200/50 mb-8">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overzicht', icon: Home },
              { id: 'bookings', label: 'Boekingen', icon: Calendar },
              { id: 'invoices', label: 'Facturen', icon: FileText },
              { id: 'discounts', label: 'Kortingen', icon: Award },
              { id: 'subscriptions', label: 'Abonnementen', icon: Users },
              { id: 'bundles', label: 'Bundels', icon: Clipboard }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-text-secondary hover:text-text-primary hover:bg-primary-50'
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
                      <Calendar className="w-4 h-4" />
                      <span>Boekingen Beheren</span>
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Bekijk en beheer al je boekingen. Annuleer of wijzig boekingen indien nodig.
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
                      <FileText className="w-4 h-4" />
                      <span>Facturen Bekijken</span>
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                      Bekijk en download al je facturen. Houd je betalingen bij.
                    </p>
                    <button 
                      onClick={() => setActiveTab('invoices')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>Naar facturen</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <h4 className="font-medium text-purple-800 mb-2 flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Kortingen & Bundels</span>
                    </h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Bekijk beschikbare kortingen en servicebundels om te besparen op je boekingen.
                    </p>
                    <button 
                      onClick={() => setActiveTab('discounts')}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>Naar kortingen</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Upcoming Bookings */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
                <h3 className="text-xl font-bold text-text-primary mb-4">Aankomende Boekingen</h3>
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="p-4 bg-primary-50 rounded-xl border border-primary-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-text-primary">{booking.service?.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-3">
                          {new Date(booking.booking_date).toLocaleDateString('nl-NL')} om {booking.booking_time}
                        </p>
                        {booking.provider && (
                          <div className="flex items-center space-x-2 text-sm text-text-secondary mb-3">
                            <User className="w-4 h-4" />
                            <span>{booking.provider.business_name}</span>
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setActiveTab('bookings')}
                            className="px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Details
                          </button>
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                            >
                              Annuleren
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {upcomingBookings.length > 3 && (
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="w-full text-center text-primary-600 hover:text-primary-700 font-medium py-2"
                      >
                        Bekijk alle {upcomingBookings.length} boekingen →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-text-secondary">Geen aankomende boekingen</p>
                    <Link 
                      href="/diensten"
                      className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <span>Dienst boeken</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Recent Invoices */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
                <h3 className="text-xl font-bold text-text-primary mb-4">Recente Facturen</h3>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-text-secondary mb-4">Bekijk je facturen in het facturen tabblad</p>
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Naar Facturen</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
              <h3 className="text-2xl font-bold text-text-primary mb-6">Mijn Boekingen</h3>
              
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Zoek op dienst of datum..."
                    className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <select
                    className="pl-12 pr-8 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
                  >
                    <option value="all">Alle statussen</option>
                    <option value="upcoming">Aankomend</option>
                    <option value="completed">Voltooid</option>
                    <option value="cancelled">Geannuleerd</option>
                  </select>
                </div>
              </div>
              
              {/* Bookings List */}
              {bookings.length > 0 ? (
                <div className="space-y-6">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Booking Header */}
                      <div className="bg-gray-50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-text-primary">{booking.service?.name}</h4>
                              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(booking.booking_date).toLocaleDateString('nl-NL')} om {booking.booking_time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                            <button
                              onClick={() => {
                                const detailsEl = document.getElementById(`booking-details-${booking.id}`);
                                if (detailsEl) {
                                  detailsEl.classList.toggle('hidden');
                                }
                              }}
                              className="p-1 text-text-light hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Booking Details (hidden by default) */}
                      <div id={`booking-details-${booking.id}`} className="p-4 bg-white hidden">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Service Details */}
                          <div>
                            <h5 className="font-medium text-text-primary mb-3">Service Details</h5>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-text-secondary text-sm">Service:</span>
                                <span className="text-text-primary text-sm font-medium">{booking.service?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary text-sm">Datum:</span>
                                <span className="text-text-primary text-sm">{new Date(booking.booking_date).toLocaleDateString('nl-NL')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary text-sm">Tijd:</span>
                                <span className="text-text-primary text-sm">{booking.booking_time}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary text-sm">Duur:</span>
                                <span className="text-text-primary text-sm">
                                  {booking.duration_hours} uur
                                  {booking.duration_days && booking.duration_days > 0 ? ` (${booking.duration_days} dagen)` : ''}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary text-sm">Prijs:</span>
                                <span className="text-text-primary text-sm">€{booking.estimated_price?.toFixed(2) || '0.00'}</span>
                              </div>
                              {booking.service_price && booking.service_price_unit && (
                                <div className="flex justify-between">
                                  <span className="text-text-secondary text-sm">Basis tarief:</span>
                                  <span className="text-text-primary text-sm">
                                    €{booking.service_price.toFixed(2)} per {booking.service_price_unit.replace('per_', '')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Provider Details */}
                          {booking.provider && (
                            <div>
                              <h5 className="font-medium text-text-primary mb-3">Professional</h5>
                              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-text-secondary text-sm">Naam:</span>
                                  <span className="text-text-primary text-sm font-medium">{booking.provider.business_name}</span>
                                </div>
                                {booking.provider.phone && (
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary text-sm">Telefoon:</span>
                                    <span className="text-text-primary text-sm">{booking.provider.phone}</span>
                                  </div>
                                )}
                                {booking.provider.email && (
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary text-sm">Email:</span>
                                    <span className="text-text-primary text-sm">{booking.provider.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Notes Section */}
                        <div className="mt-4">
                          <h5 className="font-medium text-text-primary mb-3">Notities</h5>
                          <div className="space-y-3">
                            {booking.customer_notes && (
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-blue-700">Jouw notities:</p>
                                <p className="text-sm text-blue-600">{booking.customer_notes}</p>
                              </div>
                            )}
                            {booking.special_requirements && (
                              <div className="bg-yellow-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-yellow-700">Speciale vereisten:</p>
                                <p className="text-sm text-yellow-600">{booking.special_requirements}</p>
                              </div>
                            )}
                            {booking.provider_notes && (
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-green-700">Professional notities:</p>
                                <p className="text-sm text-green-600">{booking.provider_notes}</p>
                              </div>
                            )}
                            {(!booking.customer_notes && !booking.special_requirements && !booking.provider_notes) && (
                              <p className="text-sm text-text-light italic">Geen notities beschikbaar</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Invoice Link - NEW ADDITION */}
                        {booking.invoice_pdf_url && (
                          <div className="mt-4">
                            <h5 className="font-medium text-text-primary mb-3">Factuur</h5>
                            <a 
                              href={booking.invoice_pdf_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            >
                              <FileCheck className="w-4 h-4" />
                              <span>Factuur bekijken</span>
                            </a>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-wrap gap-3">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
                            >
                              Annuleren
                            </button>
                          )}
                          
                          {booking.status === 'completed' && !booking.review && (
                            <button
                              onClick={() => {
                                setSelectedBookingForReview(booking);
                                setShowReviewForm(true);
                              }}
                              className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg font-medium transition-colors"
                            >
                              Beoordeling toevoegen
                            </button>
                          )}
                          
                          {/* Chat Button - Placeholder for future implementation */}
                          <button
                            className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors"
                            disabled
                          >
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="w-4 h-4" />
                              <span>Chat met professional</span>
                              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Binnenkort</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Geen boekingen gevonden</h3>
                  <p className="text-text-secondary mb-6">Je hebt nog geen boekingen gemaakt</p>
                  <Link 
                    href="/diensten"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Dienst Boeken</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <InvoiceManager />
          )}

          {activeTab === 'discounts' && (
            <DiscountManager />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionManager />
          )}

          {activeTab === 'bundles' && (
            <ServiceBundleManager />
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && selectedBookingForReview && (
        <ReviewForm
          bookingId={selectedBookingForReview.id}
          serviceName={selectedBookingForReview.service?.name || 'Dienst'}
          providerName={selectedBookingForReview.provider?.business_name || 'Professional'}
          onSubmit={handleSubmitReview}
          onClose={() => {
            setShowReviewForm(false);
            setSelectedBookingForReview(null);
            // Remove the review parameter from the URL
            searchParams.delete('review');
            setSearchParams(searchParams);
          }}
        />
      )}
    </div>
  );
}