'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  Calendar,
  User,
  Edit,
  Eye,
  Award,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  punctuality_rating?: number;
  quality_rating?: number;
  communication_rating?: number;
  would_recommend: boolean;
  created_at: string;
  booking: {
    scheduled_date: string;
    total_amount: number;
    service: {
      name: string;
      short_description: string;
    };
    professional: {
      first_name: string;
      last_name: string;
    };
  };
}

interface PendingReview {
  id: string;
  scheduled_date: string;
  completed_at?: string;
  total_amount: number;
  service: {
    name: string;
    short_description: string;
  };
  professional: {
    first_name: string;
    last_name: string;
  };
}

interface ReviewsManagementProps {
  onReviewSubmitted?: () => void;
}

export default function ReviewsManagement({ onReviewSubmitted }: ReviewsManagementProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'my-reviews'>('pending');
  const [selectedBooking, setSelectedBooking] = useState<PendingReview | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review_text: '',
    punctuality_rating: 5,
    quality_rating: 5,
    communication_rating: 5,
    would_recommend: true
  });

  useEffect(() => {
    fetchReviews();
    fetchPendingReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/customer/reviews?type=my-reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      const response = await fetch('/api/customer/reviews?type=pending');
      if (response.ok) {
        const data = await response.json();
        setPendingReviews(data);
      }
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;

    try {
      const response = await fetch('/api/customer/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          ...reviewForm
        }),
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews(prev => [newReview, ...prev]);
        setPendingReviews(prev => prev.filter(p => p.id !== selectedBooking.id));
        setShowReviewModal(false);
        setSelectedBooking(null);
        setReviewForm({
          rating: 5,
          review_text: '',
          punctuality_rating: 5,
          quality_rating: 5,
          communication_rating: 5,
          would_recommend: true
        });
        onReviewSubmitted?.();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingInput = (
    label: string,
    value: number,
    onChange: (value: number) => void
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value ? 'text-yellow-500 fill-current' : 'text-gray-300'
              } hover:text-yellow-400 transition-colors`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Beoordelingen laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mijn Beoordelingen</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{reviews.length}</div>
                <div className="text-sm text-gray-500">Gegeven</div>
              </div>
              <div className="text-center">
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">{averageRating.toFixed(1)}</span>
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-sm text-gray-500">Gemiddeld</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingReviews.length}</div>
                <div className="text-sm text-gray-500">Te beoordelen</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pending')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Te Beoordelen ({pendingReviews.length})
            </Button>
            <Button
              variant={activeTab === 'my-reviews' ? 'default' : 'outline'}
              onClick={() => setActiveTab('my-reviews')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Mijn Beoordelingen ({reviews.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reviews */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingReviews.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{booking.service.name}</h3>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Wacht op beoordeling
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{booking.service.short_description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {booking.professional.first_name} {booking.professional.last_name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(booking.scheduled_date)}
                      </div>
                      <div className="flex items-center">
                        <span>{formatCurrency(booking.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowReviewModal(true);
                    }}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Beoordelen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {pendingReviews.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen beoordelingen wachtend</h3>
              <p className="text-gray-600">Alle voltooide services zijn beoordeeld!</p>
            </div>
          )}
        </div>
      )}

      {/* My Reviews */}
      {activeTab === 'my-reviews' && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{review.booking.service.name}</h3>
                      {renderStars(review.rating, 'md')}
                      <span className="text-gray-600">({review.rating}/5)</span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {review.booking.professional.first_name} {review.booking.professional.last_name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(review.booking.scheduled_date)}
                      </div>
                      <div className="flex items-center">
                        <span>Beoordeeld op {formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {review.would_recommend && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Aanbevolen
                    </Badge>
                  )}
                </div>
                
                {review.review_text && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{review.review_text}</p>
                  </div>
                )}
                
                {(review.punctuality_rating || review.quality_rating || review.communication_rating) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {review.punctuality_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-1">Stiptheid</div>
                        {renderStars(review.punctuality_rating)}
                      </div>
                    )}
                    {review.quality_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-1">Kwaliteit</div>
                        {renderStars(review.quality_rating)}
                      </div>
                    )}
                    {review.communication_rating && (
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-1">Communicatie</div>
                        {renderStars(review.communication_rating)}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {reviews.length === 0 && (
            <div className="text-center py-12">
              <Star className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen beoordelingen</h3>
              <p className="text-gray-600">Boek een service om je eerste beoordeling achter te laten!</p>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              Beoordeel: {selectedBooking.service.name}
            </h3>
            
            <div className="space-y-6">
              {/* Overall Rating */}
              {renderRatingInput(
                'Algemene Beoordeling',
                reviewForm.rating,
                (value) => setReviewForm(prev => ({ ...prev, rating: value }))
              )}
              
              {/* Detailed Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderRatingInput(
                  'Stiptheid',
                  reviewForm.punctuality_rating,
                  (value) => setReviewForm(prev => ({ ...prev, punctuality_rating: value }))
                )}
                {renderRatingInput(
                  'Kwaliteit',
                  reviewForm.quality_rating,
                  (value) => setReviewForm(prev => ({ ...prev, quality_rating: value }))
                )}
                {renderRatingInput(
                  'Communicatie',
                  reviewForm.communication_rating,
                  (value) => setReviewForm(prev => ({ ...prev, communication_rating: value }))
                )}
              </div>
              
              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jouw Ervaring (optioneel)
                </label>
                <textarea
                  value={reviewForm.review_text}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, review_text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Vertel anderen over je ervaring met deze service..."
                />
              </div>
              
              {/* Recommendation */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="would_recommend"
                  checked={reviewForm.would_recommend}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, would_recommend: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="would_recommend" className="text-sm font-medium text-gray-700">
                  Ik zou deze professional aanbevelen aan anderen
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedBooking(null);
                }}
              >
                Annuleren
              </Button>
              <Button onClick={handleSubmitReview}>
                <Star className="h-4 w-4 mr-2" />
                Beoordeling Versturen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 