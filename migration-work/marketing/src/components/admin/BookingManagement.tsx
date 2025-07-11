import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  User, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  RefreshCw,
  Euro,
  FileText,
  Tag,
  Package,
  MessageSquare,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  customer_id: string;
  provider_id: string | null;
  service_id: string;
  booking_date: string;
  booking_time: string;
  duration_hours: number;
  estimated_price: number | null;
  final_price: number | null;
  status: string;
  urgency: string;
  customer_notes: string;
  special_requirements: string;
  customer_address: string | null;
  customer_phone: string | null;
  provider_notes: string;
  created_at: string;
  updated_at: string;
  service?: {
    name: string;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  provider?: {
    business_name: string;
  };
  bundle?: {
    name: string;
  };
}

interface ServiceProvider {
  id: string;
  business_name: string | null;
  user_id: string;
  user?: {
    first_name?: string;
    last_name?: string;
  };
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: '',
    provider_notes: '',
    final_price: '',
    provider_id: ''
  });

  useEffect(() => {
    fetchBookings();
    fetchServiceProviders();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      // First, fetch bookings with service and provider data
      const { data: bookingsData, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name),
          provider:service_providers(business_name),
          bundle:service_bundles(name)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      // Get unique customer IDs
      const customerIds = [...new Set(bookingsData.map(booking => booking.customer_id))];

      // Fetch customer profiles and auth user emails
      const [profilesResponse, usersResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', customerIds),
        supabase
          .from('admin_users_overview')
          .select('id, email')
          .in('id', customerIds)
      ]);

      if (profilesResponse.error) {
        console.warn('Could not fetch profiles:', profilesResponse.error);
      }

      if (usersResponse.error) {
        console.warn('Could not fetch user emails:', usersResponse.error);
      }

      // Create lookup maps
      const profilesMap = new Map();
      const usersMap = new Map();

      if (profilesResponse.data) {
        profilesResponse.data.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }

      if (usersResponse.data) {
        usersResponse.data.forEach(user => {
          usersMap.set(user.id, user);
        });
      }

      // Combine booking data with customer information
      const enrichedBookings = bookingsData.map(booking => ({
        ...booking,
        customer: {
          first_name: profilesMap.get(booking.customer_id)?.first_name || '',
          last_name: profilesMap.get(booking.customer_id)?.last_name || '',
          email: usersMap.get(booking.customer_id)?.email || ''
        }
      }));

      setBookings(enrichedBookings);
    } catch (err: any) {
      setError('Fout bij het laden van boekingen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceProviders = async () => {
    try {
      // First, fetch service providers
      const { data: providersData, error: providersError } = await supabase
        .from('service_providers')
        .select('id, business_name, user_id')
        .eq('is_active', true)
        .order('business_name');

      if (providersError) throw providersError;

      if (!providersData || providersData.length === 0) {
        setServiceProviders([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(providersData.map(provider => provider.user_id))];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Could not fetch profiles for service providers:', profilesError);
      }

      // Create a lookup map for profiles
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }

      // Combine provider data with profile information
      const enrichedProviders = providersData.map(provider => ({
        ...provider,
        user: profilesMap.get(provider.user_id) || {}
      }));

      setServiceProviders(enrichedProviders);
    } catch (err: any) {
      console.error('Error fetching service providers:', err);
      // Don't set error state here to avoid disrupting the main booking display
    }
  };

  const toggleBookingDetails = (bookingId: string) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
    } else {
      setExpandedBookingId(bookingId);
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditFormData({
      status: booking.status,
      provider_notes: booking.provider_notes || '',
      final_price: booking.final_price?.toString() || booking.estimated_price?.toString() || '',
      provider_id: booking.provider_id || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBooking) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: editFormData.status,
          provider_notes: editFormData.provider_notes,
          final_price: editFormData.final_price ? parseFloat(editFormData.final_price) : null,
          provider_id: editFormData.provider_id || null
        })
        .eq('id', selectedBooking.id);

      if (updateError) throw updateError;

      setSuccess('Boeking succesvol bijgewerkt!');
      setShowEditModal(false);
      fetchBookings();
    } catch (err: any) {
      setError('Fout bij het bijwerken van boeking: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Weet je zeker dat je deze boeking wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) throw deleteError;

      setSuccess('Boeking succesvol verwijderd!');
      fetchBookings();
    } catch (err: any) {
      setError('Fout bij het verwijderen van boeking: ' + err.message);
    } finally {
      setLoading(false);
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

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'normal': return 'Normaal';
      case 'urgent': return 'Urgent';
      case 'flexible': return 'Flexibel';
      default: return urgency;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'normal': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'flexible': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.customer_address?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Boekingenbeheer</h2>
          <p className="text-text-secondary">Beheer alle boekingen in het systeem</p>
        </div>
        <button
          onClick={fetchBookings}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Vernieuwen
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Zoek boekingen op klant, dienst of adres..."
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
          >
            <option value="all">Alle statussen</option>
            <option value="pending">In afwachting</option>
            <option value="confirmed">Bevestigd</option>
            <option value="in_progress">In uitvoering</option>
            <option value="completed">Voltooid</option>
            <option value="cancelled">Geannuleerd</option>
            <option value="rescheduled">Verzet</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="p-6">
                {/* Booking Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{booking.service?.name || 'Onbekende dienst'}</h3>
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <User className="w-4 h-4" />
                        <span>
                          {booking.customer?.first_name} {booking.customer?.last_name} 
                          {booking.customer?.email && ` (${booking.customer.email})`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(booking.booking_date).toLocaleDateString('nl-NL')} om {booking.booking_time}</span>
                      </div>
                      {booking.bundle && (
                        <div className="flex items-center space-x-2 text-sm text-text-secondary">
                          <Package className="w-4 h-4" />
                          <span>Bundel: {booking.bundle.name}</span>
                        </div>
                      )}
                      {booking.provider && (
                        <div className="flex items-center space-x-2 text-sm text-text-secondary">
                          <User className="w-4 h-4" />
                          <span>Professional: {booking.provider.business_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(booking.urgency)}`}>
                      {getUrgencyLabel(booking.urgency)}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleBookingDetails(booking.id)}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      >
                        {expandedBookingId === booking.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Booking Details */}
                {expandedBookingId === booking.id && (
                  <div className="mt-4 pl-14">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Customer Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
                          <User className="w-4 h-4 text-primary-600" />
                          <span>Klantgegevens</span>
                        </h4>
                        <div className="space-y-3">
                          {booking.customer_address && (
                            <div className="flex items-start space-x-2">
                              <MapPin className="w-4 h-4 text-text-light mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-text-primary">Adres</p>
                                <p className="text-sm text-text-secondary">{booking.customer_address}</p>
                              </div>
                            </div>
                          )}
                          {booking.customer_phone && (
                            <div className="flex items-start space-x-2">
                              <Phone className="w-4 h-4 text-text-light mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-text-primary">Telefoon</p>
                                <p className="text-sm text-text-secondary">{booking.customer_phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Booking Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-primary-600" />
                          <span>Boekingsdetails</span>
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 text-text-light mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">Duur</p>
                              <p className="text-sm text-text-secondary">{booking.duration_hours} uur</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Euro className="w-4 h-4 text-text-light mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">Prijs</p>
                              <p className="text-sm text-text-secondary">
                                Geschat: €{booking.estimated_price?.toFixed(2) || '0.00'}
                                {booking.final_price && ` | Definitief: €${booking.final_price.toFixed(2)}`}
                              </p>
                            </div>
                          </div>
                          {booking.provider && (
                            <div className="flex items-start space-x-2">
                              <User className="w-4 h-4 text-text-light mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-text-primary">Professional</p>
                                <p className="text-sm text-text-secondary">{booking.provider.business_name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="mt-4 space-y-4">
                      {booking.customer_notes && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-700">Klant notities:</p>
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {bookings.length === 0 ? 'Geen boekingen gevonden' : 'Geen boekingen gevonden met huidige filters'}
            </h3>
            <p className="text-gray-600">
              {bookings.length === 0 
                ? 'Er zijn nog geen boekingen in het systeem'
                : 'Probeer je zoekfilters aan te passen'
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit Booking Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Boeking Bewerken
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dienst:</p>
                    <p className="font-medium">{selectedBooking.service?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Klant:</p>
                    <p>{selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Datum:</p>
                    <p>{new Date(selectedBooking.booking_date).toLocaleDateString('nl-NL')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tijd:</p>
                    <p>{selectedBooking.booking_time}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="pending">In afwachting</option>
                    <option value="confirmed">Bevestigd</option>
                    <option value="in_progress">In uitvoering</option>
                    <option value="completed">Voltooid</option>
                    <option value="cancelled">Geannuleerd</option>
                    <option value="rescheduled">Verzet</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional
                  </label>
                  <select
                    value={editFormData.provider_id}
                    onChange={(e) => setEditFormData({...editFormData, provider_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Geen professional toegewezen</option>
                    {serviceProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.business_name || 'Onbekend'} 
                        {provider.user?.first_name && provider.user?.last_name && 
                          ` (${provider.user.first_name} ${provider.user.last_name})`
                        }
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Wijs een professional toe aan deze boeking
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Definitieve Prijs (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.final_price}
                    onChange={(e) => setEditFormData({...editFormData, final_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Definitieve prijs"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laat leeg om de geschatte prijs te gebruiken: €{selectedBooking.estimated_price?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Notities
                  </label>
                  <textarea
                    value={editFormData.provider_notes}
                    onChange={(e) => setEditFormData({...editFormData, provider_notes: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Notities over deze boeking..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>Opslaan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Wijzigingen Opslaan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}