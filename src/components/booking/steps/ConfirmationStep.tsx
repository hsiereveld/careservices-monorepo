'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';

interface ConfirmationStepProps {
  bookingData: any;
  franchise: any;
  onBack: () => void;
  locale: string;
}

export default function ConfirmationStep({ 
  bookingData, 
  franchise, 
  onBack, 
  locale 
}: ConfirmationStepProps) {
  const [showContactInfo, setShowContactInfo] = useState(false);

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

  const handleDownloadInvoice = () => {
    // TODO: Implement invoice download
    console.log('Downloading invoice...');
  };

  const handleAddToCalendar = () => {
    // TODO: Implement calendar integration
    console.log('Adding to calendar...');
  };

  const handleContactProvider = () => {
    setShowContactInfo(true);
  };

  const handleNewBooking = () => {
    // Reset to first step
    window.location.href = '/booking';
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-care-success rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-white">✓</span>
        </div>
        <h1 className="text-3xl font-bold text-care-secondary-dark mb-2">
          {t('booking.confirmation.title', locale)}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('booking.confirmation.subtitle', locale)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Summary Card */}
          <Card className="border-care-success border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-care-secondary-dark">
                  {t('booking.confirmation.bookingDetails', locale)}
                </h2>
                <Badge variant="success" className="bg-care-success text-white">
                  {t('booking.confirmation.confirmed', locale)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-care-secondary-dark">
                    {t('booking.confirmation.serviceInfo', locale)}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-care-background-light rounded-lg flex items-center justify-center">
                        🔧
                      </div>
                      <div>
                        <p className="font-medium text-care-secondary-dark">
                          {bookingData.selectedService?.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {bookingData.selectedProvider?.business_name || bookingData.selectedProvider?.full_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-care-background-light rounded-lg flex items-center justify-center">
                        📅
                      </div>
                      <div>
                        <p className="font-medium text-care-secondary-dark">
                          {formatDate(bookingData.selectedDate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {bookingData.selectedTime} • {formatDuration(bookingData.duration)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-care-background-light rounded-lg flex items-center justify-center">
                        💰
                      </div>
                      <div>
                        <p className="font-medium text-care-secondary-dark">
                          {formatPrice(bookingData.calculatedPrice)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('booking.confirmation.paid', locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-care-secondary-dark">
                    {t('booking.confirmation.customerInfo', locale)}
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('booking.confirmation.name', locale)}
                      </p>
                      <p className="font-medium text-care-secondary-dark">
                        {bookingData.customerInfo?.firstName} {bookingData.customerInfo?.lastName}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('booking.confirmation.email', locale)}
                      </p>
                      <p className="font-medium text-care-secondary-dark">
                        {bookingData.customerInfo?.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('booking.confirmation.phone', locale)}
                      </p>
                      <p className="font-medium text-care-secondary-dark">
                        {bookingData.customerInfo?.phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('booking.confirmation.address', locale)}
                      </p>
                      <p className="font-medium text-care-secondary-dark">
                        {bookingData.customerInfo?.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              {bookingData.customerInfo?.notes && (
                <div className="mt-6 p-4 bg-care-background-light rounded-lg">
                  <h4 className="font-medium text-care-secondary-dark mb-2">
                    {t('booking.confirmation.additionalNotes', locale)}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {bookingData.customerInfo.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-6">
                {t('booking.confirmation.quickActions', locale)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleDownloadInvoice}
                  variant="outline"
                  className="bg-care-background-light text-care-secondary-dark hover:bg-care-primary-light hover:text-white"
                >
                  <span className="mr-2">📄</span>
                  {t('booking.confirmation.downloadInvoice', locale)}
                </Button>

                <Button
                  onClick={handleAddToCalendar}
                  variant="outline"
                  className="bg-care-background-light text-care-secondary-dark hover:bg-care-primary-light hover:text-white"
                >
                  <span className="mr-2">📅</span>
                  {t('booking.confirmation.addToCalendar', locale)}
                </Button>

                <Button
                  onClick={handleContactProvider}
                  variant="outline"
                  className="bg-care-background-light text-care-secondary-dark hover:bg-care-primary-light hover:text-white"
                >
                  <span className="mr-2">📞</span>
                  {t('booking.confirmation.contactProvider', locale)}
                </Button>

                <Button
                  onClick={handleNewBooking}
                  className="bg-care-primary hover:bg-care-secondary-dark text-white"
                >
                  <span className="mr-2">➕</span>
                  {t('booking.confirmation.newBooking', locale)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Contact & Support */}
        <div className="space-y-6">
          {/* Provider Contact */}
          {showContactInfo && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-care-secondary-dark mb-4">
                  {t('booking.confirmation.providerContact', locale)}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-care-background-light rounded-full flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <p className="font-medium text-care-secondary-dark">
                        {bookingData.selectedProvider?.business_name || bookingData.selectedProvider?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('booking.confirmation.yourProvider', locale)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-care-background-light rounded-full flex items-center justify-center">
                      📧
                    </div>
                    <div>
                      <p className="font-medium text-care-secondary-dark">
                        {bookingData.selectedProvider?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('booking.confirmation.email', locale)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-care-background-light rounded-full flex items-center justify-center">
                      📞
                    </div>
                    <div>
                      <p className="font-medium text-care-secondary-dark">
                        {bookingData.selectedProvider?.phone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('booking.confirmation.phone', locale)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Franchise Support */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-4">
                {t('booking.confirmation.franchiseSupport', locale)}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-care-background-light rounded-full flex items-center justify-center">
                    🏢
                  </div>
                  <div>
                    <p className="font-medium text-care-secondary-dark">
                      {franchise?.display_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('booking.confirmation.localFranchise', locale)}
                    </p>
                  </div>
                </div>

                {franchise?.contact_email && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-care-background-light rounded-full flex items-center justify-center">
                      📧
                    </div>
                    <div>
                      <p className="font-medium text-care-secondary-dark">
                        {franchise.contact_email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('booking.confirmation.supportEmail', locale)}
                      </p>
                    </div>
                  </div>
                )}

                {franchise?.contact_phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-care-background-light rounded-full flex items-center justify-center">
                      📞
                    </div>
                    <div>
                      <p className="font-medium text-care-secondary-dark">
                        {franchise.contact_phone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('booking.confirmation.supportPhone', locale)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-care-secondary-dark mb-4">
                {t('booking.confirmation.nextSteps', locale)}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-care-primary rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-care-secondary-dark">
                      {t('booking.confirmation.step1', locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('booking.confirmation.step1Description', locale)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-care-primary rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-care-secondary-dark">
                      {t('booking.confirmation.step2', locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('booking.confirmation.step2Description', locale)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-care-primary rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-care-secondary-dark">
                      {t('booking.confirmation.step3', locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('booking.confirmation.step3Description', locale)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center">
        <Button
          onClick={onBack}
          variant="secondary"
          className="bg-care-background-light text-care-secondary-dark hover:bg-care-primary-light hover:text-white"
        >
          ← {t('booking.confirmation.backToBooking', locale)}
        </Button>
      </div>
    </div>
  );
} 