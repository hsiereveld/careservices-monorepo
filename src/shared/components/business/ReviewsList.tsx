import React from 'react';
import { Card } from '@/shared/components/ui';
import { Review } from '@/shared/types';
import { formatDate } from '@/shared/utils';

interface ReviewsListProps {
  reviews: Review[];
  showProfessional?: boolean;
  showCustomer?: boolean;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  showProfessional = false,
  showCustomer = true
}) => {
  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (reviews.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray-500">No hay reseñas disponibles</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {showCustomer && review.customer && (
                <>
                  <img
                    src={review.customer.avatar || '/default-avatar.png'}
                    alt={review.customer.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{review.customer.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                  </div>
                </>
              )}
              
              {showProfessional && review.professional && (
                <>
                  <img
                    src={review.professional.user?.avatar || '/default-avatar.png'}
                    alt={review.professional.business_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{review.professional.business_name}</p>
                    <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-lg">{renderStars(review.rating)}</div>
              <span className="text-sm text-gray-500">{review.rating}/5</span>
            </div>
          </div>
          
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          
          {review.booking?.service && (
            <div className="text-sm text-gray-500 border-t pt-2">
              Servicio: {review.booking.service.title}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}; 