'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { SearchSuggestion } from '@/packages/types/service-catalog.types';

export default function ServiceSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchServices = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        // Search in service templates
        const { data: templateResults, error: templateError } = await supabase
          .from('service_templates')
          .select(`
            id,
            name,
            name_nl,
            name_en,
            name_es,
            category_id,
            service_categories!inner(name, name_nl, name_en, name_es)
          `)
          .or(`name.ilike.%${query}%,name_nl.ilike.%${query}%,name_en.ilike.%${query}%,name_es.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(5);

        if (templateError) throw templateError;

        // Search in professional services
        const { data: serviceResults, error: serviceError } = await supabase
          .from('professional_services')
          .select(`
            id,
            custom_name,
            professional:profiles!inner(first_name, last_name, business_name)
          `)
          .or(`custom_name.ilike.%${query}%`)
          .eq('is_active', true)
          .eq('is_approved', true)
          .limit(5);

        if (serviceError) throw serviceError;

        // Combine and format results
        const combinedSuggestions: SearchSuggestion[] = [
          ...templateResults.map((template) => ({
            type: 'service' as const,
            id: template.id,
            name: template.name,
            name_nl: template.name_nl,
            name_en: template.name_en,
            name_es: template.name_es,
            relevance: 1.0
          })),
          ...serviceResults.map((service) => ({
            type: 'provider' as const,
            id: service.id,
            name: service.custom_name || 'Custom Service',
            name_nl: service.custom_name || 'Aangepaste Dienst',
            name_en: service.custom_name || 'Custom Service',
            name_es: service.custom_name || 'Servicio Personalizado',
            relevance: 0.8
          }))
        ];

        // Sort by relevance and limit to 8 results
        const sortedSuggestions = combinedSuggestions
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 8);

        setSuggestions(sortedSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchServices, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, supabase]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'service') {
      router.push(`/booking/search?q=${encodeURIComponent(suggestion.name_nl)}`);
    } else {
      router.push(`/booking/providers/${suggestion.id}`);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/booking/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'service':
        return '🔧';
      case 'category':
        return '📂';
      case 'provider':
        return '👤';
      default:
        return '🔍';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder="Zoek naar diensten, professionals of categorieën..."
          className="w-full px-4 py-3 pl-12 pr-16 text-gray-900 bg-white rounded-lg shadow-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent placeholder-gray-500"
        />
        
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-accent-600 text-white px-4 py-1.5 rounded-md hover:bg-accent-700 transition-colors text-sm font-medium"
        >
          Zoeken
        </button>

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                index === selectedIndex ? 'bg-accent-50 border-l-4 border-accent-600' : ''
              }`}
            >
              <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.name_nl}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {suggestion.type === 'service' ? 'Dienst' : 
                   suggestion.type === 'category' ? 'Categorie' : 'Professional'}
                </div>
              </div>
              {index === selectedIndex && (
                <svg className="w-4 h-4 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
          
          {/* View all results */}
          <div className="border-t border-gray-200">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-3 text-left text-accent-600 hover:bg-accent-50 transition-colors text-sm font-medium"
            >
              Bekijk alle resultaten voor "{query}"
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {showSuggestions && !loading && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4">
          <div className="text-center text-gray-500">
            <p>Geen resultaten gevonden voor "{query}"</p>
            <p className="text-sm mt-1">Probeer andere zoektermen</p>
          </div>
        </div>
      )}
    </div>
  );
} 