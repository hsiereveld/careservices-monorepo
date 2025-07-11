import { ServiceProvider } from '../lib/supabase';

/**
 * Validates a service provider profile and returns validation results
 * @param provider The service provider profile to validate
 * @returns An object containing validation results
 */
export function validateProviderProfile(provider: ServiceProvider) {
  // Define required fields and their validation rules
  const validationRules = {
    business_name: {
      required: true,
      validate: (value: any) => !!value,
      message: 'Bedrijfsnaam is verplicht'
    },
    description: {
      required: true,
      validate: (value: any) => !!value && value.length >= 10,
      message: 'Beschrijving moet minimaal 10 karakters bevatten'
    },
    phone: {
      required: true,
      validate: (value: any) => !!value,
      message: 'Telefoonnummer is verplicht'
    },
    email: {
      required: true,
      validate: (value: any) => !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || ''),
      message: 'Geldig e-mailadres is verplicht'
    },
    address: {
      required: false,
      validate: (value: any) => true,
      message: 'Adres is optioneel'
    },
    city: {
      required: true,
      validate: (value: any) => !!value,
      message: 'Stad is verplicht'
    },
    postal_code: {
      required: false,
      validate: (value: any) => true,
      message: 'Postcode is optioneel'
    },
    hourly_rate: {
      required: true,
      validate: (value: any) => value !== null && value > 0,
      message: 'Uurtarief moet groter zijn dan 0'
    },
    bank_account_number: {
      required: true,
      validate: (value: any) => !!value,
      message: 'Bankrekeningnummer is verplicht'
    },
    vat_number: {
      required: false,
      validate: (value: any) => true,
      message: 'BTW-nummer is optioneel'
    },
    company_registration_number: {
      required: false,
      validate: (value: any) => true,
      message: 'KvK-nummer is optioneel'
    }
  };

  // Validate each field
  const validationResults: Record<string, { isValid: boolean; message: string }> = {};
  let validCount = 0;
  let requiredCount = 0;

  for (const [field, rule] of Object.entries(validationRules)) {
    const value = provider[field as keyof ServiceProvider];
    const isValid = rule.validate(value);
    
    validationResults[field] = {
      isValid,
      message: isValid ? '' : rule.message
    };

    if (rule.required) {
      requiredCount++;
      if (isValid) {
        validCount++;
      }
    }
  }

  // Calculate completion percentage
  const completionPercentage = Math.round((validCount / requiredCount) * 100);
  
  // Determine if profile is complete enough (70% or more)
  const isProfileComplete = completionPercentage >= 70;

  return {
    validationResults,
    completionPercentage,
    isProfileComplete,
    validCount,
    requiredCount
  };
}

/**
 * Gets a list of missing required fields from a service provider profile
 * @param provider The service provider profile to check
 * @returns An array of field names that are required but missing
 */
export function getMissingRequiredFields(provider: ServiceProvider): string[] {
  const { validationResults } = validateProviderProfile(provider);
  
  return Object.entries(validationResults)
    .filter(([_, result]) => !result.isValid)
    .map(([field]) => field);
}

/**
 * Gets a human-readable list of missing required fields
 * @param provider The service provider profile to check
 * @returns A string with the missing field names in Dutch
 */
export function getMissingFieldsMessage(provider: ServiceProvider): string {
  const missingFields = getMissingRequiredFields(provider);
  
  if (missingFields.length === 0) {
    return '';
  }
  
  const fieldNames: Record<string, string> = {
    business_name: 'Bedrijfsnaam',
    description: 'Beschrijving',
    phone: 'Telefoonnummer',
    email: 'E-mailadres',
    address: 'Adres',
    city: 'Stad',
    postal_code: 'Postcode',
    hourly_rate: 'Uurtarief',
    bank_account_number: 'Bankrekeningnummer',
    vat_number: 'BTW-nummer',
    company_registration_number: 'KvK-nummer'
  };
  
  const missingFieldNames = missingFields.map(field => fieldNames[field] || field);
  
  if (missingFieldNames.length === 1) {
    return `Vul je ${missingFieldNames[0]} in om je profiel te voltooien.`;
  } else if (missingFieldNames.length === 2) {
    return `Vul je ${missingFieldNames[0]} en ${missingFieldNames[1]} in om je profiel te voltooien.`;
  } else {
    const lastField = missingFieldNames.pop();
    return `Vul je ${missingFieldNames.join(', ')} en ${lastField} in om je profiel te voltooien.`;
  }
}