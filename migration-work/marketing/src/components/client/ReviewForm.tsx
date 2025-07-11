import React, { useState } from 'react';
import { Star, Send, X, Loader2 } from 'lucide-react';

interface ReviewFormProps {
  bookingId: string;
  serviceName: string;
  providerName: string;
  onSubmit: (bookingId: string, rating: number, reviewText: string) => Promise<void>;
  onClose: () => void;
}

export function ReviewForm({ bookingId, serviceName, providerName, onSubmit, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating < 1) {
      setError('Selecteer een beoordeling van 1-5 sterren');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(bookingId, rating, reviewText);
      // onClose will be called by the parent component after successful submission
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het indienen van je beoordeling');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-text-primary">
              Beoordeel je ervaring
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service and Provider Info */}
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-text-primary font-medium">{serviceName}</p>
              <p className="text-text-secondary text-sm">Uitgevoerd door: {providerName}</p>
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">
                Hoe beoordeel je deze service?
              </label>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 focus:outline-none transition-colors"
                    disabled={isSubmitting}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (hoverRating !== null ? star <= hoverRating : star <= rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-text-secondary">
                {rating === 1 && 'Zeer ontevreden'}
                {rating === 2 && 'Ontevreden'}
                {rating === 3 && 'Neutraal'}
                {rating === 4 && 'Tevreden'}
                {rating === 5 && 'Zeer tevreden'}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Je review (optioneel)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-32 resize-none"
                placeholder="Deel je ervaring met deze service..."
                disabled={isSubmitting}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Bezig met verzenden...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Beoordeling Verzenden</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}