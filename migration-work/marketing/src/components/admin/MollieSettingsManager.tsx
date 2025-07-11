import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  RefreshCw,
  Info,
  ExternalLink,
  Settings,
  ToggleLeft,
  ToggleRight,
  Key,
  Lock,
  Globe,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function MollieSettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    mollieApiKeyLive: '',
    mollieApiKeyTest: '',
    mollieTestMode: true,
    mollieWebhookSecret: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');

      // First, try to get the first row from app_settings
      const { data, error } = await supabase
        .from('app_settings')
        .select('id, mollie_api_key_live, mollie_api_key_test, mollie_test_mode, mollie_webhook_secret')
        .limit(1);
      
      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const settingsRow = data[0];
        setSettings({
          mollieApiKeyLive: settingsRow.mollie_api_key_live || '',
          mollieApiKeyTest: settingsRow.mollie_api_key_test || '',
          mollieTestMode: settingsRow.mollie_test_mode !== false, // Default to true if null
          mollieWebhookSecret: settingsRow.mollie_webhook_secret || ''
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Fout bij het laden van instellingen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // First, get the existing settings to find the ID
      const { data: existingData } = await supabase
        .from('app_settings')
        .select('id')
        .limit(1);

      // Prepare settings data for database
      const settingsData = {
        mollie_api_key_live: settings.mollieApiKeyLive,
        mollie_api_key_test: settings.mollieApiKeyTest,
        mollie_test_mode: settings.mollieTestMode,
        mollie_webhook_secret: settings.mollieWebhookSecret
      };

      let result;
      
      if (existingData && existingData.length > 0) {
        // Update existing record
        result = await supabase
          .from('app_settings')
          .update(settingsData)
          .eq('id', existingData[0].id);
      } else {
        // Insert new record
        result = await supabase
          .from('app_settings')
          .insert(settingsData);
      }
        
      if (result.error) throw result.error;
      
      setSuccess('Mollie instellingen succesvol bijgewerkt! 🎉');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const testMollieConnection = async () => {
    setTesting(true);
    setError('');
    setSuccess('');

    try {
      // Call the Edge Function to test the Mollie connection
      const { data, error } = await supabase.functions.invoke('test-mollie-connection');
      
      if (error) {
        throw new Error(`Error testing Mollie connection: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }
      
      setSuccess(`Mollie verbinding succesvol getest in ${data.mode} modus! ${data.count} betaalmethoden beschikbaar.`);
    } catch (err) {
      console.error('Error testing Mollie connection:', err);
      setError('Fout bij het testen van Mollie verbinding: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Mollie Instellingen</h3>
            <p className="text-gray-600">Configureer Mollie betalingen voor je facturen</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h4 className="text-base font-semibold text-blue-800 mb-3 flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>Over Mollie Betalingen</span>
            </h4>
            
            <p className="text-sm text-blue-700 mb-4">
              Mollie is een betalingsprovider die verschillende betaalmethoden ondersteunt, waaronder iDEAL, creditcards, 
              Bancontact, en meer. Met Mollie kunnen je klanten eenvoudig en veilig online betalen.
            </p>
            
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <ExternalLink className="w-4 h-4" />
              <a 
                href="https://www.mollie.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Ga naar Mollie Dashboard
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test API Sleutel
              </label>
              <div className="relative">
                <Key className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  value={settings.mollieApiKeyTest}
                  onChange={(e) => setSettings({ ...settings, mollieApiKeyTest: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mollie Test API sleutel voor testbetalingen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Live API Sleutel
              </label>
              <div className="relative">
                <Key className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  value={settings.mollieApiKeyLive}
                  onChange={(e) => setSettings({ ...settings, mollieApiKeyLive: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mollie Live API sleutel voor echte betalingen
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                value={settings.mollieWebhookSecret}
                onChange={(e) => setSettings({ ...settings, mollieWebhookSecret: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Webhook secret voor het verifiëren van Mollie webhook verzoeken (optioneel)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, mollieTestMode: !settings.mollieTestMode })}
              className="p-2 rounded-lg transition-colors"
            >
              {settings.mollieTestMode ? (
                <ToggleRight className="w-10 h-10 text-blue-600" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-400" />
              )}
            </button>
            <div>
              <p className="font-medium text-gray-900">
                {settings.mollieTestMode ? 'Test Modus Ingeschakeld' : 'Live Modus Ingeschakeld'}
              </p>
              <p className="text-sm text-gray-500">
                {settings.mollieTestMode 
                  ? 'Betalingen worden verwerkt in de testomgeving' 
                  : 'Betalingen worden verwerkt in de live omgeving (echte betalingen)'}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Webhook URL</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  Configureer de volgende webhook URL in je Mollie dashboard:
                </p>
                <div className="bg-white p-2 rounded border border-yellow-300 text-sm font-mono break-all">
                  {`${window.location.origin.replace('http://localhost:5173', 'https://your-app-url.com')}/api/mollie-webhook`}
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  Vervang 'your-app-url.com' door je werkelijke domein in productie
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Opslaan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Instellingen Opslaan</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={testMollieConnection}
              disabled={testing || (!settings.mollieApiKeyTest && !settings.mollieApiKeyLive)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {testing ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Testen...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Verbinding Testen</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}