import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Briefcase, 
  ShoppingBag, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserRoleManagerProps {
  userId: string;
  userEmail: string;
  currentRole: string;
  userName?: string;
  onRoleUpdated?: () => void;
}

export function UserRoleManager({ 
  userId, 
  userEmail, 
  currentRole, 
  userName, 
  onRoleUpdated 
}: UserRoleManagerProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Aangepaste rollen - 'user' rol is verwijderd
  const roles = [
    { id: 'client', label: 'Klant', icon: ShoppingBag, color: 'bg-primary-100 text-primary-700 border-primary-200' },
    { id: 'professional', label: 'Professional', icon: Briefcase, color: 'bg-accent-100 text-accent-700 border-accent-200' },
    { id: 'backoffice', label: 'BackOffice', icon: Briefcase, color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'admin', label: 'Administrator', icon: Shield, color: 'bg-secondary-100 text-secondary-700 border-secondary-200' }
  ];

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      setError('Selecteer een andere rol om te wijzigen');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Try multiple approaches to ensure the role is updated

      // Approach 1: Use the RPC function if available
      try {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('assign_user_role_simple', {
            target_user_id: userId,
            new_role: selectedRole
          });
        
        if (!rpcError && rpcResult) {
          console.log('Role updated via RPC function');
          setSuccess(`Rol succesvol gewijzigd naar ${roles.find(r => r.id === selectedRole)?.label}!`);
          
          if (onRoleUpdated) {
            onRoleUpdated();
          }
          setIsSubmitting(false);
          return;
        }
      } catch (rpcErr) {
        console.warn('RPC approach failed, trying direct update:', rpcErr);
      }

      // Approach 2: Direct update
      const { error: updateError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: selectedRole,
          is_primary_role: true,
          role_assigned_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        // If direct update fails, try one more approach
        console.warn('Direct update failed, trying insert with delete first:', updateError);
        
        // Approach 3: Delete and insert
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
          
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: selectedRole,
            is_primary_role: true,
            role_assigned_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      }

      setSuccess(`Rol succesvol gewijzigd naar ${roles.find(r => r.id === selectedRole)?.label}!`);
      
      // Notify parent component
      if (onRoleUpdated) {
        onRoleUpdated();
      }
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(`Fout bij het wijzigen van rol: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <User className="w-5 h-5" />
        <span>Rol Wijzigen</span>
      </h3>

      {/* User Info */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {userName ? userName.charAt(0) : userEmail.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {userName || 'Geen naam ingesteld'}
            </p>
            <p className="text-sm text-gray-500">{userEmail}</p>
          </div>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          <span className="font-medium">Huidige rol:</span> 
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border inline-flex items-center space-x-1 ${roles.find(r => r.id === currentRole)?.color || roles[0].color}`}>
            {React.createElement(roles.find(r => r.id === currentRole)?.icon || User, { className: 'w-3 h-3' })}
            <span>{roles.find(r => r.id === currentRole)?.label || 'Klant'}</span>
          </span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Role Selection */}
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium text-gray-700">
          Selecteer nieuwe rol
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === role.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === role.id
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {selectedRole === role.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <role.icon className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{role.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleRoleChange}
        disabled={isSubmitting || selectedRole === currentRole}
        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Rol Wijzigen...</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>Rol Opslaan</span>
          </>
        )}
      </button>
    </div>
  );
}