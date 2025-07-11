import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Euro, 
  Clock, 
  Users, 
  Tag, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  Camera,
  ToggleRight,
  ToggleLeft,
  Info,
  Percent,
  Calculator,
  HelpCircle
} from 'lucide-react';
import { supabase, ProviderService, Service, PriceUnitType } from '../../lib/supabase';
import { PhotoManager } from '../admin/PhotoManager';
import { calculateDetailedPrices } from '../../utils/priceCalculations';

interface ProfessionalServiceFormProps {
  providerId: string;
  providerService?: ProviderService | null;
  availableServices: Service[];
  onClose: () => void;
  onSave: () => void;
}

export function ProfessionalServiceForm({ 
  providerId, 
  providerService, 
  availableServices,
  onClose, 
  onSave 
}: ProfessionalServiceFormProps) {
  const [formData, setFormData] = useState({
    service_id: '',
    custom_name: '',
    custom_short_description: '',
    custom_full_description: '',
    custom_price: 0,
    custom_price_unit: 'per_hour' as PriceUnitType,
    custom_duration_minutes: 60,
    custom_target_audience: '',
    custom_image_url: '',
    is_available: true,
    commission_rate_override: null as number | null // New field for commission rate override
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categoryCommissionRate, setCategoryCommissionRate] = useState<number | null>(null);
  
  // New state for price calculation
  const [totalSellingPrice, setTotalSellingPrice] = useState<number>(0);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [priceDetails, setPriceDetails] = useState<any>(null);
  const [recommendedPrice, setRecommendedPrice] = useState<string>('');

  useEffect(() => {
    if (providerService) {
      setIsEditing(true);
      setFormData({
        service_id: providerService.service_id,
        custom_name: providerService.custom_name || providerService.service?.name || '',
        custom_short_description: providerService.custom_short_description || providerService.service?.short_description || '',
        custom_full_description: providerService.custom_full_description || providerService.service?.full_description || '',
        custom_price: providerService.custom_price || (providerService.service?.pricing_tiers?.[0]?.price || 0),
        custom_price_unit: providerService.custom_price_unit || (providerService.service?.pricing_tiers?.[0]?.price_unit || 'per_hour'),
        custom_duration_minutes: providerService.custom_duration_minutes || (providerService.service?.pricing_tiers?.[0]?.duration_minutes || 60),
        custom_target_audience: providerService.custom_target_audience || providerService.service?.target_audience || '',
        custom_image_url: providerService.custom_image_url || providerService.service?.image_url || '',
        is_available: providerService.is_available,
        commission_rate_override: providerService.commission_rate_override
      });
      
      // Find the selected service
      const service = availableServices.find(s => s.id === providerService.service_id);
      if (service) {
        setSelectedService(service);
        fetchCategoryCommissionRate(service.category_id);
      }
    }
  }, [providerService, availableServices]);

  // Calculate total selling price whenever relevant values change
  useEffect(() => {
    calculateTotalSellingPrice();
  }, [formData.custom_price, formData.commission_rate_override, categoryCommissionRate]);

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    setFormData({
      ...formData,
      service_id: serviceId
    });
    
    // Find the selected service and pre-fill form with its data
    const service = availableServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      fetchCategoryCommissionRate(service.category_id);
      setFormData({
        ...formData,
        service_id: serviceId,
        custom_name: service.name,
        custom_short_description: service.short_description,
        custom_full_description: service.full_description || '',
        custom_price: service.pricing_tiers?.[0]?.price || 0,
        custom_price_unit: service.pricing_tiers?.[0]?.price_unit || 'per_hour',
        custom_duration_minutes: service.pricing_tiers?.[0]?.duration_minutes || 60,
        custom_target_audience: service.target_audience || '',
        custom_image_url: service.image_url || '',
        commission_rate_override: null // Reset commission rate override when changing service
      });
    }
  };

  const fetchCategoryCommissionRate = async (categoryId?: string) => {
    if (!categoryId) return;
    
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('commission_rate')
        .eq('id', categoryId)
        .single();
        
      if (error) {
        console.error('Error fetching category commission rate:', error);
        return;
      }
      
      setCategoryCommissionRate(data?.commission_rate || 15.0);
    } catch (err) {
      console.error('Error fetching category commission rate:', err);
    }
  };

  const calculateTotalSellingPrice = () => {
    const price = formData.custom_price;
    const effectiveCommissionRate = formData.commission_rate_override !== null 
      ? formData.commission_rate_override 
      : (categoryCommissionRate || 15.0);
    
    // Calculate detailed prices
    const details = calculateDetailedPrices(
      price,
      0, // Unused parameter
      21, // VAT rate
      15, // Default admin percentage
      effectiveCommissionRate // Effective commission rate
    );
    
    setTotalSellingPrice(details.sellingPrice);
    setPriceDetails(details);
    
    // Calculate recommended price (nearest whole or half number)
    const roundedPrice = Math.round(details.sellingPrice * 2) / 2;
    
    // Calculate what the cost price should be to achieve this rounded selling price
    const vatRate = 21;
    const commissionRate = effectiveCommissionRate;
    
    // Formula: costPrice = roundedSellingPrice / (1 + (vatRate/100)) / (1 + (commissionRate/100))
    const recommendedCostPrice = roundedPrice / (1 + (vatRate/100)) / (1 + (commissionRate/100));
    
    setRecommendedPrice(`€${recommendedCostPrice.toFixed(2)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_id) {
      setError('Selecteer een dienst categorie');
      return;
    }
    
    if (!formData.custom_name) {
      setError('Vul een naam in voor je dienst');
      return;
    }
    
    if (formData.custom_price <= 0) {
      setError('Vul een geldige prijs in (groter dan 0)');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (isEditing && providerService) {
        // Update existing service
        const { error } = await supabase
          .from('provider_services')
          .update({
            custom_name: formData.custom_name,
            custom_short_description: formData.custom_short_description,
            custom_full_description: formData.custom_full_description,
            custom_price: formData.custom_price,
            custom_price_unit: formData.custom_price_unit,
            custom_duration_minutes: formData.custom_duration_minutes,
            custom_target_audience: formData.custom_target_audience,
            custom_image_url: formData.custom_image_url,
            is_available: formData.is_available,
            commission_rate_override: formData.commission_rate_override,
            review_status: 'pending_review' // Reset review status when edited
          })
          .eq('id', providerService.id);
          
        if (error) throw error;
        
        setSuccess('Dienst succesvol bijgewerkt! Je dienst wordt nu beoordeeld door ons team voordat deze zichtbaar wordt in de marktplaats.');
      } else {
        // Create new service
        const { error } = await supabase
          .from('provider_services')
          .insert({
            provider_id: providerId,
            service_id: formData.service_id,
            custom_name: formData.custom_name,
            custom_short_description: formData.custom_short_description,
            custom_full_description: formData.custom_full_description,
            custom_price: formData.custom_price,
            custom_price_unit: formData.custom_price_unit,
            custom_duration_minutes: formData.custom_duration_minutes,
            custom_target_audience: formData.custom_target_audience,
            custom_image_url: formData.custom_image_url,
            is_available: formData.is_available,
            commission_rate_override: formData.commission_rate_override,
            review_status: 'pending_review' // New services need review
          });
          
        if (error) throw error;
        
        setSuccess('Dienst succesvol toegevoegd! Je dienst wordt nu beoordeeld door ons team voordat deze zichtbaar wordt in de marktplaats.');
      }
      
      // Wait a moment to show success message
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({
      ...formData,
      custom_image_url: imageUrl
    });
    setShowPhotoManager(false);
  };

  // Helper function to get price unit label
  const getPriceUnitLabel = (priceUnit: PriceUnitType): string => {
    switch (priceUnit) {
      case 'per_hour': return 'per uur';
      case 'per_day': return 'per dag';
      case 'per_service': return 'per service';
      case 'per_km': return 'per km';
      case 'per_item': return 'per stuk';
      case 'per_month': return 'per maand';
      case 'per_week': return 'per week';
      default: return 'per uur';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">
                  {isEditing ? 'Dienst Bewerken' : 'Nieuwe Dienst Toevoegen'}
                </h2>
                <p className="text-text-secondary">
                  {isEditing ? 'Wijzig de details van je dienst' : 'Voeg een nieuwe dienst toe aan je aanbod'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
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

          {/* Review Status Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">Dienst Beoordelingsproces</h3>
                <p className="text-sm text-blue-700">
                  Alle nieuwe en gewijzigde diensten worden eerst beoordeeld door ons team voordat ze zichtbaar worden in de marktplaats. 
                  Dit zorgt ervoor dat alle diensten voldoen aan onze kwaliteitsnormen en correct gecategoriseerd zijn.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Category Selection - only for new services */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Dienst Categorie *
                </label>
                <div className="relative">
                  <Tag className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={formData.service_id}
                    onChange={handleServiceChange}
                    className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecteer een dienst categorie</option>
                    {availableServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} {service.category ? `(${service.category.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-text-light mt-1">
                  Selecteer de categorie die het beste past bij de dienst die je wilt aanbieden
                </p>
              </div>
            )}

            {/* Display selected service category */}
            {selectedService && selectedService.category && (
              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">
                    Standaard categorie: {selectedService.category.name}
                  </span>
                </div>
                <p className="text-xs text-primary-600 mt-1 ml-6">
                  De categorie waarin je dienst wordt getoond kan worden aangepast door de administrator tijdens het beoordelingsproces.
                </p>
              </div>
            )}

            {/* Service Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Dienst Naam *
                </label>
                <input
                  type="text"
                  value={formData.custom_name}
                  onChange={(e) => setFormData({ ...formData, custom_name: e.target.value })}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Bijv. Professionele Huisschoonmaak"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Prijs *
                </label>
                <div className="flex space-x-3">
                  <div className="relative flex-1">
                    <Euro className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.custom_price}
                      onChange={(e) => setFormData({ ...formData, custom_price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <select
                    value={formData.custom_price_unit}
                    onChange={(e) => setFormData({ ...formData, custom_price_unit: e.target.value as PriceUnitType })}
                    className="px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="per_hour">per uur</option>
                    <option value="per_day">per dag</option>
                    <option value="per_service">per service</option>
                    <option value="per_km">per km</option>
                    <option value="per_item">per stuk</option>
                    <option value="per_month">per maand</option>
                    <option value="per_week">per week</option>
                  </select>
                </div>
                <p className="text-xs text-text-light mt-1">
                  Dit is het bedrag dat jij ontvangt {getPriceUnitLabel(formData.custom_price_unit)}
                </p>
              </div>
            </div>

            {/* Total Selling Price Display */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-green-800 flex items-center space-x-2">
                  <Calculator className="w-4 h-4" />
                  <span>Verkoopprijs voor klanten</span>
                </h4>
                <button 
                  type="button"
                  onClick={() => setShowPriceDetails(!showPriceDetails)}
                  className="text-green-700 hover:text-green-800 text-sm font-medium"
                >
                  {showPriceDetails ? 'Verberg details' : 'Toon details'}
                </button>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-700">Jouw prijs:</span>
                <span className="font-medium text-green-800">€{formData.custom_price.toFixed(2)} {getPriceUnitLabel(formData.custom_price_unit)}</span>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-700">Verkoopprijs voor klant:</span>
                <span className="text-xl font-bold text-green-800">€{totalSellingPrice.toFixed(2)} {getPriceUnitLabel(formData.custom_price_unit)}</span>
              </div>
              
              {showPriceDetails && priceDetails && (
                <div className="mt-3 pt-3 border-t border-green-200 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Jouw prijs:</span>
                    <span className="text-green-800">€{priceDetails.costPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Commissie ({priceDetails.adminPercentageValue}%):</span>
                    <span className="text-green-800">€{priceDetails.adminFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Netto prijs (excl. BTW):</span>
                    <span className="text-green-800">€{priceDetails.netPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">BTW ({priceDetails.vatRateValue}%):</span>
                    <span className="text-green-800">€{priceDetails.vatAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">Advies voor betere prijsstelling:</p>
                    <p className="text-sm text-green-700">
                      Overweeg je prijs aan te passen naar {recommendedPrice} om een mooie ronde verkoopprijs te krijgen. 
                      Hele of halve prijzen (zoals €25,00 of €25,50) zijn voor klanten makkelijker te lezen, begrijpen en accepteren.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Rate Override */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Commissie Percentage (%) Override
              </label>
              <div className="relative">
                <Percent className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate_override !== null ? formData.commission_rate_override : ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                    setFormData({ ...formData, commission_rate_override: value });
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={categoryCommissionRate !== null ? `Standaard: ${categoryCommissionRate.toFixed(2)}%` : "Standaard commissie"}
                />
              </div>
              <p className="text-xs text-text-light mt-1">
                Optioneel. Laat leeg om de standaard categorie commissie ({categoryCommissionRate !== null ? `${categoryCommissionRate.toFixed(2)}%` : "standaard"}) te gebruiken. 
                Wijzigingen in commissie vereisen goedkeuring van een administrator.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Aantal Uren
                </label>
                <div className="relative">
                  <Clock className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={formData.custom_duration_minutes / 60}
                    onChange={(e) => setFormData({ ...formData, custom_duration_minutes: parseFloat(e.target.value) * 60 || 60 })}
                    className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1.00"
                  />
                </div>
                <p className="text-xs text-text-light mt-1">
                  Gemiddelde duur van deze dienst in uren (bijv. 1.00 = 1 uur, 0.25 = kwartier, 1.5 = anderhalf uur)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Doelgroep
                </label>
                <div className="relative">
                  <Users className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.custom_target_audience}
                    onChange={(e) => setFormData({ ...formData, custom_target_audience: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bijv. Senioren, gezinnen, etc."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Korte Beschrijving *
              </label>
              <textarea
                value={formData.custom_short_description}
                onChange={(e) => setFormData({ ...formData, custom_short_description: e.target.value })}
                className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
                placeholder="Korte beschrijving van je dienst (wordt getoond in overzichten)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Uitgebreide Beschrijving
              </label>
              <div className="relative">
                <FileText className="w-5 h-5 text-text-light absolute left-4 top-4" />
                <textarea
                  value={formData.custom_full_description}
                  onChange={(e) => setFormData({ ...formData, custom_full_description: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-32 resize-none"
                  placeholder="Gedetailleerde beschrijving van je dienst (wordt getoond op de detailpagina)"
                />
              </div>
            </div>

            {/* Image Selection */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Afbeelding
              </label>
              <div className="space-y-3">
                {formData.custom_image_url && (
                  <div className="relative inline-block">
                    <img 
                      src={formData.custom_image_url}
                      alt="Dienst afbeelding"
                      className="w-32 h-20 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, custom_image_url: '' })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowPhotoManager(true)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">
                    {formData.custom_image_url ? 'Afbeelding wijzigen' : 'Afbeelding selecteren'}
                  </span>
                </button>
                
                {!formData.custom_image_url && selectedService?.image_url && (
                  <p className="text-xs text-text-light">
                    Als je geen afbeelding selecteert, wordt de standaard categorie afbeelding gebruikt.
                  </p>
                )}
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                className="p-2 rounded-lg transition-colors"
              >
                {formData.is_available ? (
                  <ToggleRight className="w-10 h-10 text-green-600" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
              <div>
                <p className="font-medium text-text-primary">
                  {formData.is_available ? 'Dienst is beschikbaar' : 'Dienst is niet beschikbaar'}
                </p>
                <p className="text-sm text-text-secondary">
                  {formData.is_available 
                    ? 'Klanten kunnen deze dienst boeken na goedkeuring' 
                    : 'Klanten kunnen deze dienst niet boeken'
                  }
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Opslaan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Opslaan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Photo Manager Modal */}
      {showPhotoManager && (
        <PhotoManager
          currentImageUrl={formData.custom_image_url}
          onImageSelect={handleImageSelect}
          onClose={() => setShowPhotoManager(false)}
          searchQuery={formData.custom_name}
          title="Dienst Afbeelding Selecteren"
        />
      )}
    </div>
  );
}