import React, { useState, useEffect } from 'react';
import { 
  Euro, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Tag,
  Percent,
  Calculator,
  HelpCircle,
  Loader2,
  Package
} from 'lucide-react';
import { supabase, Service, PricingTier, ServiceCategory, appSettingsAPI, PriceUnitType } from '../../lib/supabase';
import { calculateDetailedPrices, calculateSimpleMarginPercentage } from '../../utils/priceCalculations';

interface PricingTierWithService extends PricingTier {
  service?: Service;
}

export function PricingManagement() {
  const [pricingTiers, setPricingTiers] = useState<PricingTierWithService[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingTier, setEditingTier] = useState<PricingTierWithService | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultAdminPercentage, setDefaultAdminPercentage] = useState<number>(15);
  
  // Price calculation state
  const [showPriceCalculationResults, setShowPriceCalculationResults] = useState(false);
  const [calculationResults, setCalculationResults] = useState<{
    sellingPrice: number;
    netPrice: number;
    vatAmount: number;
    adminFee: number;
    costPrice: number;
    profit: number;
    marginPercentage: number;
    adminPercentageValue: number;
    vatRateValue: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch pricing tiers with services
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing_tiers')
        .select(`
          *,
          service:services(*)
        `)
        .order('created_at', { ascending: false });

      if (pricingError) throw pricingError;

      // Fetch services
      const { data: servicesData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (serviceError) throw serviceError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch global admin percentage
      const { data: adminPercentage, error: adminError } = await appSettingsAPI.getGlobalAdminPercentage();
      
      if (adminError) {
        console.error('Error fetching admin percentage:', adminError);
      } else if (adminPercentage !== null) {
        setDefaultAdminPercentage(adminPercentage);
      }

      setPricingTiers(pricingData || []);
      setServices(servicesData || []);
      setCategories(categoriesData || []);
    } catch (err: any) {
      setError('Fout bij het laden van prijsgegevens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTier = (tier: PricingTierWithService) => {
    setEditingTier({...tier});
    setShowEditModal(true);
  };

  const handleCreateTier = () => {
    // Create a new empty tier
    setEditingTier({
      id: '',
      service_id: '',
      tier_name: '',
      price: 0,
      duration_minutes: 60,
      description: '',
      is_active: true,
      cost_price: 0,
      admin_percentage: defaultAdminPercentage,
      vat_rate: 21,
      margin_percentage: 0,
      price_unit: 'per_hour',
      created_at: '',
      updated_at: ''
    });
    setShowEditModal(true);
  };

  const handleDeleteTier = async (tierId: string, tierName: string) => {
    if (!confirm(`Weet je zeker dat je prijsoptie "${tierName}" wilt verwijderen?`)) return;

    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('pricing_tiers')
        .delete()
        .eq('id', tierId);

      if (error) throw error;

      setSuccess(`Prijsoptie "${tierName}" succesvol verwijderd! 🗑️`);
      fetchData();
    } catch (err: any) {
      setError('Fout bij het verwijderen van prijsoptie: ' + err.message);
    }
  };

  const handleCalculatePrices = () => {
    if (!editingTier) return;
    
    const price = Number(editingTier.price) || 0;
    const costPrice = Number(editingTier.cost_price) || 0;
    const vatRate = Number(editingTier.vat_rate) || 21;
    const adminPercentage = Number(editingTier.admin_percentage) || defaultAdminPercentage;
    
    const results = calculateDetailedPrices(price, costPrice, vatRate, adminPercentage);
    
    setCalculationResults(results);
    setShowPriceCalculationResults(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      // Calculate margin percentage based on price and cost price
      const price = Number(editingTier.price) || 0;
      const costPrice = Number(editingTier.cost_price) || 0;
      const vatRate = Number(editingTier.vat_rate) || 21;
      const adminPercentage = Number(editingTier.admin_percentage) || defaultAdminPercentage;
      
      const marginPercentage = calculateSimpleMarginPercentage(price, costPrice, vatRate, adminPercentage);

      const tierData = {
        tier_name: editingTier.tier_name,
        price: price,
        duration_minutes: editingTier.duration_minutes || 60,
        description: editingTier.description || '',
        is_active: editingTier.is_active,
        cost_price: costPrice,
        admin_percentage: adminPercentage,
        vat_rate: vatRate,
        margin_percentage: marginPercentage,
        price_unit: editingTier.price_unit,
        service_id: editingTier.service_id // Include service_id for both create and update
      };

      if (editingTier.id) {
        // Update existing tier
        const { error } = await supabase
          .from('pricing_tiers')
          .update(tierData)
          .eq('id', editingTier.id);

        if (error) throw error;

        setSuccess('Prijsoptie succesvol bijgewerkt! 🎉');
      } else {
        // Create new tier
        const { error } = await supabase
          .from('pricing_tiers')
          .insert(tierData);

        if (error) throw error;

        setSuccess('Nieuwe prijsoptie succesvol aangemaakt! 🎉');
      }

      fetchData();
      setShowEditModal(false);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate max allowed custom price whenever selected tier changes
  const calculateMaxAllowedCustomPrice = () => {
    if (!editingTier || !editingTier.service_id) return null;
    
    // For now, we don't have a max price restriction
    return null;
  };

  // Filter pricing tiers based on search and category
  const filteredPricingTiers = pricingTiers.filter(tier => {
    const matchesSearch = 
      (tier.tier_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (tier.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (tier.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesCategory = selectedCategory === 'all' || tier.service?.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get formatted price unit label
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-accent-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">Prijzenbeheer</h3>
          <p className="text-gray-600">Beheer alle prijzen en tarieven voor diensten</p>
        </div>
        <button
          onClick={handleCreateTier}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nieuwe Prijsoptie</span>
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

      {/* Pricing Model Explanation */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Euro className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="text-base font-semibold text-blue-800">Prijsmodel Uitleg</h4>
        </div>
        
        <p className="text-sm text-blue-700 mb-4">Het prijsmodel werkt als volgt:</p>
        
        <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5 mb-4">
          <li><strong>Prijs Professional:</strong> Het bedrag dat de professional ontvangt</li>
          <li><strong>Commissie percentage:</strong> Percentage dat Care & Service rekent voor het platform</li>
          <li><strong>BTW percentage:</strong> BTW percentage dat over de verkoopprijs wordt gerekend</li>
          <li><strong>Verkoopprijs:</strong> De prijs die de klant betaalt (inclusief BTW)</li>
          <li><strong>Winstmarge:</strong> Wordt berekend als (Winst / Prijs Professional) * 100</li>
          <li><strong>Prijseenheid:</strong> De eenheid waarin de prijs wordt uitgedrukt (per uur, per dag, etc.)</li>
        </ul>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-800 mb-2 flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>Berekening</span>
            </h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Commissie</strong> = Prijs Professional * (Commissie%/100)</li>
              <li><strong>Netto prijs</strong> = Prijs Professional + Commissie</li>
              <li><strong>BTW bedrag</strong> = Netto prijs * (BTW%/100)</li>
              <li><strong>Verkoopprijs</strong> = Netto prijs + BTW bedrag</li>
              <li><strong>Winst</strong> = Commissie</li>
              <li><strong>Winstmarge</strong> = (Winst / Prijs Professional) * 100</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-800 mb-2 flex items-center space-x-2">
              <HelpCircle className="w-4 h-4" />
              <span>Voorbeeld</span>
            </h5>
            <p className="text-sm text-blue-700 mb-2">
              Bij een prijs van €70 (wat de professional ontvangt), commissie percentage van 15% en BTW van 21%:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Commissie</strong> = €70 * 0.15 = €10.50</li>
              <li><strong>Netto prijs</strong> = €70 + €10.50 = €80.50</li>
              <li><strong>BTW bedrag</strong> = €80.50 * 0.21 = €16.91</li>
              <li><strong>Verkoopprijs</strong> = €80.50 + €16.91 = €97.41</li>
              <li><strong>Winst</strong> = €10.50</li>
              <li><strong>Winstmarge</strong> = (€10.50 / €70) * 100 = 15%</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Zoek prijsopties..."
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Alle categorieën</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dienst</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijsoptie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRIJS PROFESSIONAL (€)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verkoopprijs (€)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eenheid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commissie %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BTW %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winstmarge</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPricingTiers.length > 0 ? (
                filteredPricingTiers.map((tier) => {
                  // Calculate detailed prices for display
                  const costPrice = Number(tier.price) || 0;
                  const vatRate = Number(tier.vat_rate) || 21;
                  const adminPercentage = Number(tier.admin_percentage) || defaultAdminPercentage;
                  
                  const { sellingPrice, marginPercentage } = calculateDetailedPrices(
                    costPrice, 
                    0, 
                    vatRate, 
                    adminPercentage
                  );
                  
                  return (
                    <tr key={tier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{tier.service?.name}</div>
                            <div className="text-xs text-gray-500">
                              {categories.find(c => c.id === tier.service?.category_id)?.name || 'Geen categorie'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tier.tier_name}</div>
                        <div className="text-xs text-gray-500">{tier.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">€{costPrice.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-600">€{sellingPrice.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getPriceUnitLabel(tier.price_unit)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tier.duration_minutes} min</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{adminPercentage.toFixed(2)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vatRate.toFixed(2)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{marginPercentage.toFixed(2)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditTier(tier)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTier(tier.id, tier.tier_name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    Geen prijsopties gevonden. Maak een nieuwe prijsoptie aan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingTier.id ? 'Prijsoptie Bewerken' : 'Nieuwe Prijsoptie'}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Selection - for both new and existing tiers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dienst *
                  </label>
                  <select
                    required
                    value={editingTier.service_id}
                    onChange={(e) => setEditingTier({...editingTier, service_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecteer een dienst</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Naam *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTier.tier_name}
                      onChange={(e) => setEditingTier({...editingTier, tier_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Bijv. Standaard, Premium, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschrijving
                    </label>
                    <input
                      type="text"
                      value={editingTier.description || ''}
                      onChange={(e) => setEditingTier({...editingTier, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Bijv. Per uur, Per sessie, etc."
                    />
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prijs Professional (€) *
                    </label>
                    <div className="relative">
                      <Euro className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingTier.price}
                        onChange={(e) => setEditingTier({...editingTier, price: parseFloat(e.target.value) || 0})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Dit is het bedrag dat de professional ontvangt
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duur (minuten)
                    </label>
                    <div className="relative">
                      <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        value={editingTier.duration_minutes || 60}
                        onChange={(e) => setEditingTier({...editingTier, duration_minutes: parseInt(e.target.value) || 60})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prijseenheid *
                    </label>
                    <select
                      required
                      value={editingTier.price_unit}
                      onChange={(e) => setEditingTier({...editingTier, price_unit: e.target.value as PriceUnitType})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="per_hour">Per uur</option>
                      <option value="per_day">Per dag</option>
                      <option value="per_service">Per service</option>
                      <option value="per_km">Per kilometer</option>
                      <option value="per_item">Per stuk</option>
                      <option value="per_month">Per maand</option>
                      <option value="per_week">Per week</option>
                    </select>
                  </div>
                </div>

                {/* Tax and Fees */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BTW percentage (%)
                    </label>
                    <div className="relative">
                      <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        value={editingTier.vat_rate || 21}
                        onChange={(e) => setEditingTier({...editingTier, vat_rate: parseFloat(e.target.value) || 21})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="21"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commissie percentage (%)
                    </label>
                    <div className="relative">
                      <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        value={editingTier.admin_percentage || defaultAdminPercentage}
                        onChange={(e) => setEditingTier({...editingTier, admin_percentage: parseFloat(e.target.value) || defaultAdminPercentage})}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder={defaultAdminPercentage.toString()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Winstmarge (%)
                    </label>
                    <div className="relative">
                      <Calculator className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        value={
                          editingTier.price && Number(editingTier.price) > 0
                            ? calculateSimpleMarginPercentage(
                                Number(editingTier.price) || 0,
                                0,
                                Number(editingTier.vat_rate) || 21,
                                Number(editingTier.admin_percentage) || defaultAdminPercentage
                              ).toFixed(2)
                            : 0
                        }
                        className="w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                        placeholder="Automatisch berekend"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Wordt automatisch berekend op basis van prijs professional en commissie percentage
                    </p>
                  </div>
                </div>

                {/* Calculate Prices Button */}
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

                {/* Price Calculation Results */}
                {showPriceCalculationResults && calculationResults && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-base font-semibold text-green-800 mb-3 flex items-center space-x-2">
                      <Calculator className="w-4 h-4" />
                      <span>Prijsberekening Resultaat</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-green-800">Prijs Professional:</p>
                        <p className="text-lg font-bold text-green-700">€{calculationResults.costPrice.toFixed(2)}</p>
                        <p className="text-xs text-green-600">Wat de professional ontvangt</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Commissie:</p>
                        <p className="text-lg font-bold text-green-700">€{calculationResults.adminFee.toFixed(2)}</p>
                        <p className="text-xs text-green-600">Platform commissie</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Netto prijs:</p>
                        <p className="text-lg font-bold text-green-700">€{calculationResults.netPrice.toFixed(2)}</p>
                        <p className="text-xs text-green-600">Prijs Professional + Commissie</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">BTW bedrag:</p>
                        <p className="text-lg font-bold text-green-700">€{calculationResults.vatAmount.toFixed(2)}</p>
                        <p className="text-xs text-green-600">BTW over netto prijs</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-green-200 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-green-800">Verkoopprijs (incl. BTW):</p>
                          <p className="text-xl font-bold text-green-700">€{calculationResults.sellingPrice.toFixed(2)}</p>
                          <p className="text-xs text-green-600">Wat de klant betaalt</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-800">Winstmarge:</p>
                          <p className="text-xl font-bold text-green-700">{calculationResults.marginPercentage.toFixed(2)}%</p>
                          <p className="text-xs text-green-600">Commissie% t.o.v. prijs professional</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingTier.is_active}
                    onChange={(e) => setEditingTier({...editingTier, is_active: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Actief
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Opslaan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Opslaan</span>
                      </>
                    )}
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