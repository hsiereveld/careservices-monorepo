import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  Briefcase, 
  ShoppingBag, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserRoleManager } from './UserRoleManager';

interface UserWithRole {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

export function UserRoleList() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) {
        throw new Error(`Error fetching user roles: ${rolesError.message}`);
      }

      // Get profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at');

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
      }

      // Create a map of profiles for easy lookup
      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      // Combine the data
      const usersWithRoles = userRoles?.map(userRole => {
        const profile = profileMap.get(userRole.user_id);
        return {
          id: userRole.user_id,
          email: 'Email niet beschikbaar', // We don't have direct access to emails
          role: userRole.role,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          created_at: userRole.created_at
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(`Fout bij het ophalen van gebruikers: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRoleUpdated = () => {
    fetchUsers();
    setShowRoleManager(false);
    setSelectedUser(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-secondary-600" />;
      case 'backoffice':
        return <Briefcase className="w-4 h-4 text-orange-600" />;
      case 'professional':
        return <Briefcase className="w-4 h-4 text-accent-600" />;
      case 'client':
        return <ShoppingBag className="w-4 h-4 text-primary-600" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-primary-600" />; // Default to client icon
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-secondary-100 text-secondary-700 border-secondary-200';
      case 'backoffice':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'professional':
        return 'bg-accent-100 text-accent-700 border-accent-200';
      case 'client':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      default:
        return 'bg-primary-100 text-primary-700 border-primary-200'; // Default to client style
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'backoffice':
        return 'BackOffice';
      case 'professional':
        return 'Professional';
      case 'client':
        return 'Klant';
      default:
        return 'Klant'; // Default to Klant instead of Gebruiker
    }
  };

  const filteredUsers = users.filter(user => 
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoleLabel(user.role).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gebruikers & Rollen</h2>
        <button
          onClick={fetchUsers}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Vernieuwen
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Role Manager Modal */}
      {showRoleManager && selectedUser && (
        <div className="mb-6">
          <UserRoleManager
            userId={selectedUser.id}
            userEmail={selectedUser.email}
            currentRole={selectedUser.role}
            userName={selectedUser.first_name && selectedUser.last_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : undefined}
            onRoleUpdated={handleRoleUpdated}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setShowRoleManager(false);
                setSelectedUser(null);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Zoek gebruikers op naam of rol..."
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gebruiker</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {user.first_name?.charAt(0) || user.id.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}` 
                              : 'Geen naam ingesteld'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL') : 'Onbekend'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)} flex items-center w-fit space-x-1`}>
                        {getRoleIcon(user.role)}
                        <span>{getRoleLabel(user.role)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleManager(true);
                          }}
                          className="text-primary-600 hover:text-primary-800 px-2 py-1 rounded hover:bg-primary-50"
                        >
                          Wijzig rol
                        </button>
                        <button 
                          onClick={() => handleCopyId(user.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Kopieer ID"
                        >
                          {copiedId === user.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                {users.length === 0 ? 'Geen gebruikers gevonden.' : 'Geen gebruikers gevonden met deze zoekcriteria.'}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Totaal: {users.length} gebruikers
        </div>
      </div>
    </div>
  );
}