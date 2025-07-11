import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Loader2, Check } from 'lucide-react';

interface PhotoManagerProps {
  currentImageUrl?: string;
  onImageSelect: (imageUrl: string) => void;
  onClose: () => void;
  searchQuery?: string;
  title?: string;
}

// Predefined stock photos for different categories
const stockPhotos = {
  cleaning: [
    'https://images.pexels.com/photos/4239146/pexels-photo-4239146.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/4107123/pexels-photo-4107123.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/6195951/pexels-photo-6195951.jpeg?auhref=compress&cs=tinysrgb&w=300'
  ],
  medical: [
    'https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/3845623/pexels-photo-3845623.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auhref=compress&cs=tinysrgb&w=300'
  ],
  technical: [
    'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1249610/pexels-photo-1249610.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1249612/pexels-photo-1249612.jpeg?auhref=compress&cs=tinysrgb&w=300'
  ],
  garden: [
    'https://images.pexels.com/photos/1301856/pexels-photo-1301856.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1301857/pexels-photo-1301857.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1301858/pexels-photo-1301858.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1301859/pexels-photo-1301859.jpeg?auhref=compress&cs=tinysrgb&w=300'
  ],
  pool: [
    'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/261181/pexels-photo-261181.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/261367/pexels-photo-261367.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg?auhref=compress&cs=tinysrgb&w=300'
  ],
  administrative: [
    'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/3184294/pexels-photo-3184294.jpeg?auhref=compress&cs=tinysrgb&w=300'
  ],
  general: [
    'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/4239146/pexels-photo-4239146.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auhref=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auhref=compress&cs=tinysrgb&w=300'
  ]
};

export function PhotoManager({ 
  currentImageUrl, 
  onImageSelect, 
  onClose, 
  searchQuery = '', 
  title = 'Afbeelding Selecteren' 
}: PhotoManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(currentImageUrl || '');

  useEffect(() => {
    // Auto-detect category based on search query
    const query = searchQuery.toLowerCase();
    if (query.includes('schoon') || query.includes('clean')) {
      setSelectedCategory('cleaning');
    } else if (query.includes('medisch') || query.includes('medical') || query.includes('dokter')) {
      setSelectedCategory('medical');
    } else if (query.includes('technisch') || query.includes('reparatie') || query.includes('handyman')) {
      setSelectedCategory('technical');
    } else if (query.includes('tuin') || query.includes('garden')) {
      setSelectedCategory('garden');
    } else if (query.includes('zwembad') || query.includes('pool')) {
      setSelectedCategory('pool');
    } else if (query.includes('administratief') || query.includes('papierwerk') || query.includes('nie')) {
      setSelectedCategory('administrative');
    }
  }, [searchQuery]);

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onImageSelect(selectedImage);
    }
  };

  const categories = [
    { key: 'general', label: 'Algemeen' },
    { key: 'cleaning', label: 'Schoonmaak' },
    { key: 'medical', label: 'Medisch' },
    { key: 'technical', label: 'Technisch' },
    { key: 'garden', label: 'Tuin' },
    { key: 'pool', label: 'Zwembad' },
    { key: 'administrative', label: 'Administratief' }
  ];

  const currentPhotos = stockPhotos[selectedCategory as keyof typeof stockPhotos] || stockPhotos.general;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                <p className="text-text-secondary">Kies een professionele afbeelding voor je dienst</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {currentPhotos.map((photo, index) => (
              <div
                key={index}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === photo
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleImageSelect(photo)}
              >
                <img
                  src={photo}
                  alt={`Stock foto ${index + 1}`}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300';
                  }}
                />
                {selectedImage === photo && (
                  <div className="absolute inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Selection */}
          {selectedImage && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-800 mb-2">Geselecteerde afbeelding:</h3>
              <div className="flex items-center space-x-4">
                <img
                  src={selectedImage}
                  alt="Geselecteerde afbeelding"
                  className="w-20 h-12 object-cover rounded border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auhref=compress&cs=tinysrgb&w=300';
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 break-all">{selectedImage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedImage || loading}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Bezig...</span>
                </>
              ) : (
                <span>Afbeelding Selecteren</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}