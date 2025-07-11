import React from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Star, Users, Euro, Briefcase } from 'lucide-react';
import { BookingWithDetails } from '../../lib/supabase';

interface BookingStatsProps {
  bookings: BookingWithDetails[];
  pendingCount: number;
  confirmedCount: number;
  inProgressCount: number;
  completedCount: number;
}

export function BookingStats({ 
  bookings, 
  pendingCount, 
  confirmedCount, 
  inProgressCount, 
  completedCount 
}: BookingStatsProps) {
  // Calculate total earnings from completed bookings
  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, booking) => sum + (booking.final_price || booking.estimated_price || 0), 0);

  // Calculate average rating if there are reviews
  const bookingsWithReviews = bookings.filter(b => b.review && b.review.rating);
  const averageRating = bookingsWithReviews.length > 0
    ? bookingsWithReviews.reduce((sum, b) => sum + (b.review?.rating || 0), 0) / bookingsWithReviews.length
    : 0;

  // Calculate unique customers
  const uniqueCustomers = new Set(bookings.map(b => b.customer_id)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      <div className="bg-white rounded-xl p-4 border border-primary-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Nieuwe Aanvragen</p>
            <p className="text-2xl font-bold text-text-primary">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Bevestigd</p>
            <p className="text-2xl font-bold text-text-primary">{confirmedCount}</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">In Uitvoering</p>
            <p className="text-2xl font-bold text-text-primary">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Voltooid</p>
            <p className="text-2xl font-bold text-text-primary">{completedCount}</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-white rounded-xl p-4 border border-accent-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Verdiensten</p>
            <p className="text-2xl font-bold text-text-primary">€{totalEarnings.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
            <Euro className="w-5 h-5 text-accent-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-primary-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Unieke Klanten</p>
            <p className="text-2xl font-bold text-text-primary">{uniqueCustomers}</p>
          </div>
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-secondary-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Gemiddelde Rating</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-text-primary mr-2">
                {averageRating > 0 ? averageRating.toFixed(1) : '-'}
              </p>
              {averageRating > 0 && (
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
          </div>
          <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-secondary-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Totaal Boekingen</p>
            <p className="text-2xl font-bold text-text-primary">{bookings.length}</p>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
}