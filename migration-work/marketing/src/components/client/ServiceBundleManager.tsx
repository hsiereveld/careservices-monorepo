import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Tag, 
  Percent, 
  ArrowRight, 
  Check, 
  Users, 
  Shield, 
  Clock, 
  Calendar,
  MapPin,
  Phone,
  User,
  Heart,
  Info,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Euro,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calculateEstimatedPrice, getPriceUnitLabel } from '../../utils/bookingPriceCalculator';

interface ServiceBundle {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_percentage: number;
  admin_percentage: number;
  is_active: boolean;
  sort_order: number;
  price_unit: string;
  created_at: string;
  updated_at: string;
  services?: BundleService[];
}

interface BundleService {
  id: string;
  bundle_id: string;
  service_id: string;
  custom_price: number | null;
  discount_percentage: number | null;
  created_at: string;
  service?: {
    id: string;
    name: string;
    short_description: string;
    pricing_tiers?: {
      id: string;
      price: number;
      price_unit: string;
    }[];
  };
}

export function ServiceBundleManager() {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Booking form state
  const [bookingData, setBookingData] = useState({
    booking_start_date: '',
    booking_start_time: '',
    booking_end_date: '',
    booking_end_time: '',
    customer_notes: '',
    customer_address: '',
    customer_phone: '',
    urgency: 'normal' as 'normal' | 'urgent' | 'flexible'
  });

  useEffect(() => {
    fetchBundles();
  }, [user]);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch service bundles with their services
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('service_bundles')
        .select(`
          *,
          services:bundle_services(
            *,
            service:services(*, pricing_tiers(*))
          )
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (bundlesError) throw bundlesError;

      setBundles(bundlesData || []);
    } catch (err: any) {
      setError('Fout bij het laden van servicebundels: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBundleDetails = (bundleId: string) => {
    if (expandedBundleId === bundleId) {
      setExpandedBundleId(null);
    } else {
      setExpandedBundleId(bundleId);
    }
  };

  const handleSelectBundle = (bundleId: string) => {
    if (!user) {
      // If not logged in, don't show booking form
      return;
    }
    
    setSelectedBundleId(bundleId);
    setShowBookingForm(true);
    
    // Reset booking form
    setBookingData({
      booking_start_date: '',
      booking_start_time: '',
      booking_end_date: '',
      booking_end_time: '',
      customer_notes: '',
      customer_address: '',
      customer_phone: '',
      urgency: 'normal'
    });
  };

  const handleBookBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBundleId) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Get the selected bundle
      const selectedBundle = bundles.find(bundle => bundle.id === selectedBundleId);
      if (!selectedBundle) {
        throw new Error('Geselecteerde bundel niet gevonden');
      }

      // Get the first service in the bundle to use as the primary service
      const primaryService = selectedBundle.services?.[0]?.service;
      if (!primaryService) {
        throw new Error('Geen diensten gevonden in deze bundel');
      }

      // Calculate estimated price based on the bundle price and booking duration
      let estimatedPrice = selectedBundle.price;
      
      // If the bundle has a price unit other than per_service, adjust the price based on duration
      if (selectedBundle.price_unit !== 'per_service' && 
          bookingData.booking_start_date && bookingData.booking_start_time) {
        
        estimatedPrice = calculateEstimatedPrice(
          selectedBundle.price,
          selectedBundle.price_unit as any,
          bookingData.booking_start_date,
          bookingData.booking_start_time,
          bookingData.booking_end_date,
          bookingData.booking_end_time
        );
      }

      // Create booking
      const { data, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          service_id: primaryService.id,
          bundle_id: selectedBundleId,
          booking_start_date: bookingData.booking_start_date,
          booking_start_time: bookingData.booking_start_time,
          booking_end_date: bookingData.booking_end_date || bookingData.booking_start_date,
          booking_end_time: bookingData.booking_end_time || bookingData.booking_start_time,
          booking_date: bookingData.booking_start_date, // For backward compatibility
          booking_time: bookingData.booking_start_time, // For backward compatibility
          customer_notes: bookingData.customer_notes,
          customer_address: bookingData.customer_address,
          customer_phone: bookingData.customer_phone,
          urgency: bookingData.urgency,
          estimated_price: estimatedPrice,
          status: 'pending'
        })
        .select();

      if (bookingError) throw bookingError;

      setSuccess(`Bundel "${selectedBundle.name}" succesvol geboekt! 🎉`);
      setShowBookingForm(false);
      setSelectedBundleId(null);
    } catch (err: any) {
      setError('Fout bij het boeken van bundel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBundles = bundles.filter(bundle => 
    bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bundle.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total regular price for a bundle
  const calculateRegularPrice = (bundle: ServiceBundle): number => {
    if (!bundle.services) return 0;
    
    return bundle.services.reduce((total, bundleService) => {
      const servicePrice = bundleService.custom_price || 0;
      return total + servicePrice;
    }, 0);
  };

  // Calculate savings amount
  const calculateSavings = (bundle: ServiceBundle): number => {
    const regularPrice = calculateRegularPrice(bundle);
    return regularPrice - bundle.price;
  };

  // Render login/signup prompt for non-authenticated users
  const renderAuthPrompt = () => {
    return (
      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <div className="flex items-center space-x-3 mb-3">
          <Info className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800">Log in om bundels te boeken</h4>
        </div>
        <p className="text-blue-700 mb-4">
          Je kunt alle servicebundels bekijken, maar je moet ingelogd zijn om ze te boeken.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Inloggen</span>
          </Link>
          <Link 
            href="/signup"
            className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Account aanmaken</span>
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-500 mr-3" />
          <span className="text-gray-600">Servicebundels laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary">Servicebundels</h3>
          <p className="text-text-secondary">Combineer diensten en bespaar</p>
        </div>
        <button
          onClick={fetchBundles}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Vernieuwen</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Show login prompt for non-authenticated users */}
      {!user && renderAuthPrompt()}

      {/* Bundles */}
      {filteredBundles.length > 0 ? (
        <div className="space-y-6">
          {filteredBundles.map((bundle) => {
            const regularPrice = calculateRegularPrice(bundle);
            const savings = calculateSavings(bundle);
            const savingsPercentage = regularPrice > 0 ? (savings / regularPrice) * 100 : 0;
            
            return (
              <div key={bundle.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Bundle Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-bold mb-1">{bundle.name}</h4>
                      <p className="text-primary-100">{bundle.description}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-white">
                      <span className="font-bold">€{bundle.price.toFixed(2)}</span>
                      <span className="text-sm ml-1">{getPriceUnitLabel(bundle.price_unit as any)}</span>
                    </div>
                  </div>
                  
                  {savings > 0 && (
                    <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
                      <span className="text-white">
                        Bespaar {savingsPercentage.toFixed(0)}% (€{savings.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Bundle Content */}
                <div className="p-6 bg-white">
                  {/* Services Toggle */}
                  <div 
                    className="flex items-center justify-between cursor-pointer text-primary-600 hover:text-primary-700 mb-4"
                    onClick={() => toggleBundleDetails(bundle.id)}
                  >
                    <span className="font-medium">Inbegrepen Diensten</span>
                    {expandedBundleId === bundle.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* Services List */}
                  {expandedBundleId === bundle.id && bundle.services && (
                    <div className="mb-6 space-y-3">
                      {bundle.services.map((bundleService) => {
                        // Get price unit from service pricing tier if available
                        const pricingTier = bundleService.service?.pricing_tiers?.[0];
                        const priceUnit = pricingTier?.price_unit || 'per_service';
                        
                        return (
                          <div key={bundleService.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-gray-900">{bundleService.service?.name}</h5>
                                <p className="text-sm text-gray-600">{bundleService.service?.short_description}</p>
                              </div>
                              {bundleService.custom_price && (
                                <div className="text-sm font-medium text-gray-900">
                                  €{bundleService.custom_price.toFixed(2)} {getPriceUnitLabel(priceUnit as any)}
                                </div>
                              )}
                            </div>
                            {bundleService.discount_percentage && (
                              <div className="mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full inline-block">
                                {bundleService.discount_percentage}% korting
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Action Button */}
                  {user ? (
                    <button
                      onClick={() => handleSelectBundle(bundle.id)}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Package className="w-5 h-5" />
                      <span>Bundel Boeken</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login"
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <User className="w-5 h-5" />
                        <span>Inloggen om te boeken</span>
                      </Link>
                      <Link
                        href="/signup"
                        className="w-full bg-white border border-primary-300 text-primary-700 hover:bg-primary-50 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <User className="w-4 h-4" />
                        <span>Registreren</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h5 className="text-lg font-semibold text-gray-900 mb-2">Geen servicebundels gevonden</h5>
          <p className="text-gray-600">
            {searchTerm 
              ? `Geen servicebundels gevonden voor "${searchTerm}"`
              : 'Er zijn momenteel geen servicebundels beschikbaar'}
          </p>
        </div>
      )}

      {/* How to Use Bundles */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center space-x-2">
          <Info className="w-5 h-5" />
          <span>Voordelen van Servicebundels</span>
        </h4>
        <ul className="space-y-3 text-blue-700">
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium">Bespaar geld</p>
              <p className="text-sm">Profiteer van aanzienlijke kortingen door diensten te combineren</p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium">Eenvoudige planning</p>
              <p className="text-sm">Boek meerdere diensten in één keer met gecoördineerde planning</p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium">Consistente kwaliteit</p>
              <p className="text-sm">Geniet van dezelfde hoge kwaliteit over alle gebundelde diensten</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedBundleId && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-text-primary mb-6">
                Boek {bundles.find(b => b.id === selectedBundleId)?.name}
              </h3>
              
              <form onSubmit={handleBookBundle} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Startdatum *
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingData.booking_start_date}
                      onChange={(e) => setBookingData({ ...bookingData, booking_start_date: e.target.value })}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Starttijd *
                    </label>
                    <input
                      type="time"
                      required
                      value={bookingData.booking_start_time}
                      onChange={(e) => setBookingData({ ...bookingData, booking_start_time: e.target.value })}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Einddatum (optioneel)
                    </label>
                    <input
                      type="date"
                      value={bookingData.booking_end_date}
                      onChange={(e) => setBookingData({ ...bookingData, booking_end_date: e.target.value })}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={bookingData.booking_start_date || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Eindtijd (optioneel)
                    </label>
                    <input
                      type="time"
                      value={bookingData.booking_end_time}
                      onChange={(e) => setBookingData({ ...bookingData, booking_end_time: e.target.value })}
                      className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Adres *
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={bookingData.customer_address}
                      onChange={(e) => setBookingData({ ...bookingData, customer_address: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Straat, huisnummer, stad"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Telefoonnummer *
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={bookingData.customer_phone}
                      onChange={(e) => setBookingData({ ...bookingData, customer_phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+34 123 456 789"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Urgentie
                  </label>
                  <select
                    value={bookingData.urgency}
                    onChange={(e) => setBookingData({ ...bookingData, urgency: e.target.value as any })}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="normal">Normaal</option>
                    <option value="urgent">Urgent</option>
                    <option value="flexible">Flexibel</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Notities
                  </label>
                  <textarea
                    value={bookingData.customer_notes}
                    onChange={(e) => setBookingData({ ...bookingData, customer_notes: e.target.value })}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
                    placeholder="Aanvullende informatie of wensen..."
                  />
                </div>
                
                {/* Bundle Summary */}
                <div className="bg-primary-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text-primary mb-3">Bundel Samenvatting</h4>
                  {(() => {
                    const bundle = bundles.find(b => b.id === selectedBundleId);
                    if (!bundle) return null;
                    
                    // Calculate estimated price based on booking duration
                    let estimatedPrice = bundle.price;
                    
                    // If the bundle has a price unit other than per_service, adjust the price based on duration
                    if (bundle.price_unit !== 'per_service' && 
                        bookingData.booking_start_date && bookingData.booking_start_time) {
                        
                      estimatedPrice = calculateEstimatedPrice(
                        bundle.price,
                        bundle.price_unit as any,
                        bookingData.booking_start_date,
                        bookingData.booking_start_time,
                        bookingData.booking_end_date,
                        bookingData.booking_end_time
                      );
                    }
                    
                    return (
                      <>
                        <div className="flex justify-between mb-2">
                          <span className="text-text-secondary">Bundel:</span>
                          <span className="font-medium text-text-primary">{bundle.name}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-text-secondary">Basis prijs:</span>
                          <span className="font-medium text-text-primary">
                            €{bundle.price.toFixed(2)} {getPriceUnitLabel(bundle.price_unit as any)}
                          </span>
                        </div>
                        {bookingData.booking_start_date && bookingData.booking_start_time && estimatedPrice !== bundle.price && (
                          <div className="flex justify-between mb-2">
                            <span className="text-text-secondary">Geschatte prijs:</span>
                            <span className="font-medium text-primary-600">€{estimatedPrice.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Korting:</span>
                          <span className="font-medium text-green-600">{bundle.discount_percentage}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span>Verwerken...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Boeking Bevestigen</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}