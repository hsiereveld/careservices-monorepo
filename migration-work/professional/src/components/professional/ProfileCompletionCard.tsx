import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertCircle, 
  CheckCircle, 
  User, 
  Building, 
  Phone, 
  Mail, 
  FileText, 
  MapPin, 
  CreditCard, 
  FileCheck, 
  ArrowRight 
} from 'lucide-react';
import { ServiceProvider } from '../../lib/supabase';

interface ProfileCompletionCardProps {
  provider: ServiceProvider;
}

export function ProfileCompletionCard({ provider }: ProfileCompletionCardProps) {
  // Define required fields and their validation status
  const requiredFields = [
    { 
      name: 'business_name', 
      label: 'Bedrijfsnaam', 
      value: provider.business_name,
      icon: Building,
      isValid: !!provider.business_name
    },
    { 
      name: 'description', 
      label: 'Beschrijving', 
      value: provider.description,
      icon: FileText,
      isValid: !!provider.description && provider.description.length >= 10
    },
    { 
      name: 'phone', 
      label: 'Telefoonnummer', 
      value: provider.phone,
      icon: Phone,
      isValid: !!provider.phone
    },
    { 
      name: 'email', 
      label: 'Email', 
      value: provider.email,
      icon: Mail,
      isValid: !!provider.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(provider.email || '')
    },
    { 
      name: 'address', 
      label: 'Adres', 
      value: provider.address,
      icon: MapPin,
      isValid: !!provider.address
    },
    { 
      name: 'city', 
      label: 'Stad', 
      value: provider.city,
      icon: MapPin,
      isValid: !!provider.city
    },
    { 
      name: 'postal_code', 
      label: 'Postcode', 
      value: provider.postal_code,
      icon: MapPin,
      isValid: !!provider.postal_code
    },
    { 
      name: 'hourly_rate', 
      label: 'Uurtarief', 
      value: provider.hourly_rate,
      icon: CreditCard,
      isValid: provider.hourly_rate !== null && provider.hourly_rate > 0
    },
    { 
      name: 'bank_account_number', 
      label: 'Bankrekeningnummer', 
      value: provider.bank_account_number,
      icon: CreditCard,
      isValid: !!provider.bank_account_number
    },
    { 
      name: 'vat_number', 
      label: 'BTW-nummer', 
      value: provider.vat_number,
      icon: FileCheck,
      isValid: !!provider.vat_number
    }
  ];

  // Calculate completion percentage
  const validFieldsCount = requiredFields.filter(field => field.isValid).length;
  const completionPercentage = Math.round((validFieldsCount / requiredFields.length) * 100);
  
  // Determine if profile is complete enough to be visible to customers
  const isProfileComplete = completionPercentage >= 70;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50 mb-8">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {isProfileComplete 
              ? 'Je profiel is bijna compleet' 
              : 'Je profiel is nog niet volledig ingevuld'}
          </h2>
          <p className="text-text-secondary mb-4">
            {isProfileComplete 
              ? 'Je profiel is voldoende ingevuld om zichtbaar te zijn voor klanten, maar je kunt het nog verder verbeteren.' 
              : 'Vul je bedrijfsgegevens in om zichtbaar te worden voor potentiële klanten en diensten aan te kunnen bieden.'}
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className={`h-4 rounded-full ${
                completionPercentage >= 70 ? 'bg-green-500' : 
                completionPercentage >= 40 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-text-secondary">Profiel compleetheid</span>
            <span className={`text-sm font-medium ${
              completionPercentage >= 70 ? 'text-green-600' : 
              completionPercentage >= 40 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {completionPercentage}%
            </span>
          </div>
          
          {/* Field validation status */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {requiredFields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.name} className="flex items-center space-x-2">
                  {field.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-text-light" />
                    <span className={field.isValid ? 'text-text-secondary' : 'text-red-600'}>
                      {field.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <Link 
            href="/profile"
            className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
          >
            <User className="w-5 h-5" />
            <span>Profiel voltooien</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}