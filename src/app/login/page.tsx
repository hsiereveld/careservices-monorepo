"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Header from '../components/Header';
import { supabase } from '@/lib/supabase';
import { getLanguageFromPath, getPathWithLanguage } from "@/lib/i18n";

export default function LoginPage() {
  const pathname = usePathname();
  const language = getLanguageFromPath(pathname);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for success messages from registration
  useEffect(() => {
    const registered = searchParams.get('registered');
    const type = searchParams.get('type');
    
    if (registered === 'true') {
      setShowSuccess(true);
      const message = type === 'professional' 
        ? 'Je account is succesvol aangemaakt! Je kunt nu inloggen.'
        : 'Je account is succesvol aangemaakt! Je kunt nu inloggen.';
      
      // Auto-fill email if available
      const email = searchParams.get('email');
      if (email) {
        setFormData(prev => ({ ...prev, email }));
      }
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'E-mailadres is verplicht';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Voer een geldig e-mailadres in';
    }

    if (!formData.password) {
      newErrors.password = 'Wachtwoord is verplicht';
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
      // Login met Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Haal gebruikersrol op
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (roleError) {
          console.error('Error fetching user role:', roleError);
          // Default naar client als er geen rol is
          window.location.href = '/my';
          return;
        }

        const role = roleData?.role || 'client';

        // Redirect op basis van rol
        switch (role) {
          case 'admin':
          case 'backoffice':
            window.location.href = '/admin';
            break;
          case 'professional':
            window.location.href = '/pro';
            break;
          case 'client':
          default:
            window.location.href = '/my';
            break;
        }
      }
      
    } catch (error: any) {
      console.error('Login fout:', error);
      
      // Specifieke error handling voor Supabase
      if (error.message?.includes('Invalid login credentials')) {
        setErrors({ submit: 'Ongeldige e-mail of wachtwoord' });
      } else if (error.message?.includes('Email not confirmed')) {
        setErrors({ submit: 'Controleer je e-mail om je account te bevestigen' });
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
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-accent-600 mb-4">
              Inloggen
            </h1>
            <p className="text-xl text-gray-600">
              Welkom terug bij Care & Service Pinoso
            </p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    Je account is succesvol aangemaakt! Je kunt nu inloggen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-mailadres
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
                  autoComplete="username"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Wachtwoord
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
                  placeholder="Jouw wachtwoord"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
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
                {isSubmitting ? 'Inloggen...' : 'Inloggen'}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-4">
              <div>
                <Link 
                  href={getPathWithLanguage("/forgot-password", language)}
                  className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                >
                  Wachtwoord vergeten?
                </Link>
              </div>
              
              <div className="border-t pt-6">
                <p className="text-gray-600 text-sm">
                  Nog geen account?{' '}
                  <Link 
                    href={getPathWithLanguage("/signup", language)}
                    className="text-accent-600 hover:text-accent-700 font-medium"
                  >
                    Registreer je hier
                  </Link>
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">
                  Ben je een professional?{' '}
                  <Link 
                    href={getPathWithLanguage("/professional-signup", language)}
                    className="text-accent-600 hover:text-accent-700 font-medium"
                  >
                    Registreer je als professional
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 