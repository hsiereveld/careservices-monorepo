import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Tag, 
  ArrowRight, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  MapPin,
  Clock,
  Euro,
  Users
} from 'lucide-react';
import { supabase, ServiceCategory, ServiceWithDetails } from '../lib/supabase';
import { calculateDetailedPrices } from '../utils/priceCalculations';
import { getPriceUnitLabel } from '../utils/bookingPriceCalculator';

export function ServicesPage() {
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedService, setSelectedService] = useState<ServiceWithDetails | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch service categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      // Fetch services with related data
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(*),
          pricing_tiers(*)
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (servicesError) throw servicesError;

      setCategories(categoriesData || []);
      setServices(servicesData || []);
    } catch (err: any) {
      setError('Fout bij het laden van diensten: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service: ServiceWithDetails) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const closeServiceModal = () => {
    setShowServiceModal(false);
    setSelectedService(null);
  };

  // Filter services based on search and category
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.short_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || service.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get category icon based on name
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('huishoudelijke') || name.includes('huis')) return '🏠';
    if (name.includes('zorg') || name.includes('persoonlijke')) return '❤️';
    if (name.includes('transport') || name.includes('vervoer')) return '🚗';
    if (name.includes('medische') || name.includes('medisch')) return '🏥';
    if (name.includes('administratieve') || name.includes('admin')) return '📋';
    if (name.includes('property') || name.includes('onderhoud')) return '🔧';
    return '✨';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Onze Diensten
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Ontdek ons uitgebreide aanbod van zorg- en servicediensten voor Nederlandse en Belgische immigranten en expats in Pinoso
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Zoek diensten..."
              />
            </div>
            {categories.length > 0 && (
              <div className="relative">
                <Filter className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
                >
                  <option value="">Alle categorieën</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-8">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Services Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary-500 mr-3" />
            <span className="text-gray-600">Diensten laden...</span>
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              // Calculate selling price
              const defaultPriceTier = service.pricing_tiers?.[0];
              const costPrice = defaultPriceTier?.price || 0;
              const vatRate = defaultPriceTier?.vat_rate || 21;
              const adminPercentage = defaultPriceTier?.admin_percentage || 15;
              const priceUnit = defaultPriceTier?.price_unit || 'per_hour';

              const { sellingPrice } = calculateDetailedPrices(costPrice, 0, vatRate, adminPercentage);
              const formattedSellingPrice = `€${sellingPrice.toFixed(2)} ${getPriceUnitLabel(priceUnit)}`;

              return (
                <div 
                  key={service.id} 
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleServiceClick(service)}
                >
                  {/* Service Image */}
                  <div className="h-48 bg-gray-200 relative">
                    {service.image_url ? (
                      <img 
                        src={service.image_url} 
                        alt={service.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=600';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-100">
                        <span className="text-4xl">{service.category ? getCategoryIcon(service.category.name) : '✨'}</span>
                      </div>
                    )}
                    
                    {/* Category Tag */}
                    {service.category && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-primary-700 flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{service.category.name}</span>
                      </div>
                    )}
                    
                    {/* Price Tag */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-primary-700">
                      {formattedSellingPrice}
                    </div>
                    
                    {/* Featured Badge */}
                    {service.is_featured && (
                      <div className="absolute bottom-4 left-4 bg-accent-500 px-3 py-1 rounded-full text-xs font-medium text-white flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-white" />
                        <span>Uitgelicht</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Service Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-text-primary mb-2">{service.name}</h3>
                    <p className="text-text-secondary mb-4">{service.short_description}</p>
                    
                    {/* Service Details */}
                    <div className="space-y-2 mb-4">
                      {service.target_audience && (
                        <div className="flex items-center space-x-2 text-sm text-text-secondary">
                          <Users className="w-4 h-4 text-primary-500" />
                          <span>{service.target_audience}</span>
                        </div>
                      )}
                      
                      {defaultPriceTier?.duration_minutes && (
                        <div className="flex items-center space-x-2 text-sm text-text-secondary">
                          <Clock className="w-4 h-4 text-primary-500" />
                          <span>{defaultPriceTier.duration_minutes} minuten</span>
                        </div>
                      )}
                    </div>
                    
                    <button className="w-full bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium py-2 rounded-lg transition-colors flex items-center justify-center space-x-1">
                      <span>Meer informatie</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Geen diensten gevonden
            </h3>
            <p className="text-text-secondary">
              {searchTerm || selectedCategory 
                ? 'Probeer andere zoektermen of filters'
                : 'Er zijn momenteel geen diensten beschikbaar'
              }
            </p>
          </div>
        )}
      </div>

      {/* Service Detail Modal */}
      {showServiceModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {/* Service Image */}
              <div className="h-64 bg-gray-200">
                {selectedService.image_url ? (
                  <img 
                    src={selectedService.image_url} 
                    alt={selectedService.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=600';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-100">
                    <span className="text-6xl">{selectedService.category ? getCategoryIcon(selectedService.category.name) : '✨'}</span>
                  </div>
                )}
                
                {/* Close Button */}
                <button 
                  onClick={closeServiceModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                
                {/* Category Tag */}
                {selectedService.category && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-primary-700 flex items-center space-x-1">
                    <Tag className="w-4 h-4" />
                    <span>{selectedService.category.name}</span>
                  </div>
                )}
              </div>
              
              {/* Service Content */}
              <div className="p-8">
                <h2 className="text-3xl font-bold text-text-primary mb-4">{selectedService.name}</h2>
                
                {/* Price and Duration */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {selectedService.pricing_tiers && selectedService.pricing_tiers.length > 0 && (
                    <>
                      <div className="bg-primary-50 px-4 py-2 rounded-lg flex items-center space-x-2">
                        <Euro className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="text-sm text-primary-600">Prijs</p>
                          <p className="font-semibold text-primary-700">
                            {(() => {
                              const priceTier = selectedService.pricing_tiers[0];
                              const costPrice = priceTier.price || 0;
                              const vatRate = priceTier.vat_rate || 21;
                              const adminPercentage = priceTier.admin_percentage || 15;
                              const priceUnit = priceTier.price_unit || 'per_hour';
                              
                              const { sellingPrice } = calculateDetailedPrices(costPrice, 0, vatRate, adminPercentage);
                              return `€${sellingPrice.toFixed(2)} ${getPriceUnitLabel(priceUnit)}`;
                            })()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-primary-50 px-4 py-2 rounded-lg flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="text-sm text-primary-600">Duur</p>
                          <p className="font-semibold text-primary-700">
                            {selectedService.pricing_tiers[0].duration_minutes} minuten
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {selectedService.target_audience && (
                    <div className="bg-primary-50 px-4 py-2 rounded-lg flex items-center space-x-2">
                      <Users className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="text-sm text-primary-600">Doelgroep</p>
                        <p className="font-semibold text-primary-700">{selectedService.target_audience}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-text-primary mb-3">Beschrijving</h3>
                  <p className="text-text-secondary mb-4">{selectedService.short_description}</p>
                  {selectedService.full_description && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-text-secondary whitespace-pre-wrap">{selectedService.full_description}</p>
                    </div>
                  )}
                </div>
                
                {/* Service Details */}
                {selectedService.details && selectedService.details.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Inbegrepen</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selectedService.details
                        .filter(detail => detail.detail_type === 'included')
                        .map((detail, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>{detail.detail_value}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {/* Book Button */}
                <div className="flex justify-center">
                  <Link 
                    href="/signup"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors inline-flex items-center space-x-2"
                  >
                    <span>Dienst Boeken</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// X component for the close button
function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}