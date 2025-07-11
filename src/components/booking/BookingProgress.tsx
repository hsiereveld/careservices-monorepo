'use client';

import { BookingStep } from './BookingFlow';
import { t } from '@/lib/i18n';

interface BookingProgressProps {
  currentStep: BookingStep;
  franchise: any;
  locale: string;
}

const steps: { key: BookingStep; label: string; icon: string }[] = [
  { key: 'category', label: 'booking.steps.category', icon: '📋' },
  { key: 'service', label: 'booking.steps.service', icon: '🔧' },
  { key: 'scheduling', label: 'booking.steps.scheduling', icon: '📅' },
  { key: 'provider', label: 'booking.steps.provider', icon: '👤' },
  { key: 'payment', label: 'booking.steps.payment', icon: '💳' },
  { key: 'confirmation', label: 'booking.steps.confirmation', icon: '✅' }
];

export default function BookingProgress({ currentStep, franchise, locale }: BookingProgressProps) {
  const currentIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      {/* Franchise Header */}
      {franchise && (
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-care-secondary-dark">
            {franchise.display_name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('booking.franchise.location', locale)}
          </p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full">
          <div 
            className="h-full bg-care-primary rounded-full transition-all duration-300 ease-in-out"
            style={{ 
              width: `${((currentIndex + 1) / steps.length) * 100}%` 
            }}
          />
        </div>

        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center">
                {/* Step Circle */}
                <div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium
                    transition-all duration-200 ease-in-out
                    ${isCompleted 
                      ? 'bg-care-success text-white' 
                      : isCurrent 
                        ? 'bg-care-primary text-white ring-4 ring-care-primary-light ring-opacity-30' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p className={`
                    text-xs font-medium
                    ${isCompleted || isCurrent 
                      ? 'text-care-secondary-dark' 
                      : 'text-muted-foreground'
                    }
                  `}>
                    {t(step.label, locale)}
                  </p>
                </div>

                {/* Step Number */}
                <div className="mt-1">
                  <span className={`
                    text-xs font-bold
                    ${isCompleted || isCurrent 
                      ? 'text-care-primary' 
                      : 'text-muted-foreground'
                    }
                  `}>
                    {index + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Info */}
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-care-secondary-dark">
          {t(`booking.steps.${currentStep}.title`, locale)}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t(`booking.steps.${currentStep}.description`, locale)}
        </p>
      </div>
    </div>
  );
} 