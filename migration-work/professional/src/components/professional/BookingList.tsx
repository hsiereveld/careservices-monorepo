import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Star, 
  Settings,
  Euro,
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
  FileCheck,
  ChevronDown,
  ChevronUp,
  Play,
  Check,
  X
} from 'lucide-react';
import { BookingWithDetails, BookingStatus } from '../../lib/supabase';
import { getPriceUnitLabel } from '../../utils/bookingPriceCalculator';

interface BookingListProps {
  bookings: BookingWithDetails[];
  loading: boolean;
  error: string | null;
  onUpdateStatus: (bookingId: string, status: BookingStatus, notes?: string) => Promise<void>;
}

export function BookingList({ bookings, loading, error, onUpdateStatus }: BookingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Check if user can see professional earnings
  const canSeeEarnings = true;

  const toggleBookingDetails = (bookingId: string) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
    } else {
      setExpandedBookingId(bookingId);
    }
  };

  const openStatusChangeModal = (bookingId: string, status: BookingStatus) => {
    setSelectedBookingId(bookingId);
    setSelectedStatus(status);
    setStatusNote('');
    setShowNoteModal(true);
  };

  const closeStatusChangeModal = () => {
    setShowNoteModal(false);
    setSelectedBookingId(null);
    setSelectedStatus(null);
    setStatusNote('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedBookingId || !selectedStatus) return;

    try {
      setIsSubmitting(true);
      setActionError(null);
      setActionSuccess(null);

      await onUpdateStatus(selectedBookingId, selectedStatus, statusNote);
      
      setActionSuccess(`Status bijgewerkt naar ${getStatusLabel(selectedStatus)}!`);
      closeStatusChangeModal();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date to Dutch format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  // Format time
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  // Format duration in a more user-friendly way
  const formatDuration = (hours: number | undefined, days: number | undefined) => {
    if (hours === undefined) return 'Onbekend';
    
    // Calculate days and remaining hours
    const calculatedDays = Math.floor(hours / 24);
    const remainingHours = Math.round((hours % 24) * 10) / 10; // Round to 1 decimal
    
    if (calculatedDays === 0) {
      return `${remainingHours} uur`;
    } else if (remainingHours === 0) {
      return `${calculatedDays} ${calculatedDays === 1 ? 'dag' : 'dagen'}`;
    } else {
      return `${calculatedDays} ${calculatedDays === 1 ? 'dag' : 'dagen'} en ${remainingHours} uur`;
    }
  };

  // Get date filter options
  const getDateFilterOptions = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return [
      { value: 'all', label: 'Alle datums' },
      { value: 'today', label: 'Vandaag', date: today },
      { value: 'tomorrow', label: 'Morgen', date: tomorrow },
      { value: 'week', label: 'Komende week', date: nextWeek },
      { value: 'month', label: 'Komende maand', date: nextMonth },
      { value: 'past', label: 'Verleden boekingen' }
    ];
  };

  // Filter bookings by date
  const filterBookingsByDate = (booking: BookingWithDetails, filter: string) => {
    if (filter === 'all') return true;
    
    const bookingDate = new Date(booking.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    switch (filter) {
      case 'today':
        return bookingDate.toDateString() === today.toDateString();
      case 'tomorrow':
        return bookingDate.toDateString() === tomorrow.toDateString();
      case 'week':
        return bookingDate >= today && bookingDate <= nextWeek;
      case 'month':
        return bookingDate >= today && bookingDate <= nextMonth;
      case 'past':
        return bookingDate < today;
      default:
        return true;
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

  // Check if a status transition is valid
  const isValidStatusTransition = (currentStatus: string, newStatus: string): boolean => {
    // Define valid transitions
    const validTransitions: Record<string, string[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled', 'rescheduled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // No transitions from completed
      'cancelled': [], // No transitions from cancelled
      'rescheduled': ['confirmed', 'cancelled']
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  // Filter bookings based on search, status, and date
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.customer_address?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesDate = filterBookingsByDate(booking, dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort bookings by date (most recent first)
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(a.booking_date);
    const dateB = new Date(b.booking_date);
    return dateB.getTime() - dateA.getTime();
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-accent-500 mr-3" />
        <span className="text-text-secondary">Boekingen laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Action messages */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{actionSuccess}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Zoek op klant, dienst of adres..."
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-12 pr-8 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
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
        <div className="relative">
          <Calendar className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-12 pr-8 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
          >
            {getDateFilterOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {sortedBookings.length > 0 ? (
        <div className="space-y-6">
          {sortedBookings.map((booking) => {
            // Use booking_start_date/time if available, otherwise fall back to booking_date/time
            const startDate = booking.booking_start_date || booking.booking_date;
            const startTime = booking.booking_start_time || booking.booking_time;
            const endDate = booking.booking_end_date;
            const endTime = booking.booking_end_time;
            
            return (
              <div key={booking.id} className="bg-white rounded-xl border border-primary-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Booking Header */}
                <div className="p-4 border-b border-primary-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{booking.service?.name}</h3>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                        <span className="text-text-light">•</span>
                        <span className="text-text-secondary">{formatDate(startDate)} om {formatTime(startTime)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Status Action Buttons */}
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openStatusChangeModal(booking.id, 'confirmed')}
                          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Accepteren
                        </button>
                        <button
                          onClick={() => openStatusChangeModal(booking.id, 'cancelled')}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Weigeren
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => openStatusChangeModal(booking.id, 'in_progress')}
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Start Dienst</span>
                      </button>
                    )}
                    {booking.status === 'in_progress' && (
                      <button
                        onClick={() => openStatusChangeModal(booking.id, 'completed')}
                        className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Voltooien</span>
                      </button>
                    )}
                    
                    {/* Toggle Details Button */}
                    <button
                      onClick={() => toggleBookingDetails(booking.id)}
                      className="p-2 text-text-light hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      {expandedBookingId === booking.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedBookingId === booking.id && (
                  <div className="p-4 bg-primary-50">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Customer Information */}
                      <div>
                        <h4 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
                          <User className="w-4 h-4 text-primary-600" />
                          <span>Klantgegevens</span>
                        </h4>
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <div className="flex items-start space-x-2">
                            <User className="w-4 h-4 text-text-light mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">Naam</p>
                              <p className="text-sm text-text-secondary">
                                {booking.customer?.first_name} {booking.customer?.last_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Phone className="w-4 h-4 text-text-light mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">Telefoon</p>
                              <p className="text-sm text-text-secondary">{booking.customer_phone || 'Niet opgegeven'}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 text-text-light mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">Adres</p>
                              <p className="text-sm text-text-secondary">{booking.customer_address || 'Niet opgegeven'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Booking Details */}
                      <div>
                        <h4 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-primary-600" />
                          <span>Boekingsdetails</span>
                        </h4>
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <div className="flex items-start space-x-2">
                            <Calendar className="w-4 h-4 text-text-light mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">Start Datum & Tijd</p>
                              <p className="text-sm text-text-secondary">
                                {formatDate(startDate)} om {formatTime(startTime)}
                              </p>
                            </div>
                          </div>
                          
                          {/* End Date and Time - Only show if available */}
                          {(endDate || endTime) && (
                            <div className="flex items-start space-x-2">
                              <Calendar className="w-4 h-4 text-text-light mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-text-primary">Eind Datum & Tijd</p>
                                <p className="text-sm text-text-secondary">
                                  {endDate ? formatDate(endDate) : formatDate(startDate)} 
                                  {endTime ? ` om ${formatTime(endTime)}` : ''}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Duration - Improved format */}
                          <div className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 text-text-light mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">Duur</p>
                              <p className="text-sm text-text-secondary">
                                {formatDuration(booking.duration_hours, booking.duration_days)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Urgency */}
                          <div className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 text-text-light mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">Urgentie</p>
                              <p className="text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs border ${getUrgencyColor(booking.urgency)}`}>
                                  {getUrgencyLabel(booking.urgency)}
                                </span>
                              </p>
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className="flex items-start space-x-2">
                            <Euro className="w-4 h-4 text-text-light mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">Prijs incl. BTW en Commissie</p>
                              <p className="text-sm text-text-secondary">
                                €{booking.estimated_price?.toFixed(2) || '0.00'}
                                {booking.final_price ? ` (Definitief: €${booking.final_price.toFixed(2)})` : ''}
                              </p>
                            </div>
                          </div>
                          
                          {/* Service Price and Unit - New addition */}
                          {booking.service_price && booking.service_price_unit && (
                            <div className="flex items-start space-x-2">
                              <Euro className="w-4 h-4 text-primary-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-text-primary">Basis Tarief</p>
                                <p className="text-sm text-text-secondary">
                                  €{booking.service_price.toFixed(2)} {getPriceUnitLabel(booking.service_price_unit)}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Professional Earnings - Only show for professional, admin, or backoffice */}
                          {canSeeEarnings && booking.professional_earning !== undefined && (
                            <div className="flex items-start space-x-2">
                              <Euro className="w-4 h-4 text-accent-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-text-primary">Jouw Verdiensten (excl. BTW)</p>
                                <p className="text-sm font-semibold text-accent-600">
                                  €{booking.professional_earning.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Notes Section */}
                    <div className="mt-4">
                      <h4 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-primary-600" />
                        <span>Notities</span>
                      </h4>
                      <div className="space-y-3">
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
                            <p className="text-sm font-medium text-green-700">Jouw notities:</p>
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
                        <h4 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
                          <FileCheck className="w-4 h-4 text-primary-600" />
                          <span>Factuur</span>
                        </h4>
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
                    
                    {/* Status History */}
                    {booking.status_history && booking.status_history.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-primary-600" />
                          <span>Status Geschiedenis</span>
                        </h4>
                        <div className="space-y-2">
                          {booking.status_history.map((history) => (
                            <div key={history.id} className="bg-white p-2 rounded-lg">
                              <div className="flex justify-between text-xs text-text-light">
                                <span>{new Date(history.created_at).toLocaleString('nl-NL')}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(history.new_status)}`}>
                                  {getStatusLabel(history.new_status)}
                                </span>
                              </div>
                              {history.notes && (
                                <p className="text-sm text-text-secondary mt-1">{history.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Status Change Buttons */}
                    <div className="mt-4 pt-4 border-t border-primary-200">
                      <h4 className="font-medium text-text-primary mb-3">Status Wijzigen</h4>
                      <div className="flex flex-wrap gap-2">
                        {isValidStatusTransition(booking.status, 'confirmed') && (
                          <button
                            onClick={() => openStatusChangeModal(booking.id, 'confirmed')}
                            className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            Bevestigen
                          </button>
                        )}
                        {isValidStatusTransition(booking.status, 'in_progress') && (
                          <button
                            onClick={() => openStatusChangeModal(booking.id, 'in_progress')}
                            className="px-3 py-1.5 rounded-md text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center space-x-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start Dienst</span>
                          </button>
                        )}
                        {isValidStatusTransition(booking.status, 'completed') && (
                          <button
                            onClick={() => openStatusChangeModal(booking.id, 'completed')}
                            className="px-3 py-1.5 rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Voltooien</span>
                          </button>
                        )}
                        {isValidStatusTransition(booking.status, 'cancelled') && (
                          <button
                            onClick={() => openStatusChangeModal(booking.id, 'cancelled')}
                            className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center space-x-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Annuleren</span>
                          </button>
                        )}
                        {isValidStatusTransition(booking.status, 'rescheduled') && (
                          <button
                            onClick={() => openStatusChangeModal(booking.id, 'rescheduled')}
                            className="px-3 py-1.5 rounded-md text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center space-x-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>Verzetten</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {bookings.length === 0 ? 'Geen boekingen gevonden' : 'Geen boekingen gevonden met huidige filters'}
          </h3>
          <p className="text-text-secondary">
            {bookings.length === 0 
              ? 'Je hebt nog geen boekingen ontvangen'
              : 'Probeer je zoekfilters aan te passen'
            }
          </p>
        </div>
      )}

      {/* Status Change Modal */}
      {showNoteModal && selectedBookingId && selectedStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Status Wijzigen naar {getStatusLabel(selectedStatus)}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Notitie (optioneel)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-32 resize-none"
                  placeholder="Voeg een notitie toe over deze statuswijziging..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateStatus}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    selectedStatus === 'confirmed' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                    selectedStatus === 'in_progress' ? 'bg-purple-500 hover:bg-purple-600 text-white' :
                    selectedStatus === 'completed' ? 'bg-green-500 hover:bg-green-600 text-white' :
                    selectedStatus === 'cancelled' ? 'bg-red-500 hover:bg-red-600 text-white' :
                    'bg-primary-500 hover:bg-primary-600 text-white'
                  } disabled:opacity-50 flex items-center justify-center space-x-2`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      <span>Bezig...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Bevestigen</span>
                    </>
                  )}
                </button>
                <button
                  onClick={closeStatusChangeModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}