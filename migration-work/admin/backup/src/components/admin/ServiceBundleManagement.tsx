import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Tag,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  Euro,
  Percent,
  Hash,
  FileText,
  Calculator,
  HelpCircle
} from 'lucide-react';
import { supabase, ServiceBundle, BundleService, Service, PriceUnitType } from '../../lib/supabase';
import { getPriceUnitLabel } from '../../utils/bookingPriceCalculator';
import { calculateDetailedPrices } from '../../utils/priceCalculations';

interface ServiceBundleManagementProps {}

export function ServiceBundleManagement({}: ServiceBundleManagementProps) {
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState<ServiceBundle | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Partial<ServiceBundle>>({
    name: '',
    description: '',
    price: 0,
    discount_percentage: 0,
    admin_percentage: 15,
    is_active: true,
    sort_order: 0,
    price_unit: 'per_service' as PriceUnitType
  });
  
  // Bundle services state
  const [bundleServices, setBundleServices] = useState<(Partial<BundleService> & { 
    service_name?: string;
    service_cost_price?: number;
  })[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedServicePrice, setSelectedServicePrice] = useState<number>(0);
  const [selectedServiceCostPrice, setSelectedServiceCostPrice] = useState<number>(0);
  const [selectedServiceDiscount, setSelectedServiceDiscount] = useState<number>(0);

  // Price calculation state
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [calculationResults, setCalculationResults] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch bundles with their services
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('service_bundles')
        .select(`
          *,
          services:bundle_services(
            *,
            service:services(*, pricing_tiers(*))
          )
        `)
        .order('sort_order', { ascending: true });

      if (bundlesError) throw bundlesError;

      // Fetch available services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*, pricing_tiers(*)')
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;

      setBundles(bundlesData || []);
      setServices(servicesData || []);
    } catch (err: any) {
      setError('Fout bij het laden van bundels: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (mode: 'create' | 'edit' | 'view', bundle?: ServiceBundle) => {
    setFormMode(mode);
    setEditingBundle(bundle || null);
    
    if (bundle) {
      setFormData({
        name: bundle.name,
        description: bundle.description || '',
        price: bundle.price,
        discount_percentage: bundle.discount_percentage || 0,
        admin_percentage: bundle.admin_percentage || 15,
        is_active: bundle.is_active,
        sort_order: bundle.sort_order || 0,
        price_unit: bundle.price_unit || 'per_service'
      });
      
      // Set bundle services
      if (bundle.services) {
        const formattedServices = bundle.services.map(bs => {
          // Find the service to get its cost price from pricing tiers
          const service = bs.service;
          let serviceCostPrice = 0;
          
          if (service && service.pricing_tiers && service.pricing_tiers.length > 0) {
            // Get the cost price from the first pricing tier
            serviceCostPrice = service.pricing_tiers[0].cost_price || 0;
          }
          
          return {
            id: bs.id,
            bundle_id: bs.bundle_id,
            service_id: bs.service_id,
            custom_price: bs.custom_price,
            discount_percentage: bs.discount_percentage,
            service_name: bs.service?.name,
            service_cost_price: serviceCostPrice
          };
        });
        setBundleServices(formattedServices);
      } else {
        setBundleServices([]);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        discount_percentage: 0,
        admin_percentage: 15,
        is_active: true,
        sort_order: bundles.length,
        price_unit: 'per_service'
      });
      setBundleServices([]);
    }
    
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBundle(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      discount_percentage: 0,
      admin_percentage: 15,
      is_active: true,
      sort_order: 0,
      price_unit: 'per_service'
    });
    setBundleServices([]);
    setSelectedServiceId('');
    setSelectedServicePrice(0);
    setSelectedServiceCostPrice(0);
    setSelectedServiceDiscount(0);
    setShowCalculationDetails(false);
    setCalculationResults(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'view') return;

    setError('');
    setSuccess('');

    try {
      // Validate bundle services
      if (bundleServices.length === 0) {
        throw new Error('Voeg minimaal één dienst toe aan de bundel');
      }

      let bundleId: string;

      if (formMode === 'create') {
        // Create new bundle
        const { data: newBundle, error: createError } = await supabase
          .from('service_bundles')
          .insert([formData])
          .select()
          .single();

        if (createError) throw createError;
        if (!newBundle) throw new Error('Fout bij het aanmaken van bundel');
        
        bundleId = newBundle.id;
        setSuccess('Bundel succesvol aangemaakt! 🎉');
      } else {
        // Update existing bundle
        const { error: updateError } = await supabase
          .from('service_bundles')
          .update(formData)
          .eq('id', editingBundle!.id);

        if (updateError) throw updateError;
        
        bundleId = editingBundle!.id;
        setSuccess('Bundel succesvol bijgewerkt! 🎉');
      }

      // Handle bundle services
      if (formMode === 'edit') {
        // Delete existing bundle services
        const { error: deleteError } = await supabase
          .from('bundle_services')
          .delete()
          .eq('bundle_id', bundleId);

        if (deleteError) throw deleteError;
      }

      // Insert new bundle services
      const bundleServicesToInsert = bundleServices.map(bs => ({
        bundle_id: bundleId,
        service_id: bs.service_id,
        custom_price: bs.custom_price,
        discount_percentage: bs.discount_percentage
      }));

      const { error: insertError } = await supabase
        .from('bundle_services')
        .insert(bundleServicesToInsert);

      if (insertError) throw insertError;

      fetchData();
      setTimeout(() => {
        closeForm();
      }, 1500);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    }
  };

  const toggleBundleStatus = async (bundleId: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('service_bundles')
        .update({ is_active: !currentStatus })
        .eq('id', bundleId);

      if (error) throw error;

      setSuccess(`Bundel ${!currentStatus ? 'geactiveerd' : 'gedeactiveerd'}! 🎉`);
      fetchData();
    } catch (err: any) {
      setError('Fout bij het wijzigen van status: ' + err.message);
    }
  };

  const deleteBundle = async (bundleId: string, bundleName: string) => {
    if (!confirm(`Weet je zeker dat je "${bundleName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      // First check if there are any bookings using this bundle
      const { data: bookings, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('bundle_id', bundleId);

      if (checkError) throw checkError;

      if (bookings && bookings.length > 0) {
        throw new Error(`Deze bundel kan niet worden verwijderd omdat er ${bookings.length} boekingen aan gekoppeld zijn.`);
      }

      // Delete bundle services first
      const { error: deleteServicesError } = await supabase
        .from('bundle_services')
        .delete()
        .eq('bundle_id', bundleId);

      if (deleteServicesError) throw deleteServicesError;

      // Then delete the bundle
      const { error } = await supabase
        .from('service_bundles')
        .delete()
        .eq('id', bundleId);

      if (error) throw error;

      setSuccess(`Bundel "${bundleName}" succesvol verwijderd! 🗑️`);
      fetchData();
    } catch (err: any) {
      setError('Fout bij het verwijderen van bundel: ' + err.message);
    }
  };

  const addServiceToBundle = () => {
    if (!selectedServiceId) return;
    
    // Check if service is already in bundle
    const existingService = bundleServices.find(bs => bs.service_id === selectedServiceId);
    if (existingService) {
      setError('Deze dienst is al toegevoegd aan de bundel');
      return;
    }
    
    // Find service details
    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;
    
    // Get default price and cost price from service pricing tiers if available
    let defaultPrice = selectedServicePrice;
    let costPrice = selectedServiceCostPrice;
    
    if (service.pricing_tiers && service.pricing_tiers.length > 0) {
      const pricingTier = service.pricing_tiers[0];
      defaultPrice = pricingTier.price;
      costPrice = pricingTier.cost_price || 0;
    }
    
    // Add service to bundle
    setBundleServices([
      ...bundleServices,
      {
        service_id: selectedServiceId,
        custom_price: defaultPrice,
        discount_percentage: selectedServiceDiscount,
        service_name: service.name,
        service_cost_price: costPrice
      }
    ]);
    
    // Reset selection
    setSelectedServiceId('');
    setSelectedServicePrice(0);
    setSelectedServiceCostPrice(0);
    setSelectedServiceDiscount(0);
  };

  const removeServiceFromBundle = (index: number) => {
    const updatedServices = [...bundleServices];
    updatedServices.splice(index, 1);
    setBundleServices(updatedServices);
  };

  const updateBundleService = (index: number, field: string, value: any) => {
    const updatedServices = [...bundleServices];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setBundleServices(updatedServices);
  };

  const moveServiceInBundle = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updatedServices = [...bundleServices];
      [updatedServices[index], updatedServices[index - 1]] = [updatedServices[index - 1], updatedServices[index]];
      setBundleServices(updatedServices);
    } else if (direction === 'down' && index < bundleServices.length - 1) {
      const updatedServices = [...bundleServices];
      [updatedServices[index], updatedServices[index + 1]] = [updatedServices[index + 1], updatedServices[index]];
      setBundleServices(updatedServices);
    }
  };

  // Calculate total regular price (sum of all services)
  const calculateRegularPrice = (): number => {
    return bundleServices.reduce((total, bs) => total + (bs.custom_price || 0), 0);
  };

  // Calculate total cost price (sum of all service cost prices)
  const calculateTotalCostPrice = (): number => {
    return bundleServices.reduce((total, bs) => total + (bs.service_cost_price || 0), 0);
  };

  // Calculate bundle discount amount
  const calculateDiscountAmount = (): number => {
    const regularPrice = calculateRegularPrice();
    return (regularPrice * (formData.discount_percentage || 0)) / 100;
  };

  // Calculate final bundle price
  const calculateBundlePrice = (): number => {
    const regularPrice = calculateRegularPrice();
    const discountAmount = calculateDiscountAmount();
    return regularPrice - discountAmount;
  };

  // Calculate price details
  const handleCalculatePrices = () => {
    if (!formData.price) return;
    
    const price = Number(formData.price) || 0;
    const costPrice = calculateTotalCostPrice(); // Use the total of service cost prices
    const vatRate = 21; // Default VAT rate
    const adminPercentage = Number(formData.admin_percentage) || 15;
    
    const results = calculateDetailedPrices(price, costPrice, vatRate, adminPercentage);
    
    setCalculationResults(results);
    setShowCalculationDetails(true);
  };

  // Update bundle price based on services
  useEffect(() => {
    if (formMode !== 'view') {
      const calculatedPrice = calculateBundlePrice();
      setFormData(prev => ({ ...prev, price: calculatedPrice }));
    }
  }, [bundleServices, formData.discount_percentage]);

  const filteredBundles = bundles.filter(bundle =>
    bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bundle.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isReadOnly = formMode === 'view';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Servicebundels</h2>
          <p className="text-text-secondary">Beheer alle servicebundels en hun eigenschappen</p>
        </div>
        <button
          onClick={() => openForm('create')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nieuwe Bundel</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Zoek bundels..."
        />
      </div>

      {/* Bundles Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
        </div>
      ) : filteredBundles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.map((bundle) => {
            const regularPrice = calculateRegularPrice();
            const savings = calculateDiscountAmount();
            const savingsPercentage = regularPrice > 0 ? (savings / regularPrice) * 100 : 0;
            
            return (
              <div key={bundle.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Bundle Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{bundle.name}</h3>
                        <span className="text-xs text-gray-500">Volgorde: {bundle.sort_order}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
                  </div>
                </div>
                
                {/* Bundle Details */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Prijs:</span>
                    <span className="font-semibold text-primary-600">
                      €{bundle.price.toFixed(2)} {getPriceUnitLabel(bundle.price_unit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Korting:</span>
                    <span className="font-semibold text-green-600">{bundle.discount_percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Admin %:</span>
                    <span className="font-semibold">{bundle.admin_percentage}%</span>
                  </div>
                </div>

                {/* Included Services */}
                <div className="p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Inbegrepen Diensten:</h4>
                  <ul className="space-y-1">
                    {bundle.services && bundle.services.length > 0 ? (
                      bundle.services.slice(0, 3).map((bs) => (
                        <li key={bs.id} className="text-xs text-gray-600 flex items-start space-x-2">
                          <Tag className="w-3 h-3 text-primary-500 mt-0.5 flex-shrink-0" />
                          <span>{bs.service?.name}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-gray-500 italic">Geen diensten gedefinieerd</li>
                    )}
                    {bundle.services && bundle.services.length > 3 && (
                      <li className="text-xs text-primary-600">+{bundle.services.length - 3} meer...</li>
                    )}
                  </ul>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${bundle.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {bundle.is_active ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {new Date(bundle.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openForm('view', bundle)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Bekijken"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openForm('edit', bundle)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Bewerken"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBundle(bundle.id, bundle.name)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => toggleBundleStatus(bundle.id, bundle.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      bundle.is_active 
                        ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                        : 'text-red-600 bg-red-50 hover:bg-red-100'
                    }`}
                    title={bundle.is_active ? 'Deactiveren' : 'Activeren'}
                  >
                    {bundle.is_active ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {bundles.length === 0 ? 'Geen bundels gevonden' : 'Geen bundels gevonden met huidige filters'}
          </h3>
          <p className="text-gray-600">
            {bundles.length === 0 
              ? 'Voeg je eerste bundel toe om te beginnen'
              : 'Probeer je zoekfilters aan te passen'
            }
          </p>
          {bundles.length === 0 && (
            <button 
              onClick={() => openForm('create')}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Eerste bundel toevoegen
            </button>
          )}
        </div>
      )}

      {/* Bundle Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formMode === 'create' && 'Nieuwe Servicebundel'}
                      {formMode === 'edit' && 'Servicebundel Bewerken'}
                      {formMode === 'view' && 'Servicebundel Bekijken'}
                    </h2>
                    <p className="text-gray-600">
                      {formMode === 'create' && 'Voeg een nieuwe servicebundel toe'}
                      {formMode === 'edit' && 'Wijzig de servicebundel eigenschappen'}
                      {formMode === 'view' && 'Bekijk alle servicebundel informatie'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeForm}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Bundel Naam *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="Bijvoorbeeld: Verhuispakket"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Beschrijving
                      </label>
                      <textarea
                        disabled={isReadOnly}
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none disabled:opacity-60"
                        placeholder="Beschrijving van de servicebundel..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Korting (%)
                        </label>
                        <div className="relative">
                          <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="number"
                            step="0.01"
                            disabled={isReadOnly}
                            value={formData.discount_percentage || 0}
                            onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Admin Percentage (%)
                        </label>
                        <div className="relative">
                          <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="number"
                            step="0.01"
                            disabled={isReadOnly}
                            value={formData.admin_percentage || 15}
                            onChange={(e) => setFormData({ ...formData, admin_percentage: parseFloat(e.target.value) || 15 })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                            placeholder="15"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Sorteervolgorde
                        </label>
                        <div className="relative">
                          <Hash className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="number"
                            disabled={isReadOnly}
                            value={formData.sort_order || 0}
                            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Prijseenheid
                        </label>
                        <select
                          disabled={isReadOnly}
                          value={formData.price_unit}
                          onChange={(e) => setFormData({ ...formData, price_unit: e.target.value as PriceUnitType })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        >
                          <option value="per_service">Per service</option>
                          <option value="per_hour">Per uur</option>
                          <option value="per_day">Per dag</option>
                          <option value="per_week">Per week</option>
                          <option value="per_month">Per maand</option>
                          <option value="per_km">Per kilometer</option>
                          <option value="per_item">Per stuk</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Bundel Prijs (€)
                      </label>
                      <div className="relative">
                        <Euro className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.01"
                          required
                          disabled={isReadOnly}
                          value={formData.price || 0}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Dit is de prijs {getPriceUnitLabel(formData.price_unit || 'per_service')}
                      </p>
                    </div>

                    {/* Calculate Prices Button */}
                    {!isReadOnly && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={handleCalculatePrices}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                        >
                          <Calculator className="h-4 w-4" />
                          <span>Prijzen Berekenen</span>
                        </button>
                      </div>
                    )}

                    {/* Price Calculation Results */}
                    {showCalculationDetails && calculationResults && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-base font-semibold text-green-800 mb-3 flex items-center space-x-2">
                          <Calculator className="w-4 h-4" />
                          <span>Prijsberekening Resultaat</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-green-800">Verkoopprijs:</p>
                            <p className="text-lg font-bold text-green-700">€{calculationResults.sellingPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">Netto prijs:</p>
                            <p className="text-lg font-bold text-green-700">€{calculationResults.netPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">BTW bedrag:</p>
                            <p className="text-lg font-bold text-green-700">€{calculationResults.vatAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">Admin fee:</p>
                            <p className="text-lg font-bold text-green-700">€{calculationResults.adminFee.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium text-green-800">Kostprijs:</p>
                            <p className="text-lg font-bold text-green-700">€{calculationResults.costPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">Winst:</p>
                            <p className="text-lg font-bold text-green-700">€{calculationResults.profit.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">Winstmarge:</p>
                            <p className="text-lg font-bold text-green-700">{calculationResults.marginPercentage.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">Admin %:</p>
                            <p className="text-lg font-bold text-green-700">{calculationResults.adminPercentageValue.toFixed(2)}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        className={`p-2 rounded-lg transition-colors ${
                          formData.is_active 
                            ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                            : 'text-red-600 bg-red-50 hover:bg-red-100'
                        } disabled:opacity-60`}
                      >
                        {formData.is_active ? (
                          <ToggleRight className="w-6 h-6" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-gray-900">
                        Bundel is {formData.is_active ? 'actief' : 'inactief'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Diensten in Bundel</h3>
                    
                    {!isReadOnly && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Dienst Toevoegen
                          </label>
                          <select
                            value={selectedServiceId}
                            onChange={(e) => {
                              setSelectedServiceId(e.target.value);
                              // Set default price and cost price from service pricing tiers
                              const service = services.find(s => s.id === e.target.value);
                              if (service && service.pricing_tiers && service.pricing_tiers.length > 0) {
                                const pricingTier = service.pricing_tiers[0];
                                setSelectedServicePrice(pricingTier.price);
                                setSelectedServiceCostPrice(pricingTier.cost_price || 0);
                              } else {
                                setSelectedServicePrice(0);
                                setSelectedServiceCostPrice(0);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Selecteer een dienst</option>
                            {services.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Prijs (€)
                            </label>
                            <div className="relative">
                              <Euro className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                              <input
                                type="number"
                                step="0.01"
                                value={selectedServicePrice}
                                onChange={(e) => setSelectedServicePrice(parseFloat(e.target.value) || 0)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Korting (%)
                            </label>
                            <div className="relative">
                              <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                              <input
                                type="number"
                                step="0.01"
                                value={selectedServiceDiscount}
                                onChange={(e) => setSelectedServiceDiscount(parseFloat(e.target.value) || 0)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={addServiceToBundle}
                          disabled={!selectedServiceId}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Dienst Toevoegen</span>
                        </button>
                      </div>
                    )}

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Geselecteerde Diensten</h4>
                      {bundleServices.length > 0 ? (
                        <div className="space-y-3">
                          {bundleServices.map((bs, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{bs.service_name}</div>
                                  <div className="flex items-center space-x-4 text-sm">
                                    <div className="text-gray-600">
                                      Prijs: €{bs.custom_price?.toFixed(2)}
                                    </div>
                                    {bs.service_cost_price !== undefined && (
                                      <div className="text-gray-600">
                                        Kostprijs: €{bs.service_cost_price.toFixed(2)}
                                      </div>
                                    )}
                                    {bs.discount_percentage && bs.discount_percentage > 0 && (
                                      <div className="text-green-600">
                                        Korting: {bs.discount_percentage}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {!isReadOnly && (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => moveServiceInBundle(index, 'up')}
                                      disabled={index === 0}
                                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveServiceInBundle(index, 'down')}
                                      disabled={index === bundleServices.length - 1}
                                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeServiceFromBundle(index)}
                                      className="p-1 text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-500">Geen diensten toegevoegd</p>
                        </div>
                      )}
                    </div>

                    {/* Price Summary */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-3">Prijsoverzicht</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Totale waarde van diensten:</span>
                          <span className="font-medium">€{calculateRegularPrice().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Totale kostprijs van diensten:</span>
                          <span className="font-medium">€{calculateTotalCostPrice().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Bundel prijs:</span>
                          <span className="font-medium">€{formData.price?.toFixed(2) || '0.00'} {getPriceUnitLabel(formData.price_unit || 'per_service')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Bundel korting ({formData.discount_percentage}%):</span>
                          <span className="font-medium text-green-600">-€{calculateDiscountAmount().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Model Explanation */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4" />
                        <span>Prijsmodel Uitleg</span>
                      </h4>
                      <p className="text-xs text-yellow-700 mb-2">
                        Het prijsmodel werkt als volgt:
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1 list-disc pl-5">
                        <li><strong>Verkoopprijs:</strong> De prijs die de klant betaalt (inclusief BTW)</li>
                        <li><strong>Kostprijs:</strong> De som van de kostprijzen van de individuele diensten</li>
                        <li><strong>Admin percentage:</strong> Percentage dat Care & Service rekent voor administratie</li>
                        <li><strong>Prijseenheid:</strong> Bepaalt hoe de prijs wordt berekend (per uur, per dag, etc.)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isReadOnly && (
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>
                        {formMode === 'create' ? 'Bundel Aanmaken' : 'Wijzigingen Opslaan'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md font-medium transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                )}

                {isReadOnly && (
                  <div className="flex justify-end pt-6">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
                    >
                      Sluiten
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}