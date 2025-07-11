'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { 
  Settings, 
  Edit, 
  Trash2, 
  Euro, 
  BarChart3, 
  Star, 
  Eye, 
  EyeOff,
  TrendingUp,
  Users
} from 'lucide-react';

interface ProfessionalService {
  id: string;
  custom_price?: number;
  is_active: boolean;
  created_at: string;
  service: {
    id: string;
    name: string;
    short_description: string;
    base_price: number;
    service_category: {
      id: string;
      name: string;
      commission_rate: number;
    };
  };
}

interface MyServicesProps {
  onServiceUpdated?: () => void;
}

export default function MyServices({ onServiceUpdated }: MyServicesProps) {
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<number | ''>('');

  useEffect(() => {
    fetchMyServices();
  }, []);

  const fetchMyServices = async () => {
    try {
      const response = await fetch('/api/professional/services?type=my-services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching my services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async (serviceId: string, updates: { custom_price?: number; is_active?: boolean }) => {
    try {
      const response = await fetch('/api/professional/services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: serviceId,
          ...updates,
        }),
      });

      if (response.ok) {
        const updatedService = await response.json();
        setServices(prev => prev.map(service => 
          service.id === serviceId ? updatedService : service
        ));
        setEditingService(null);
        setCustomPrice('');
        onServiceUpdated?.();
      } else {
        console.error('Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!confirm('Weet je zeker dat je deze service wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/professional/services?id=${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setServices(prev => prev.filter(service => service.id !== serviceId));
        onServiceUpdated?.();
      } else {
        console.error('Failed to remove service');
      }
    } catch (error) {
      console.error('Error removing service:', error);
    }
  };

  const startEditing = (service: ProfessionalService) => {
    setEditingService(service.id);
    setCustomPrice(service.custom_price || service.service.base_price);
  };

  const cancelEditing = () => {
    setEditingService(null);
    setCustomPrice('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateCommission = (price: number, commissionRate: number) => {
    return (price * commissionRate) / 100;
  };

  const calculateNetEarnings = (price: number, commissionRate: number) => {
    return price - calculateCommission(price, commissionRate);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Mijn services laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Mijn Services ({services.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {services.filter(s => s.is_active).length} actief
              </span>
              <Badge variant="secondary">
                {services.filter(s => !s.is_active).length} inactief
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Services List */}
      <div className="grid grid-cols-1 gap-4">
        {services.map((professionalService) => {
          const service = professionalService.service;
          const currentPrice = professionalService.custom_price || service.base_price;
          const commissionRate = service.service_category.commission_rate;
          const isEditing = editingService === professionalService.id;

          return (
            <Card key={professionalService.id} className={`${!professionalService.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <Badge variant="secondary">{service.service_category.name}</Badge>
                      {professionalService.is_active ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Eye className="h-3 w-3 mr-1" />
                          Actief
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactief
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{service.short_description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500">Basisprijs</span>
                        <p className="font-medium">{formatCurrency(service.base_price)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500">Mijn prijs</span>
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value ? parseFloat(e.target.value) : '')}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                              step="0.01"
                            />
                            <span className="text-xs text-gray-500">€</span>
                          </div>
                        ) : (
                          <p className="font-medium text-blue-600">
                            {formatCurrency(currentPrice)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500">Commissie ({commissionRate}%)</span>
                        <p className="font-medium text-red-600">
                          -{formatCurrency(calculateCommission(currentPrice, commissionRate))}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500">Netto inkomsten</span>
                        <p className="font-medium text-green-600">
                          {formatCurrency(calculateNetEarnings(currentPrice, commissionRate))}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateService(professionalService.id, { 
                            custom_price: typeof customPrice === 'number' ? customPrice : undefined 
                          })}
                        >
                          Opslaan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          Annuleren
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(professionalService)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateService(professionalService.id, { 
                            is_active: !professionalService.is_active 
                          })}
                        >
                          {professionalService.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveService(professionalService.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen services</h3>
          <p className="text-gray-600 mb-4">Voeg services toe aan je portfolio om te beginnen</p>
          <Button>
            Services Toevoegen
          </Button>
        </div>
      )}
    </div>
  );
} 