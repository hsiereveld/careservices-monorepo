import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase, ServiceProvider } from '../../lib/supabase';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { GeneralAvailabilityEditor } from './GeneralAvailabilityEditor';

export function AvailabilityManager() {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'general'>('calendar');

  useEffect(() => {
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Niet ingelogd');
      }

      // Get the provider record for this user
      const { data: providerData, error: providerError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (providerError) {
        throw new Error('Provider profiel niet gevonden');
      }

      setProvider(providerData);
    } catch (err: any) {
      setError('Fout bij het laden van provider gegevens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-500 mx-auto mb-3 animate-spin" />
            <p className="text-text-secondary">Beschikbaarheid laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Provider profiel niet gevonden</h3>
          <p className="text-text-secondary mb-6">
            Er is geen provider profiel gevonden voor je account. Probeer de pagina te verversen of neem contact op met support.
          </p>
          <button
            onClick={fetchProviderData}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Probeer opnieuw</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary">Beschikbaarheid Beheren</h3>
          <p className="text-text-secondary mt-1">
            Stel in wanneer je beschikbaar bent voor boekingen
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'calendar' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Kalender</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'general' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Algemene Beschikbaarheid</span>
            </div>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 mb-6">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'calendar' && (
        <AvailabilityCalendar providerId={provider.id} />
      )}

      {activeTab === 'general' && (
        <GeneralAvailabilityEditor providerId={provider.id} />
      )}
    </div>
  );
}