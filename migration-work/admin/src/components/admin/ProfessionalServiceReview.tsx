import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Tag, 
  Eye, 
  Edit, 
  Save, 
  X, 
  Loader2, 
  User, 
  FileText, 
  Euro, 
  Image as ImageIcon,
  Check,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  Info,
  Percent
} from 'lucide-react';
import { supabase, ProviderService, Service, ServiceCategory } from '../../lib/supabase';

export function ProfessionalServiceReview() {
  const [services, setServices] = useState<ProviderService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('pending_review');
  const [selectedService, setSelectedService] = useState<ProviderService | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryCommissionRate, setCategoryCommissionRate] = useState<number | null>(null);
  const [approvedCommissionRate, setApprovedCommissionRate] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch provider services with service and provider data (without profiles)
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select(`
          *,
          service:services(*,category:service_categories(*)),
          provider:service_providers(*)
        `)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      // Extract unique user_ids from providers
      const userIds = [...new Set(
        servicesData
          ?.map(service => service.provider?.user_id)
          .filter(Boolean) || []
      )];

      // Fetch profiles for these user_ids
      let profilesData = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, created_at');

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Manually attach profile data to provider objects
      const servicesWithProfiles = servicesData?.map(service => {
        if (service.provider?.user_id) {
          const profile = profilesData.find(p => p.id === service.provider.user_id);
          return {
            ...service,
            provider: {
              ...service.provider,
              user_id: profile || null
            }
          };
        }
        return service;
      }) || [];

      // Fetch categories for the dropdown
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;

      setServices(servicesWithProfiles);
      setCategories(categoriesData || []);
    } catch (err: any) {
      setError('Fout bij het laden van diensten: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (service: ProviderService) => {
    setSelectedService(service);
    setReviewNotes(service.review_notes || '');
    setSelectedCategoryId(service.display_category_id || service.service?.category_id || '');
    setApprovedCommissionRate(service.commission_rate_override);
    
    // Fetch the category commission rate
    if (service.service?.category_id) {
      fetchCategoryCommissionRate(service.service.category_id);
    }
    
    setShowReviewModal(true);
  };

  const fetchCategoryCommissionRate = async (categoryId: string) => {
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

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedService(null);
    setReviewNotes('');
    setSelectedCategoryId('');
    setApprovedCommissionRate(null);
    setCategoryCommissionRate(null);
  };

  const handleApprove = async () => {
    if (!selectedService) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const { error } = await supabase
        .from('provider_services')
        .update({
          review_status: 'approved',
          review_notes: reviewNotes,
          display_category_id: selectedCategoryId || null,
          commission_rate_override: approvedCommissionRate,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedService.id);
        
      if (error) throw error;
      
      setSuccess(`Dienst "${selectedService.custom_name || selectedService.service?.name}" goedgekeurd!`);
      fetchData();
      setTimeout(() => {
        closeReviewModal();
      }, 1500);
    } catch (err: any) {
      setError('Fout bij het goedkeuren: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedService) return;
    
    if (!reviewNotes.trim()) {
      setError('Voeg een reden toe voor afwijzing');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const { error } = await supabase
        .from('provider_services')
        .update({
          review_status: 'rejected',
          review_notes: reviewNotes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedService.id);
        
      if (error) throw error;
      
      setSuccess(`Dienst "${selectedService.custom_name || selectedService.service?.name}" afgewezen!`);
      fetchData();
      setTimeout(() => {
        closeReviewModal();
      }, 1500);
    } catch (err: any) {
      setError('Fout bij het afwijzen: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter services based on search and status
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      (service.custom_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (service.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (service.provider?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (service.provider?.user_id?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (service.provider?.user_id?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'all' || service.review_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status label
  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'pending_review': return 'Wacht op beoordeling';
      case 'approved': return 'Goedgekeurd';
      case 'rejected': return 'Afgewezen';
      default: return 'Onbekend';
    }
  };

  // Get price unit label
  const getPriceUnitLabel = (priceUnit: string | undefined) => {
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
        <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary">Diensten Beoordelen</h3>
          <p className="text-text-secondary">Beoordeel en beheer diensten van professionals</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Zoek op dienst, professional of beschrijving..."
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
          >
            <option value="all">Alle statussen</option>
            <option value="pending_review">Wacht op beoordeling</option>
            <option value="approved">Goedgekeurd</option>
            <option value="rejected">Afgewezen</option>
          </select>
        </div>
      </div>

      {/* Services List */}
      {filteredServices.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dienst</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professional</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commissie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {service.custom_name || service.service?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Basis: {service.service?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.provider?.business_name || 'Onbekend'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {service.provider?.user_id?.first_name} {service.provider?.user_id?.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        €{service.custom_price?.toFixed(2) || '0.00'} {getPriceUnitLabel(service.custom_price_unit)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {service.custom_duration_minutes ? `${service.custom_duration_minutes / 60} uur` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {service.commission_rate_override !== null 
                          ? `${service.commission_rate_override.toFixed(2)}% (override)` 
                          : `${service.service?.category?.commission_rate?.toFixed(2) || '15.00'}% (standaard)`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(service.review_status)}`}>
                        {getStatusLabel(service.review_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(service.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openReviewModal(service)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        {service.review_status === 'pending_review' ? 'Beoordelen' : 'Bekijken'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {services.length === 0 ? 'Geen diensten gevonden' : 'Geen diensten gevonden met huidige filters'}
          </h3>
          <p className="text-gray-600">
            {services.length === 0 
              ? 'Er zijn nog geen diensten toegevoegd door professionals'
              : 'Probeer je zoekfilters aan te passen'
            }
          </p>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Dienst Beoordelen
                    </h2>
                    <p className="text-gray-600">
                      Beoordeel deze dienst voordat deze zichtbaar wordt in de marktplaats
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeReviewModal}
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

              <div className="space-y-6">
                {/* Service Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-primary-600" />
                      <span>Dienst Informatie</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Naam:</p>
                        <p className="font-medium">{selectedService.custom_name || selectedService.service?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Basis Dienst:</p>
                        <p>{selectedService.service?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Korte Beschrijving:</p>
                        <p className="text-sm">{selectedService.custom_short_description || selectedService.service?.short_description}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Prijs:</p>
                        <p>€{selectedService.custom_price?.toFixed(2) || '0.00'} {getPriceUnitLabel(selectedService.custom_price_unit)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Duur:</p>
                        <p>{selectedService.custom_duration_minutes ? `${selectedService.custom_duration_minutes / 60} uur` : 'Niet opgegeven'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Doelgroep:</p>
                        <p>{selectedService.custom_target_audience || selectedService.service?.target_audience || 'Niet opgegeven'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <User className="w-4 h-4 text-primary-600" />
                      <span>Professional Informatie</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Naam:</p>
                        <p className="font-medium">{selectedService.provider?.business_name || 'Professional'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contactpersoon:</p>
                        <p>{selectedService.provider?.user_id?.first_name} {selectedService.provider?.user_id?.last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email:</p>
                        <p>{selectedService.provider?.email || 'Niet opgegeven'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Telefoon:</p>
                        <p>{selectedService.provider?.phone || 'Niet opgegeven'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Stad:</p>
                        <p>{selectedService.provider?.city || 'Niet opgegeven'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Description */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    <span>Uitgebreide Beschrijving</span>
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedService.custom_full_description || selectedService.service?.full_description || 'Geen uitgebreide beschrijving opgegeven.'}
                  </p>
                </div>

                {/* Service Image */}
                {selectedService.custom_image_url && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-primary-600" />
                      <span>Afbeelding</span>
                    </h3>
                    <div className="flex justify-center">
                      <img 
                        src={selectedService.custom_image_url}
                        alt={selectedService.custom_name || selectedService.service?.name}
                        className="max-h-64 object-contain rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Commission Rate Section */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
                    <Percent className="w-4 h-4" />
                    <span>Commissie Percentage</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Categorie Standaard:</p>
                        <p className="text-blue-700">{categoryCommissionRate?.toFixed(2) || '15.00'}%</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-blue-800">Voorgestelde Override:</p>
                        <p className="text-blue-700">
                          {selectedService.commission_rate_override !== null 
                            ? `${selectedService.commission_rate_override.toFixed(2)}%` 
                            : 'Geen override'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">
                        Goedgekeurde Commissie Override
                      </label>
                      <div className="flex space-x-3">
                        <div className="relative flex-1">
                          <Percent className="w-5 h-5 text-blue-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={approvedCommissionRate !== null ? approvedCommissionRate : ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              setApprovedCommissionRate(value);
                            }}
                            className="w-full pl-10 pr-3 py-2 border border-blue-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Standaard: ${categoryCommissionRate?.toFixed(2) || '15.00'}%`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setApprovedCommissionRate(null)}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Gebruik standaard
                        </button>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Laat leeg om de standaard categorie commissie te gebruiken. Als de professional een override heeft voorgesteld, 
                        kunt u deze goedkeuren of aanpassen.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-primary-600" />
                    <span>Categorie Toewijzing</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Standaard Categorie:</p>
                      <p className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg inline-block">
                        {selectedService.service?.category?.name || 'Geen categorie'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Toon in Categorie:</p>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        disabled={selectedService.review_status !== 'pending_review'}
                      >
                        <option value="">Gebruik standaard categorie</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Selecteer in welke categorie deze dienst moet worden getoond in de marktplaats
                      </p>
                    </div>
                  </div>
                </div>

                {/* Review Notes */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-primary-600" />
                    <span>Beoordelingsnotities</span>
                  </h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 h-32 resize-none"
                    placeholder="Voeg notities toe over deze dienst (zichtbaar voor de professional)"
                    disabled={selectedService.review_status !== 'pending_review'}
                  />
                </div>

                {/* Availability Toggle */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <span>Beschikbaarheid</span>
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-5 rounded-full ${selectedService.is_available ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                      <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${selectedService.is_available ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedService.is_available ? 'Beschikbaar' : 'Niet beschikbaar'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-13">
                    Deze instelling is door de professional ingesteld en kan niet worden gewijzigd
                  </p>
                </div>

                {/* Current Status */}
                {selectedService.review_status !== 'pending_review' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-primary-600" />
                      <span>Huidige Status</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status:</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedService.review_status)}`}>
                          {getStatusLabel(selectedService.review_status)}
                        </span>
                      </div>
                      {selectedService.reviewed_at && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Beoordeeld op:</p>
                          <p>{new Date(selectedService.reviewed_at).toLocaleString('nl-NL')}</p>
                        </div>
                      )}
                      {selectedService.review_notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Notities:</p>
                          <p className="text-sm">{selectedService.review_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Sluiten
                  </button>
                  
                  {selectedService.review_status === 'pending_review' && (
                    <>
                      <button
                        onClick={handleReject}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span>Afwijzen</span>
                      </button>
                      
                      <button
                        onClick={handleApprove}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        <span>Goedkeuren</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}