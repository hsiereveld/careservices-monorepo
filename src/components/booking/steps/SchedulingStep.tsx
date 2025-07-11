'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';

interface SchedulingStepProps {
  service: any;
  franchise: any;
  onComplete: (data: { 
    selectedDate: string; 
    selectedTime: string; 
    duration: number;
    notes: string;
    emergencyBooking: boolean;
    calculatedPrice: number;
  }) => void;
  onBack: () => void;
  locale: string;
}

export default function SchedulingStep({ 
  service, 
  franchise, 
  onComplete, 
  onBack, 
  locale 
}: SchedulingStepProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(service?.duration_hours || 1);
  const [notes, setNotes] = useState('');
  const [emergencyBooking, setEmergencyBooking] = useState(false);
  const [availableTimes] = useState([
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ]);

  // Calculate price based on duration and emergency booking
  const basePrice = service?.base_price || 0;
  const emergencyMultiplier = emergencyBooking ? 1.5 : 1;
  const calculatedPrice = basePrice * duration * emergencyMultiplier;

  // Get minimum date (today + 1 day)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  // Get maximum date (3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateString = maxDate.toISOString().split('T')[0];

  const handleComplete = () => {
    if (!selectedDate || !selectedTime) {
      alert(t('booking.scheduling.selectDateTime', locale));
      return;
    }

    onComplete({
      selectedDate,
      selectedTime,
      duration,
      notes,
      emergencyBooking,
      calculatedPrice
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDuration = (hours: number) => {
    if (hours === 1) return t('booking.duration.hour', locale);
    return t('booking.duration.hours', locale, { hours });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-care-secondary-dark">
            {t('booking.scheduling.title', locale)}
          </h2>
          <p className="text-muted-foreground">
            {t('booking.scheduling.subtitle', locale)}
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={onBack}
          className="bg-care-background-light text-care-secondary-dark hover:bg-care-primary-light hover:text-white"
        >
          ← {t('common.back', locale)}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Scheduling Options */}
        <div className="space-y-6">
          {/* Service Summary */}
          <Card className="border-care-primary border-2">
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-3">
                {service?.title}
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {t('booking.service.basePrice', locale)}:
                </span>
                <span className="font-medium text-care-secondary-dark">
                  {formatPrice(service?.base_price || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('booking.service.provider', locale)}:
                </span>
                <span className="font-medium text-care-secondary-dark">
                  {service?.service_providers?.business_name || service?.service_providers?.full_name}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-4">
                {t('booking.scheduling.selectDate', locale)}
              </h3>
              <input
                type="date"
                min={minDateString}
                max={maxDateString}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent"
              />
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-4">
                {t('booking.scheduling.selectTime', locale)}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${selectedTime === time
                        ? 'bg-care-primary text-white'
                        : 'bg-care-background-light text-care-secondary-dark hover:bg-care-primary-light hover:text-white'
                      }
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Duration Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-4">
                {t('booking.scheduling.duration', locale)}
              </h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setDuration(Math.max(1, duration - 1))}
                  className="w-10 h-10 rounded-full bg-care-background-light text-care-secondary-dark hover:bg-care-primary-light hover:text-white flex items-center justify-center font-bold"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-care-secondary-dark">
                    {duration}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(duration)}
                  </div>
                </div>
                <button
                  onClick={() => setDuration(Math.min(8, duration + 1))}
                  className="w-10 h-10 rounded-full bg-care-background-light text-care-secondary-dark hover:bg-care-primary-light hover:text-white flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Booking */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-care-secondary-dark">
                    {t('booking.scheduling.emergency', locale)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('booking.scheduling.emergencyDescription', locale)}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emergencyBooking}
                    onChange={(e) => setEmergencyBooking(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-care-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-care-primary"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-4">
                {t('booking.scheduling.notes', locale)}
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('booking.scheduling.notesPlaceholder', locale)}
                rows={3}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Price Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-6">
                {t('booking.scheduling.priceSummary', locale)}
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('booking.scheduling.basePrice', locale)}:
                  </span>
                  <span>{formatPrice(basePrice)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('booking.scheduling.duration', locale)} ({duration} {formatDuration(duration)}):
                  </span>
                  <span>{formatPrice(basePrice * duration)}</span>
                </div>

                {emergencyBooking && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('booking.scheduling.emergencyFee', locale)}:
                    </span>
                    <span className="text-care-warning">
                      +{formatPrice(basePrice * duration * 0.5)}
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg font-bold text-care-secondary-dark">
                    <span>{t('booking.scheduling.total', locale)}:</span>
                    <span className="text-care-primary">{formatPrice(calculatedPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Selected Date/Time Display */}
              {(selectedDate || selectedTime) && (
                <div className="mt-6 p-4 bg-care-background-light rounded-lg">
                  <h4 className="font-medium text-care-secondary-dark mb-2">
                    {t('booking.scheduling.selectedDateTime', locale)}:
                  </h4>
                  <div className="space-y-1 text-sm">
                    {selectedDate && (
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">📅</span>
                        <span>{new Date(selectedDate).toLocaleDateString(locale)}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">🕐</span>
                        <span>{selectedTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <Button
                onClick={handleComplete}
                disabled={!selectedDate || !selectedTime}
                className="w-full mt-6 bg-care-primary hover:bg-care-secondary-dark text-white"
              >
                {t('booking.scheduling.continue', locale)}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 