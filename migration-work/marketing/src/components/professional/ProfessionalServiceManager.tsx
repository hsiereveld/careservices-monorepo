import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Tag,
  Euro,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { supabase, ServiceProvider, ProviderService, Service, PriceUnitType } from '../../lib/supabase';
import { ProfessionalServiceForm } from './ProfessionalServiceForm';

interface ProfessionalServiceManagerProps {
  providerId: string;
  onServiceUpdated?: () => void;
}

export function ProfessionalServiceManager({ providerId, onServiceUpdated }: ProfessionalServiceManagerProps) {
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<ProviderService | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (providerId) {
      fetchData();
    }
  }, [providerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch provider services with service details
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select(`
          *,
          service:services(*, category:service_categories(*))
        `)
        .eq('provider_id', providerId);

      if (servicesError) throw servicesError;

      // Fetch available service categories for filtering
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch all available services for adding new ones
      const { data: availableServicesData, error: availableServicesError } = await supabase
        .from('services')
        .select('*, category:service_categories(name)')
        .eq('is_active', true)
        .order('name');

      if (availableServicesError) throw availableServicesError;

      setProviderServices(servicesData || []);
      setCategories(categoriesData || []);
      setAvailableServices(availableServicesData || []);
    } catch (err: any) {
      setError('Fout bij het laden van diensten: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setShowServiceForm(true);
  };

  const handleEditService = (service: ProviderService) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Weet je zeker dat je deze dienst wilt verwijderen?')) return;

    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      setSuccess('Dienst succesvol verwijderd!');
      fetchData();
      if (onServiceUpdated) onServiceUpdated();
    } catch (err: any) {
      setError('Fout bij het verwijderen van dienst: ' + err.message);
    }
  };

  const handleToggleServiceAvailability = async (serviceId: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('provider_services')
        .update({ is_available: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      setSuccess(`Dienst ${!currentStatus ? 'beschikbaar' : 'onbeschikbaar'} gemaakt!`);
      fetchData();
      if (onServiceUpdated) onServiceUpdated();
    } catch (err: any) {
      setError('Fout bij het wijzigen van beschikbaarheid: ' + err.message);
    }
  };

  const handleServiceFormClose = () => {
    setShowServiceForm(false);
    setEditingService(null);
  };

  const handleServiceFormSave = () => {
    fetchData();
    setShowServiceForm(false);
    setEditingService(null);
    if (onServiceUpdated) onServiceUpdated();
  };

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

  // Filter services based on search and category
  const filteredServices = providerServices.filter(service => {
    const serviceName = service.custom_name || service.service?.name || '';
    const serviceDescription = service.custom_short_description || service.service?.short_description || '';
    const categoryId = service.service?.category_id || '';
    
    const matchesSearch = 
      serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || categoryId === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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
          <h3 className="text-2xl font-bold text-text-primary">Mijn Diensten</h3>
          <p className="text-text-secondary">Beheer de diensten die je aanbiedt</p>
        </div>
        <button
          onClick={handleAddService}
          className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe Dienst</span>
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

      {/* Search and Filter */}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
            >
              <option value="all">Alle categorieën</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              {/* Service Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">
                    {service.custom_name || service.service?.name}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Categorie: {service.service?.category?.name || 'Onbekend'}
                  </p>
                </div>
              </div>
              
              {/* Service Description */}
              <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                {service.custom_short_description || service.service?.short_description}
              </p>
              
              {/* Service Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  <Euro className="w-4 h-4 text-text-light" />
                  <span className="text-sm font-medium">
                    €{service.custom_price || 0} 
                    <span className="text-text-light ml-1">
                      {getPriceUnitLabel(service.custom_price_unit || 'per_hour')}
                    </span>
                  </span>
                </div>
                
                {(service.custom_duration_minutes || service.service?.pricing_tiers?.[0]?.duration_minutes) && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-text-light" />
                    <span className="text-sm">
                      {service.custom_duration_minutes || service.service?.pricing_tiers?.[0]?.duration_minutes} minuten
                    </span>
                  </div>
                )}
                
                {(service.custom_target_audience || service.service?.target_audience) && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-text-light" />
                    <span className="text-sm">
                      {service.custom_target_audience || service.service?.target_audience}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleServiceAvailability(service.id, service.is_available)}
                    className="p-2 rounded-lg transition-colors"
                    title={service.is_available ? 'Beschikbaar' : 'Niet beschikbaar'}
                  >
                    {service.is_available ? (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                  <span className="text-sm text-text-secondary">
                    {service.is_available ? 'Beschikbaar' : 'Niet beschikbaar'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditService(service)}
                    className="text-accent-600 hover:text-accent-700 p-2 hover:bg-accent-50 rounded-lg transition-colors"
                    title="Bewerken"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {providerServices.length === 0 ? 'Geen diensten gevonden' : 'Geen diensten gevonden met huidige filters'}
          </h3>
          <p className="text-text-secondary mb-6">
            {providerServices.length === 0 
              ? 'Je biedt nog geen diensten aan. Voeg je eerste dienst toe om te beginnen.'
              : 'Probeer je zoekfilters aan te passen of voeg een nieuwe dienst toe.'
            }
          </p>
          {providerServices.length === 0 && (
            <button 
              onClick={handleAddService}
              className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Eerste dienst toevoegen</span>
            </button>
          )}
        </div>
      )}

      {/* Service Form Modal */}
      {showServiceForm && (
        <ProfessionalServiceForm
          providerId={providerId}
          providerService={editingService}
          availableServices={availableServices}
          onClose={handleServiceFormClose}
          onSave={handleServiceFormSave}
        />
      )}
    </div>
  );
}