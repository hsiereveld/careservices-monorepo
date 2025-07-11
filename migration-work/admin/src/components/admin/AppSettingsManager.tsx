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
  Clock,
  CreditCard
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { GeneralSettingsManager } from './GeneralSettingsManager';
import { MollieSettingsManager } from './MollieSettingsManager';

export function AppSettingsManager() {
  const [activeTab, setActiveTab] = useState<'general' | 'payments'>('general');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'general'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Algemeen</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'payments'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Betalingen</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && <GeneralSettingsManager />}
      {activeTab === 'payments' && <MollieSettingsManager />}
    </div>
  );
}