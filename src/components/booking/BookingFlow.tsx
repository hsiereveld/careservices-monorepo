'use client';

import { useState, useEffect } from 'react';
import { useFranchise } from '@/shared/providers/FranchiseProvider';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import BookingProgress from './BookingProgress';
import ServiceCategoryStep from './steps/ServiceCategoryStep';
import ServiceSelectionStep from './steps/ServiceSelectionStep';
import SchedulingStep from './steps/SchedulingStep';
import ProviderSelectionStep from './steps/ProviderSelectionStep';
import PaymentStep from './steps/PaymentStep';
import ConfirmationStep from './steps/ConfirmationStep';

// Define booking flow steps
export type BookingStep = 'category' | 'service' | 'scheduling' | 'provider' | 'payment' | 'confirmation';

interface BookingFlowProps {
  categories: any[];
  locale: string;
}

interface BookingData {
  selectedCategory?: any;
  selectedService?: any;
  selectedProvider?: any;
  selectedDate?: string;
  selectedTime?: string;
  duration?: number;
  notes?: string;
  emergencyBooking?: boolean;
}

export default function BookingFlow({ categories, locale }: BookingFlowProps) {
  const { franchiseId, franchise } = useFranchise();
  const [currentStep, setCurrentStep] = useState<BookingStep>('category');
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [loading, setLoading] = useState(false);

  // Franchise-aware data fetching
  const fetchFranchiseServices = async (categoryId?: string) => {
    if (!franchiseId) return [];
    
    let query = supabase
      .from('services')
      .select(`
        *,
        service_providers!inner (
          id,
          full_name,
          business_name,
          rating_average,
          is_active
        )
      `)
      .eq('franchise_id', franchiseId)
      .eq('is_active', true)
      .eq('service_providers.is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching franchise services:', error);
      return [];
    }
    return data || [];
  };

  const handleStepComplete = (step: BookingStep, data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
    
    // Move to next step
    const stepOrder: BookingStep[] = ['category', 'service', 'scheduling', 'provider', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(step);
    const nextStep = stepOrder[currentIndex + 1];
    
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const handleStepBack = () => {
    const stepOrder: BookingStep[] = ['category', 'service', 'scheduling', 'provider', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const prevStep = stepOrder[currentIndex - 1];
    
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'category':
        return (
          <ServiceCategoryStep
            categories={categories}
            franchise={franchise}
            onComplete={(data) => handleStepComplete('category', data)}
            locale={locale}
          />
        );
      
      case 'service':
        return (
          <ServiceSelectionStep
            category={bookingData.selectedCategory}
            franchise={franchise}
            onComplete={(data) => handleStepComplete('service', data)}
            onBack={handleStepBack}
            locale={locale}
          />
        );
      
      case 'scheduling':
        return (
          <SchedulingStep
            service={bookingData.selectedService}
            franchise={franchise}
            onComplete={(data) => handleStepComplete('scheduling', data)}
            onBack={handleStepBack}
            locale={locale}
          />
        );
      
      case 'provider':
        return (
          <ProviderSelectionStep
            service={bookingData.selectedService}
            date={bookingData.selectedDate}
            time={bookingData.selectedTime}
            franchise={franchise}
            onComplete={(data) => handleStepComplete('provider', data)}
            onBack={handleStepBack}
            locale={locale}
          />
        );
      
      case 'payment':
        return (
          <PaymentStep
            bookingData={bookingData}
            franchise={franchise}
            onComplete={(data) => handleStepComplete('payment', data)}
            onBack={handleStepBack}
            locale={locale}
          />
        );
      
      case 'confirmation':
        return (
          <ConfirmationStep
            bookingData={bookingData}
            franchise={franchise}
            onBack={handleStepBack}
            locale={locale}
          />
        );
      
      default:
        return null;
    }
  };

  if (!franchiseId) {
    return (
      <div className="text-center py-12">
        <div className="bg-care-background-light rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-care-secondary-dark mb-4">
            {t('booking.franchise.select', locale)}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t('booking.franchise.selectDescription', locale)}
          </p>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <BookingProgress 
        currentStep={currentStep} 
        franchise={franchise}
        locale={locale}
      />
      
      {/* Current Step Content */}
      <div className="mt-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
} 