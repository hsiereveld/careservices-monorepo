import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Users, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  BarChart2,
  TrendingUp,
  HardDrive,
  Cpu
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function SystemMonitoring() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    database: { status: 'healthy', latency: 45, connections: 12 },
    storage: { status: 'healthy', usage: 68, total: 500 },
    auth: { status: 'healthy', activeUsers: 24, totalUsers: 156 },
    functions: { status: 'healthy', invocations: 342, errors: 2 },
    cpu: { usage: 32, memory: 45 }
  });

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError('');

      // In a real implementation, this would fetch actual system metrics
      // For now, we'll just simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate a database check
      const { data, error } = await supabase
        .from('service_categories')
        .select('count')
        .limit(1);
        
      if (error) throw error;
      
      // Update with random values to simulate changing metrics
      setSystemStatus({
        database: { 
          status: 'healthy', 
          latency: Math.floor(Math.random() * 100) + 20, 
          connections: Math.floor(Math.random() * 20) + 5 
        },
        storage: { 
          status: 'healthy', 
          usage: Math.floor(Math.random() * 100) + 50, 
          total: 500 
        },
        auth: { 
          status: 'healthy', 
          activeUsers: Math.floor(Math.random() * 30) + 10, 
          totalUsers: 156 
        },
        functions: { 
          status: 'healthy', 
          invocations: Math.floor(Math.random() * 500) + 300, 
          errors: Math.floor(Math.random() * 5) 
        },
        cpu: { 
          usage: Math.floor(Math.random() * 50) + 20, 
          memory: Math.floor(Math.random() * 60) + 30 
        }
      });
      
      setLastRefresh(new Date());
      setSuccess('Systeem status succesvol bijgewerkt');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Fout bij het ophalen van systeem status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100';
      case 'warning': return 'bg-yellow-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Systeem Monitoring</h3>
            <p className="text-gray-600">Bekijk de status en prestaties van het systeem</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {lastRefresh && (
            <span className="text-sm text-gray-500">
              Laatste update: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchSystemStatus}
            disabled={loading}
            className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Vernieuwen</span>
          </button>
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
          <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Database</h4>
                <Database className={`w-5 h-5 ${getStatusColor(systemStatus.database.status)}`} />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(systemStatus.database.status)} ${getStatusColor(systemStatus.database.status)}`}>
                  {systemStatus.database.status}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Latentie:</span>
                  <span className="font-medium">{systemStatus.database.latency} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Connecties:</span>
                  <span className="font-medium">{systemStatus.database.connections}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Opslag</h4>
                <HardDrive className={`w-5 h-5 ${getStatusColor(systemStatus.storage.status)}`} />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(systemStatus.storage.status)} ${getStatusColor(systemStatus.storage.status)}`}>
                  {systemStatus.storage.status}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Gebruikt:</span>
                  <span className="font-medium">{systemStatus.storage.usage} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Totaal:</span>
                  <span className="font-medium">{systemStatus.storage.total} GB</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(systemStatus.storage.usage / systemStatus.storage.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Authenticatie</h4>
                <Users className={`w-5 h-5 ${getStatusColor(systemStatus.auth.status)}`} />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(systemStatus.auth.status)} ${getStatusColor(systemStatus.auth.status)}`}>
                  {systemStatus.auth.status}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Actieve gebruikers:</span>
                  <span className="font-medium">{systemStatus.auth.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Totaal gebruikers:</span>
                  <span className="font-medium">{systemStatus.auth.totalUsers}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Edge Functions</h4>
                <Server className={`w-5 h-5 ${getStatusColor(systemStatus.functions.status)}`} />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(systemStatus.functions.status)} ${getStatusColor(systemStatus.functions.status)}`}>
                  {systemStatus.functions.status}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Aanroepen:</span>
                  <span className="font-medium">{systemStatus.functions.invocations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fouten:</span>
                  <span className="font-medium">{systemStatus.functions.errors}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Systeembronnen Gebruik</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-700">CPU Gebruik</h5>
                  <span className="text-sm font-medium">{systemStatus.cpu.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className={`h-2.5 rounded-full ${
                      systemStatus.cpu.usage > 80 ? 'bg-red-600' : 
                      systemStatus.cpu.usage > 60 ? 'bg-yellow-600' : 
                      'bg-green-600'
                    }`}
                    style={{ width: `${systemStatus.cpu.usage}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-700">Geheugen Gebruik</h5>
                  <span className="text-sm font-medium">{systemStatus.cpu.memory}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      systemStatus.cpu.memory > 80 ? 'bg-red-600' : 
                      systemStatus.cpu.memory > 60 ? 'bg-yellow-600' : 
                      'bg-green-600'
                    }`}
                    style={{ width: `${systemStatus.cpu.memory}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <Cpu className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Systeem draait normaal
                    <br />
                    Geen performance problemen gedetecteerd
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Logs */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Recente Systeem Logs</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tijd</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bericht</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-06-25 14:32:15</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">INFO</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">Systeem gestart</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-06-25 14:30:22</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">DEBUG</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">Database connectie geïnitialiseerd</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-06-25 14:28:05</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">WARN</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">Hoog geheugengebruik gedetecteerd</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-06-25 14:25:18</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">ERROR</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">Edge Function timeout: payment-webhook</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-06-25 14:20:42</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">INFO</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">Automatische backup voltooid</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}