import { useState } from 'react';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  bookingId: string;
  serviceName: string;
  providerName: string;
  onSubmit: (reviewData: ReviewData) => Promise<void>;
  onCancel: () => void;
}

interface ReviewData {
  booking_id: string;
  rating: number;
  punctuality_rating: number;
  quality_rating: number;
  communication_rating: number;
  review_text: string;
  would_recommend: boolean;
  is_public: boolean;
}

export default function ReviewForm({ 
  bookingId, 
  serviceName, 
  providerName, 
  onSubmit, 
  onCancel 
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reviewData: ReviewData = {
        booking_id: bookingId,
        rating,
        punctuality_rating: punctualityRating,
        quality_rating: qualityRating,
        communication_rating: communicationRating,
        review_text: reviewText,
        would_recommend: wouldRecommend,
        is_public: isPublic
      };

      await onSubmit(reviewData);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
  }) => (
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
              className={`w-6 h-6 ${
                star <= value
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Service Beoordelen
        </h2>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900">{serviceName}</h3>
          <p className="text-gray-600">Door: {providerName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <StarRating
            value={rating}
            onChange={setRating}
            label="Algemene Beoordeling"
          />

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StarRating
              value={punctualityRating}
              onChange={setPunctualityRating}
              label="Stiptheid"
            />
            <StarRating
              value={qualityRating}
              onChange={setQualityRating}
              label="Kwaliteit"
            />
            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Communicatie"
            />
          </div>

          {/* Written Review */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uw Ervaring (Optioneel)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              placeholder="Vertel anderen over uw ervaring met deze service..."
            />
          </div>

          {/* Recommendation */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="recommend"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
              className="w-4 h-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
            />
            <label htmlFor="recommend" className="text-sm font-medium text-gray-700">
              Ik zou deze professional aanbevelen aan anderen
            </label>
          </div>

          {/* Public Review */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
            />
            <label htmlFor="public" className="text-sm font-medium text-gray-700">
              Maak deze beoordeling openbaar (anderen kunnen deze zien)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Opslaan...' : 'Beoordeling Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 