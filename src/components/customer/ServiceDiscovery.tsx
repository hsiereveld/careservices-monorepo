'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Clock,
  Euro,
  Users,
  Heart,
  Plus,
  SlidersHorizontal,
  Zap,
  Award,
  TrendingUp,
  Eye
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  short_description: string;
  base_price: number;
  image_url?: string;
  service_category: {
    id: string;
    name: string;
    icon?: string;
  };
  providers?: {
    count: number;
    avg_rating: number;
    min_price: number;
    max_price: number;
  };
  is_popular?: boolean;
  is_recommended?: boolean;
}

interface ServiceDiscoveryProps {
  onServiceSelected?: (service: Service) => void;
}

export default function ServiceDiscovery({ onServiceSelected }: ServiceDiscoveryProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [recommendations, setRecommendations] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 200 });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price' | 'rating' | 'popularity'>('relevance');

  useEffect(() => {
    fetchServices();
    fetchRecommendations();
  }, []);

  const fetchServices = async () => {
    try {
      // This would be replaced with actual API call
      const mockServices: Service[] = [
        {
          id: '1',
          name: 'Huisschoonmaak',
          short_description: 'Professionele schoonmaak van je hele huis',
          base_price: 45,
          service_category: { id: '1', name: 'Schoonmaak', icon: '🧹' },
          providers: { count: 12, avg_rating: 4.6, min_price: 35, max_price: 55 },
          is_popular: true
        },
        {
          id: '2',
          name: 'Tuinonderhoud',
          short_description: 'Onderhoud van je tuin en planten',
          base_price: 35,
          service_category: { id: '2', name: 'Tuin', icon: '🌱' },
          providers: { count: 8, avg_rating: 4.4, min_price: 25, max_price: 45 },
          is_recommended: true
        },
        {
          id: '3',
          name: 'Huisdierenzorg',
          short_description: 'Oppassen en verzorgen van je huisdieren',
          base_price: 25,
          service_category: { id: '3', name: 'Huisdieren', icon: '🐕' },
          providers: { count: 15, avg_rating: 4.8, min_price: 20, max_price: 35 }
        },
        {
          id: '4',
          name: 'Boodschappen',
          short_description: 'Boodschappen doen en thuisbezorgen',
          base_price: 15,
          service_category: { id: '4', name: 'Boodschappen', icon: '🛒' },
          providers: { count: 6, avg_rating: 4.2, min_price: 10, max_price: 20 },
          is_popular: true
        }
      ];
      setServices(mockServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      // Mock recommendations based on user history
      const mockRecommendations = [
        {
          id: '5',
          name: 'Auto Wassen',
          short_description: 'Professionele autowasservice bij je thuis',
          base_price: 30,
          service_category: { id: '5', name: 'Auto', icon: '🚗' },
          is_recommended: true
        },
        {
          id: '6',
          name: 'Ramen Lappen',
          short_description: 'Kristalheldere ramen binnen en buiten',
          base_price: 20,
          service_category: { id: '1', name: 'Schoonmaak', icon: '🧹' },
          is_recommended: true
        }
      ];
      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const categories = Array.from(new Set(services.map(s => s.service_category.name)))
    .map(name => services.find(s => s.service_category.name === name)?.service_category)
    .filter(Boolean);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.short_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || service.service_category.id === selectedCategory;
    
    const matchesPrice = service.base_price >= priceRange.min && service.base_price <= priceRange.max;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.base_price - b.base_price;
      case 'rating':
        return (b.providers?.avg_rating || 0) - (a.providers?.avg_rating || 0);
      case 'popularity':
        return (b.providers?.count || 0) - (a.providers?.count || 0);
      default:
        return 0;
    }
  });

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
      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              Aanbevolen voor jou
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((service) => (
                <div key={service.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{service.name}</h3>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Award className="h-3 w-3 mr-1" />
                      Aanbevolen
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{service.short_description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-600">{formatCurrency(service.base_price)}</span>
                    <Button size="sm" onClick={() => onServiceSelected?.(service)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Boeken
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Service Zoeken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
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

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Alle Categorieën
              </Button>
              {categories.map((category) => (
                <Button
                  key={category!.id}
                  variant={selectedCategory === category!.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category!.id)}
                >
                  {category!.icon} {category!.name}
                </Button>
              ))}
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters {showFilters ? 'Verbergen' : 'Tonen'}
              </Button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="relevance">Relevantie</option>
                <option value="price">Prijs (laag-hoog)</option>
                <option value="rating">Beoordeling</option>
                <option value="popularity">Populariteit</option>
              </select>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prijsbereik: {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
                  </label>
                  <div className="flex space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedServices.map((service) => (
          <Card key={service.id} className="relative hover:shadow-lg transition-shadow">
            {service.is_popular && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Populair
                </Badge>
              </div>
            )}
            
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{service.name}</h3>
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="mb-2">
                  {service.service_category.icon} {service.service_category.name}
                </Badge>
                <p className="text-gray-600 text-sm">{service.short_description}</p>
              </div>
              
              {service.providers && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Beschikbare professionals:</span>
                    <span className="font-medium">{service.providers.count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Gemiddelde beoordeling:</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{service.providers.avg_rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Prijsbereik:</span>
                    <span className="font-medium">
                      {formatCurrency(service.providers.min_price)} - {formatCurrency(service.providers.max_price)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500">Vanaf</span>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(service.base_price)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => onServiceSelected?.(service)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Boeken
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedServices.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen services gevonden</h3>
          <p className="text-gray-600 mb-4">Probeer je zoekcriteria aan te passen</p>
          <Button onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            setPriceRange({ min: 0, max: 200 });
          }}>
            Filters Resetten
          </Button>
        </div>
      )}
    </div>
  );
} 