import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, User, ArrowRight, Shield, Heart, Clock, Star, MapPin, Users, Home, Phone, Calendar, InfoIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRoleRedirect } from '../hooks/useRoleRedirect';
import { Lock } from '../components/icons/LockIcon';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { redirectToDashboard } = useRoleRedirect();

  if (user) {
    return <Navigate href="/admin-dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        // Handle different types of authentication errors
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid_credentials')) {
          setError('Het email adres of wachtwoord is onjuist. Controleer je gegevens en probeer het opnieuw.');
        } else if (error.message?.includes('Email not confirmed')) {
          setError('Je email adres is nog niet bevestigd. Controleer je inbox voor de bevestigingsmail.');
        } else if (error.message?.includes('Too many requests')) {
          setError('Te veel inlogpogingen. Wacht even voordat je het opnieuw probeert.');
        } else {
          setError('Er is een fout opgetreden bij het inloggen. Probeer het opnieuw.');
        }
      } else {
        // Successful login - redirect will be handled by useRoleRedirect hook
        await redirectToDashboard();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background-accent to-accent-50"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl"></div>
      
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Welcome Back */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Welkom terug bij <span className="text-primary-600">Care & Service</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed">
              Fijn dat je er weer bent! Log in om verder te gaan met het organiseren van je zorg en service in Pinoso.
            </p>
          </div>

          {/* Quick Benefits */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Je Vertrouwde Netwerk</h3>
                <p className="text-text-secondary">Toegang tot je persoonlijke dashboard en betrouwbare dienstverleners.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Direct Beschikbaar</h3>
                <p className="text-text-secondary">Boek diensten, bekijk je afspraken en beheer je voorkeuren.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Veilig & Betrouwbaar</h3>
                <p className="text-text-secondary">Je gegevens zijn veilig en je kunt vertrouwen op onze dienstverleners.</p>
              </div>
            </div>
          </div>

          {/* Community Quote */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-primary-200/50">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-bold">M</div>
                <div className="w-10 h-10 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-bold">J</div>
                <div className="w-10 h-10 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-bold">A</div>
              </div>
              <div>
                <p className="font-semibold text-text-primary">Actieve gemeenschap</p>
                <p className="text-sm text-text-secondary">van Nederlandse en Belgische immigranten en expats</p>
              </div>
            </div>
            <blockquote className="text-text-secondary italic">
              "Dankzij Care & Service voel ik me nooit alleen in Spanje. Er is altijd wel iemand die kan helpen."
            </blockquote>
            <cite className="text-sm text-text-light mt-2 block">- Maria, Pinoso</cite>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Inloggen op je account
            </h2>
            <p className="text-text-secondary">
              Welkom terug! Voer je gegevens in om verder te gaan
            </p>
          </div>
          
          <div className="bg-background-primary/80 backdrop-blur-lg rounded-3xl p-8 border border-primary-200/50 shadow-xl">
            {/* Quick Access Info */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Na inloggen krijg je toegang tot:</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                  <span className="text-sm text-text-secondary">Je persoonlijke dashboard op basis van je rol</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                  <span className="text-sm text-text-secondary">Direct diensten boeken of aanbieden</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                  <span className="text-sm text-text-secondary">Contact met betrouwbare professionals of klanten</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-red-700 text-sm">{error}</span>
                    {error.includes('onjuist') && (
                      <div className="mt-2 text-xs text-red-600 flex items-start space-x-2">
                        <InfoIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Zorg ervoor dat je het juiste email adres en wachtwoord gebruikt. 
                          Als je nog geen account hebt, registreer je dan eerst.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-3">
                  Email adres
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    placeholder="je@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-3">
                  Wachtwoord
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-primary-50 border border-primary-200 rounded-2xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Security Note */}
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-semibold text-primary-800">Veilig Inloggen</span>
                </div>
                <p className="text-xs text-primary-700">
                  Je wordt automatisch doorgestuurd naar het juiste dashboard op basis van je rol (klant, professional, of backoffice).
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-4 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Inloggen...</span>
                  </>
                ) : (
                  <>
                    <span>Inloggen</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-text-secondary mb-4">
                Nog geen account?{' '}
                <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                  Registreer hier gratis
                </Link>
              </p>
              
              {/* Quick Registration CTA */}
              <div className="bg-accent-50 border border-accent-200 rounded-xl p-4">
                <p className="text-sm text-accent-800 mb-2">
                  <strong>Nieuw in Pinoso?</strong> Ontdek hoe onze gemeenschap je kan helpen!
                </p>
                <Link 
                  href="/signup"
                  className="text-xs text-accent-700 hover:text-accent-800 font-medium underline"
                >
                  Gratis account aanmaken →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}