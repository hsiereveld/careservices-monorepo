import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Clock, 
  Calendar, 
  Percent, 
  Loader2, 
  RefreshCw,
  Check,
  X,
  Info,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface DiscountType {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  is_active: boolean;
}

interface Discount {
  id: string;
  discount_type_id: string | null;
  user_id: string | null;
  code: string | null;
  description: string;
  amount: number | null;
  percentage: number | null;
  is_percentage: boolean;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  discount_type?: DiscountType;
}

export function DiscountManager() {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscountData();
  }, [user]);

  const fetchDiscountData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch discount types
      const { data: typesData, error: typesError } = await supabase
        .from('discount_types')
        .select('*')
        .eq('is_active', true);

      if (typesError) throw typesError;

      setDiscountTypes(typesData || []);

      // Fetch available discounts
      const discountQuery = supabase
        .from('discounts')
        .select(`
          *,
          discount_type:discount_types(*)
        `)
        .eq('is_active', true);
      
      // Add user-specific filter if logged in
      if (user) {
        discountQuery.or(`user_id.is.null,user_id.eq.${user.id}`);
      } else {
        // For anonymous users, only show public discounts
        discountQuery.is('user_id', null);
      }

      const { data: discountsData, error: discountsError } = await discountQuery;

      if (discountsError) throw discountsError;

      setDiscounts(discountsData || []);
    } catch (err: any) {
      setError('Fout bij het laden van kortingsgegevens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    if (!user) return; // Only allow copying if logged in
    
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isDiscountValid = (discount: Discount): boolean => {
    const now = new Date();
    
    // Check start date
    if (discount.start_date && new Date(discount.start_date) > now) {
      return false;
    }
    
    // Check end date
    if (discount.end_date && new Date(discount.end_date) < now) {
      return false;
    }
    
    // Check max uses
    if (discount.max_uses !== null && discount.uses_count >= discount.max_uses) {
      return false;
    }
    
    return discount.is_active;
  };

  const getDiscountValue = (discount: Discount): string => {
    if (discount.is_percentage && discount.percentage) {
      return `${discount.percentage}%`;
    } else if (!discount.is_percentage && discount.amount) {
      return `€${discount.amount.toFixed(2)}`;
    } else if (discount.discount_type?.discount_percentage) {
      return `${discount.discount_type.discount_percentage}%`;
    }
    return 'Onbekend';
  };

  const getDiscountStatus = (discount: Discount): { valid: boolean; message: string } => {
    const now = new Date();
    
    if (!discount.is_active) {
      return { valid: false, message: 'Inactief' };
    }
    
    if (discount.start_date && new Date(discount.start_date) > now) {
      return { valid: false, message: `Geldig vanaf ${new Date(discount.start_date).toLocaleDateString('nl-NL')}` };
    }
    
    if (discount.end_date && new Date(discount.end_date) < now) {
      return { valid: false, message: 'Verlopen' };
    }
    
    if (discount.max_uses !== null && discount.uses_count >= discount.max_uses) {
      return { valid: false, message: 'Maximaal aantal keer gebruikt' };
    }
    
    if (discount.end_date) {
      return { valid: true, message: `Geldig tot ${new Date(discount.end_date).toLocaleDateString('nl-NL')}` };
    }
    
    return { valid: true, message: 'Geldig' };
  };

  const filteredDiscounts = discounts.filter(discount => 
    discount.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.discount_type?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render login/signup prompt for non-authenticated users
  const renderAuthPrompt = () => {
    return (
      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <div className="flex items-center space-x-3 mb-3">
          <Info className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800">Log in voor persoonlijke kortingen</h4>
        </div>
        <p className="text-blue-700 mb-4">
          Je kunt alle openbare kortingen bekijken, maar log in om ook persoonlijke kortingen te zien en kortingscodes te gebruiken bij het boeken.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Inloggen</span>
          </Link>
          <Link 
            href="/signup"
            className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
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
          <span className="text-gray-600">Kortingsgegevens laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary">Kortingen</h3>
          <p className="text-text-secondary">Bekijk en gebruik beschikbare kortingscodes</p>
        </div>
        <button
          onClick={fetchDiscountData}
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
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
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

      {/* Discount Types */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-text-primary mb-4">Kortingstypen</h4>
        <div className="grid md:grid-cols-3 gap-4">
          {discountTypes.map((type) => (
            <div key={type.id} className="bg-primary-50 rounded-xl p-4 border border-primary-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Percent className="w-4 h-4 text-primary-600" />
                </div>
                <h5 className="font-semibold text-text-primary">{type.name}</h5>
              </div>
              <p className="text-sm text-text-secondary mb-3">{type.description}</p>
              <div className="bg-white rounded-lg px-3 py-2 inline-block">
                <span className="font-medium text-primary-600">{type.discount_percentage}% korting</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Discounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-text-primary">Beschikbare Kortingscodes</h4>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Zoek kortingscodes..."
            />
          </div>
        </div>

        {filteredDiscounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Beschrijving</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Korting</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Geldigheid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDiscounts.map((discount) => {
                  const status = getDiscountStatus(discount);
                  
                  return (
                    <tr key={discount.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900">{discount.code}</div>
                        {discount.discount_type && (
                          <div className="text-xs text-gray-500">{discount.discount_type.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {discount.description}
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium text-primary-600">{getDiscountValue(discount)}</div>
                        {discount.min_order_amount > 0 && (
                          <div className="text-xs text-gray-500">
                            Min. bestelling: €{discount.min_order_amount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {discount.start_date && (
                          <div className="flex items-center space-x-1 text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Vanaf: {new Date(discount.start_date).toLocaleDateString('nl-NL')}</span>
                          </div>
                        )}
                        {discount.end_date && (
                          <div className="flex items-center space-x-1 text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Tot: {new Date(discount.end_date).toLocaleDateString('nl-NL')}</span>
                          </div>
                        )}
                        {discount.max_uses && (
                          <div className="flex items-center space-x-1 text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Gebruikt: {discount.uses_count}/{discount.max_uses}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status.valid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {status.message}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {discount.code && status.valid && (
                          user ? (
                            <button
                              onClick={() => handleCopyCode(discount.code!)}
                              className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                            >
                              {copiedCode === discount.code ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Gekopieerd</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span>Kopiëren</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <Link
                              href="/login"
                              className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                            >
                              <LogIn className="w-4 h-4" />
                              <span>Log in om te gebruiken</span>
                            </Link>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h5 className="text-lg font-semibold text-gray-900 mb-2">Geen kortingscodes gevonden</h5>
            <p className="text-gray-600">
              {searchTerm 
                ? `Geen kortingscodes gevonden voor "${searchTerm}"`
                : 'Er zijn momenteel geen kortingscodes beschikbaar'}
            </p>
          </div>
        )}
      </div>

      {/* How to Use Discounts */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center space-x-2">
          <Info className="w-5 h-5" />
          <span>Hoe kortingscodes te gebruiken</span>
        </h4>
        <ol className="space-y-3 text-blue-700">
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium flex-shrink-0 mt-0.5">1</div>
            <div>
              <p className="font-medium">Kopieer een geldige kortingscode</p>
              <p className="text-sm">Klik op de "Kopiëren" knop naast een geldige kortingscode</p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium flex-shrink-0 mt-0.5">2</div>
            <div>
              <p className="font-medium">Plak de code tijdens het boeken</p>
              <p className="text-sm">Voer de kortingscode in het daarvoor bestemde veld in tijdens het boekingsproces</p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium flex-shrink-0 mt-0.5">3</div>
            <div>
              <p className="font-medium">Geniet van je korting</p>
              <p className="text-sm">De korting wordt automatisch toegepast op je boeking</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}