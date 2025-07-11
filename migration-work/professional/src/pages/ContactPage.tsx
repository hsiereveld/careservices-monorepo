import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  User, 
  MessageSquare, 
  Clock, 
  Loader2,
  Building
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function ContactPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    contactPreference: 'email' as 'email' | 'phone' | 'any'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Pre-fill form with user data if logged in
  React.useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            email: user.email || '',
            phone: profile.phone || ''
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            email: user.email || ''
          }));
        }
      };
      
      fetchUserProfile();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.message) {
        throw new Error('Vul alle verplichte velden in');
      }

      // Save contact message to database
      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject || 'Algemene vraag',
          message: formData.message,
          contact_preference: formData.contactPreference,
          user_id: user?.id || null,
          status: 'new'
        });

      if (insertError) throw insertError;

      // Reset form and show success message
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        contactPreference: 'email'
      });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contact
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Neem contact met ons op voor vragen, suggesties of ondersteuning
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-800">Bericht verzonden!</h2>
                    <p className="text-green-700">Bedankt voor uw bericht. We nemen zo snel mogelijk contact met u op.</p>
                  </div>
                </div>
                
                <p className="text-green-700 mb-6">
                  We streven ernaar om binnen 1-2 werkdagen te reageren op alle berichten.
                </p>
                
                <div className="flex space-x-4">
                  <Link 
                    href="/"
                    className="bg-white text-green-700 border border-green-300 hover:bg-green-50 px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    Terug naar home
                  </Link>
                  <button
                    onClick={() => setSuccess(false)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    Nieuw bericht
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Stuur ons een bericht</h2>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                      Naam *
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Uw naam"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="uw@email.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                      Telefoonnummer
                    </label>
                    <div className="relative">
                      <Phone className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+31 6 12345678"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-2">
                      Onderwerp
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Waar gaat uw vraag over?"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                      Bericht *
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-5 h-5 text-text-light absolute left-4 top-4" />
                      <textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        placeholder="Uw bericht..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="contactPreference" className="block text-sm font-medium text-text-primary mb-2">
                      Hoe wilt u dat wij contact met u opnemen?
                    </label>
                    <select
                      id="contactPreference"
                      name="contactPreference"
                      value={formData.contactPreference}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="email">Per e-mail</option>
                      <option value="phone">Telefonisch</option>
                      <option value="any">Geen voorkeur</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verzenden...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Bericht Verzenden</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
          
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Contactgegevens</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Care & Service Pinoso</h3>
                    <p className="text-text-secondary">Een initiatief van HS Management & Beheer BV</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Adres</h3>
                    <p className="text-text-secondary">Torenlaant 5B<br />1402 AT Bussum<br />Nederland</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Email</h3>
                    <a href="mailto:h.siereveld@gmail.com" className="text-primary-600 hover:text-primary-700">h.siereveld@gmail.com</a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Telefoon</h3>
                    <a href="tel:+31634339304" className="text-primary-600 hover:text-primary-700">+31 (0)6-34339304</a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-50 rounded-2xl p-8 border border-primary-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-primary-700">Reactietijd</h3>
              </div>
              <p className="text-primary-700 mb-4">
                Wij streven ernaar om binnen 1-2 werkdagen te reageren op alle berichten. Bij dringende zaken kunt u ons het beste telefonisch bereiken.
              </p>
              <div className="bg-white rounded-xl p-4">
                <h4 className="font-medium text-primary-700 mb-2">Openingstijden</h4>
                <ul className="space-y-1 text-primary-600">
                  <li className="flex justify-between">
                    <span>Maandag - Vrijdag:</span>
                    <span>09:00 - 17:00</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Zaterdag:</span>
                    <span>10:00 - 14:00</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Zondag:</span>
                    <span>Gesloten</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Terug naar home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}