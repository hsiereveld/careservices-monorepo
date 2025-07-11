'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Plus, Search, Filter, Euro, Users, Star, CheckCircle } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  short_description: string;
  base_price: number;
  commission_rate: number;
  is_offered: boolean;
  custom_price?: number;
  professional_active: boolean;
  service_category: {
    id: string;
    name: string;
    icon?: string;
    color_scheme?: string;
  };
}

interface ServiceCatalogProps {
  onServiceAdded?: () => void;
}

export default function ServiceCatalog({ onServiceAdded }: ServiceCatalogProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/professional/services?type=available');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (serviceId: string) => {
    try {
      const response = await fetch('/api/professional/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
        }),
      });

      if (response.ok) {
        // Update the local state
        setServices(prev => prev.map(service => 
          service.id === serviceId 
            ? { ...service, is_offered: true, professional_active: true }
            : service
        ));
        onServiceAdded?.();
      } else {
        console.error('Failed to add service');
      }
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.short_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || service.service_category.id === selectedCategory;
    
    const matchesAvailability = !showOnlyAvailable || !service.is_offered;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const categories = Array.from(new Set(services.map(s => s.service_category.name)))
    .map(name => services.find(s => s.service_category.name === name)?.service_category)
    .filter(Boolean);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Services laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Service Catalogus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Alle Categorieën</option>
                {categories.map((category) => (
                  <option key={category!.id} value={category!.id}>
                    {category!.name}
                  </option>
                ))}
              </select>
              <Button
                variant={showOnlyAvailable ? "default" : "outline"}
                onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Alleen Beschikbaar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card key={service.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {service.service_category.name}
                  </Badge>
                </div>
                {service.is_offered && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Actief
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">{service.short_description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Basisprijs:</span>
                  <span className="font-medium">{formatCurrency(service.base_price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Commissie:</span>
                  <span className="font-medium">{service.commission_rate}%</span>
                </div>
                {service.custom_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Mijn prijs:</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(service.custom_price)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>Populair</span>
                </div>
                
                {service.is_offered ? (
                  <Button variant="outline" size="sm" disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Toegevoegd
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => handleAddService(service.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Toevoegen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen services gevonden</h3>
          <p className="text-gray-600">Probeer je zoekcriteria aan te passen</p>
        </div>
      )}
    </div>
  );
} 