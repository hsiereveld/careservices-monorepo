'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '@/components/shared/Badge';

interface ServiceCategoryStepProps {
  categories: any[];
  franchise: any;
  onComplete: (data: { selectedCategory: any }) => void;
  locale: string;
}

interface CategoryWithCount {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_scheme?: string;
  service_count: number;
}

export default function ServiceCategoryStep({ 
  categories, 
  franchise, 
  onComplete, 
  locale 
}: ServiceCategoryStepProps) {
  const [categoriesWithCounts, setCategoriesWithCounts] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategoryCounts();
  }, [franchise]);

  const fetchCategoryCounts = async () => {
    if (!franchise?.id) return;

    try {
      setLoading(true);
      
      // Get service counts per category for this franchise
      const { data: services } = await supabase
        .from('services')
        .select('category_id')
        .eq('franchise_id', franchise.id)
        .eq('is_active', true);

      // Count services per category
      const categoryCounts = services?.reduce((acc, service) => {
        if (service.category_id) {
          acc[service.category_id] = (acc[service.category_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Add service count to each category
      const categoriesWithCounts = categories.map(category => ({
        ...category,
        service_count: categoryCounts[category.id] || 0
      }));

      setCategoriesWithCounts(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching category counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (icon: string) => {
    const iconMap: Record<string, string> = {
      medical: '🏥',
      care: '👥',
      household: '🏠',
      technical: '🔧',
      admin: '📋',
      emergency: '🚨',
      cleaning: '🧹',
      gardening: '🌱',
      petcare: '🐕',
      childcare: '👶',
      eldercare: '👴',
      transport: '🚗',
      beauty: '💄',
      fitness: '💪',
      education: '📚'
    };
    return iconMap[icon] || '📋';
  };

  const filteredCategories = categoriesWithCounts.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategorySelect = (category: CategoryWithCount) => {
    onComplete({ selectedCategory: category });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded mb-4"></div>
              <div className="h-3 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder={t('booking.search.categories', locale)}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-12 bg-input-background border border-border rounded-lg focus:ring-2 focus:ring-care-primary focus:border-transparent transition-all duration-200"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          🔍
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <Card 
            key={category.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 border border-border hover:border-care-primary"
            onClick={() => handleCategorySelect(category)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ 
                      backgroundColor: `${category.color_scheme || '#4a9b8e'}20`, 
                      color: category.color_scheme || '#4a9b8e' 
                    }}
                  >
                    {getCategoryIcon(category.icon)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-care-secondary-dark group-hover:text-care-primary transition-colors">
                      {category.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {category.service_count} {t('booking.services.available', locale)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {category.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t('booking.click.to.select', locale)}
                </span>
                <div className="w-6 h-6 rounded-full bg-care-primary-light text-white flex items-center justify-center text-xs font-bold">
                  →
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-care-secondary-dark mb-2">
            {t('booking.search.noResults', locale)}
          </h3>
          <p className="text-muted-foreground">
            {t('booking.search.tryDifferent', locale)}
          </p>
        </div>
      )}
    </div>
  );
} 