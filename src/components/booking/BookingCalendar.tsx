'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { BookingCalendarSlot } from '@/packages/types/service-catalog.types';
import { useFranchise } from '@/shared/providers';

interface BookingCalendarProps {
  professionalId: string;
  serviceId: string;
  selectedDate: string | null;
  selectedTime: string | null;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onDurationChange: (duration: number) => void;
  minDuration?: number;
  maxDuration?: number;
}

export default function BookingCalendar({
  professionalId,
  serviceId,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  onDurationChange,
  minDuration = 60,
  maxDuration = 480
}: BookingCalendarProps) {
  const { franchiseId } = useFranchise();
  const [availability, setAvailability] = useState<Record<string, BookingCalendarSlot[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [duration, setDuration] = useState(minDuration);

  // Generate calendar dates for current month
  const generateCalendarDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || dates.length < 42) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const calendarDates = generateCalendarDates(currentMonth);

  // Fetch availability for a specific date
  const fetchAvailability = async (date: string) => {
    if (availability[date]) return; // Already loaded

    setLoading(true);
    try {
      const response = await fetch(`/api/booking/availability?professional_id=${professionalId}&date=${date}&service_id=${serviceId}&franchise_id=${franchiseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      
      // Convert availability slots to our format
      const slots: BookingCalendarSlot[] = data.availability_slots.map((slot: any) => ({
        date,
        time: slot.time,
        is_available: slot.is_available,
        is_emergency: slot.is_emergency,
        price: 0 // Will be calculated based on service
      }));

      setAvailability(prev => ({
        ...prev,
        [date]: slots
      }));
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Er is een fout opgetreden bij het laden van de beschikbaarheid');
    } finally {
      setLoading(false);
    }
  };

  // Load availability when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, professionalId, serviceId]);

  const handleDateClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return; // Can't book in the past

    onDateSelect(dateString);
    onTimeSelect(''); // Reset time selection
  };

  const handleTimeClick = (time: string) => {
    onTimeSelect(time);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    onDurationChange(newDuration);
  };

  const isDateAvailable = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const slots = availability[dateString];
    return slots && slots.some(slot => slot.is_available);
  };

  const isDateSelected = (date: Date) => {
    return selectedDate === date.toISOString().split('T')[0];
  };

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('nl-NL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getTimeSlots = () => {
    if (!selectedDate) return [];
    return availability[selectedDate] || [];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Selecteer Datum</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-700">
                {currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDates.map((date, index) => {
              const isSelected = isDateSelected(date);
              const isToday = isDateToday(date);
              const isPast = isDatePast(date);
              const isAvailable = isDateAvailable(date);
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  disabled={isPast || !isAvailable}
                  className={`
                    p-2 text-sm rounded-lg transition-colors relative
                    ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${isSelected ? 'bg-accent-600 text-white' : ''}
                    ${isToday && !isSelected ? 'bg-accent-100 text-accent-800' : ''}
                    ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${!isPast && isAvailable && !isSelected ? 'hover:bg-gray-100' : ''}
                    ${!isPast && !isAvailable ? 'text-gray-400 cursor-not-allowed' : ''}
                  `}
                >
                  {date.getDate()}
                  {isAvailable && !isPast && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecteer Tijd</h3>
          
          {selectedDate ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Beschikbare tijden voor {formatDate(new Date(selectedDate))}
              </p>

              {loading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {getTimeSlots().map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => handleTimeClick(slot.time)}
                      disabled={!slot.is_available}
                      className={`
                        p-2 text-sm rounded-lg border transition-colors
                        ${selectedTime === slot.time ? 'bg-accent-600 text-white border-accent-600' : ''}
                        ${slot.is_available && selectedTime !== slot.time ? 'border-gray-300 hover:border-accent-300 hover:bg-accent-50' : ''}
                        ${!slot.is_available ? 'border-gray-200 text-gray-400 cursor-not-allowed' : ''}
                      `}
                    >
                      {formatTime(slot.time)}
                      {slot.is_emergency && (
                        <div className="text-xs text-red-600 mt-1">🚨</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Duration Selector */}
              {selectedTime && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duur van de Dienst
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min={minDuration}
                      max={maxDuration}
                      step={15}
                      value={duration}
                      onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                      {Math.floor(duration / 60)}u {duration % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{Math.floor(minDuration / 60)}u {minDuration % 60}m</span>
                    <span>{Math.floor(maxDuration / 60)}u {maxDuration % 60}m</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Selecteer eerst een datum om beschikbare tijden te zien</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 