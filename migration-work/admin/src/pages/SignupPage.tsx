import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, User, ArrowRight, Shield, Heart, Clock, Star, MapPin, Users, Home, Phone, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { RoleSelector } from '../components/auth/RoleSelector';
import { sendEmail } from '../utils/emailService';
import { Lock } from '../components/icons/LockIcon';

export function SignupPage() {
  const [step, setStep] = useState<'role' | 'details' | 'success'>('role');
  const [selectedRole, setSelectedRole] = useState<'client' | 'professional' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();

  if (user) {
    return <Navigate href="/dashboard" replace />;
  }

  const handleRoleSelect = (role: 'client' | 'professional') => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters lang zijn');
      setLoading(false);
      return;
    }

    if (!selectedRole) {
      setError('Selecteer eerst je rol');
      setLoading(false);
      return;
    }

    try {
      console.log(`🔍 Registreren als ${selectedRole}...`);
      
      // Create user account
      const { data: authData, error: authError } = await signUp(email, password);
      
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData?.user) {
        try {
          console.log(`✅ Gebruiker aangemaakt met ID: ${authData.user.id}`);
          console.log(`🔑 Geselecteerde rol: ${selectedRole}`);
          
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              first_name: firstName,
              last_name: lastName,
              phone: phone,
              date_of_birth: dateOfBirth || null
            });

          if (profileError) {
            console.error('❌ Fout bij het aanmaken van profiel:', profileError);
            throw profileError;
          }
          
          console.log('✅ Profiel aangemaakt');

          // Explicitly assign the selected role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: selectedRole, // Gebruik de expliciet geselecteerde rol
              is_primary_role: true
            });

          if (roleError) {
            console.error('❌ Fout bij het toewijzen van rol:', roleError);
            throw roleError;
          }
          
          console.log(`✅ Rol '${selectedRole}' toegewezen`);

          // Send welcome email based on role
          try {
            const emailData = {
              first_name: firstName,
              last_name: lastName,
              email: email
            };

            if (selectedRole === 'client') {
              // Send welcome email to client
              await sendEmail('welcome_client', email, emailData);
              console.log('✅ Welkomst e-mail verzonden naar klant');
            } else if (selectedRole === 'professional') {
              // Send welcome email to professional
              await sendEmail('welcome_professional', email, emailData);
              console.log('✅ Welkomst e-mail verzonden naar professional');
            }
          } catch (emailErr) {
            // Log email error but don't fail the registration process
            console.error('⚠️ Fout bij het verzenden van welkomst e-mail:', emailErr);
          }

          setStep('success');
          setSuccess(true);
        } catch (err: any) {
          console.error('❌ Fout bij registratie:', err);
          setError('Er is een fout opgetreden bij het registreren. Probeer het later opnieuw.');
        }
      }
    } catch (err: any) {
      console.error('❌ Algemene registratiefout:', err);
      setError('Er is een fout opgetreden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    switch (selectedRole) {
      case 'client': return 'Klant Account';
      case 'professional': return 'Professional Account';
      default: return 'Account';
    }
  };

  const getRoleDescription = () => {
    switch (selectedRole) {
      case 'client': return 'Je kunt nu diensten boeken en betrouwbare professionals vinden';
      case 'professional': return 'Je kunt nu diensten aanbieden en je eigen planning beheren';
      default: return 'Je account is klaar voor gebruik';
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-50 via-primary-50 to-background-accent"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-2xl w-full relative z-10">
          <div className="bg-background-primary/80 backdrop-blur-lg rounded-3xl p-8 border border-primary-200/50 shadow-xl text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              {getRoleTitle()} Aangemaakt! 🎉
            </h2>
            <p className="text-text-secondary mb-8 leading-relaxed text-lg">
              {getRoleDescription()}
            </p>

            {/* Role-specific next steps */}
            <div className="bg-primary-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-xl font-bold text-text-primary mb-4 text-center">Wat gebeurt er nu?</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Log direct in</h4>
                    <p className="text-text-secondary text-sm">Je kunt nu inloggen met je email en wachtwoord</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      {selectedRole === 'client' ? 'Ontdek diensten' : 'Stel je diensten in'}
                    </h4>
                    <p className="text-text-secondary text-sm">
                      {selectedRole === 'client' 
                        ? 'Bekijk welke zorg- en servicediensten beschikbaar zijn'
                        : 'Configureer welke diensten je wilt aanbieden'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      {selectedRole === 'client' ? 'Boek je eerste dienst' : 'Ontvang je eerste boeking'}
                    </h4>
                    <p className="text-text-secondary text-sm">
                      {selectedRole === 'client' 
                        ? 'Maak contact met betrouwbare professionals in je omgeving'
                        : 'Begin met het aanbieden van je diensten aan klanten'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link 
              href="/login"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span>Inloggen en beginnen</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background-accent to-accent-50"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl"></div>
      
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Benefits */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Nederlandse service en zorg <span className="text-primary-600">in Spanje</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed">
              Sluit je aan bij onze groeiende gemeenschap van Nederlanders en Belgen in regio Pinoso. 
              {selectedRole === 'client' 
                ? ' Ontdek betrouwbare zorg- en servicediensten die je helpen een fijn leven op te bouwen in Spanje.'
                : selectedRole === 'professional'
                ? ' Help andere immigranten en expats en verdien geld met je vaardigheden en diensten.'
                : ' Kies je rol en ontdek wat Care & Service voor jou kan betekenen.'
              }
            </p>
          </div>

          {/* Role-specific benefits */}
          <div className="space-y-6">
            {selectedRole === 'client' && (
              <>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Zorgzame Ondersteuning</h3>
                    <p className="text-text-secondary">Van huishoudelijke hulp tot medische begeleiding - wij begrijpen je situatie als immigrant en expat.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Lokale Expertise</h3>
                    <p className="text-text-secondary">Onze dienstverleners kennen Pinoso en omgeving en spreken jouw taal.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Veilig & Betrouwbaar</h3>
                    <p className="text-text-secondary">Alle dienstverleners zijn gescreend en beoordeeld door de gemeenschap.</p>
                  </div>
                </div>
              </>
            )}

            {selectedRole === 'professional' && (
              <>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Flexibele Planning</h3>
                    <p className="text-text-secondary">Werk wanneer het jou uitkomt en bepaal je eigen tarieven en beschikbaarheid.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Betekenisvol Werk</h3>
                    <p className="text-text-secondary">Help andere immigranten en expats en maak een verschil in hun leven terwijl je geld verdient.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Bouw je Reputatie</h3>
                    <p className="text-text-secondary">Krijg reviews van tevreden klanten en bouw een sterke professionele reputatie op.</p>
                  </div>
                </div>
              </>
            )}

            {!selectedRole && (
              <>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Zorgzame Gemeenschap</h3>
                    <p className="text-text-secondary">Verbind met andere Nederlanders en Belgen die elkaar helpen in Spanje.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Lokale Expertise</h3>
                    <p className="text-text-secondary">Profiteer van lokale kennis en ervaring van mensen die jouw situatie begrijpen.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Veilig & Betrouwbaar</h3>
                    <p className="text-text-secondary">Alle leden zijn geverifieerd en het platform is veilig en betrouwbaar.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Social Proof */}
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

        {/* Right side - Form */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              {step === 'role' ? 'Maak je gratis account aan' : `${getRoleTitle()} Aanmaken`}
            </h2>
            <p className="text-text-secondary">
              {step === 'role' 
                ? 'Kies eerst je rol om de juiste ervaring te krijgen'
                : 'Vul je gegevens in om je account te voltooien'
              }
            </p>
          </div>
          
          <div className="bg-background-primary/80 backdrop-blur-lg rounded-3xl p-8 border border-primary-200/50 shadow-xl">
            {step === 'role' && (
              <RoleSelector
                selectedRole={selectedRole}
                onRoleSelect={handleRoleSelect}
                disabled={loading}
              />
            )}

            {step === 'details' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                {/* Progress indicator */}
                <div className="flex items-center space-x-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setStep('role')}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                  >
                    <span>← Rol wijzigen</span>
                  </button>
                  <span className="text-sm text-text-light">|</span>
                  <span className="text-sm text-text-secondary">Stap 2 van 2</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-text-primary mb-2">
                      Voornaam *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Je voornaam"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-text-primary mb-2">
                      Achternaam *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Je achternaam"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
                    Email adres *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="je@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-text-primary mb-2">
                    Telefoonnummer
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+34 123 456 789"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-text-primary mb-2">
                    Geboortedatum
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-2">
                    Wachtwoord *
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Minimaal 6 karakters"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-primary mb-2">
                    Bevestig wachtwoord *
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Herhaal je wachtwoord"
                    />
                  </div>
                </div>

                {/* Role-specific info */}
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Shield className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-semibold text-primary-800">
                      {selectedRole === 'client' ? 'Klant Account' : 'Professional Account'}
                    </span>
                  </div>
                  <p className="text-xs text-primary-700">
                    {selectedRole === 'client' 
                      ? 'Je krijgt toegang tot het klanten dashboard waar je diensten kunt boeken en je boekingen kunt beheren.'
                      : 'Je krijgt toegang tot het professional dashboard waar je je diensten kunt beheren en boekingen kunt accepteren.'
                    }
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Account aanmaken...</span>
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5" />
                      <span>{getRoleTitle()} Aanmaken</span>
                    </>
                  )}
                </button>
              </form>
            )}
            
            <div className="mt-8 text-center">
              <p className="text-text-secondary">
                Al een account?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
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