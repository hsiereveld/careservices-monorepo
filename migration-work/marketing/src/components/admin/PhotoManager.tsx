import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Search, 
  ExternalLink, 
  Check, 
  X, 
  Loader2, 
  Image as ImageIcon,
  Globe,
  Upload,
  Eye,
  Save,
  RefreshCw,
  Tag,
  Filter
} from 'lucide-react';

interface PhotoSource {
  id: string;
  name: string;
  baseUrl: string;
  searchUrl: string;
  description: string;
}

interface PhotoResult {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  source: string;
  photographer?: string;
  width?: number;
  height?: number;
}

interface PhotoManagerProps {
  currentImageUrl?: string;
  onImageSelect: (imageUrl: string) => void;
  onClose: () => void;
  searchQuery?: string;
  title?: string;
}

export function PhotoManager({ 
  currentImageUrl, 
  onImageSelect, 
  onClose, 
  searchQuery = '', 
  title = 'Foto Selecteren' 
}: PhotoManagerProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'search' | 'url' | 'collection'>(currentImageUrl ? 'current' : 'search');
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<PhotoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState(currentImageUrl || '');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  // Photo sources configuration
  const photoSources: PhotoSource[] = [
    {
      id: 'pexels',
      name: 'Pexels',
      baseUrl: 'https://images.pexels.com',
      searchUrl: 'https://www.pexels.com/search/',
      description: 'Gratis stock foto\'s van hoge kwaliteit'
    },
    {
      id: 'unsplash',
      name: 'Unsplash',
      baseUrl: 'https://images.unsplash.com',
      searchUrl: 'https://unsplash.com/s/photos/',
      description: 'Professionele foto\'s van fotografen wereldwijd'
    },
    {
      id: 'pixabay',
      name: 'Pixabay',
      baseUrl: 'https://pixabay.com',
      searchUrl: 'https://pixabay.com/images/search/',
      description: 'Gratis afbeeldingen en video\'s die je overal kunt gebruiken'
    }
  ];

  // Fotocategorieën
  const photoCategories = [
    { id: 'all', name: 'Alle categorieën' },
    { id: 'huishoudelijk', name: 'Huishoudelijk' },
    { id: 'zorg', name: 'Zorg & Persoonlijk' },
    { id: 'transport', name: 'Transport' },
    { id: 'medisch', name: 'Medisch' },
    { id: 'administratief', name: 'Administratief' },
    { id: 'property', name: 'Property Management' },
    { id: 'huisdieren', name: 'Huisdieren' },
    { id: 'algemeen', name: 'Algemeen' }
  ];

  // Predefined photo collections for common service categories
  const predefinedPhotos: Record<string, PhotoResult[]> = {
    huishoudelijk: [
      {
        id: 'house-cleaning-1',
        url: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Huishoudelijke hulp - schoonmaken',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'house-cleaning-2',
        url: 'https://images.pexels.com/photos/4107120/pexels-photo-4107120.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4107120/pexels-photo-4107120.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Professionele schoonmaak service',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'house-cleaning-3',
        url: 'https://images.pexels.com/photos/4107098/pexels-photo-4107098.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4107098/pexels-photo-4107098.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Schoonmaak van keuken',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'house-cleaning-4',
        url: 'https://images.pexels.com/photos/4107099/pexels-photo-4107099.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4107099/pexels-photo-4107099.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Schoonmaak van badkamer',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'house-cleaning-5',
        url: 'https://images.pexels.com/photos/5591581/pexels-photo-5591581.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/5591581/pexels-photo-5591581.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Stofzuigen van tapijt',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'house-cleaning-6',
        url: 'https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Schoonmaakproducten',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'house-cleaning-7',
        url: 'https://images.pexels.com/photos/4108718/pexels-photo-4108718.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4108718/pexels-photo-4108718.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Schoonmaak van ramen',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'house-cleaning-8',
        url: 'https://images.pexels.com/photos/4108726/pexels-photo-4108726.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4108726/pexels-photo-4108726.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Schoonmaak van vloer',
        source: 'Pexels',
        photographer: 'Pexels'
      }
    ],
    zorg: [
      {
        id: 'elderly-care-1',
        url: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Ouderenzorg en ondersteuning',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'elderly-care-2',
        url: 'https://images.pexels.com/photos/7551617/pexels-photo-7551617.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/7551617/pexels-photo-7551617.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Ouderenzorg thuis',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'personal-care-1',
        url: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Persoonlijke zorg en begeleiding',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'personal-care-2',
        url: 'https://images.pexels.com/photos/7551670/pexels-photo-7551670.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/7551670/pexels-photo-7551670.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Zorg voor ouderen',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'elderly-care-3',
        url: 'https://images.pexels.com/photos/7551741/pexels-photo-7551741.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/7551741/pexels-photo-7551741.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Ouderen activiteiten',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'elderly-care-4',
        url: 'https://images.pexels.com/photos/7551754/pexels-photo-7551754.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/7551754/pexels-photo-7551754.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Ouderen gezelschap',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'elderly-care-5',
        url: 'https://images.pexels.com/photos/7551623/pexels-photo-7551623.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/7551623/pexels-photo-7551623.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Ouderen ondersteuning',
        source: 'Pexels',
        photographer: 'Pexels'
      }
    ],
    transport: [
      {
        id: 'transport-1',
        url: 'https://images.pexels.com/photos/1118448/pexels-photo-1118448.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/1118448/pexels-photo-1118448.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Transport en begeleiding',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'transport-2',
        url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Auto transport',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'transport-3',
        url: 'https://images.pexels.com/photos/2526128/pexels-photo-2526128.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/2526128/pexels-photo-2526128.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Vervoer naar ziekenhuis',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'transport-4',
        url: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Auto op de weg',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'transport-5',
        url: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Auto dashboard',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'transport-6',
        url: 'https://images.pexels.com/photos/1164778/pexels-photo-1164778.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/1164778/pexels-photo-1164778.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Personen in auto',
        source: 'Pexels',
        photographer: 'Pexels'
      }
    ],
    medisch: [
      {
        id: 'medical-1',
        url: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Medische begeleiding',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'medical-2',
        url: 'https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Doktersbezoek',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'medical-3',
        url: 'https://images.pexels.com/photos/7088530/pexels-photo-7088530.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/7088530/pexels-photo-7088530.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Medische ondersteuning',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'medical-4',
        url: 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Ziekenhuis',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'medical-5',
        url: 'https://images.pexels.com/photos/3376799/pexels-photo-3376799.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3376799/pexels-photo-3376799.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Medisch consult',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'medical-6',
        url: 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Medicatie',
        source: 'Pexels',
        photographer: 'Pexels'
      }
    ],
    administratief: [
      {
        id: 'admin-1',
        url: 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Administratieve ondersteuning',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'admin-2',
        url: 'https://images.pexels.com/photos/4386296/pexels-photo-4386296.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4386296/pexels-photo-4386296.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Administratie en papierwerk',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'admin-3',
        url: 'https://images.pexels.com/photos/4386294/pexels-photo-4386294.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/4386294/pexels-photo-4386294.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Belastingaangifte hulp',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'admin-4',
        url: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Administratie op laptop',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'admin-5',
        url: 'https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Documenten en administratie',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'admin-6',
        url: 'https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Administratieve hulp',
        source: 'Pexels',
        photographer: 'Pexels'
      }
    ],
    property: [
      {
        id: 'property-1',
        url: 'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Property management',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'property-2',
        url: 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Huisbeheer',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'property-3',
        url: 'https://images.pexels.com/photos/2079234/pexels-photo-2079234.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/2079234/pexels-photo-2079234.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Onderhoud van woning',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'property-4',
        url: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Huis exterieur',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'property-5',
        url: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Huis interieur',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'property-6',
        url: 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Sleutels van huis',
        source: 'Pexels',
        photographer: 'Pexels'
      }
    ],
    huisdieren: [
      {
        id: 'pets-1',
        url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Huisdierenzorg',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'pets-2',
        url: 'https://images.pexels.com/photos/1633522/pexels-photo-1633522.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/1633522/pexels-photo-1633522.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Hondenverzorging',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'pets-3',
        url: 'https://images.pexels.com/photos/2061057/pexels-photo-2061057.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/2061057/pexels-photo-2061057.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Kattenverzorging',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'pets-4',
        url: 'https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Hond wandelen',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'pets-5',
        url: 'https://images.pexels.com/photos/46024/pexels-photo-46024.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/46024/pexels-photo-46024.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Kat verzorging',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'pets-6',
        url: 'https://images.pexels.com/photos/1741205/pexels-photo-1741205.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/1741205/pexels-photo-1741205.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Huisdier verzorging',
        source: 'Pexels',
        photographer: 'Pexels'
      }
    ],
    // Algemene categorie voor als er geen specifieke match is
    algemeen: [
      {
        id: 'general-1',
        url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Algemene service',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'general-2',
        url: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Professionele service',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'general-3',
        url: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Kwaliteitsservice',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'general-4',
        url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Professionele ondersteuning',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'general-5',
        url: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Zakelijke dienstverlening',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'general-6',
        url: 'https://images.pexels.com/photos/3182781/pexels-photo-3182781.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3182781/pexels-photo-3182781.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Klantenservice',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'general-7',
        url: 'https://images.pexels.com/photos/3182746/pexels-photo-3182746.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3182746/pexels-photo-3182746.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Professionele dienstverlening',
        source: 'Pexels',
        photographer: 'Pexels'
      },
      {
        id: 'general-8',
        url: 'https://images.pexels.com/photos/3182755/pexels-photo-3182755.jpeg?auhref=compress&cs=tinysrgb&w=600',
        thumbnail: 'https://images.pexels.com/photos/3182755/pexels-photo-3182755.jpeg?auhref=compress&cs=tinysrgb&w=300',
        alt: 'Dienstverlening',
        source: 'Pexels',
        photographer: 'Pexels'
      }
    ]
  };

  // Mapping van Nederlandse zoektermen naar categorieën
  const searchTermMapping: Record<string, string[]> = {
    'huishoudelijk': ['huishoudelijk'],
    'schoonmaak': ['huishoudelijk'],
    'huis': ['huishoudelijk', 'property'],
    'woning': ['property', 'huishoudelijk'],
    'zorg': ['zorg'],
    'ouderen': ['zorg'],
    'senior': ['zorg'],
    'persoonlijk': ['zorg'],
    'transport': ['transport'],
    'vervoer': ['transport'],
    'auto': ['transport'],
    'medisch': ['medisch'],
    'dokter': ['medisch'],
    'ziekenhuis': ['medisch'],
    'administratie': ['administratief'],
    'admin': ['administratief'],
    'papierwerk': ['administratief'],
    'belasting': ['administratief'],
    'property': ['property'],
    'onderhoud': ['property'],
    'beheer': ['property'],
    'huisdier': ['huisdieren'],
    'dier': ['huisdieren'],
    'hond': ['huisdieren'],
    'kat': ['huisdieren'],
    'oppas': ['huisdieren', 'zorg'],
    'categorie': ['algemeen'],
    'dienst': ['algemeen'],
    'service': ['algemeen']
  };

  // Get relevant photos based on search query and category
  const getRelevantPhotos = (query: string, category: string): PhotoResult[] => {
    // Als een specifieke categorie is geselecteerd, toon alleen die categorie
    if (category !== 'all') {
      return predefinedPhotos[category] || [];
    }
    
    if (!query.trim()) {
      // Als er geen zoekterm is, toon een mix van alle categorieën
      return Object.values(predefinedPhotos).flatMap(photos => photos.slice(0, 2));
    }

    const normalizedQuery = query.toLowerCase();
    const relevantCategories = new Set<string>();
    
    // Zoek naar matches in de zoekterm mapping
    Object.entries(searchTermMapping).forEach(([term, categories]) => {
      if (normalizedQuery.includes(term)) {
        categories.forEach(category => relevantCategories.add(category));
      }
    });
    
    // Als er geen specifieke categorieën gevonden zijn, gebruik algemeen
    if (relevantCategories.size === 0) {
      relevantCategories.add('algemeen');
      
      // Probeer ook een fuzzy match te vinden
      for (const [term, categories] of Object.entries(searchTermMapping)) {
        if (term.length > 3 && (normalizedQuery.includes(term.substring(0, 4)) || term.includes(normalizedQuery.substring(0, 4)))) {
          categories.forEach(category => relevantCategories.add(category));
        }
      }
    }
    
    // Verzamel foto's uit alle relevante categorieën
    let relevantPhotos: PhotoResult[] = [];
    relevantCategories.forEach(category => {
      if (predefinedPhotos[category]) {
        relevantPhotos = [...relevantPhotos, ...predefinedPhotos[category]];
      }
    });
    
    // Als er nog steeds geen foto's zijn, toon algemene foto's
    if (relevantPhotos.length === 0) {
      relevantPhotos = [...predefinedPhotos.algemeen];
    }
    
    return relevantPhotos;
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      // Simuleer een korte laadtijd voor een betere gebruikerservaring
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Haal relevante foto's op basis van de zoekterm en categorie
      const relevantPhotos = getRelevantPhotos(searchTerm, selectedCategory);
      
      if (relevantPhotos.length === 0) {
        setError(`Geen foto's gevonden voor "${searchTerm}". Probeer een andere zoekterm of categorie.`);
      }
      
      setSearchResults(relevantPhotos);
    } catch (error) {
      console.error('Search error:', error);
      setError('Er is een fout opgetreden bij het zoeken naar foto\'s. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    onImageSelect(imageUrl);
    onClose();
  };

  const handleCustomUrlSubmit = () => {
    if (customUrl.trim()) {
      handleImageSelect(customUrl.trim());
    }
  };

  const handlePreview = () => {
    if (customUrl.trim()) {
      setPreviewUrl(customUrl);
    } else {
      setError('Voer een geldige URL in om te bekijken');
    }
  };

  // Voer automatisch een zoekopdracht uit bij het laden van de component
  useEffect(() => {
    if (activeTab === 'search') {
      handleSearch();
    }
  }, [activeTab, selectedCategory]);

  // Voer een nieuwe zoekopdracht uit wanneer de zoekterm verandert
  useEffect(() => {
    if (searchQuery && activeTab === 'search' && !searchTerm) {
      setSearchTerm(searchQuery);
      handleSearch();
    }
  }, [searchQuery]);

  // Collectie tab - alle foto's gegroepeerd per categorie
  const renderCollectionTab = () => {
    return (
      <div className="space-y-8">
        <h3 className="text-lg font-semibold text-gray-900">Fotocollectie</h3>
        
        {photoCategories.slice(1).map((category) => (
          <div key={category.id} className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Tag className="w-4 h-4 text-primary-600" />
              <span>{category.name}</span>
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {predefinedPhotos[category.id]?.slice(0, 4).map((photo) => (
                <div
                  key={photo.id}
                  className="group relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => handleImageSelect(photo.url)}
                >
                  <img 
                    src={photo.thumbnail}
                    alt={photo.alt}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white rounded-full p-2">
                        <Check className="w-4 h-4 text-primary-600" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {predefinedPhotos[category.id]?.length > 4 && (
              <button
                onClick={() => {
                  setSelectedCategory(category.id);
                  setActiveTab('search');
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
              >
                <span>Meer {category.name.toLowerCase()} foto's bekijken</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600">Selecteer een foto uit onze collectie of voeg een eigen URL toe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'current'
                ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Huidige Foto</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'collection'
                ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Fotocollectie</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Foto Zoeken</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'url'
                ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Eigen URL</span>
            </div>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
            <X className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'current' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Huidige Foto</h3>
              {currentImageUrl ? (
                <div className="text-center">
                  <div className="inline-block relative">
                    <img 
                      src={currentImageUrl}
                      alt="Huidige foto"
                      className="max-w-md max-h-64 object-cover rounded-xl shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=400';
                      }}
                    />
                  </div>
                  <p className="mt-4 text-sm text-gray-600 break-all">{currentImageUrl}</p>
                  <button
                    onClick={() => handleImageSelect(currentImageUrl)}
                    className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Check className="w-4 h-4" />
                    <span>Huidige Foto Behouden</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Geen foto ingesteld</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collection' && renderCollectionTab()}

          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Controls */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Zoek naar foto's (bijv. 'huishoudelijk', 'zorg', 'transport')"
                    />
                  </div>
                  
                  <div className="relative">
                    <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
                    >
                      {photoCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 md:w-auto w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Zoeken</span>
                  </button>
                </div>

                {/* Populaire zoektermen */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 mr-2">Populair:</span>
                  {['huishoudelijk', 'zorg', 'transport', 'medisch', 'huisdieren', 'administratief', 'property'].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchTerm(term);
                        setTimeout(() => handleSearch(), 100);
                      }}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results */}
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Foto's zoeken...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {searchResults.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                      onClick={() => handleImageSelect(photo.url)}
                    >
                      <img 
                        src={photo.thumbnail}
                        alt={photo.alt}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white rounded-full p-2">
                            <Check className="w-4 h-4 text-primary-600" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs truncate">{photo.alt}</p>
                        {photo.photographer && (
                          <p className="text-white/80 text-xs">door {photo.photographer}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm && !loading ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Geen foto's gevonden voor "{searchTerm}"</p>
                  <p className="text-gray-500 text-sm mt-2">Probeer een andere zoekterm of categorie</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Voer een zoekterm in om foto's te vinden</p>
                  <p className="text-gray-500 text-sm mt-2">Bijvoorbeeld: huishoudelijk, zorg, transport</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Eigen Foto URL</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Foto URL
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      onClick={handlePreview}
                      disabled={!customUrl.trim()}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
                    <div className="text-center">
                      <img 
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-md max-h-64 object-cover rounded-lg shadow-lg mx-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'text-red-600 text-sm';
                          errorDiv.textContent = 'Kan afbeelding niet laden. Controleer de URL.';
                          target.parentNode?.appendChild(errorDiv);
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'block';
                          // Remove any error messages
                          const errorDivs = document.querySelectorAll('.text-red-600');
                          errorDivs.forEach(div => div.remove());
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* URL Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Tips voor foto URL's:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Gebruik directe links naar afbeeldingen (.jpg, .png, .webp)</li>
                    <li>• Zorg ervoor dat de afbeelding publiek toegankelijk is</li>
                    <li>• Aanbevolen formaat: 600x400 pixels of hoger</li>
                    <li>• Test altijd de preview voordat je opslaat</li>
                    <li>• Gebruik bij voorkeur afbeeldingen van Pexels, Unsplash of Pixabay</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {activeTab === 'url' && customUrl && (
              <span>URL: {customUrl.length > 50 ? customUrl.substring(0, 50) + '...' : customUrl}</span>
            )}
            {activeTab === 'search' && searchResults.length > 0 && (
              <span>{searchResults.length} foto's gevonden</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
            >
              Annuleren
            </button>
            {activeTab === 'url' && (
              <button
                onClick={handleCustomUrlSubmit}
                disabled={!customUrl.trim()}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>URL Gebruiken</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}