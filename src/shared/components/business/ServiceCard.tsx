import React from 'react';
import { Card, Button } from '@/shared/components/ui';
import { Service } from '@/shared/types';
import { formatCurrency } from '@/shared/utils';

interface ServiceCardProps {
  service: Service;
  onBook?: (service: Service) => void;
  onEdit?: (service: Service) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onBook,
  onEdit,
  showActions = true,
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      {service.images && service.images.length > 0 && (
        <div className={`relative ${isCompact ? 'h-32' : 'h-48'} overflow-hidden rounded-t-lg`}>
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          {!service.is_active && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-medium">No Disponible</span>
            </div>
          )}
        </div>
      )}
      
      <div className={`p-4 ${isCompact ? 'space-y-2' : 'space-y-3'}`}>
        <div className="flex justify-between items-start">
          <h3 className={`font-semibold text-gray-900 ${isCompact ? 'text-sm' : 'text-lg'}`}>
            {service.title}
          </h3>
          <span className={`text-blue-600 font-bold ${isCompact ? 'text-sm' : 'text-lg'}`}>
            {formatCurrency(service.price)}
          </span>
        </div>
        
        <p className={`text-gray-600 ${isCompact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'}`}>
          {service.description}
        </p>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>📅 {service.duration} min</span>
          <span>📍 {service.category}</span>
        </div>
        
        {service.professional && (
          <div className="flex items-center gap-2 text-sm">
            <img
              src={service.professional.user?.avatar || '/default-avatar.png'}
              alt={service.professional.business_name}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-gray-700">{service.professional.business_name}</span>
            <span className="text-yellow-500">⭐ {service.professional.rating}</span>
          </div>
        )}
        
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onBook && service.is_active && (
              <Button
                onClick={() => onBook(service)}
                size={isCompact ? 'sm' : 'md'}
                className="flex-1"
              >
                Reservar
              </Button>
            )}
            {onEdit && (
              <Button
                onClick={() => onEdit(service)}
                variant="outline"
                size={isCompact ? 'sm' : 'md'}
              >
                Editar
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}; 