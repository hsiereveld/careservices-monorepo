import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Clock,
  Tag,
  Percent,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  List,
  Star
} from 'lucide-react';
import { supabase, SubscriptionPlan } from '../../lib/supabase';

export function SubscriptionPlanManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    price: 0,
    included_hours: 0,
    discount_percentage: 0,
    admin_percentage: 15,
    features: [],
    is_active: true,
    sort_order: 0
  });
  
  // Feature input state
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Parse features JSON
      const parsedPlans = data?.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]')
      })) || [];

      setPlans(parsedPlans);
    } catch (err: any) {
      setError('Fout bij het laden van abonnementsplannen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (mode: 'create' | 'edit' | 'view', plan?: SubscriptionPlan) => {
    setFormMode(mode);
    setEditingPlan(plan || null);
    
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        included_hours: plan.included_hours,
        discount_percentage: plan.discount_percentage || 0,
        admin_percentage: plan.admin_percentage || 15,
        features: Array.isArray(plan.features) ? [...plan.features] : [],
        is_active: plan.is_active,
        sort_order: plan.sort_order || 0
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        included_hours: 0,
        discount_percentage: 0,
        admin_percentage: 15,
        features: [],
        is_active: true,
        sort_order: plans.length
      });
    }
    
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      included_hours: 0,
      discount_percentage: 0,
      admin_percentage: 15,
      features: [],
      is_active: true,
      sort_order: 0
    });
    setNewFeature('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'view') return;

    setError('');
    setSuccess('');

    try {
      // Prepare features for storage
      const featuresJson = JSON.stringify(formData.features);

      if (formMode === 'create') {
        const { error: createError } = await supabase
          .from('subscription_plans')
          .insert([{
            ...formData,
            features: featuresJson
          }]);

        if (createError) throw createError;
        setSuccess('Abonnementsplan succesvol aangemaakt! 🎉');
      } else {
        const { error: updateError } = await supabase
          .from('subscription_plans')
          .update({
            ...formData,
            features: featuresJson
          })
          .eq('id', editingPlan!.id);

        if (updateError) throw updateError;
        setSuccess('Abonnementsplan succesvol bijgewerkt! 🎉');
      }

      fetchPlans();
      setTimeout(() => {
        closeForm();
      }, 1500);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      setSuccess(`Abonnementsplan ${!currentStatus ? 'geactiveerd' : 'gedeactiveerd'}! 🎉`);
      fetchPlans();
    } catch (err: any) {
      setError('Fout bij het wijzigen van status: ' + err.message);
    }
  };

  const deletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Weet je zeker dat je "${planName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      // First check if there are any active subscriptions using this plan
      const { data: activeSubscriptions, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('subscription_plan_id', planId)
        .eq('is_active', true);

      if (checkError) throw checkError;

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        throw new Error(`Dit abonnementsplan kan niet worden verwijderd omdat er ${activeSubscriptions.length} actieve abonnementen aan gekoppeld zijn.`);
      }

      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      setSuccess(`Abonnementsplan "${planName}" succesvol verwijderd! 🗑️`);
      fetchPlans();
    } catch (err: any) {
      setError('Fout bij het verwijderen van abonnementsplan: ' + err.message);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    
    setFormData({
      ...formData,
      features: [...(formData.features || []), newFeature.trim()]
    });
    
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = [...(formData.features || [])];
    updatedFeatures.splice(index, 1);
    setFormData({ ...formData, features: updatedFeatures });
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    if (!formData.features) return;
    
    const features = [...formData.features];
    
    if (direction === 'up' && index > 0) {
      [features[index], features[index - 1]] = [features[index - 1], features[index]];
    } else if (direction === 'down' && index < features.length - 1) {
      [features[index], features[index + 1]] = [features[index + 1], features[index]];
    }
    
    setFormData({ ...formData, features });
  };

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isReadOnly = formMode === 'view';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Abonnementsbeheer</h2>
          <p className="text-gray-600">Beheer alle abonnementsplannen en hun eigenschappen</p>
        </div>
        <button
          onClick={() => openForm('create')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nieuw Abonnement</span>
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
          placeholder="Zoek abonnementsplannen..."
        />
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
              {/* Plan Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <span className="text-xs text-gray-500">Volgorde: {plan.sort_order}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                </div>
              </div>

              {/* Plan Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Prijs:</span>
                  <span className="font-semibold text-primary-600">€{plan.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Uren inbegrepen:</span>
                  <span className="font-semibold">{plan.included_hours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Korting:</span>
                  <span className="font-semibold text-green-600">{plan.discount_percentage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Admin %:</span>
                  <span className="font-semibold">{plan.admin_percentage}%</span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Kenmerken:</h4>
                <ul className="space-y-1">
                  {plan.features && plan.features.length > 0 ? (
                    plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                        <Star className="w-3 h-3 text-primary-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-gray-500 italic">Geen kenmerken gedefinieerd</li>
                  )}
                  {plan.features && plan.features.length > 3 && (
                    <li className="text-xs text-primary-600">+{plan.features.length - 3} meer...</li>
                  )}
                </ul>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${plan.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {plan.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {new Date(plan.created_at).toLocaleDateString('nl-NL')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <button
                    onClick={() => openForm('view', plan)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Bekijken"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openForm('edit', plan)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Bewerken"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id, plan.name)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    plan.is_active 
                      ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                      : 'text-red-600 bg-red-50 hover:bg-red-100'
                  }`}
                  title={plan.is_active ? 'Deactiveren' : 'Activeren'}
                >
                  {plan.is_active ? (
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
            {plans.length === 0 ? 'Geen abonnementsplannen gevonden' : 'Geen abonnementsplannen gevonden met huidige filters'}
          </h3>
          <p className="text-gray-600">
            {plans.length === 0 
              ? 'Voeg je eerste abonnementsplan toe om te beginnen'
              : 'Probeer je zoekfilters aan te passen'
            }
          </p>
          {plans.length === 0 && (
            <button 
              onClick={() => openForm('create')}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Eerste abonnementsplan toevoegen
            </button>
          )}
        </div>
      )}

      {/* Plan Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formMode === 'create' && 'Nieuw Abonnementsplan'}
                      {formMode === 'edit' && 'Abonnementsplan Bewerken'}
                      {formMode === 'view' && 'Abonnementsplan Bekijken'}
                    </h2>
                    <p className="text-gray-600">
                      {formMode === 'create' && 'Voeg een nieuw abonnementsplan toe'}
                      {formMode === 'edit' && 'Wijzig de abonnementsplan eigenschappen'}
                      {formMode === 'view' && 'Bekijk alle abonnementsplan informatie'}
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
                        Naam *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="Bijvoorbeeld: Basis Abonnement"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Prijs (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        disabled={isReadOnly}
                        value={formData.price || 0}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="0.00"
                      />
                    </div>
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
                      placeholder="Beschrijving van het abonnementsplan..."
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Inbegrepen Uren *
                      </label>
                      <input
                        type="number"
                        required
                        disabled={isReadOnly}
                        value={formData.included_hours || 0}
                        onChange={(e) => setFormData({ ...formData, included_hours: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Korting (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={formData.discount_percentage || 0}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Admin Percentage (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={formData.admin_percentage || 15}
                        onChange={(e) => setFormData({ ...formData, admin_percentage: parseFloat(e.target.value) || 15 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="15"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Sorteervolgorde
                    </label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={formData.sort_order || 0}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lagere nummers worden eerst getoond
                    </p>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Kenmerken
                    </label>
                    
                    {!isReadOnly && (
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Nieuw kenmerk toevoegen..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        />
                        <button
                          type="button"
                          onClick={addFeature}
                          className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      {formData.features && formData.features.length > 0 ? (
                        <ul className="space-y-2">
                          {formData.features.map((feature, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-primary-500" />
                                <span className="text-sm">{feature}</span>
                              </div>
                              {!isReadOnly && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => moveFeature(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveFeature(index, 'down')}
                                    disabled={index === formData.features.length - 1}
                                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="p-1 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-2 text-gray-500 text-sm">
                          Geen kenmerken toegevoegd
                        </div>
                      )}
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
                      Abonnementsplan is {formData.is_active ? 'actief' : 'inactief'}
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
                        {formMode === 'create' ? 'Abonnement Aanmaken' : 'Wijzigingen Opslaan'}
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