import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const POST = async (request: NextRequest) => {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    const body = await request.json();
    
    const {
      professional_id,
      service_id,
      date,
      start_time,
      end_time
    } = body;

    // Validate required fields
    if (!professional_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Professional ID, date, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Check for conflicts using provider_id (correct column name)
    const { data: conflicts, error } = await supabase
      .from('bookings')
      .select('id, booking_time, duration_hours')
      .eq('provider_id', professional_id)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .gte('booking_time', start_time)
      .lt('booking_time', end_time);

    if (error) {
      throw error;
    }

    const isAvailable = !conflicts || conflicts.length === 0;

    return NextResponse.json({
      available: isAvailable,
      conflicts: conflicts || [],
      professional_id,
      date,
      start_time,
      end_time
    });
  } catch (error) {
    console.error('Error in availability POST:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);

    const professional_id = searchParams.get('professional_id');
    const date = searchParams.get('date');
    const service_id = searchParams.get('service_id');

    if (!professional_id || !date) {
      return NextResponse.json(
        { error: 'Professional ID and date are required' },
        { status: 400 }
      );
    }

    // Validate professional_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(professional_id)) {
      return NextResponse.json(
        { error: 'Invalid professional ID format' },
        { status: 400 }
      );
    }

    const dayOfWeek = new Date(date).getDay();
    
    // Get professional's availability for the day - check if table exists first
    let availability: any[] = [];
    try {
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('professional_id', professional_id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .order('start_time', { ascending: true });

      if (!availabilityError) {
        availability = availabilityData || [];
      }
    } catch (e) {
      // Table doesn't exist, use default availability
      console.log('professional_availability table not found, using default availability');
      availability = [
        {
          start_time: '08:00',
          end_time: '18:00',
          is_emergency_available: false
        }
      ];
    }

    // Get blocked dates - check if table exists first
    let blockedDates: any[] = [];
    try {
      const { data: blockedData, error: blockedError } = await supabase
        .from('professional_blocked_dates')
        .select('*')
        .eq('professional_id', professional_id)
        .eq('blocked_date', date);

      if (!blockedError) {
        blockedDates = blockedData || [];
      }
    } catch (e) {
      // Table doesn't exist, no blocked dates
      console.log('professional_blocked_dates table not found, no blocked dates');
    }

    // Get existing bookings - fix the enum issue by using valid status values
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', professional_id)
      .eq('booking_date', date)
      .not('status', 'in', '(cancelled)') // Remove 'no_show' as it's not a valid enum value
      .order('booking_time', { ascending: true });

    if (bookingsError) throw bookingsError;

    // Generate available time slots
    const timeSlots: {
      time: string;
      is_available: boolean;
      is_emergency: boolean;
    }[] = [];
    const slotDuration = 15; // 15-minute slots

    availability?.forEach((slot: any) => {
      // Defensive: skip if start_time or end_time is missing
      if (!slot.start_time || !slot.end_time) return;

      // Parse start and end times as today-agnostic Date objects
      let start = new Date(`2000-01-01T${slot.start_time}:00`);
      const end = new Date(`2000-01-01T${slot.end_time}:00`);

      // Defensive: skip if start >= end
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return;

      while (start < end) {
        const slotStart = start.toTimeString().slice(0, 5);
        const slotEndDate = new Date(start.getTime() + slotDuration * 60000);
        const slotEnd = slotEndDate.toTimeString().slice(0, 5);

        // Don't create slots that extend past the end time
        if (slotEndDate > end) break;

        // Check if slot is blocked
        const isBlocked = blockedDates?.some((blocked: any) => {
          if (blocked.is_all_day) return true;
          const blockedStart = blocked.start_time || '00:00';
          const blockedEnd = blocked.end_time || '23:59';
          return slotStart >= blockedStart && slotEnd <= blockedEnd;
        });

        // Check if slot conflicts with existing booking
        const hasConflict = existingBookings?.some((booking: any) => {
          const bookingStart = booking.booking_time;
          const bookingEnd = booking.booking_time; // Simplified for now
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });

        if (!isBlocked && !hasConflict) {
          timeSlots.push({
            time: slotStart,
            is_available: true,
            is_emergency: !!slot.is_emergency_available
          });
        }

        start = slotEndDate;
      }
    });

    return NextResponse.json({
      availability_slots: timeSlots,
      professional_id,
      date,
      service_id,
      total_slots: timeSlots.length,
      available_slots: timeSlots.filter(slot => slot.is_available).length
    });

  } catch (error) {
    console.error('Error in availability GET:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}; 