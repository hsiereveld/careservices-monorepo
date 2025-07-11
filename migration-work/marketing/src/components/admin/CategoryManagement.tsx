import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Eye, Trash2, Search, Filter, Tag as TagIcon, Save, X, AlertCircle, CheckCircle, ToggleLeft, ToggleRight, Palette, Hash, FileText, Loader2, Camera, Image as ImageIcon, Percent, Upload, Download, Home, Heart, Car, Briefcase, ShoppingBag, Users, Settings, MapPin, Phone, Mail, Calendar, Clock, Star, Shield, FileCheck, Package, Truck, Coffee, Utensils, Music, Book, Scissors, PenTool as Tool, Wrench, Zap, Wifi, Smartphone, Laptop, Monitor, Printer, Server, Database, Cloud, Globe, DollarSign, CreditCard, Gift, ShoppingCart } from 'lucide-react';
import { supabase, ServiceCategory } from '../../lib/supabase';
import { PhotoManager } from './PhotoManager';
import Papa from 'papaparse';

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  image_url: string;
  color_scheme: string;
  commission_rate: number; // New field for commission rate
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: '',
    sort_order: 0,
    is_active: true,
    image_url: '',
    color_scheme: 'primary',
    commission_rate: 15.0 // Default commission rate
  });

  // Photo manager state
  const [showPhotoManager, setShowPhotoManager] = useState(false);

  // CSV import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      setCategories(data || []);
    } catch (err: any) {
      setError('Fout bij het laden van categorieën: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (mode: 'create' | 'edit' | 'view', category?: ServiceCategory) => {
    setFormMode(mode);
    setEditingCategory(category || null);
    
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        icon: category.icon,
        sort_order: category.sort_order,
        is_active: category.is_active,
        image_url: category.image_url || '',
        color_scheme: category.color_scheme || 'primary',
        commission_rate: category.commission_rate || 15.0 // Use category commission rate or default
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '',
        sort_order: categories.length,
        is_active: true,
        image_url: '',
        color_scheme: 'primary',
        commission_rate: 15.0 // Default commission rate for new categories
      });
    }
    
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      sort_order: 0,
      is_active: true,
      image_url: '',
      color_scheme: 'primary',
      commission_rate: 15.0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'view') return;

    setError('');
    setSuccess('');

    try {
      if (formMode === 'create') {
        // Create new category
        const { error: createError } = await supabase
          .from('service_categories')
          .insert([formData]);

        if (createError) throw createError;
        setSuccess('Categorie succesvol aangemaakt! 🎉');
      } else {
        // Update existing category
        const { error: updateError } = await supabase
          .from('service_categories')
          .update(formData)
          .eq('id', editingCategory!.id);

        if (updateError) throw updateError;
        setSuccess('Categorie succesvol bijgewerkt! 🎉');
      }

      fetchCategories();
      setTimeout(() => {
        closeForm();
      }, 1500);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    }
  };

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('service_categories')
        .update({ is_active: !currentStatus })
        .eq('id', categoryId);

      if (error) throw error;

      setSuccess(`Categorie ${!currentStatus ? 'geactiveerd' : 'gedeactiveerd'}! 🎉`);
      fetchCategories();
    } catch (err: any) {
      setError('Fout bij het wijzigen van status: ' + err.message);
    }
  };

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Weet je zeker dat je "${categoryName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setSuccess(`Categorie "${categoryName}" succesvol verwijderd! 🗑️`);
      fetchCategories();
    } catch (err: any) {
      setError('Fout bij het verwijderen van categorie: ' + err.message);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, image_url: imageUrl });
    setShowPhotoManager(false);
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
          
          if (missingFields.length > 0) {
            setImportError(`Verplichte velden ontbreken: ${missingFields.join(', ')}`);
            setImportLoading(false);
            return;
          }
          
          // Prepare categories for import
          const categoriesToImport = data.map((row, index) => ({
            name: row.name,
            description: row.description || '',
            icon: row.icon || '',
            sort_order: parseInt(row.sort_order) || index,
            is_active: row.is_active === 'true' || row.is_active === '1' || row.is_active === 'yes',
            image_url: row.image_url || '',
            color_scheme: row.color_scheme || 'primary',
            commission_rate: parseFloat(row.commission_rate) || 15.0
          }));
          
          // Import categories using upsert to handle duplicates
          const { error } = await supabase
            .from('service_categories')
            .upsert(categoriesToImport, { 
              onConflict: 'name',
              ignoreDuplicates: false 
            });
            
          if (error) throw error;
          
          setImportSuccess(`${categoriesToImport.length} categorieën succesvol geïmporteerd/bijgewerkt!`);
          fetchCategories();
        } catch (err: any) {
          setImportError('Fout bij het importeren: ' + err.message);
        } finally {
          setImportLoading(false);
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
    const dataToExport = categories.map(category => ({
      name: category.name,
      description: category.description,
      icon: category.icon,
      sort_order: category.sort_order,
      is_active: category.is_active,
      image_url: category.image_url,
      color_scheme: category.color_scheme,
      commission_rate: category.commission_rate
    }));
    
    // Convert to CSV
    const csv = Papa.unparse(dataToExport);
    
    // Create a blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'categories.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to render the appropriate icon based on the icon name
  const renderIcon = (iconName: string) => {
    // If the icon name is empty, return the default TagIcon
    if (!iconName) {
      return <TagIcon className="w-5 h-5" />;
    }

    // Check if the icon name is a Lucide icon name
    const iconMap: Record<string, React.ReactNode> = {
      'home': <Home className="w-5 h-5" />,
      'heart': <Heart className="w-5 h-5" />,
      'car': <Car className="w-5 h-5" />,
      'briefcase': <Briefcase className="w-5 h-5" />,
      'shopping-bag': <ShoppingBag className="w-5 h-5" />,
      'users': <Users className="w-5 h-5" />,
      'settings': <Settings className="w-5 h-5" />,
      'map-pin': <MapPin className="w-5 h-5" />,
      'phone': <Phone className="w-5 h-5" />,
      'mail': <Mail className="w-5 h-5" />,
      'calendar': <Calendar className="w-5 h-5" />,
      'clock': <Clock className="w-5 h-5" />,
      'star': <Star className="w-5 h-5" />,
      'shield': <Shield className="w-5 h-5" />,
      'file-check': <FileCheck className="w-5 h-5" />,
      'package': <Package className="w-5 h-5" />,
      'truck': <Truck className="w-5 h-5" />,
      'coffee': <Coffee className="w-5 h-5" />,
      'utensils': <Utensils className="w-5 h-5" />,
      'music': <Music className="w-5 h-5" />,
      'book': <Book className="w-5 h-5" />,
      'scissors': <Scissors className="w-5 h-5" />,
      'tool': <Tool className="w-5 h-5" />,
      'wrench': <Wrench className="w-5 h-5" />,
      'zap': <Zap className="w-5 h-5" />,
      'wifi': <Wifi className="w-5 h-5" />,
      'smartphone': <Smartphone className="w-5 h-5" />,
      'laptop': <Laptop className="w-5 h-5" />,
      'monitor': <Monitor className="w-5 h-5" />,
      'printer': <Printer className="w-5 h-5" />,
      'server': <Server className="w-5 h-5" />,
      'database': <Database className="w-5 h-5" />,
      'cloud': <Cloud className="w-5 h-5" />,
      'globe': <Globe className="w-5 h-5" />,
      'dollar-sign': <DollarSign className="w-5 h-5" />,
      'credit-card': <CreditCard className="w-5 h-5" />,
      'gift': <Gift className="w-5 h-5" />,
      'shopping-cart': <ShoppingCart className="w-5 h-5" />,
      'tag': <TagIcon className="w-5 h-5" />
    };

    // Convert to lowercase and remove spaces for matching
    const normalizedIconName = iconName.toLowerCase().replace(/\s+/g, '-');
    
    // Check if we have a matching icon
    if (normalizedIconName in iconMap) {
      return iconMap[normalizedIconName];
    }
    
    // If it's not a Lucide icon, it might be an emoji or custom text
    return <span className="text-lg">{iconName}</span>;
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isReadOnly = formMode === 'view';

  const colorSchemes = [
    { value: 'primary', label: 'Primair', color: 'bg-primary-500' },
    { value: 'accent', label: 'Accent', color: 'bg-accent-500' },
    { value: 'secondary', label: 'Secundair', color: 'bg-secondary-500' },
    { value: 'green', label: 'Groen', color: 'bg-green-500' },
    { value: 'blue', label: 'Blauw', color: 'bg-blue-500' },
    { value: 'orange', label: 'Oranje', color: 'bg-orange-500' },
    { value: 'purple', label: 'Paars', color: 'bg-purple-500' },
    { value: 'red', label: 'Rood', color: 'bg-red-500' }
  ];

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Categorieën laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Categorieënbeheer</h2>
          <p className="text-gray-600">Beheer alle service categorieën en hun eigenschappen</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => openForm('create')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nieuwe Categorie</span>
          </button>
          <div className="relative">
            <input
              type="file"
              id="csv-import"
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
              onClick={() => setImportFile(null)}
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
            <p>CSV-formaat: name, description, icon, sort_order, is_active, image_url, color_scheme, commission_rate</p>
            <p>Alleen 'name' is verplicht. Andere velden zijn optioneel.</p>
            <p>Bestaande categorieën met dezelfde naam worden bijgewerkt.</p>
          </div>
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
          placeholder="Zoek categorieën..."
        />
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
              {/* Category Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      {category.icon ? (
                        renderIcon(category.icon)
                      ) : (
                        <TagIcon className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <span className="text-xs text-gray-500">Volgorde: {category.sort_order}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                </div>
              </div>

              {/* Category Image */}
              {category.image_url && (
                <div className="mb-4">
                  <img 
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Commission Rate */}
              <div className="flex items-center space-x-2 mb-4">
                <Percent className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-gray-700">
                  Commissie: {category.commission_rate?.toFixed(2) || '15.00'}%
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {category.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {new Date(category.created_at).toLocaleDateString('nl-NL')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <button
                    onClick={() => openForm('view', category)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Bekijken"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openForm('edit', category)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Bewerken"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id, category.name)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => toggleCategoryStatus(category.id, category.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    category.is_active 
                      ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                      : 'text-red-600 bg-red-50 hover:bg-red-100'
                  }`}
                  title={category.is_active ? 'Deactiveren' : 'Activeren'}
                >
                  {category.is_active ? (
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
          <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {categories.length === 0 ? 'Geen categorieën gevonden' : 'Geen categorieën gevonden met huidige filters'}
          </h3>
          <p className="text-gray-600">
            {categories.length === 0 
              ? 'Voeg je eerste categorie toe om te beginnen'
              : 'Probeer je zoekfilters aan te passen'
            }
          </p>
          {categories.length === 0 && (
            <button 
              onClick={() => openForm('create')}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Eerste categorie toevoegen
            </button>
          )}
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <TagIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formMode === 'create' && 'Nieuwe Categorie'}
                      {formMode === 'edit' && 'Categorie Bewerken'}
                      {formMode === 'view' && 'Categorie Bekijken'}
                    </h2>
                    <p className="text-gray-600">
                      {formMode === 'create' && 'Voeg een nieuwe service categorie toe'}
                      {formMode === 'edit' && 'Wijzig de categorie eigenschappen'}
                      {formMode === 'view' && 'Bekijk alle categorie informatie'}
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
                <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Categorie Naam *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="Bijvoorbeeld: Transport & Begeleiding"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Icoon
                      </label>
                      <div className="relative">
                        <Palette className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                          placeholder="🚗 of icoon naam (bijv. car, home)"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Gebruik een emoji of een Lucide icoon naam zoals 'home', 'car', 'heart', etc.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Beschrijving
                    </label>
                    <div className="relative">
                      <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                      <textarea
                        disabled={isReadOnly}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none disabled:opacity-60"
                        placeholder="Beschrijf wat voor soort diensten in deze categorie vallen..."
                      />
                    </div>
                  </div>

                  {/* Commission Rate Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Commissie Percentage (%) *
                    </label>
                    <div className="relative">
                      <Percent className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        disabled={isReadOnly}
                        value={formData.commission_rate}
                        onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="15.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Standaard commissiepercentage voor alle diensten in deze categorie
                    </p>
                  </div>

                  {/* Category Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Categorie Afbeelding
                    </label>
                    <div className="space-y-3">
                      {formData.image_url && (
                        <div className="relative inline-block">
                          <img 
                            src={formData.image_url}
                            alt="Categorie afbeelding"
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
                      
                      {formData.image_url && (
                        <p className="text-xs text-gray-500 break-all">{formData.image_url}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Sorteervolgorde
                      </label>
                      <div className="relative">
                        <Hash className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={formData.sort_order}
                          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Lagere nummers worden eerst getoond
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Kleurschema
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={formData.color_scheme}
                        onChange={(e) => setFormData({ ...formData, color_scheme: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                      >
                        {colorSchemes.map((scheme) => (
                          <option key={scheme.value} value={scheme.value}>
                            {scheme.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                      Categorie is {formData.is_active ? 'actief' : 'inactief'}
                    </span>
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
                        {formMode === 'create' ? 'Categorie Aanmaken' : 'Wijzigingen Opslaan'}
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

      {/* Photo Manager Modal */}
      {showPhotoManager && (
        <PhotoManager
          currentImageUrl={formData.image_url}
          onImageSelect={handleImageSelect}
          onClose={() => setShowPhotoManager(false)}
          searchQuery={formData.name}
          title="Categorie Afbeelding Selecteren"
        />
      )}
    </div>
  );
}