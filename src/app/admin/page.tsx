'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card'
import { Button } from '../../components/shared/Button'
import { Badge } from '../../components/shared/Badge'
import { Users, Calendar, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart3, Star, Settings, Plus, Edit, Trash2, Bell, LogOut, Database, Activity, Search } from 'lucide-react'
import { useLogout } from '../../hooks/useLogout'
import DatabaseAnalytics from '../../components/admin/DatabaseAnalytics'

// export const metadata: Metadata = {
//   title: 'Admin Dashboard - Care & Service',
//   description: 'Platform administration and analytics',
// }

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color_scheme?: string;
  commission_rate: number;
  is_active: boolean;
  sort_order: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface ServiceTemplate {
  id: string;
  name: string;
  short_description?: string;
  full_description?: string;
  base_price: number;
  commission_rate: number;
  final_price: number;
  franchise_id?: string;
  professional_id?: string;
  is_active: boolean;
  is_featured?: boolean;
  category_id?: string;
  category?: {
    id: string;
    name: string;
  };
}

interface CommissionRequest {
  id: string;
  professional_id: string;
  service_id: string;
  franchise_id: string;
  current_commission_rate: number;
  requested_commission_rate: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  professional?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  service?: {
    name: string;
  };
  franchise?: {
    name: string;
    display_name: string;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const [commissionRequests, setCommissionRequests] = useState<CommissionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServiceTemplate | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const { logout, isLoggingOut } = useLogout();

  // Laad categorieën
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Laad services
  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  // Laad commission requests
  const loadCommissionRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/commission-requests');
      if (!response.ok) throw new Error('Failed to fetch commission requests');
      const data = await response.json();
      setCommissionRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commission requests');
    } finally {
      setLoading(false);
    }
  };

  // Laad data bij tab-wissel
  useEffect(() => {
    if (activeTab === 'categories') {
      loadCategories();
    } else if (activeTab === 'services') {
      loadServices();
    } else if (activeTab === 'commissions') {
      loadCommissionRequests();
    }
  }, [activeTab]);

  // Verwijder categorie
  const deleteCategory = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze categorie wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      await loadCategories(); // Herlaad lijst
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  // Verwijder service
  const deleteService = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze service wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`/api/admin/services?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete service');
      await loadServices(); // Herlaad lijst
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  // Bewerk service
  const editService = (service: ServiceTemplate) => {
    setEditingService(service);
    setShowServiceModal(true);
  };

  // Bewerk categorie
  const editCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  // Sluit modals
  const closeModals = () => {
    setShowServiceModal(false);
    setShowCategoryModal(false);
    setEditingService(null);
    setEditingCategory(null);
  };

  // Update service
  const updateService = async (serviceData: Partial<ServiceTemplate>) => {
    if (!editingService) return;
    
    try {
      const response = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...serviceData, id: editingService.id }),
      });
      
      if (!response.ok) throw new Error('Failed to update service');
      
      closeModals();
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
    }
  };

  // Update categorie
  const updateCategory = async (categoryData: Partial<Category>) => {
    if (!editingCategory) return;
    
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...categoryData, id: editingCategory.id }),
      });
      
      if (!response.ok) throw new Error('Failed to update category');
      
      closeModals();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  // Approve/Reject commission request
  const handleCommissionRequest = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const response = await fetch('/api/admin/commission-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status, 
          review_notes: notes,
          reviewed_by: 'current-admin-id' // TODO: Get from auth context
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update commission request');
      
      await loadCommissionRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update commission request');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'database', label: 'Database Analytics', icon: Database },
    { id: 'categories', label: 'Categorieën', icon: Settings },
    { id: 'services', label: 'Services', icon: Star },
    { id: 'commissions', label: 'Commissies', icon: DollarSign },
  ];

  const renderDashboardContent = () => (
    <>
      {/* Database Analytics Component */}
      <DatabaseAnalytics />
    </>
  );

  const renderCategoriesContent = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Service Categorieën</CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Categorie
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">Laden...</div>
        ) : (
          <div className="space-y-4">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Geen categorieën gevonden. Voeg de eerste categorie toe!
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {category.image_url && (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{category.name}</h3>
                        {category.icon && (
                          <span className="text-sm text-gray-500">({category.icon})</span>
                        )}
                        {category.color_scheme && (
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color_scheme }}
                          />
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>Commissie: {category.commission_rate}%</span>
                        <span>Volgorde: {category.sort_order}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={category.is_active ? "secondary" : "default"}>
                      {category.is_active ? 'Actief' : 'Inactief'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderServicesContent = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Service Catalog</CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Service
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">Laden...</div>
        ) : (
          <div className="space-y-4">
            {services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Geen services gevonden. Voeg de eerste service toe!
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      {service.is_featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {service.short_description}
                    </p>
                    
                    {/* Pricing Info */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                      <span>Basis: €{service.base_price || 0}</span>
                      <span>Commissie: {service.commission_rate}%</span>
                      <span>Totaal: €{service.final_price || 0}</span>
                    </div>
                    
                    {/* Category & Professional Info */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      {service.category && (
                        <span>Categorie: {service.category.name}</span>
                      )}
                      {service.professional_id && (
                        <span>Professional: {service.professional_id.substring(0, 8)}...</span>
                      )}
                      {service.franchise_id && (
                        <span>Franchise: {service.franchise_id.substring(0, 8)}...</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={service.is_active ? "secondary" : "default"}>
                      {service.is_active ? 'Actief' : 'Inactief'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => editService(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteService(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCommissionsContent = () => (
    <Card>
      <CardHeader>
        <CardTitle>Commission Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">Laden...</div>
        ) : (
          <div className="space-y-4">
            {commissionRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Geen commissie aanvragen gevonden.
              </div>
            ) : (
              commissionRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">
                          {request.professional?.first_name} {request.professional?.last_name}
                        </h3>
                        <Badge variant={
                          request.status === 'pending' ? "default" :
                          request.status === 'approved' ? "secondary" : "default"
                        }>
                          {request.status === 'pending' ? 'Wachtend' :
                           request.status === 'approved' ? 'Goedgekeurd' : 'Afgewezen'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Service:</strong> {request.service?.name}</p>
                        <p><strong>Email:</strong> {request.professional?.email}</p>
                        <p><strong>Huidige commissie:</strong> {request.current_commission_rate}%</p>
                        <p><strong>Gewenste commissie:</strong> {request.requested_commission_rate}%</p>
                        <p><strong>Reden:</strong> {request.reason}</p>
                        {request.franchise && (
                          <p><strong>Franchise:</strong> {request.franchise.display_name}</p>
                        )}
                      </div>
                      
                      {request.review_notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <strong>Review notities:</strong> {request.review_notes}
                        </div>
                      )}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const notes = prompt('Review notities (optioneel):');
                            handleCommissionRequest(request.id, 'approved', notes || undefined);
                          }}
                        >
                          Goedkeuren
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const notes = prompt('Reden voor afwijzing:');
                            if (notes) {
                              handleCommissionRequest(request.id, 'rejected', notes);
                            }
                          }}
                        >
                          Afwijzen
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Aangevraagd op: {new Date(request.created_at).toLocaleDateString('nl-NL')}
                    {request.reviewed_at && (
                      <span> • Beoordeeld op: {new Date(request.reviewed_at).toLocaleDateString('nl-NL')}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button size="sm">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Meldingen
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Instellingen
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Uitloggen...' : 'Uitloggen'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-accent-500 text-accent-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboardContent()}
        {activeTab === 'database' && <DatabaseAnalytics />}
        {activeTab === 'categories' && renderCategoriesContent()}
        {activeTab === 'services' && renderServicesContent()}
        {activeTab === 'commissions' && renderCommissionsContent()}
      </main>
    </div>
  )
} 