import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Calendar, Clock, MapPin, Star, MessageCircle, Phone, Edit, X, MessageSquare, CheckCircle, XCircle, RotateCcw, AlertCircle, User } from 'lucide-react';

// Updated Booking interface to include review property
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress';
  final_price: number;
  customer_address?: string;
  customer_notes?: string;
  special_requirements?: string;
  service: {
    name: string;
    short_description: string;
    base_price: number;
  };
  provider: {
    business_name: string;
    user_id: string;
  };
  review?: Review; // Added review property
}

interface BookingManagementProps {
  onBookingUpdated?: () => void;
}

export default function BookingManagement({ onBookingUpdated }: BookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/customer/bookings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch('/api/customer/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          action: 'cancel',
          cancel_reason: cancelReason
        }),
      });

      if (response.ok) {
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        ));
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedBooking(null);
        onBookingUpdated?.();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bevestigd';
      case 'pending': return 'Wachtend op bevestiging';
      case 'completed': return 'Voltooid';
      case 'cancelled': return 'Geannuleerd';
      case 'in_progress': return 'Bezig';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'in_progress': return <RotateCcw className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const canCancelBooking = (booking: Booking) => {
    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const hoursDiff = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return ['pending', 'confirmed'].includes(booking.status) && hoursDiff > 24;
  };

  const canRescheduleBooking = (booking: Booking) => {
    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const hoursDiff = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return ['pending', 'confirmed'].includes(booking.status) && hoursDiff > 48;
  };

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming') return ['pending', 'confirmed'].includes(booking.status);
    if (statusFilter === 'active') return ['confirmed', 'in_progress'].includes(booking.status);
    return booking.status === statusFilter;
  });

  const statusCounts = {
    all: bookings.length,
    upcoming: bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length,
    active: bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Boekingen laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mijn Boekingen ({filteredBookings.length})</CardTitle>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Nieuwe Boeking
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Alle', count: statusCounts.all },
              { key: 'upcoming', label: 'Komend', count: statusCounts.upcoming },
              { key: 'active', label: 'Actief', count: statusCounts.active },
              { key: 'completed', label: 'Voltooid', count: statusCounts.completed },
              { key: 'cancelled', label: 'Geannuleerd', count: statusCounts.cancelled }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                variant={statusFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(key)}
              >
                {label} ({count})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold">{booking.service.name}</h3>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1">{getStatusText(booking.status)}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(booking.booking_date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(booking.booking_time)}
                      </div>
                      {booking.customer_address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {booking.customer_address}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {booking.provider?.business_name || 'Provider'}
                      </div>
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <span>Prijs: {formatCurrency(booking.final_price)}</span>
                      </div>
                    </div>
                  </div>

                  {booking.customer_notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Notities:</strong> {booking.customer_notes}
                      </p>
                    </div>
                  )}

                  {booking.review && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">
                          {booking.review.rating} / 5
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {booking.review.comment}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  {booking.status === 'completed' && !booking.review && (
                    <Button size="sm">
                      <Star className="h-4 w-4 mr-1" />
                      Beoordelen
                    </Button>
                  )}
                  
                  {canRescheduleBooking(booking) && (
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Verplaatsen
                    </Button>
                  )}
                  
                  {['confirmed', 'in_progress'].includes(booking.status) && (
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  )}
                  
                  {canCancelBooking(booking) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowCancelModal(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Annuleren
                    </Button>
                  )}
                  
                  {booking.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Opnieuw Boeken
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen boekingen gevonden</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter === 'all' 
              ? 'Je hebt nog geen boekingen gemaakt'
              : `Geen boekingen met status "${statusFilter}"`
            }
          </p>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Eerste Boeking Maken
          </Button>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Boeking Annuleren</h3>
            <p className="text-gray-600 mb-4">
              Weet je zeker dat je de boeking voor "{selectedBooking.service.name}" wilt annuleren?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reden (optioneel)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Waarom annuleer je deze boeking?"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancelReason('');
                }}
              >
                Behouden
              </Button>
              <Button
                onClick={() => handleCancelBooking(selectedBooking.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
