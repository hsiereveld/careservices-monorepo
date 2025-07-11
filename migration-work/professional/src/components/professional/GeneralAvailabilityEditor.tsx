import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Loader2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GeneralAvailability {
  id: string;
  provider_id: string;
  day_of_week: number;
  time_slot: string;
  is_active: boolean;
  start_time?: string;
  end_time?: string;
}

interface GeneralAvailabilityEditorProps {
  providerId: string;
}

export function GeneralAvailabilityEditor({ providerId }: GeneralAvailabilityEditorProps) {
  const [availability, setAvailability] = useState<GeneralAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Time slots configuration
  const timeSlots = [
    { id: 'morning', label: 'Ochtend', time: '08:00 - 12:00' },
    { id: 'afternoon', label: 'Middag', time: '12:00 - 17:00' },
    { id: 'evening', label: 'Avond', time: '17:00 - 21:00' }
  ];

  // Days of week
  const daysOfWeek = [
    { id: 0, name: 'Zondag' },
    { id: 1, name: 'Maandag' },
    { id: 2, name: 'Dinsdag' },
    { id: 3, name: 'Woensdag' },
    { id: 4, name: 'Donderdag' },
    { id: 5, name: 'Vrijdag' },
    { id: 6, name: 'Zaterdag' }
  ];

  useEffect(() => {
    fetchAvailability();
  }, [providerId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', providerId)
        .order('day_of_week')
        .order('time_slot');

      if (fetchError) throw fetchError;

      // If no availability data exists yet, create default structure
      if (!data || data.length === 0) {
        const defaultAvailability: Omit<GeneralAvailability, 'id'>[] = [];
        
        // Create a record for each day and time slot combination
        daysOfWeek.forEach(day => {
          timeSlots.forEach(slot => {
            defaultAvailability.push({
              provider_id: providerId,
              day_of_week: day.id,
              time_slot: slot.id,
              is_active: false // Default to not available
            });
          });
        });
        
        // Insert default availability
        const { error: insertError } = await supabase
          .from('provider_availability')
          .insert(defaultAvailability);
          
        if (insertError) throw insertError;
        
        // Fetch the newly created records
        const { data: newData, error: newFetchError } = await supabase
          .from('provider_availability')
          .select('*')
          .eq('provider_id', providerId)
          .order('day_of_week')
          .order('time_slot');
          
        if (newFetchError) throw newFetchError;
        
        setAvailability(newData || []);
      } else {
        setAvailability(data);
      }
    } catch (err: any) {
      setError('Fout bij het laden van beschikbaarheid: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (dayOfWeek: number, timeSlot: string) => {
    // Find the availability record
    const availabilityRecord = availability.find(
      a => a.day_of_week === dayOfWeek && a.time_slot === timeSlot
    );
    
    if (!availabilityRecord) return;
    
    // Create a new array with the updated record
    const updatedAvailability = availability.map(a => 
      a.id === availabilityRecord.id 
        ? { ...a, is_active: !a.is_active } 
        : a
    );
    
    // Update state optimistically
    setAvailability(updatedAvailability);
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Update in database
      const { error } = await supabase
        .from('provider_availability')
        .update({ is_active: !availabilityRecord.is_active })
        .eq('id', availabilityRecord.id);
        
      if (error) throw error;
      
      setSuccess('Beschikbaarheid bijgewerkt!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Fout bij het bijwerken: ' + err.message);
      
      // Revert state on error
      setAvailability(availability);
    } finally {
      setSaving(false);
    }
  };

  const setAllAvailability = async (isActive: boolean) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Update all records in the database
      const { error } = await supabase
        .from('provider_availability')
        .update({ is_active: isActive })
        .eq('provider_id', providerId);
        
      if (error) throw error;
      
      // Update local state
      const updatedAvailability = availability.map(a => ({ ...a, is_active: isActive }));
      setAvailability(updatedAvailability);
      
      setSuccess(`Alle tijdslots ${isActive ? 'beschikbaar' : 'niet beschikbaar'} gemaakt!`);
    } catch (err: any) {
      setError('Fout bij het bijwerken: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isAvailable = (dayOfWeek: number, timeSlot: string): boolean => {
    const slot = availability.find(
      a => a.day_of_week === dayOfWeek && a.time_slot === timeSlot
    );
    return slot?.is_active || false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setAllAvailability(true)}
          disabled={saving}
          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Alles Beschikbaar</span>
        </button>
        <button
          onClick={() => setAllAvailability(false)}
          disabled={saving}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Alles Onbeschikbaar</span>
        </button>
      </div>

      {/* Availability Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dag
              </th>
              {timeSlots.map(slot => (
                <th key={slot.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {slot.label} <span className="font-normal text-gray-400">({slot.time})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {daysOfWeek.map(day => (
              <tr key={day.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{day.name}</div>
                </td>
                {timeSlots.map(slot => {
                  const available = isAvailable(day.id, slot.id);
                  return (
                    <td key={slot.id} className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAvailability(day.id, slot.id)}
                        disabled={saving}
                        className={`p-2 rounded-lg transition-colors ${
                          available 
                            ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                            : 'text-red-600 bg-red-50 hover:bg-red-100'
                        } disabled:opacity-50`}
                      >
                        {available ? (
                          <ToggleRight className="w-8 h-8" />
                        ) : (
                          <ToggleLeft className="w-8 h-8" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Hoe werkt algemene beschikbaarheid?</h4>
            <p className="text-blue-700 mb-4">
              Algemene beschikbaarheid bepaalt op welke dagen en tijdstippen je normaal gesproken beschikbaar bent voor boekingen.
              Dit is je standaard schema dat elke week geldt, tenzij je specifieke uitzonderingen maakt in de kalender.
            </p>
            <ul className="text-blue-700 space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <span>Klik op de schakelaars om je beschikbaarheid per tijdslot aan of uit te zetten</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <span>Groene schakelaars betekenen dat je beschikbaar bent</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <span>Grijze schakelaars betekenen dat je niet beschikbaar bent</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <span>Gebruik de "Alles Beschikbaar" of "Alles Onbeschikbaar" knoppen om snel alle tijdslots in te stellen</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}