import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Save,
  RefreshCw
} from 'lucide-react';

export function BackupSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    includeMedia: true,
    includeUserData: true
  });
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would save to the database
      setSuccess('Backup instellingen succesvol bijgewerkt! 🎉');
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualBackup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const now = new Date();
      setLastBackup(now.toLocaleString('nl-NL'));
      setSuccess('Handmatige backup succesvol uitgevoerd! 🎉');
    } catch (err: any) {
      setError('Fout bij het maken van backup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Backup Instellingen</h3>
            <p className="text-gray-600">Beheer database en bestandsbackups</p>
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

      <div className="grid md:grid-cols-2 gap-8">
        {/* Backup Settings Form */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Automatische Backup Configuratie</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Automatische Backup</label>
                <p className="text-sm text-gray-500">Periodiek automatisch backups maken</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                <input
                  type="checkbox"
                  id="auto-backup"
                  checked={backupSettings.autoBackup}
                  onChange={(e) => setBackupSettings({ ...backupSettings, autoBackup: e.target.checked })}
                  className="absolute w-0 h-0 opacity-0"
                />
                <label
                  htmlFor="auto-backup"
                  className={`absolute left-0 w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                    backupSettings.autoBackup ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 transition-transform duration-200 transform bg-white rounded-full ${
                      backupSettings.autoBackup ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Frequentie
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={backupSettings.backupFrequency}
                  onChange={(e) => setBackupSettings({ ...backupSettings, backupFrequency: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={!backupSettings.autoBackup}
                >
                  <option value="hourly">Elk uur</option>
                  <option value="daily">Dagelijks</option>
                  <option value="weekly">Wekelijks</option>
                  <option value="monthly">Maandelijks</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Tijd
              </label>
              <div className="relative">
                <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="time"
                  value={backupSettings.backupTime}
                  onChange={(e) => setBackupSettings({ ...backupSettings, backupTime: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={!backupSettings.autoBackup || backupSettings.backupFrequency === 'hourly'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bewaartermijn (dagen)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={backupSettings.retentionDays}
                onChange={(e) => setBackupSettings({ ...backupSettings, retentionDays: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={!backupSettings.autoBackup}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-media"
                  checked={backupSettings.includeMedia}
                  onChange={(e) => setBackupSettings({ ...backupSettings, includeMedia: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={!backupSettings.autoBackup}
                />
                <label htmlFor="include-media" className="ml-2 block text-sm text-gray-900">
                  Media bestanden includeren
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-user-data"
                  checked={backupSettings.includeUserData}
                  onChange={(e) => setBackupSettings({ ...backupSettings, includeUserData: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={!backupSettings.autoBackup}
                />
                <label htmlFor="include-user-data" className="ml-2 block text-sm text-gray-900">
                  Gebruikersgegevens includeren
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
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
        </div>

        {/* Manual Backup & Restore */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Handmatige Backup & Herstel</h4>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h5 className="font-medium text-gray-900 mb-3">Backup Starten</h5>
            <p className="text-sm text-gray-600 mb-4">
              Start een handmatige backup van de database en bestanden. Dit kan enkele minuten duren.
            </p>
            
            {lastBackup && (
              <div className="text-sm text-gray-600 mb-4">
                Laatste backup: {lastBackup}
              </div>
            )}
            
            <button
              onClick={handleManualBackup}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Bezig...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Backup Nu Starten</span>
                </>
              )}
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h5 className="font-medium text-gray-900 mb-3">Backup Herstellen</h5>
            <p className="text-sm text-gray-600 mb-4">
              Herstel een eerdere backup. Let op: dit overschrijft alle huidige gegevens.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecteer Backup Bestand
              </label>
              <input
                type="file"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Backup Herstellen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}