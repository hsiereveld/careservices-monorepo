import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AvailabilitySlot {
  id: string;
  provider_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  slot_type: 'regular' | 'custom' | 'holiday';
  notes?: string;
}

interface BlockedDate {
  id: string;
  provider_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  is_recurring: boolean;
  recurrence_pattern?: 'yearly' | 'monthly' | 'weekly';
}

interface Booking {
  id: string;
  booking_start_date: string;
  booking_start_time: string;
  booking_end_date: string;
  booking_end_time: string;
  service_id: string;
  customer_id: string;
  status: string;
  service?: {
    name: string;
  };
  customer?: {
    first_name?: string;
    last_name?: string;
  };
}

interface AvailabilityCalendarProps {
  providerId: string;
}

export function AvailabilityCalendar({ providerId }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [generalAvailability, setGeneralAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit states
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showBlockedDateModal, setShowBlockedDateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [editingBlockedDate, setEditingBlockedDate] = useState<BlockedDate | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Calendar navigation
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (providerId) {
      fetchAvailabilityData();
    }
  }, [providerId, currentMonth, currentYear]);

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true);
      setError('');

      // Calculate date range for the current month/view
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      
      // Format dates for query
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch general availability
      const { data: generalData, error: generalError } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', providerId);

      if (generalError) throw generalError;
      setGeneralAvailability(generalData || []);

      // Fetch specific availability slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('provider_availability_slots')
        .select('*')
        .eq('provider_id', providerId)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (slotsError) throw slotsError;
      setAvailabilitySlots(slotsData || []);

      // Fetch blocked dates
      const { data: blockedData, error: blockedError } = await supabase
        .from('provider_blocked_dates')
        .select('*')
        .eq('provider_id', providerId)
        .or(`start_date.lte.${endDateStr},end_date.gte.${startDateStr}`);

      if (blockedError) throw blockedError;
      setBlockedDates(blockedData || []);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_start_date,
          booking_start_time,
          booking_end_date,
          booking_end_time,
          service_id,
          customer_id,
          status,
          service:services(name),
          customer:profiles(first_name, last_name)
        `)
        .eq('provider_id', providerId)
        .in('status', ['confirmed', 'in_progress'])
        .or(`booking_start_date.lte.${endDateStr},booking_end_date.gte.${startDateStr}`);

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

    } catch (err: any) {
      setError('Fout bij het laden van beschikbaarheid: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Check if there's already a slot for this date
    const existingSlot = availabilitySlots.find(
      slot => new Date(slot.date).toDateString() === date.toDateString()
    );
    
    if (existingSlot) {
      setEditingSlot(existingSlot);
    } else {
      // Create a new slot with default values
      setEditingSlot({
        id: '',
        provider_id: providerId,
        date: date.toISOString().split('T')[0],
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: true,
        slot_type: 'regular'
      });
    }
    
    setShowSlotModal(true);
  };

  const handleAddBlockedDate = () => {
    const today = new Date();
    setEditingBlockedDate({
      id: '',
      provider_id: providerId,
      start_date: today.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
      is_recurring: false
    });
    setShowBlockedDateModal(true);
  };

  const handleSaveSlot = async () => {
    if (!editingSlot) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (editingSlot.id) {
        // Update existing slot
        const { error } = await supabase
          .from('provider_availability_slots')
          .update({
            start_time: editingSlot.start_time,
            end_time: editingSlot.end_time,
            is_available: editingSlot.is_available,
            slot_type: editingSlot.slot_type,
            notes: editingSlot.notes
          })
          .eq('id', editingSlot.id);
          
        if (error) throw error;
      } else {
        // Create new slot
        const { error } = await supabase
          .from('provider_availability_slots')
          .insert([{
            provider_id: providerId,
            date: editingSlot.date,
            start_time: editingSlot.start_time,
            end_time: editingSlot.end_time,
            is_available: editingSlot.is_available,
            slot_type: editingSlot.slot_type,
            notes: editingSlot.notes
          }]);
          
        if (error) throw error;
      }
      
      setSuccess('Beschikbaarheid succesvol opgeslagen!');
      fetchAvailabilityData();
      setShowSlotModal(false);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBlockedDate = async () => {
    if (!editingBlockedDate) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (editingBlockedDate.id) {
        // Update existing blocked date
        const { error } = await supabase
          .from('provider_blocked_dates')
          .update({
            start_date: editingBlockedDate.start_date,
            end_date: editingBlockedDate.end_date,
            reason: editingBlockedDate.reason,
            is_recurring: editingBlockedDate.is_recurring,
            recurrence_pattern: editingBlockedDate.recurrence_pattern
          })
          .eq('id', editingBlockedDate.id);
          
        if (error) throw error;
      } else {
        // Create new blocked date
        const { error } = await supabase
          .from('provider_blocked_dates')
          .insert([{
            provider_id: providerId,
            start_date: editingBlockedDate.start_date,
            end_date: editingBlockedDate.end_date,
            reason: editingBlockedDate.reason,
            is_recurring: editingBlockedDate.is_recurring,
            recurrence_pattern: editingBlockedDate.recurrence_pattern
          }]);
          
        if (error) throw error;
      }
      
      setSuccess('Geblokkeerde periode succesvol opgeslagen!');
      fetchAvailabilityData();
      setShowBlockedDateModal(false);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!editingSlot || !editingSlot.id) return;
    
    if (!confirm('Weet je zeker dat je deze beschikbaarheid wilt verwijderen?')) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const { error } = await supabase
        .from('provider_availability_slots')
        .delete()
        .eq('id', editingSlot.id);
        
      if (error) throw error;
      
      setSuccess('Beschikbaarheid succesvol verwijderd!');
      fetchAvailabilityData();
      setShowSlotModal(false);
    } catch (err: any) {
      setError('Fout bij het verwijderen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlockedDate = async () => {
    if (!editingBlockedDate || !editingBlockedDate.id) return;
    
    if (!confirm('Weet je zeker dat je deze geblokkeerde periode wilt verwijderen?')) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const { error } = await supabase
        .from('provider_blocked_dates')
        .delete()
        .eq('id', editingBlockedDate.id);
        
      if (error) throw error;
      
      setSuccess('Geblokkeerde periode succesvol verwijderd!');
      fetchAvailabilityData();
      setShowBlockedDateModal(false);
    } catch (err: any) {
      setError('Fout bij het verwijderen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a date is in a blocked period
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.some(blocked => {
      const startDate = new Date(blocked.start_date);
      const endDate = new Date(blocked.end_date);
      return date >= startDate && date <= endDate;
    });
  };

  // Helper function to check if a date has bookings
  const getDateBookings = (date: Date): Booking[] => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => {
      const startDate = new Date(booking.booking_start_date);
      const endDate = booking.booking_end_date ? new Date(booking.booking_end_date) : startDate;
      return (
        (startDate.toISOString().split('T')[0] <= dateStr && 
         endDate.toISOString().split('T')[0] >= dateStr)
      );
    });
  };

  // Helper function to check if a date has specific availability
  const getDateAvailability = (date: Date): AvailabilitySlot | null => {
    const dateStr = date.toISOString().split('T')[0];
    return availabilitySlots.find(slot => slot.date === dateStr) || null;
  };

  // Helper function to check if a day of week is generally available
  const isDayGenerallyAvailable = (date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return generalAvailability.some(avail => 
      avail.day_of_week === dayOfWeek && 
      avail.is_active
    );
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    for (let i = firstDayOfWeek; i > 0; i--) {
      const prevMonthDay = new Date(currentYear, currentMonth, 1 - i);
      days.push(prevMonthDay);
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }
    
    // Add days from next month to fill the last week
    const lastDayOfWeek = lastDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const nextMonthDay = new Date(currentYear, currentMonth + 1, i);
      days.push(nextMonthDay);
    }
    
    return days;
  };

  // Get day class based on availability, bookings, etc.
  const getDayClass = (date: Date): string => {
    const isToday = date.toDateString() === new Date().toDateString();
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isBlocked = isDateBlocked(date);
    const hasBookings = getDateBookings(date).length > 0;
    const specificAvailability = getDateAvailability(date);
    const isGenerallyAvailable = isDayGenerallyAvailable(date);
    
    let classes = 'relative w-full h-24 p-1 border ';
    
    // Base styling
    if (!isCurrentMonth) {
      classes += 'bg-gray-100 text-gray-400 border-gray-200 ';
    } else if (isToday) {
      classes += 'bg-primary-50 border-primary-300 ';
    } else {
      classes += 'bg-white border-gray-200 ';
    }
    
    // Availability styling
    if (isBlocked) {
      classes += 'bg-red-50 ';
    } else if (specificAvailability) {
      if (specificAvailability.is_available) {
        classes += 'bg-green-50 ';
      } else {
        classes += 'bg-red-50 ';
      }
    } else if (isGenerallyAvailable) {
      classes += 'bg-green-50 ';
    }
    
    // Booking styling - Make the blue border more visible
    if (hasBookings) {
      classes += 'border-2 border-blue-500 ';
    }
    
    // Interactive styling
    classes += 'hover:bg-gray-50 cursor-pointer transition-colors';
    
    return classes;
  };

  // Format time for display
  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    
    // If it's already in HH:MM format, return as is
    if (timeString.length <= 5) return timeString;
    
    // Otherwise, format from HH:MM:SS to HH:MM
    return timeString.substring(0, 5);
  };

  if (loading && !availabilitySlots.length && !blockedDates.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-primary-500 mr-3" />
        <span className="text-gray-600">Beschikbaarheid laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          <button
            onClick={handleAddBlockedDate}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Blokkeer Periode</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h4 className="text-lg font-semibold">
            {new Date(currentYear, currentMonth).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
          </h4>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentView('month')}
            className={`px-3 py-1 rounded-lg ${currentView === 'month' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}
          >
            Maand
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-3 py-1 rounded-lg ${currentView === 'week' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView('day')}
            className={`px-3 py-1 rounded-lg ${currentView === 'day' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}
          >
            Dag
          </button>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
          <span>Beschikbaar</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
          <span>Geblokkeerd</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded"></div>
          <span>Dagen met boekingen</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-primary-50 border border-primary-300 rounded"></div>
          <span>Vandaag</span>
        </div>
      </div>

      {/* Month View */}
      {currentView === 'month' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map((day, index) => (
              <div key={index} className="py-2 text-center font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {generateCalendarDays().map((date, index) => {
              const dayBookings = getDateBookings(date);
              const specificAvailability = getDateAvailability(date);
              
              return (
                <div 
                  key={index} 
                  className={getDayClass(date)}
                  onClick={() => handleDateClick(date)}
                >
                  {/* Date number */}
                  <div className={`text-right font-medium ${date.getMonth() !== currentMonth ? 'text-gray-400' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Availability indicator */}
                  {specificAvailability && (
                    <div className="mt-1 text-xs">
                      {specificAvailability.is_available ? (
                        <span className="bg-green-100 text-green-800 px-1 rounded text-xs">
                          {formatTime(specificAvailability.start_time)}-{formatTime(specificAvailability.end_time)}
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-1 rounded text-xs">
                          Niet beschikbaar
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Bookings */}
                  {dayBookings.length > 0 && (
                    <div className="mt-1">
                      {dayBookings.length === 1 ? (
                        <div className="bg-blue-100 text-blue-800 px-1 rounded text-xs truncate">
                          {formatTime(dayBookings[0].booking_start_time)} {dayBookings[0].service?.name}
                        </div>
                      ) : (
                        <div className="bg-blue-100 text-blue-800 px-1 rounded text-xs">
                          {dayBookings.length} boekingen
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {currentView === 'week' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="text-center py-4">Week View Coming Soon</div>
        </div>
      )}

      {/* Day View */}
      {currentView === 'day' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="text-center py-4">Day View Coming Soon</div>
        </div>
      )}

      {/* Availability Slot Modal */}
      {showSlotModal && editingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingSlot.id ? 'Beschikbaarheid Bewerken' : 'Beschikbaarheid Toevoegen'}
                </h3>
                <button
                  onClick={() => setShowSlotModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="date"
                      value={editingSlot.date}
                      onChange={(e) => setEditingSlot({...editingSlot, date: e.target.value})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Tijd
                    </label>
                    <div className="relative">
                      <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="time"
                        value={formatTime(editingSlot.start_time)}
                        onChange={(e) => setEditingSlot({...editingSlot, start_time: e.target.value + ':00'})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eind Tijd
                    </label>
                    <div className="relative">
                      <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="time"
                        value={formatTime(editingSlot.end_time)}
                        onChange={(e) => setEditingSlot({...editingSlot, end_time: e.target.value + ':00'})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={editingSlot.slot_type}
                    onChange={(e) => setEditingSlot({...editingSlot, slot_type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="regular">Regulier</option>
                    <option value="custom">Aangepast</option>
                    <option value="holiday">Feestdag</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschikbaarheid
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditingSlot({...editingSlot, is_available: !editingSlot.is_available})}
                      className={`p-2 rounded-lg transition-colors ${
                        editingSlot.is_available 
                          ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                          : 'text-red-600 bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      {editingSlot.is_available ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <X className="w-6 h-6" />
                      )}
                    </button>
                    <span className="text-sm font-medium text-gray-900">
                      {editingSlot.is_available ? 'Beschikbaar' : 'Niet beschikbaar'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notities (optioneel)
                  </label>
                  <textarea
                    value={editingSlot.notes || ''}
                    onChange={(e) => setEditingSlot({...editingSlot, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 h-20 resize-none"
                    placeholder="Voeg notities toe over deze beschikbaarheid..."
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <div>
                    {editingSlot.id && (
                      <button
                        type="button"
                        onClick={handleDeleteSlot}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Verwijderen
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowSlotModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Annuleren
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSlot}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Opslaan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Date Modal */}
      {showBlockedDateModal && editingBlockedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingBlockedDate.id ? 'Geblokkeerde Periode Bewerken' : 'Periode Blokkeren'}
                </h3>
                <button
                  onClick={() => setShowBlockedDateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Datum
                    </label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="date"
                        value={editingBlockedDate.start_date}
                        onChange={(e) => setEditingBlockedDate({...editingBlockedDate, start_date: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eind Datum
                    </label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="date"
                        value={editingBlockedDate.end_date}
                        onChange={(e) => setEditingBlockedDate({...editingBlockedDate, end_date: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reden (optioneel)
                  </label>
                  <textarea
                    value={editingBlockedDate.reason || ''}
                    onChange={(e) => setEditingBlockedDate({...editingBlockedDate, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 h-20 resize-none"
                    placeholder="Bijv. vakantie, feestdag, etc."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={editingBlockedDate.is_recurring}
                    onChange={(e) => setEditingBlockedDate({...editingBlockedDate, is_recurring: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">
                    Jaarlijks herhalen
                  </label>
                </div>

                {editingBlockedDate.is_recurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Herhaalpatroon
                    </label>
                    <select
                      value={editingBlockedDate.recurrence_pattern || 'yearly'}
                      onChange={(e) => setEditingBlockedDate({...editingBlockedDate, recurrence_pattern: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="yearly">Jaarlijks</option>
                      <option value="monthly">Maandelijks</option>
                      <option value="weekly">Wekelijks</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <div>
                    {editingBlockedDate.id && (
                      <button
                        type="button"
                        onClick={handleDeleteBlockedDate}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Verwijderen
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowBlockedDateModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Annuleren
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBlockedDate}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Opslaan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6 mt-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Hoe werkt de beschikbaarheidskalender?</h4>
            <ul className="text-blue-700 space-y-2">
              <li className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-green-50 border border-green-200 rounded-full flex-shrink-0 mt-0.5"></div>
                <span>Groene dagen zijn dagen waarop je beschikbaar bent</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-red-50 border border-red-200 rounded-full flex-shrink-0 mt-0.5"></div>
                <span>Rode dagen zijn dagen waarop je niet beschikbaar bent</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-white border-2 border-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                <span>Dagen met een blauwe rand hebben boekingen</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-blue-700">
          <p className="mb-2">Je kunt op verschillende manieren je beschikbaarheid beheren:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Klik op een dag in de kalender om specifieke beschikbaarheid voor die dag in te stellen</li>
            <li>Gebruik de "Blokkeer Periode" knop om meerdere dagen tegelijk te blokkeren (bijv. voor vakantie)</li>
            <li>Stel je algemene beschikbaarheid in via het tabblad "Algemene Beschikbaarheid"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}