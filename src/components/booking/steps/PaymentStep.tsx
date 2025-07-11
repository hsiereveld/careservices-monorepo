'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';

interface PaymentStepProps {
  bookingData: any;
  franchise: any;
  onComplete: (data: { 
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      notes: string;
    };
    bookingId: string;
  }) => void;
  onBack: () => void;
  locale: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export default function PaymentStep({ 
  bookingData, 
  franchise, 
  onComplete, 
  onBack, 
  locale 
}: PaymentStepProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: bookingData.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  const validateForm = () => {
    const newErrors: Partial<CustomerInfo> = {};
    
    if (!customerInfo.firstName.trim()) {
      newErrors.firstName = t('booking.payment.errors.firstName', locale);
    }
    if (!customerInfo.lastName.trim()) {
      newErrors.lastName = t('booking.payment.errors.lastName', locale);
    }
    if (!customerInfo.email.trim()) {
      newErrors.email = t('booking.payment.errors.email', locale);
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      newErrors.email = t('booking.payment.errors.emailInvalid', locale);
    }
    if (!customerInfo.phone.trim()) {
      newErrors.phone = t('booking.payment.errors.phone', locale);
    }
    if (!customerInfo.address.trim()) {
      newErrors.address = t('booking.payment.errors.address', locale);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Generate a temporary booking ID
      const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      onComplete({
        customerInfo,
        bookingId
      });
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            {t('booking.payment.title', locale)}
          </h2>
          <p className="text-muted-foreground">
            {t('booking.payment.subtitle', locale)}
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
        {/* Left Column - Customer Information */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-6">
                {t('booking.payment.customerInfo', locale)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-care-secondary-dark mb-2">
                    {t('booking.payment.firstName', locale)} *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className={`w-full px-4 py-3 bg-input-background border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent ${
                      errors.firstName ? 'border-care-error' : 'border-border'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-care-error mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-care-secondary-dark mb-2">
                    {t('booking.payment.lastName', locale)} *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className={`w-full px-4 py-3 bg-input-background border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent ${
                      errors.lastName ? 'border-care-error' : 'border-border'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-care-error mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-care-secondary-dark mb-2">
                    {t('booking.payment.email', locale)} *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-3 bg-input-background border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent ${
                      errors.email ? 'border-care-error' : 'border-border'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-sm text-care-error mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-care-secondary-dark mb-2">
                    {t('booking.payment.phone', locale)} *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full px-4 py-3 bg-input-background border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent ${
                      errors.phone ? 'border-care-error' : 'border-border'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-sm text-care-error mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-care-secondary-dark mb-2">
                  {t('booking.payment.address', locale)} *
                </label>
                <textarea
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className={`w-full px-4 py-3 bg-input-background border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent resize-none ${
                    errors.address ? 'border-care-error' : 'border-border'
                  }`}
                  placeholder={t('booking.payment.addressPlaceholder', locale)}
                />
                {errors.address && (
                  <p className="text-sm text-care-error mt-1">{errors.address}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-care-secondary-dark mb-2">
                  {t('booking.payment.additionalNotes', locale)}
                </label>
                <textarea
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent resize-none"
                  placeholder={t('booking.payment.notesPlaceholder', locale)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Booking Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-6">
                {t('booking.payment.bookingSummary', locale)}
              </h3>

              <div className="space-y-4">
                {/* Service Info */}
                <div className="border-b border-border pb-4">
                  <h4 className="font-medium text-care-secondary-dark mb-2">
                    {bookingData.selectedService?.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {bookingData.selectedProvider?.business_name || bookingData.selectedProvider?.full_name}
                  </p>
                </div>

                {/* Date & Time */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">📅</span>
                    <span className="text-sm">{formatDate(bookingData.selectedDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">🕐</span>
                    <span className="text-sm">{bookingData.selectedTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">⏱️</span>
                    <span className="text-sm">{formatDuration(bookingData.duration)}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('booking.payment.basePrice', locale)}:
                    </span>
                    <span>{formatPrice(bookingData.selectedService?.base_price || 0)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('booking.payment.duration', locale)} ({bookingData.duration} {formatDuration(bookingData.duration)}):
                    </span>
                    <span>{formatPrice((bookingData.selectedService?.base_price || 0) * bookingData.duration)}</span>
                  </div>

                  {bookingData.emergencyBooking && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('booking.payment.emergencyFee', locale)}:
                      </span>
                      <span className="text-care-warning">
                        +{formatPrice((bookingData.selectedService?.base_price || 0) * bookingData.duration * 0.5)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between text-lg font-bold text-care-secondary-dark">
                      <span>{t('booking.payment.total', locale)}:</span>
                      <span className="text-care-primary">{formatPrice(bookingData.calculatedPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Franchise Info */}
                {franchise && (
                  <div className="bg-care-background-light rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-care-secondary-dark mb-2">
                      {franchise.display_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t('booking.payment.franchiseInfo', locale)}
                    </p>
                  </div>
                )}

                {/* Payment Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-care-primary hover:bg-care-secondary-dark text-white py-3"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('booking.payment.processing', locale)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>💳</span>
                      <span>{t('booking.payment.payNow', locale)}</span>
                      <span>{formatPrice(bookingData.calculatedPrice)}</span>
                    </div>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    🔒 {t('booking.payment.securityNotice', locale)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 