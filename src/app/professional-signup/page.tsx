"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '../components/Header';
import { supabase } from '@/lib/supabase';
import { getLanguageFromPath, getPathWithLanguage } from "@/lib/i18n";

export default function ProfessionalSignupPage() {
  const pathname = usePathname();
  const language = getLanguageFromPath(pathname);

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
    businessName: '',
    businessDescription: '',
    services: [] as string[],
    experience: '',
    certifications: '',
    hourlyRate: '',
    availability: [] as string[],
    agreeToTerms: false,
    agreeToMarketing: false,
    agreeToBackgroundCheck: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableServices = [
    'Medische Begeleiding',
    'Oppas Diensten',
    'Huishouden',
    'Technische Hulp',
    'Administratieve Ondersteuning',
    'Property Management',
    'Vervoer',
    'Sociale Activiteiten',
    'Zwembad Techniek'
  ];

  const availableDays = [
    'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 
    'Vrijdag', 'Zaterdag', 'Zondag'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Voornaam is verplicht';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Achternaam is verplicht';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mailadres is verplicht';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Voer een geldig e-mailadres in';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefoonnummer is verplicht';
    }

    if (!formData.password) {
      newErrors.password = 'Wachtwoord is verplicht';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Wachtwoord moet minimaal 8 karakters bevatten';
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

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Bedrijfsnaam is verplicht';
    }

    if (!formData.businessDescription.trim()) {
      newErrors.businessDescription = 'Bedrijfsbeschrijving is verplicht';
    }

    if (formData.services.length === 0) {
      newErrors.services = 'Selecteer minimaal één dienst';
    }

    if (!formData.experience.trim()) {
      newErrors.experience = 'Ervaring is verplicht';
    }

    if (!formData.hourlyRate.trim()) {
      newErrors.hourlyRate = 'Uurtarief is verplicht';
    }

    if (formData.availability.length === 0) {
      newErrors.availability = 'Selecteer minimaal één beschikbare dag';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Je moet akkoord gaan met de voorwaarden';
    }

    if (!formData.agreeToBackgroundCheck) {
      newErrors.agreeToBackgroundCheck = 'Je moet akkoord gaan met de achtergrondcontrole';
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
      // Step 1: Supabase Auth signup voor professionals
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            user_type: 'professional'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Step 2: Create profile using server-side API (bypasses RLS)
        const profileResponse = await fetch('/api/auth/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            role: 'professional',
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            language: formData.language,
            businessName: formData.businessName,
            businessDescription: formData.businessDescription,
            services: formData.services,
            experience: formData.experience,
            certifications: formData.certifications,
            hourlyRate: formData.hourlyRate,
            availability: formData.availability,
            marketingConsent: formData.agreeToMarketing,
            backgroundCheckConsent: formData.agreeToBackgroundCheck
          })
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.error || 'Failed to create profile');
        }

        // Redirect naar login met success message
        window.location.href = '/login?registered=true&type=professional&email=' + encodeURIComponent(formData.email);
      }
      
    } catch (error: any) {
      console.error('Registratie fout:', error);
      
      // Specifieke error handling voor Supabase
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
              Word Professional bij Care & Service Pinoso
            </h1>
            <p className="text-xl text-gray-600">
              Start je eigen business en verdien geld met je vaardigheden
            </p>
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
                        Voorkeurstaal
                      </label>
                      <select
                        id="language"
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      >
                        <option value="nl">Nederlands</option>
                        <option value="be">Vlaams</option>
                        <option value="en">Engels</option>
                        <option value="es">Spaans</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information */}
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
                      placeholder="Beschrijf je bedrijf en expertise..."
                    />
                    {errors.businessDescription && (
                      <p className="text-red-500 text-sm mt-1">{errors.businessDescription}</p>
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
                        placeholder="Beschrijf je ervaring en achtergrond..."
                      />
                      {errors.experience && (
                        <p className="text-red-500 text-sm mt-1">{errors.experience}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-2">
                        Certificeringen & Diploma's
                      </label>
                      <textarea
                        id="certifications"
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                        placeholder="Lijst je certificeringen en diploma's op..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Diensten</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Welke diensten bied je aan? *
                  </label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {availableServices.map((service) => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service)}
                          onChange={() => handleServiceChange(service)}
                          className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                  {errors.services && (
                    <p className="text-red-500 text-sm mt-1">{errors.services}</p>
                  )}
                </div>
              </div>

              {/* Pricing & Availability */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Prijzen & Beschikbaarheid</h3>
                <div className="grid md:grid-cols-2 gap-6">
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
                    <p className="text-xs text-gray-500 mt-1">
                      Dit is wat jij ontvangt. De klant betaalt commissie en BTW extra.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Beschikbare dagen *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableDays.map((day) => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.availability.includes(day)}
                            onChange={() => handleAvailabilityChange(day)}
                            className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day}</span>
                        </label>
                      ))}
                    </div>
                    {errors.availability && (
                      <p className="text-red-500 text-sm mt-1">{errors.availability}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Security */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Beveiliging</h3>
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
                      placeholder="Minimaal 8 karakters"
                      autoComplete="new-password"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Bevestig wachtwoord *
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

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-700">
                    Ik ga akkoord met de{' '}
                    <Link href="/terms" className="text-accent-600 hover:text-accent-700 underline">
                      algemene voorwaarden
                    </Link>{' '}
                    en{' '}
                    <Link href="/privacy" className="text-accent-600 hover:text-accent-700 underline">
                      privacybeleid
                    </Link> *
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
                )}

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreeToBackgroundCheck"
                    name="agreeToBackgroundCheck"
                    checked={formData.agreeToBackgroundCheck}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agreeToBackgroundCheck" className="ml-3 text-sm text-gray-700">
                    Ik ga akkoord met een achtergrondcontrole voor de veiligheid van onze klanten *
                  </label>
                </div>
                {errors.agreeToBackgroundCheck && (
                  <p className="text-red-500 text-sm">{errors.agreeToBackgroundCheck}</p>
                )}

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreeToMarketing"
                    name="agreeToMarketing"
                    checked={formData.agreeToMarketing}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agreeToMarketing" className="ml-3 text-sm text-gray-700">
                    Ik wil op de hoogte blijven van nieuwe mogelijkheden en aanbiedingen (optioneel)
                  </label>
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Account aanmaken...' : 'Professional Account aanmaken'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Heb je al een account?{' '}
                <Link href={getPathWithLanguage("/login", language)} className="text-accent-600 hover:text-accent-700 font-semibold">
                  Log hier in
                </Link>
              </p>
            </div>

            {/* Customer Signup Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Zoek je hulp in plaats van hulp aan te bieden?{' '}
                <Link href={getPathWithLanguage("/signup", language)} className="text-primary-600 hover:text-primary-700 font-semibold">
                  Word Klant
                </Link>
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Verdien Geld</h3>
              <p className="text-gray-600">Stel je eigen prijzen in en verdien flexibel</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Eenvoudig Beheer</h3>
              <p className="text-gray-600">Beheer je boekingen en agenda via ons platform</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Betrouwbare Klanten</h3>
              <p className="text-gray-600">Al onze klanten zijn geverifieerd en betrouwbaar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 