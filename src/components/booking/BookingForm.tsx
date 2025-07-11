'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BookingCalendar from './BookingCalendar';
// Using a basic ProviderCard interface for now since the component has import issues
// import ProviderCard from '@/components/booking/provider-card';
// import type { BookingFormData, ProfessionalServiceWithTemplate } from '@/packages/types/service-catalog.types';
// import { useFranchise } from '@/shared/providers';

// Temporary types until imports are resolved
interface BookingFormData {
  service_id: string;
  professional_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  service_address: string;
  service_city: string;
  service_postal_code: string;
  service_instructions: string;
  special_requirements: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  access_instructions: string;
  language_preference: string;
  is_recurring: boolean;
  recurring_pattern?: 'weekly' | 'bi_weekly' | 'monthly';
  recurring_end_date?: string;
  payment_method: 'credit_card' | 'ideal' | 'bancontact' | 'paypal' | 'bank_transfer' | 'cash';
  accept_terms: boolean;
  franchise_id?: string;
}

interface ProfessionalServiceWithTemplate {
  id: string;
  custom_name?: string;
  custom_description?: string;
  custom_price?: number;
  custom_minimum_duration?: number;
  template?: {
    name_nl?: string;
    description_nl?: string;
    base_price?: number;
    minimum_duration?: number;
  };
}

// Simple ProviderCard component placeholder
const ProviderCard = ({ professional, services, showAvailability }: any) => (
  <div className="p-4 border rounded-lg">
    <h4 className="font-medium">{professional.business_name || professional.name}</h4>
    <p className="text-sm text-gray-600">Professional service provider</p>
  </div>
);

interface BookingFormProps {
  service: ProfessionalServiceWithTemplate;
  professional: any;
}

const STEPS = [
  { id: 1, title: 'Service & Professional', description: 'Bevestig je keuze' },
  { id: 2, title: 'Datum & Tijd', description: 'Selecteer beschikbare tijd' },
  { id: 3, title: 'Service Details', description: 'Locatie en instructies' },
  { id: 4, title: 'Speciale Wensen', description: 'Extra vereisten' },
  { id: 5, title: 'Herhaling', description: 'Recurring opties' },
  { id: 6, title: 'Betaling', description: 'Betaalmethode' }
];

export default function BookingForm({ service, professional }: BookingFormProps) {
  // const { franchiseId } = useFranchise(); // This line was removed as per the new_code
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({
    service_id: service.id,
    professional_id: professional.id,
    booking_date: '',
    start_time: '',
    end_time: '',
    duration: service.custom_minimum_duration || service.template?.minimum_duration || 60,
    service_address: '',
    service_city: '',
    service_postal_code: '',
    service_instructions: '',
    special_requirements: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    access_instructions: '',
    language_preference: 'nl',
    is_recurring: false,
    recurring_pattern: undefined,
    recurring_end_date: undefined,
    payment_method: 'credit_card',
    accept_terms: false,
    franchise_id: undefined, // This line was removed as per the new_code
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // setFormData((prev) => ({ ...prev, franchise_id: franchiseId || '' })); // This line was removed as per the new_code
  }, []); // This line was removed as per the new_code

  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDateSelect = (date: string) => {
    updateFormData({ booking_date: date });
  };

  const handleTimeSelect = (time: string) => {
    updateFormData({ start_time: time });
    // Calculate end time based on duration
    const start = new Date(`2000-01-01T${time}`);
    const end = new Date(start.getTime() + formData.duration * 60000);
    updateFormData({ end_time: end.toTimeString().slice(0, 5) });
  };

  const handleDurationChange = (duration: number) => {
    updateFormData({ duration });
    if (formData.start_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(start.getTime() + duration * 60000);
      updateFormData({ end_time: end.toTimeString().slice(0, 5) });
    }
  };

  const handleSubmit = async () => {
    if (!formData.accept_terms) {
      setError('Je moet de voorwaarden accepteren om door te gaan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Transform form data to match API expectations
      const bookingData = {
        provider_id: formData.professional_id,
        service_id: formData.service_id,
        booking_date: formData.booking_date,
        booking_time: formData.start_time,
        duration_hours: formData.duration / 60, // Convert minutes to hours
        notes: formData.service_instructions || formData.special_requirements || '',
        emergency_booking: false // Could be enhanced based on form data
      };

      const response = await fetch('/api/customer/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Er is een fout opgetreden');
      }

      const result = await response.json();
      
      // Redirect to payment or confirmation
      if (result.payment_required) {
        router.push(`/booking/payment/${result.booking.id}`);
      } else {
        router.push(`/booking/confirmation/${result.booking.id}`);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return true; // Service and professional are already selected
      case 2:
        return formData.booking_date && formData.start_time;
      case 3:
        return formData.service_address && formData.service_city;
      case 4:
        return true; // Optional fields
      case 5:
        return !formData.is_recurring || (formData.recurring_pattern && formData.recurring_end_date);
      case 6:
        return formData.payment_method && formData.accept_terms;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geselecteerde Service</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {service.custom_name || service.template?.name_nl}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {service.custom_description || service.template?.description_nl}
                  </p>
                  <p className="text-lg font-semibold text-accent-600 mt-2">
                    €{(service.custom_price || service.template?.base_price || 0).toFixed(2)}/uur
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geselecteerde Professional</h3>
              <ProviderCard 
                professional={professional}
                services={[service]}
                showAvailability={false}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <BookingCalendar
            professionalId={professional.id}
            serviceId={service.id}
            selectedDate={formData.booking_date}
            selectedTime={formData.start_time}
            onDateSelect={handleDateSelect}
            onTimeSelect={handleTimeSelect}
            onDurationChange={handleDurationChange}
            minDuration={service.custom_minimum_duration || service.template?.minimum_duration || 60}
            maxDuration={480} // 8 hours max
          />
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Adres *
              </label>
              <input
                type="text"
                value={formData.service_address}
                onChange={(e) => updateFormData({ service_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="Straat en huisnummer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stad *
                </label>
                <input
                  type="text"
                  value={formData.service_city}
                  onChange={(e) => updateFormData({ service_city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="Pinoso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  value={formData.service_postal_code}
                  onChange={(e) => updateFormData({ service_postal_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="03650"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Instructies
              </label>
              <textarea
                value={formData.service_instructions}
                onChange={(e) => updateFormData({ service_instructions: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="Specifieke instructies voor de professional..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speciale Vereisten
              </label>
              <textarea
                value={formData.special_requirements}
                onChange={(e) => updateFormData({ special_requirements: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="Speciale wensen of vereisten..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Noodcontact Naam
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => updateFormData({ emergency_contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="Naam van contactpersoon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Noodcontact Telefoon
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => updateFormData({ emergency_contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="+34 XXX XXX XXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toegangsinstructies
              </label>
              <textarea
                value={formData.access_instructions}
                onChange={(e) => updateFormData({ access_instructions: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="Codes, sleutels, parkeren, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taalvoorkeur
              </label>
              <select
                value={formData.language_preference}
                onChange={(e) => updateFormData({ language_preference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              >
                <option value="nl">Nederlands</option>
                <option value="en">Engels</option>
                <option value="es">Spaans</option>
              </select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.is_recurring}
                onChange={(e) => updateFormData({ is_recurring: e.target.checked })}
                className="w-4 h-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
              />
              <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                Herhalende Boeking
              </label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 pl-7">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Herhalingspatroon
                  </label>
                  <select
                    value={formData.recurring_pattern || ''}
                    onChange={(e) => updateFormData({ recurring_pattern: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  >
                    <option value="">Selecteer patroon</option>
                    <option value="weekly">Wekelijks</option>
                    <option value="bi_weekly">Tweewekelijks</option>
                    <option value="monthly">Maandelijks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Einddatum
                  </label>
                  <input
                    type="date"
                    value={formData.recurring_end_date || ''}
                    onChange={(e) => updateFormData({ recurring_end_date: e.target.value })}
                    min={formData.booking_date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Betaalmethode
              </label>
              <div className="space-y-3">
                {[
                  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
                  { value: 'ideal', label: 'iDEAL', icon: '🏦' },
                  { value: 'bancontact', label: 'Bancontact', icon: '📱' },
                  { value: 'paypal', label: 'PayPal', icon: '🔵' },
                  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏛️' }
                ].map((method) => (
                  <label key={method.value} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.value}
                      checked={formData.payment_method === method.value}
                      onChange={(e) => updateFormData({ payment_method: e.target.value as any })}
                      className="w-4 h-4 text-accent-600 focus:ring-accent-500 border-gray-300"
                    />
                    <span className="text-lg">{method.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={formData.accept_terms}
                onChange={(e) => updateFormData({ accept_terms: e.target.checked })}
                className="w-4 h-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                Ik ga akkoord met de{' '}
                <a href="/terms" className="text-accent-600 hover:text-accent-700 underline">
                  algemene voorwaarden
                </a>{' '}
                en{' '}
                <a href="/privacy" className="text-accent-600 hover:text-accent-700 underline">
                  privacybeleid
                </a>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step.id < currentStep ? 'bg-accent-600 text-white' :
                step.id === currentStep ? 'bg-accent-100 text-accent-800 border-2 border-accent-600' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step.id < currentStep ? '✓' : step.id}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step.id < currentStep ? 'bg-accent-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Vorige
        </button>

        {currentStep < STEPS.length ? (
          <button
            onClick={nextStep}
            disabled={!canProceedToNext()}
            className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volgende
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !canProceedToNext()}
            className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Bezig met boeken...' : 'Boeking Bevestigen'}
          </button>
        )}
      </div>
    </div>
  );
} 