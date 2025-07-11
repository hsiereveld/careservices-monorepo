import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  Loader2,
  RefreshCw,
  Mail,
  Globe,
  Database,
  Server,
  Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function GeneralSettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    siteName: 'Care & Service Pinoso',
    siteUrl: 'https://careservice.es',
    contactEmail: 'info@careservice.es',
    defaultLanguage: 'nl',
    timeZone: 'Europe/Madrid',
    maintenanceMode: false,
    debugMode: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch settings from the app_settings table
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching settings:', error);
        // If no settings exist yet, we'll create them later
        if (error.code !== 'PGRST116') {
          throw error;
        }
      } else if (data) {
        // If we have settings data, update our state
        setSettings({
          siteName: data.site_name || 'Care & Service Pinoso',
          siteUrl: data.site_url || 'https://careservice.es',
          contactEmail: data.contact_email || 'info@careservice.es',
          defaultLanguage: data.default_language || 'nl',
          timeZone: data.time_zone || 'Europe/Madrid',
          maintenanceMode: data.maintenance_mode || false,
          debugMode: data.debug_mode || false
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
      // Prepare settings data for database
      const settingsData = {
        id: 'general', // Use a fixed ID for the general settings
        site_name: settings.siteName,
        site_url: settings.siteUrl,
        contact_email: settings.contactEmail,
        default_language: settings.defaultLanguage,
        time_zone: settings.timeZone,
        maintenance_mode: settings.maintenanceMode,
        debug_mode: settings.debugMode,
        updated_at: new Date().toISOString()
      };
      
      // Use upsert to create or update the settings
      const { error } = await supabase
        .from('app_settings')
        .upsert(settingsData, { onConflict: 'id' });
      
      if (error) throw error;
      
      setSuccess('Instellingen succesvol bijgewerkt! 🎉');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Algemene Instellingen</h3>
            <p className="text-gray-600">Beheer de basisinstellingen van de applicatie</p>
          </div>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Vernieuwen</span>
        </button>
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
          <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
              <HelpCircle className="w-5 h-5" />
              <span>Over Algemene Instellingen</span>
            </h4>
            <p className="text-blue-700 mb-4">
              Deze instellingen bepalen de basiswerking van de applicatie. Wijzigingen kunnen invloed hebben op de hele website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Naam
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="url"
                  value={settings.siteUrl}
                  onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standaard Taal
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="nl">Nederlands</option>
                <option value="en">Engels</option>
                <option value="es">Spaans</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tijdzone
              </label>
              <div className="relative">
                <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={settings.timeZone}
                  onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Europe/Madrid">Europe/Madrid</option>
                  <option value="Europe/Amsterdam">Europe/Amsterdam</option>
                  <option value="Europe/Brussels">Europe/Brussels</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4">Systeem Instellingen</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Onderhoudsmodus</label>
                  <p className="text-sm text-gray-500">Zet de website in onderhoudsmodus</p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                  <input
                    type="checkbox"
                    id="maintenance-mode"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="absolute w-0 h-0 opacity-0"
                  />
                  <label
                    htmlFor="maintenance-mode"
                    className={`absolute left-0 w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                      settings.maintenanceMode ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 transition-transform duration-200 transform bg-white rounded-full ${
                        settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Debug Modus</label>
                  <p className="text-sm text-gray-500">Schakel debug modus in voor ontwikkelaars</p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                  <input
                    type="checkbox"
                    id="debug-mode"
                    checked={settings.debugMode}
                    onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
                    className="absolute w-0 h-0 opacity-0"
                  />
                  <label
                    htmlFor="debug-mode"
                    className={`absolute left-0 w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                      settings.debugMode ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 transition-transform duration-200 transform bg-white rounded-full ${
                        settings.debugMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
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
        </form>
      )}
    </div>
  );
}