"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '../components/Header';
import { supabase } from '@/lib/supabase';
import { getLanguageFromPath, getPathWithLanguage } from "@/lib/i18n";

type UserRole = 'client' | 'professional';

export default function UnifiedSignupPage() {
  const pathname = usePathname();
  const language = getLanguageFromPath(pathname);
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    postalCode: '',
    language: 'nl',
    agreeToTerms: false,
    agreeToMarketing: false,
    
    // Professional specific fields
    businessName: '',
    businessDescription: '',
    services: [] as string[],
    experience: '',
    certifications: '',
    hourlyRate: '',
    availability: {} as Record<string, boolean>,
    agreeToBackgroundCheck: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleServiceChange = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleAvailabilityChange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability[day]
      }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Voornaam is verplicht';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Achternaam is verplicht';
    }

    if (!formData.email) {
      newErrors.email = 'E-mailadres is verplicht';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Voer een geldig e-mailadres in';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefoonnummer is verplicht';
    }

    if (!formData.password) {
      newErrors.password = 'Wachtwoord is verplicht';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Wachtwoord moet minimaal 6 karakters bevatten';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Wachtwoorden komen niet overeen';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Adres is verplicht';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Plaats is verplicht';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postcode is verplicht';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Je moet akkoord gaan met de voorwaarden';
    }

    // Professional specific validations
    if (selectedRole === 'professional') {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Bedrijfsnaam is verplicht';
      }

      if (!formData.businessDescription.trim()) {
        newErrors.businessDescription = 'Bedrijfsbeschrijving is verplicht';
      }

      if (formData.services.length === 0) {
        newErrors.services = 'Selecteer minimaal één service';
      }

      if (!formData.experience.trim()) {
        newErrors.experience = 'Ervaring is verplicht';
      }

      if (!formData.hourlyRate.trim()) {
        newErrors.hourlyRate = 'Uurtarief is verplicht';
      } else if (isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) <= 0) {
        newErrors.hourlyRate = 'Voer een geldig uurtarief in';
      }

      if (!formData.agreeToBackgroundCheck) {
        newErrors.agreeToBackgroundCheck = 'Je moet akkoord gaan met de achtergrondcontrole';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Supabase Auth signup
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            user_type: selectedRole
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Step 2: Create profile using server-side API (bypasses RLS)
        const profileData: any = {
          userId: data.user.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: selectedRole,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          language: formData.language,
          marketingConsent: formData.agreeToMarketing
        };

        // Add professional-specific fields
        if (selectedRole === 'professional') {
          profileData.businessName = formData.businessName;
          profileData.businessDescription = formData.businessDescription;
          profileData.services = formData.services;
          profileData.experience = formData.experience;
          profileData.certifications = formData.certifications;
          profileData.hourlyRate = formData.hourlyRate;
          profileData.availability = formData.availability;
          profileData.backgroundCheckConsent = formData.agreeToBackgroundCheck;
        }

        const profileResponse = await fetch('/api/auth/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData)
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.error || 'Failed to create profile');
        }

        // Redirect naar login met success message
        window.location.href = `/login?registered=true&type=${selectedRole}&email=${encodeURIComponent(formData.email)}`;
      }
      
    } catch (error: any) {
      console.error('Registratie fout:', error);
      
      if (error.message?.includes('already registered')) {
        setErrors({ email: 'Dit e-mailadres is al geregistreerd' });
      } else if (error.message?.includes('password')) {
        setErrors({ password: 'Wachtwoord moet minimaal 6 karakters bevatten' });
      } else {
        setErrors({ submit: 'Er is een fout opgetreden. Probeer het opnieuw.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-accent-600 mb-4">
              Registreer bij Care & Service Pinoso
            </h1>
            <p className="text-xl text-gray-600">
              Kies je rol en maak een account aan
            </p>
          </div>

          {/* Role Selection */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Kies je Rol</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div 
                className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                  selectedRole === 'client' 
                    ? 'border-accent-500 bg-accent-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole('client')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Klant</h3>
                  <p className="text-gray-600 mb-4">
                    Ik wil services boeken en hulp krijgen van professionals
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Services boeken</li>
                    <li>• Reviews schrijven</li>
                    <li>• Favoriete professionals</li>
                    <li>• Booking geschiedenis</li>
                  </ul>
                </div>
              </div>

              <div 
                className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                  selectedRole === 'professional' 
                    ? 'border-accent-500 bg-accent-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole('professional')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Professional</h3>
                  <p className="text-gray-600 mb-4">
                    Ik wil services aanbieden en geld verdienen met mijn vaardigheden
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Services aanbieden</li>
                    <li>• Boekingen beheren</li>
                    <li>• Reviews ontvangen</li>
                    <li>• Verdien geld</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Persoonlijke Gegevens</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Voornaam *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Jouw voornaam"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Achternaam *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Jouw achternaam"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contactgegevens</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-mailadres *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="jouw@email.nl"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefoonnummer *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+31 6 12345678"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Business Information */}
              {selectedRole === 'professional' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Bedrijfsinformatie</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                        Bedrijfsnaam *
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                          errors.businessName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Jouw bedrijfsnaam"
                      />
                      {errors.businessName && (
                        <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 mb-2">
                        Bedrijfsbeschrijving *
                      </label>
                      <textarea
                        id="businessDescription"
                        name="businessDescription"
                        value={formData.businessDescription}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                          errors.businessDescription ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Beschrijf je bedrijf en diensten..."
                      />
                      {errors.businessDescription && (
                        <p className="text-red-500 text-sm mt-1">{errors.businessDescription}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Services Aangeboden *
                      </label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {['Limpieza', 'Jardinería', 'Reparaciones', 'Cuidado Personal', 'Tecnología', 'Otros'].map((service) => (
                          <label key={service} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.services.includes(service)}
                              onChange={() => handleServiceChange(service)}
                              className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{service}</span>
                          </label>
                        ))}
                      </div>
                      {errors.services && (
                        <p className="text-red-500 text-sm mt-1">{errors.services}</p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                          Ervaring *
                        </label>
                        <textarea
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          rows={3}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                            errors.experience ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Beschrijf je ervaring..."
                        />
                        {errors.experience && (
                          <p className="text-red-500 text-sm mt-1">{errors.experience}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                          Uurtarief (€) *
                        </label>
                        <input
                          type="number"
                          id="hourlyRate"
                          name="hourlyRate"
                          value={formData.hourlyRate}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                            errors.hourlyRate ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="25.00"
                        />
                        {errors.hourlyRate && (
                          <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Adresgegevens</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Adres *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Straatnaam en huisnummer"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        Plaats *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Pinoso"
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Postcode *
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                          errors.postalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="03650"
                      />
                      {errors.postalCode && (
                        <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                        Taal
                      </label>
                      <select
                        id="language"
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      >
                        <option value="nl">Nederlands</option>
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Wachtwoord</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Wachtwoord *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Minimaal 6 karakters"
                      autoComplete="new-password"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Bevestig Wachtwoord *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Herhaal je wachtwoord"
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Consent */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Toestemming</h3>
                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-1 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Ik ga akkoord met de{' '}
                      <Link href="/terms" className="text-accent-600 hover:text-accent-700">
                        algemene voorwaarden
                      </Link>{' '}
                      en{' '}
                      <Link href="/privacy" className="text-accent-600 hover:text-accent-700">
                        privacybeleid
                      </Link> *
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
                  )}

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="agreeToMarketing"
                      checked={formData.agreeToMarketing}
                      onChange={handleInputChange}
                      className="mt-1 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Ik ga akkoord met het ontvangen van marketing e-mails en updates
                    </span>
                  </label>

                  {selectedRole === 'professional' && (
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        name="agreeToBackgroundCheck"
                        checked={formData.agreeToBackgroundCheck}
                        onChange={handleInputChange}
                        className="mt-1 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Ik ga akkoord met een achtergrondcontrole voor mijn veiligheid en die van klanten *
                      </span>
                    </label>
                  )}
                  {errors.agreeToBackgroundCheck && (
                    <p className="text-red-500 text-sm">{errors.agreeToBackgroundCheck}</p>
                  )}
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-accent-700 focus:ring-4 focus:ring-accent-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registreren...' : `Registreer als ${selectedRole === 'client' ? 'Klant' : 'Professional'}`}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Heb je al een account?{' '}
                <Link 
                  href={getPathWithLanguage("/login", language)}
                  className="text-accent-600 hover:text-accent-700 font-medium"
                >
                  Log hier in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 