import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Tag, 
  Users, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  FileText,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { supabase, Service, ServiceCategory, ServiceDetail, ServiceRequirement, ServiceClientType, ClientType } from '../../lib/supabase';
import { PhotoManager } from './PhotoManager';

interface ServiceFormProps {
  serviceId?: string;
  mode: 'create' | 'edit' | 'view';
  onClose: () => void;
  onSave: () => void;
}

export function ServiceForm({ serviceId, mode, onClose, onSave }: ServiceFormProps) {
  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'details' | 'target'>('info');
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    short_description: '',
    full_description: '',
    category_id: '',
    target_audience: '',
    is_active: true,
    is_featured: false,
    sort_order: 0,
    image_url: ''
  });
  
  // Details and requirements
  const [details, setDetails] = useState<ServiceDetail[]>([]);
  const [requirements, setRequirements] = useState<ServiceRequirement[]>([]);
  const [selectedClientTypes, setSelectedClientTypes] = useState<string[]>([]);
  
  // New item inputs
  const [newDetail, setNewDetail] = useState({ detail_type: 'included', detail_value: '' });
  const [newRequirement, setNewRequirement] = useState({ requirement_type: 'equipment', requirement_value: '', is_mandatory: true });

  useEffect(() => {
    fetchCategories();
    fetchClientTypes();
    
    if (serviceId && (mode === 'edit' || mode === 'view')) {
      fetchServiceDetails();
    } else {
      setLoading(false);
    }
  }, [serviceId, mode]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchClientTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('client_types')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setClientTypes(data || []);
    } catch (err: any) {
      console.error('Error fetching client types:', err);
    }
  };

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch service with all related data
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          details:service_details(*),
          requirements:service_requirements(*),
          client_types:service_client_types(
            *,
            client_type:client_types(*)
          )
        `)
        .eq('id', serviceId)
        .single();
        
      if (error) throw error;
      
      setService(data);
      setFormData({
        name: data.name,
        short_description: data.short_description,
        full_description: data.full_description,
        category_id: data.category_id,
        target_audience: data.target_audience,
        is_active: data.is_active,
        is_featured: data.is_featured,
        sort_order: data.sort_order,
        image_url: data.image_url
      });
      
      // Set details and requirements
      setDetails(data.details || []);
      setRequirements(data.requirements || []);
      
      // Set selected client types
      const clientTypeIds = data.client_types?.map(ct => ct.client_type_id) || [];
      setSelectedClientTypes(clientTypeIds);
      
    } catch (err: any) {
      console.error('Error fetching service details:', err);
      setError('Fout bij het laden van servicegegevens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      let serviceId: string;
      
      if (mode === 'create') {
        // Create new service
        const { data: newService, error: createError } = await supabase
          .from('services')
          .insert([formData])
          .select()
          .single();
          
        if (createError) throw createError;
        serviceId = newService.id;
      } else {
        // Update existing service
        const { error: updateError } = await supabase
          .from('services')
          .update(formData)
          .eq('id', service!.id);
          
        if (updateError) throw updateError;
        serviceId = service!.id;
      }
      
      // Update details
      if (mode === 'edit') {
        // Delete existing details
        await supabase
          .from('service_details')
          .delete()
          .eq('service_id', serviceId);
      }
      
      // Add new details
      if (details.length > 0) {
        const detailsToInsert = details.map(detail => ({
          ...detail,
          service_id: serviceId
        }));
        
        const { error: detailsError } = await supabase
          .from('service_details')
          .insert(detailsToInsert);
          
        if (detailsError) throw detailsError;
      }
      
      // Update requirements
      if (mode === 'edit') {
        // Delete existing requirements
        await supabase
          .from('service_requirements')
          .delete()
          .eq('service_id', serviceId);
      }
      
      // Add new requirements
      if (requirements.length > 0) {
        const requirementsToInsert = requirements.map(req => ({
          ...req,
          service_id: serviceId
        }));
        
        const { error: requirementsError } = await supabase
          .from('service_requirements')
          .insert(requirementsToInsert);
          
        if (requirementsError) throw requirementsError;
      }
      
      // Update client types
      if (mode === 'edit') {
        // Delete existing client types
        await supabase
          .from('service_client_types')
          .delete()
          .eq('service_id', serviceId);
      }
      
      // Add new client types
      if (selectedClientTypes.length > 0) {
        const clientTypesToInsert = selectedClientTypes.map(clientTypeId => ({
          service_id: serviceId,
          client_type_id: clientTypeId
        }));
        
        const { error: clientTypesError } = await supabase
          .from('service_client_types')
          .insert(clientTypesToInsert);
          
        if (clientTypesError) throw clientTypesError;
      }
      
      setSuccess(mode === 'create' ? 'Dienst succesvol aangemaakt! 🎉' : 'Dienst succesvol bijgewerkt! 🎉');
      
      // Notify parent component
      onSave();
      
      // Close form after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error saving service:', err);
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDetail = () => {
    if (!newDetail.detail_value.trim()) return;
    
    setDetails([...details, {
      id: `temp_${Date.now()}`,
      service_id: service?.id || '',
      detail_type: newDetail.detail_type,
      detail_value: newDetail.detail_value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);
    
    setNewDetail({ detail_type: 'included', detail_value: '' });
  };

  const handleRemoveDetail = (id: string) => {
    setDetails(details.filter(detail => detail.id !== id));
  };

  const handleAddRequirement = () => {
    if (!newRequirement.requirement_value.trim()) return;
    
    setRequirements([...requirements, {
      id: `temp_${Date.now()}`,
      service_id: service?.id || '',
      requirement_type: newRequirement.requirement_type,
      requirement_value: newRequirement.requirement_value,
      is_mandatory: newRequirement.is_mandatory,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);
    
    setNewRequirement({ requirement_type: 'equipment', requirement_value: '', is_mandatory: true });
  };

  const handleRemoveRequirement = (id: string) => {
    setRequirements(requirements.filter(req => req.id !== id));
  };

  const handleClientTypeToggle = (clientTypeId: string) => {
    if (selectedClientTypes.includes(clientTypeId)) {
      setSelectedClientTypes(selectedClientTypes.filter(id => id !== clientTypeId));
    } else {
      setSelectedClientTypes([...selectedClientTypes, clientTypeId]);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({
      ...formData,
      image_url: imageUrl
    });
    setShowPhotoManager(false);
  };

  const isReadOnly = mode === 'view';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          </div>
          <p className="text-center mt-4 text-gray-600">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {mode === 'create' ? 'Nieuwe Dienst' : mode === 'edit' ? 'Dienst Bewerken' : 'Dienst Bekijken'}
                </h2>
                <p className="text-gray-600">
                  {mode === 'create' ? 'Voeg een nieuwe dienst toe' : mode === 'edit' ? 'Wijzig de dienstgegevens' : 'Bekijk de dienstgegevens'}
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

          {/* Tabs */}
          <div className="bg-gray-100 rounded-lg p-1 mb-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-white shadow'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Basis Info</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'bg-white shadow'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Details</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('target')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'target'
                    ? 'bg-white shadow'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Doelgroepen</span>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Naam *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Naam van de dienst"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categorie *
                    </label>
                    <select
                      required
                      disabled={isReadOnly}
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">Selecteer een categorie</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Korte Beschrijving *
                  </label>
                  <textarea
                    required
                    disabled={isReadOnly}
                    value={formData.short_description || ''}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Korte beschrijving van de dienst"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uitgebreide Beschrijving
                  </label>
                  <textarea
                    disabled={isReadOnly}
                    value={formData.full_description || ''}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Uitgebreide beschrijving van de dienst"
                    rows={5}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doelgroep
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formData.target_audience || ''}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Bijv. Senioren, gezinnen, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Afbeelding
                  </label>
                  <div className="space-y-3">
                    {formData.image_url && (
                      <div className="relative inline-block">
                        <img 
                          src={formData.image_url}
                          alt="Service afbeelding"
                          className="w-32 h-20 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300';
                          }}
                        />
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image_url: '' })}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setShowPhotoManager(true)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700">
                          {formData.image_url ? 'Afbeelding wijzigen' : 'Afbeelding selecteren'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sorteervolgorde
                    </label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={formData.sort_order || 0}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lagere nummers worden eerst getoond
                    </p>
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_active"
                          disabled={isReadOnly}
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                          Actief
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_featured"
                          disabled={isReadOnly}
                          checked={formData.is_featured}
                          onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                          Uitgelicht
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Service Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Inbegrepen & Details</h3>
                  
                  {!isReadOnly && (
                    <div className="flex space-x-2 mb-4">
                      <select
                        value={newDetail.detail_type}
                        onChange={(e) => setNewDetail({ ...newDetail, detail_type: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="included">Inbegrepen</option>
                        <option value="excluded">Niet inbegrepen</option>
                        <option value="feature">Kenmerk</option>
                        <option value="benefit">Voordeel</option>
                      </select>
                      <input
                        type="text"
                        value={newDetail.detail_value}
                        onChange={(e) => setNewDetail({ ...newDetail, detail_value: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Detail toevoegen..."
                      />
                      <button
                        type="button"
                        onClick={handleAddDetail}
                        className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  {details.length > 0 ? (
                    <div className="space-y-2">
                      {details.map((detail) => (
                        <div key={detail.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              detail.detail_type === 'included' ? 'bg-green-100 text-green-800' :
                              detail.detail_type === 'excluded' ? 'bg-red-100 text-red-800' :
                              detail.detail_type === 'feature' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {detail.detail_type === 'included' ? 'Inbegrepen' :
                               detail.detail_type === 'excluded' ? 'Niet inbegrepen' :
                               detail.detail_type === 'feature' ? 'Kenmerk' : 'Voordeel'}
                            </span>
                            <span>{detail.detail_value}</span>
                          </div>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDetail(detail.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Geen details toegevoegd</p>
                  )}
                </div>
                
                {/* Service Requirements */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Vereisten</h3>
                  
                  {!isReadOnly && (
                    <div className="flex space-x-2 mb-4">
                      <select
                        value={newRequirement.requirement_type}
                        onChange={(e) => setNewRequirement({ ...newRequirement, requirement_type: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="equipment">Benodigdheden</option>
                        <option value="qualification">Kwalificatie</option>
                        <option value="preparation">Voorbereiding</option>
                        <option value="space">Ruimte</option>
                      </select>
                      <input
                        type="text"
                        value={newRequirement.requirement_value}
                        onChange={(e) => setNewRequirement({ ...newRequirement, requirement_value: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Vereiste toevoegen..."
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_mandatory"
                          checked={newRequirement.is_mandatory}
                          onChange={(e) => setNewRequirement({ ...newRequirement, is_mandatory: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_mandatory" className="ml-2 block text-sm text-gray-900">
                          Verplicht
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddRequirement}
                        className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  {requirements.length > 0 ? (
                    <div className="space-y-2">
                      {requirements.map((req) => (
                        <div key={req.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              req.requirement_type === 'equipment' ? 'bg-blue-100 text-blue-800' :
                              req.requirement_type === 'qualification' ? 'bg-purple-100 text-purple-800' :
                              req.requirement_type === 'preparation' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {req.requirement_type === 'equipment' ? 'Benodigdheden' :
                               req.requirement_type === 'qualification' ? 'Kwalificatie' :
                               req.requirement_type === 'preparation' ? 'Voorbereiding' : 'Ruimte'}
                            </span>
                            <span>{req.requirement_value}</span>
                            {req.is_mandatory && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Verplicht
                              </span>
                            )}
                          </div>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRequirement(req.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Geen vereisten toegevoegd</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Target Audience Tab */}
            {activeTab === 'target' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Doelgroepen</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {clientTypes.map((clientType) => (
                    <div key={clientType.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id={`client-type-${clientType.id}`}
                        disabled={isReadOnly}
                        checked={selectedClientTypes.includes(clientType.id)}
                        onChange={() => handleClientTypeToggle(clientType.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`client-type-${clientType.id}`} className="flex-1">
                        <div className="font-medium">{clientType.name}</div>
                        {clientType.description && (
                          <div className="text-sm text-gray-500">{clientType.description}</div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                
                {clientTypes.length === 0 && (
                  <p className="text-gray-500 italic">Geen doelgroepen beschikbaar</p>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              
              {mode !== 'view' && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
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
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* Photo Manager Modal */}
      {showPhotoManager && (
        <PhotoManager
          currentImageUrl={formData.image_url}
          onImageSelect={handleImageSelect}
          onClose={() => setShowPhotoManager(false)}
          searchQuery={formData.name}
          title="Dienst Afbeelding Selecteren"
        />
      )}
    </div>
  );
}