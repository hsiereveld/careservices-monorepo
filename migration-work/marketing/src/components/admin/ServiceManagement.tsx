import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Search, 
  Filter,
  Tag,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Settings,
  Calendar,
  Star,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Upload,
  Download,
  X
} from 'lucide-react';
import { supabase, Service, ServiceCategory, PricingTier, ServiceWithDetails } from '../../lib/supabase';
import { ServiceForm } from './ServiceForm';
import { CategoryManagement } from './CategoryManagement';
import { PricingManagement } from './PricingManagement';
import { ProfessionalServiceReview } from './ProfessionalServiceReview';
import Papa from 'papaparse';

type ServiceManagementTab = 'services' | 'categories' | 'pricing' | 'availability' | 'review';
type ServiceFormMode = 'create' | 'edit' | 'view' | null;

export function ServiceManagement() {
  const [activeTab, setActiveTab] = useState<ServiceManagementTab>('services');
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Service form state
  const [serviceFormMode, setServiceFormMode] = useState<ServiceFormMode>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // CSV import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Fetching services and categories...');

      // Fetch services with related data - using the actual database schema
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(*),
          details:service_details(*),
          requirements:service_requirements(*),
          client_types:service_client_types(
            *,
            client_type:client_types(*)
          )
        `)
        .order('sort_order', { ascending: true });

      if (servicesError) {
        console.error('Services error:', servicesError);
        throw servicesError;
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
        throw categoriesError;
      }

      console.log('✅ Fetched services:', servicesData);
      console.log('✅ Fetched categories:', categoriesData);

      setServices(servicesData || []);
      setCategories(categoriesData || []);
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError('Fout bij het laden van diensten: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openServiceForm = (mode: 'create' | 'edit' | 'view', serviceId?: string) => {
    setServiceFormMode(mode);
    setEditingServiceId(serviceId || null);
  };

  const closeServiceForm = () => {
    setServiceFormMode(null);
    setEditingServiceId(null);
  };

  const handleServiceFormSave = () => {
    fetchData();
    // Success message will be shown by the form component
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      setSuccess(`Dienst ${!currentStatus ? 'geactiveerd' : 'gedeactiveerd'}! 🎉`);
      fetchData();
    } catch (err: any) {
      setError('Fout bij het wijzigen van status: ' + err.message);
    }
  };

  const deleteService = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Weet je zeker dat je "${serviceName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      setSuccess(`Dienst "${serviceName}" succesvol verwijderd! 🗑️`);
      fetchData();
    } catch (err: any) {
      setError('Fout bij het verwijderen van dienst: ' + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    if (file.type !== 'text/csv') {
      setImportError('Alleen CSV-bestanden zijn toegestaan');
      return;
    }
    
    setImportFile(file);
    setImportError('');
  };

  // Helper function to validate UUID format
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Helper function to map human-readable price units to enum values
  const mapPriceUnitToEnum = (priceUnit: string): string => {
    if (!priceUnit) return 'per_hour'; // default value
    
    const lowerUnit = priceUnit.toLowerCase().trim();
    
    // Mapping for Dutch and English terms
    const unitMapping: { [key: string]: string } = {
      // Dutch terms
      'per uur': 'per_hour',
      'per dag': 'per_day',
      'per dienst': 'per_service',
      'per service': 'per_service',
      'per km': 'per_km',
      'per kilometer': 'per_km',
      'per item': 'per_item',
      'per stuk': 'per_item',
      'per maand': 'per_month',
      'per week': 'per_week',
      
      // English terms
      'per hour': 'per_hour',
      'per day': 'per_day',
      'per service': 'per_service',
      'per km': 'per_km',
      'per item': 'per_item',
      'per month': 'per_month',
      'per week': 'per_week',
      
      // Direct enum values (in case they're already correct)
      'per_hour': 'per_hour',
      'per_day': 'per_day',
      'per_service': 'per_service',
      'per_km': 'per_km',
      'per_item': 'per_item',
      'per_month': 'per_month',
      'per_week': 'per_week'
    };
    
    return unitMapping[lowerUnit] || 'per_hour'; // fallback to per_hour if not found
  };

  const handleImport = () => {
    if (!importFile) {
      setImportError('Selecteer eerst een CSV-bestand');
      return;
    }
    
    setImportLoading(true);
    setImportError('');
    setImportSuccess('');
    
    Papa.parse(importFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            setImportError(`CSV parse error: ${results.errors[0].message}`);
            setImportLoading(false);
            return;
          }
          
          const data = results.data as any[];
          if (data.length === 0) {
            setImportError('CSV-bestand bevat geen gegevens');
            setImportLoading(false);
            return;
          }
          
          // Validate required fields
          const missingFields = [];
          if (!data[0].name) missingFields.push('name');
          if (!data[0].category_id && !data[0].category_name) missingFields.push('category_id of category_name');
          
          if (missingFields.length > 0) {
            setImportError(`Verplichte velden ontbreken: ${missingFields.join(', ')}`);
            setImportLoading(false);
            return;
          }
          
          // Process each service
          let successCount = 0;
          let errorCount = 0;
          
          for (const row of data) {
            try {
              // Find or create category if category_name is provided
              let categoryId = row.category_id;
              
              // Validate category_id if provided - if it's not a valid UUID, treat it as undefined
              if (categoryId && !isValidUUID(categoryId)) {
                console.warn(`Invalid UUID format for category_id: ${categoryId}, falling back to category_name lookup`);
                categoryId = undefined;
              }
              
              if (!categoryId && row.category_name) {
                // Check if category exists
                const { data: existingCategories } = await supabase
                  .from('service_categories')
                  .select('id')
                  .eq('name', row.category_name)
                  .limit(1);
                  
                if (existingCategories && existingCategories.length > 0) {
                  categoryId = existingCategories[0].id;
                } else {
                  // Create new category
                  const { data: newCategory, error: categoryError } = await supabase
                    .from('service_categories')
                    .insert({
                      name: row.category_name,
                      description: row.category_description || '',
                      icon: row.category_icon || '',
                      is_active: true
                    })
                    .select('id')
                    .single();
                    
                  if (categoryError) throw categoryError;
                  
                  categoryId = newCategory.id;
                }
              }
              
              // Create service
              const { data: newService, error: serviceError } = await supabase
                .from('services')
                .insert({
                  name: row.name,
                  short_description: row.short_description || '',
                  full_description: row.full_description || '',
                  category_id: categoryId,
                  target_audience: row.target_audience || '',
                  is_active: row.is_active === 'true' || row.is_active === '1' || row.is_active === 'yes',
                  is_featured: row.is_featured === 'true' || row.is_featured === '1' || row.is_featured === 'yes',
                  sort_order: parseInt(row.sort_order) || 0,
                  image_url: row.image_url || null
                })
                .select('id')
                .single();
                
              if (serviceError) throw serviceError;
              
              // Create pricing tier if price is provided
              if (row.price) {
                // Map the price_unit to the correct enum value
                const mappedPriceUnit = mapPriceUnitToEnum(row.price_unit);
                
                // Calculate VAT rate (default to 21%)
                let vatRate = 21.0;
                
                // Calculate admin percentage (default to 15%)
                let adminPercentage = 15.0;
                
                // Calculate the cost price (what the professional receives) from the selling price
                // Formula: costPrice = sellingPrice / (1 + vatRate/100) / (1 + adminPercentage/100)
                const sellingPrice = parseFloat(row.price);
                
                // If professional_price_ex_vat is provided, use it directly
                let costPrice;
                if (row.professional_price_ex_vat) {
                  costPrice = parseFloat(row.professional_price_ex_vat);
                  
                  // If we have both price and professional_price_ex_vat, we can calculate the actual admin percentage
                  if (row.price_ex_vat) {
                    const priceExVat = parseFloat(row.price_ex_vat);
                    if (costPrice > 0 && priceExVat > costPrice) {
                      adminPercentage = ((priceExVat / costPrice) - 1) * 100;
                    }
                  }
                } else {
                  // Calculate cost price from selling price
                  costPrice = sellingPrice / (1 + vatRate/100) / (1 + adminPercentage/100);
                }
                
                const { error: pricingError } = await supabase
                  .from('pricing_tiers')
                  .insert({
                    service_id: newService.id,
                    tier_name: row.tier_name || 'Standaard',
                    price: costPrice, // This is the cost price (what the professional receives)
                    duration_minutes: parseInt(row.duration_minutes) || 60,
                    description: row.price_description || '',
                    is_active: true,
                    price_unit: mappedPriceUnit,
                    vat_rate: vatRate,
                    admin_percentage: adminPercentage
                  });
                  
                if (pricingError) throw pricingError;
              }
              
              successCount++;
            } catch (err) {
              console.error('Error importing service:', err);
              errorCount++;
            }
          }
          
          if (successCount > 0) {
            setImportSuccess(`${successCount} diensten succesvol geïmporteerd!`);
            fetchData();
          }
          
          if (errorCount > 0) {
            setImportError(`${errorCount} diensten konden niet worden geïmporteerd.`);
          }
        } catch (err: any) {
          setImportError('Fout bij het importeren: ' + err.message);
        } finally {
          setImportLoading(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setImportFile(null);
        }
      },
      error: (error) => {
        setImportError('Fout bij het verwerken van CSV: ' + error.message);
        setImportLoading(false);
      }
    });
  };

  const handleExport = () => {
    // Prepare data for export
    const dataToExport = services.map(service => {
      return {
        name: service.name,
        short_description: service.short_description,
        full_description: service.full_description,
        category_id: service.category_id,
        category_name: service.category?.name,
        target_audience: service.target_audience,
        is_active: service.is_active,
        is_featured: service.is_featured,
        sort_order: service.sort_order,
        image_url: service.image_url
      };
    });
    
    // Convert to CSV
    const csv = Papa.unparse(dataToExport);
    
    // Create a blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'services.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.short_description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || service.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const tabs = [
    {
      id: 'services' as ServiceManagementTab,
      label: 'Diensten',
      icon: Package,
      description: 'Beheer alle diensten'
    },
    {
      id: 'categories' as ServiceManagementTab,
      label: 'Categorieën',
      icon: Tag,
      description: 'Beheer categorieën'
    },
    {
      id: 'pricing' as ServiceManagementTab,
      label: 'Prijzen',
      icon: Star,
      description: 'Beheer prijsstructuren'
    },
    {
      id: 'availability' as ServiceManagementTab,
      label: 'Beschikbaarheid',
      icon: Calendar,
      description: 'Beheer beschikbaarheid'
    },
    {
      id: 'review' as ServiceManagementTab,
      label: 'Beoordelen',
      icon: CheckCircle,
      description: 'Beoordeel diensten van professionals'
    }
  ];

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Diensten laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Dashboard_v2 style */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dienstenbeheer</h2>
          <p className="text-gray-600">Beheer alle diensten, categorieën en prijzen</p>
        </div>
        {activeTab === 'services' && (
          <div className="flex space-x-2">
            <button 
              onClick={() => openServiceForm('create')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nieuwe Dienst</span>
            </button>
            <div className="relative">
              <input
                type="file"
                id="csv-import"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
              >
                <Upload className="w-5 h-5" />
                <span>Importeren</span>
              </button>
            </div>
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Exporteren</span>
            </button>
          </div>
        )}
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

      {/* Import Section */}
      {importFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-800">CSV Import</h3>
            </div>
            <button
              onClick={() => {
                setImportFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-blue-700 mb-2">
            Geselecteerd bestand: <span className="font-medium">{importFile.name}</span> ({Math.round(importFile.size / 1024)} KB)
          </p>
          
          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-700">
              {importError}
            </div>
          )}
          
          {importSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-sm text-green-700">
              {importSuccess}
            </div>
          )}
          
          <button
            onClick={handleImport}
            disabled={importLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {importLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importeren...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Importeren</span>
              </>
            )}
          </button>
          
          <div className="mt-2 text-xs text-blue-600">
            <p>CSV-formaat: name, short_description, full_description, category_id, category_name, target_audience, is_active, is_featured, sort_order, image_url</p>
            <p>Verplichte velden: name, category_id OF category_name</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md p-1 mb-8 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-secondary-500 text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                <p className="text-xs mt-1 opacity-75">{tab.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'services' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex space-x-4">
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
                    className="pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

            {/* Services Grid */}
            {filteredServices.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <div key={service.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                    {/* Service Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{service.short_description}</p>
                        {service.category && (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            {service.category.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Service Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {service.details?.length || 0}
                        </p>
                        <p className="text-xs text-gray-600">Details</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {service.requirements?.length || 0}
                        </p>
                        <p className="text-xs text-gray-600">Vereisten</p>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${service.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                          {service.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openServiceForm('view', service.id)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Bekijken"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openServiceForm('edit', service.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Bewerken"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteService(service.id, service.name)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          service.is_active 
                            ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                            : 'text-red-600 bg-red-50 hover:bg-red-100'
                        }`}
                        title={service.is_active ? 'Deactiveren' : 'Activeren'}
                      >
                        {service.is_active ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {services.length === 0 ? 'Geen diensten gevonden' : 'Geen diensten gevonden met huidige filters'}
                </h3>
                <p className="text-gray-600">
                  {services.length === 0 
                    ? 'Voeg je eerste dienst toe om te beginnen'
                    : 'Probeer je zoekfilters aan te passen'
                  }
                </p>
                {services.length === 0 && (
                  <button 
                    onClick={() => openServiceForm('create')}
                    className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition-colors"
                  >
                    Eerste dienst toevoegen
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <CategoryManagement />
        )}

        {activeTab === 'pricing' && (
          <PricingManagement />
        )}

        {activeTab === 'review' && (
          <ProfessionalServiceReview />
        )}

        {activeTab === 'availability' && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Beschikbaarheidsbeheer
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto mb-6">
              Deze functionaliteit wordt binnenkort toegevoegd. Hier kun je straks alle beschikbaarheidsschema's beheren.
            </p>
            <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">In ontwikkeling</span>
            </div>
          </div>
        )}
      </div>

      {/* Service Form Modal */}
      {serviceFormMode && (
        <ServiceForm
          serviceId={editingServiceId || undefined}
          mode={serviceFormMode}
          onClose={closeServiceForm}
          onSave={handleServiceFormSave}
        />
      )}
    </div>
  );
}