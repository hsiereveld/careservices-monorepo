'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { 
  Database, 
  Users, 
  Calendar, 
  Star, 
  Activity, 
  RefreshCw, 
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Briefcase,
  CreditCard,
  MessageSquare,
  Settings,
  Shield,
  Clock,
  Edit,
  Trash2,
  X,
  Save
} from 'lucide-react';

interface DatabaseStats {
  tables: {
    name: string;
    count: number;
    type: 'core' | 'franchise' | 'extended' | 'other';
  }[];
  users: {
    total: number;
    admins: number;
    professionals: number;
    clients: number;
    recent: number;
  };
  activity: {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    recentBookings: number;
    totalServices: number;
    activeServices: number;
    totalReviews: number;
    avgRating: number;
  };
  professionals: {
    total: number;
    verified: number;
    active: number;
    avgRating: number;
    totalEarnings: number;
  };
  systemHealth: {
    schemaVersion: string;
    lastBackup: string;
    activeConnections: number;
    responseTime: number;
  };
}

interface UserDetail {
  id: string;
  email?: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  date_of_birth?: string;
  instroom_completed?: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
  is_verified?: boolean;
}

interface ProfessionalDetail {
  id: string;
  user_id: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  service_radius_km?: number;
  hourly_rate?: number;
  rating_average?: number;
  total_reviews?: number;
  total_bookings?: number;
  is_verified: boolean;
  is_active?: boolean;
  joined_at?: string;
  created_at: string;
  updated_at?: string;
}

export default function DatabaseAnalytics() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'professionals' | 'queries'>('overview');
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('/api/admin/database-analytics');
      if (!response.ok) throw new Error('Failed to fetch database stats');
      const data = await response.json();
      setStats(data); // API now returns the DatabaseStats structure directly
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch database stats');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      // Accept both { users: [...] } and [...]
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    }
  };

  const fetchProfessionals = async () => {
    try {
      const response = await fetch('/api/admin/professionals');
      if (!response.ok) throw new Error('Failed to fetch professionals');
      const data = await response.json();
      // Accept both { professionals: [...] } and [...]
      setProfessionals(Array.isArray(data) ? data : (data.professionals || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch professionals');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      // Refresh analytics data to reflect changes
      fetchDatabaseStats();
      
      console.log(`✅ Successfully updated user role to ${newRole}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
      console.error('❌ Error updating user role:', err);
    }
  };

  const updateUser = async (userData: Partial<UserDetail>) => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const result = await response.json();

      // Update the local state
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...user, ...result.user } : user
      ));

      // Refresh analytics data to reflect changes
      fetchDatabaseStats();
      
      setShowEditModal(false);
      setEditingUser(null);
      
      console.log(`✅ Successfully updated user ${editingUser.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      console.error('❌ Error updating user:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate user');
      }

      const result = await response.json();

      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...result.user } : user
      ));

      // Refresh analytics data to reflect changes
      fetchDatabaseStats();
      
      setShowDeleteConfirm(null);
      
      console.log(`✅ Successfully deactivated user ${userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
      console.error('❌ Error deactivating user:', err);
    }
  };

  const openEditModal = (user: UserDetail) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const refreshData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        fetchDatabaseStats(),
        fetchUsers(),
        fetchProfessionals()
      ]);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    loadData();
  }, []);

  // Map new API response shape to legacy stats structure for UI compatibility
  let mappedStats = stats;
  const statsAny = stats as any;
  if (stats && !statsAny.users && (typeof statsAny.totalUsers === 'number')) {
    mappedStats = {
      users: {
        total: statsAny.totalUsers,
        admins: statsAny.userTypes?.admins ?? 0,
        professionals: statsAny.userTypes?.professionals ?? 0,
        clients: statsAny.userTypes?.customers ?? 0,
        recent: statsAny.growthStats?.newUsersLast30Days ?? 0,
      },
      activity: {
        totalBookings: statsAny.totalBookings ?? 0,
        activeBookings: statsAny.bookingStats?.pending ?? 0,
        completedBookings: statsAny.bookingStats?.completed ?? 0,
        recentBookings: statsAny.growthStats?.newBookingsLast30Days ?? 0,
        totalServices: statsAny.totalServices ?? 0,
        activeServices: statsAny.serviceStats?.active ?? 0,
        totalReviews: statsAny.totalReviews ?? 0,
        avgRating: statsAny.reviewStats?.averageRating ?? 0,
      },
      professionals: {
        total: statsAny.totalProviders ?? 0,
        verified: statsAny.providerStats?.verified ?? 0,
        active: statsAny.providerStats?.active ?? 0,
        avgRating: statsAny.providerStats?.averageRating ?? 0,
        totalEarnings: statsAny.providerStats?.totalEarnings ?? 0,
      },
      systemHealth: {
        schemaVersion: 'N/A',
        lastBackup: 'N/A',
        activeConnections: 0,
        responseTime: 0,
      },
      tables: [],
    };
  }

  const exportData = async (type: 'users' | 'professionals' | 'stats') => {
    try {
      const response = await fetch(`/api/admin/export/${type}`);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Database analytics laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Analytics</h2>
          <p className="text-gray-600">Live database statistieken en gebruikersoverzicht</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Vernieuwen...' : 'Vernieuwen'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportData('stats')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overzicht', icon: Activity },
            { id: 'users', label: 'Gebruikers', icon: Users },
            { id: 'professionals', label: 'Professionals', icon: Briefcase },
            { id: 'queries', label: 'Live Queries', icon: Search }
          ].map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && mappedStats && (
        <div className="space-y-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Systeem Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mappedStats.systemHealth?.schemaVersion || 'N/A'}</div>
                  <p className="text-sm text-gray-600">Schema Versie</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{mappedStats.systemHealth?.activeConnections || 0}</div>
                  <p className="text-sm text-gray-600">Actieve Verbindingen</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{mappedStats.systemHealth?.responseTime || 0}ms</div>
                  <p className="text-sm text-gray-600">Response Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{mappedStats.systemHealth?.lastBackup || 'N/A'}</div>
                  <p className="text-sm text-gray-600">Laatste Backup</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Tables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Database Tabellen ({mappedStats.tables?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mappedStats.tables?.length > 0 ? mappedStats.tables.map((table) => (
                  <div key={table.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{table.name}</h3>
                      <Badge variant={
                        table.type === 'core' ? 'secondary' :
                        table.type === 'franchise' ? 'default' :
                        'secondary'
                      } className={
                        table.type === 'other' ? 'bg-gray-100 text-gray-600' : ''
                      }>
                        {table.type}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{table.count.toLocaleString()}</div>
                    <p className="text-xs text-gray-600">records</p>
                  </div>
                )) : (
                  <div className="col-span-full text-center text-gray-500">
                    Geen tabellen gevonden
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Gebruikers Overzicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Totaal Gebruikers</span>
                    <span className="text-2xl font-bold">{mappedStats.users?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Administrators</span>
                    <span className="text-lg font-semibold text-red-600">{mappedStats.users?.admins || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Professionals</span>
                    <span className="text-lg font-semibold text-blue-600">{mappedStats.users?.professionals || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Klanten</span>
                    <span className="text-lg font-semibold text-green-600">{mappedStats.users?.clients || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nieuw (30 dagen)</span>
                    <span className="text-lg font-semibold text-orange-600">{mappedStats.users?.recent || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Platform Activiteit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Totaal Boekingen</span>
                    <span className="text-2xl font-bold">{mappedStats.activity?.totalBookings || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Actieve Boekingen</span>
                    <span className="text-lg font-semibold text-blue-600">{mappedStats.activity?.activeBookings || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Voltooide Boekingen</span>
                    <span className="text-lg font-semibold text-green-600">{mappedStats.activity?.completedBookings || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Actieve Services</span>
                    <span className="text-lg font-semibold text-purple-600">{mappedStats.activity?.activeServices || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gemiddelde Rating</span>
                    <span className="text-lg font-semibold text-yellow-600">{(mappedStats.activity?.avgRating || 0).toFixed(1)} ⭐</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Users Section */}
      {activeSection === 'users' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Alle Gebruikers ({users.length})
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportData('users')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Gebruikers
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(users) && users.length > 0 ? users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      user.role === 'admin' ? 'bg-red-500' :
                      user.role === 'professional' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`} />
                    <div>
                      <div className="font-semibold">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.email
                        }
                      </div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select 
                      value={user.role} 
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="customer">Customer</option>
                      <option value="professional">Professional</option>
                      <option value="admin">Admin</option>
                    </select>
                    {user.is_verified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <div className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('nl-NL')}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Geen gebruikers gevonden</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professionals Section */}
      {activeSection === 'professionals' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Professionals ({professionals.length})
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportData('professionals')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Professionals
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {professionals.map((professional) => (
                <div key={professional.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">
                          {professional.business_name || 
                           `${professional.first_name} ${professional.last_name}`}
                        </h3>
                        {professional.is_verified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {!professional.is_active && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Beschrijving:</span> {professional.description || 'Niet opgegeven'}
                        </div>
                        <div>
                          <span className="text-gray-600">Service radius:</span> {professional.service_radius_km ? `${professional.service_radius_km} km` : 'Niet opgegeven'}
                        </div>
                        <div>
                          <span className="text-gray-600">Lid sinds:</span> {new Date(professional.created_at).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-yellow-600">
                            {professional.rating_average?.toFixed(1) || '0.0'} ⭐
                          </div>
                          <div className="text-xs text-gray-500">
                            {professional.total_reviews || 0} reviews
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-600">
                            {professional.total_bookings || 0}
                          </div>
                          <div className="text-xs text-gray-500">boekingen</div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Badge variant={professional.is_active !== false ? 'secondary' : 'secondary'} 
                               className={professional.is_active !== false ? '' : 'bg-gray-100 text-gray-600'}>
                          {professional.is_active !== false ? 'Actief' : 'Inactief'}
                        </Badge>
                        <Badge variant={professional.is_verified ? 'default' : 'default'} 
                               className={professional.is_verified ? '' : 'bg-red-100 text-red-800'}>
                          {professional.is_verified ? 'Geverifieerd' : 'Niet geverifieerd'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Queries Section */}
      {activeSection === 'queries' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Live Database Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Beschikbare Queries:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Recente Activiteit
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Groei Statistieken
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Betalingen Overzicht
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Star className="h-4 w-4 mr-2" />
                    Top Professionals
                  </Button>
                </div>
              </div>
              
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Selecteer een query om live data te bekijken</p>
                <p className="text-sm mt-2">Meer query opties komen binnenkort beschikbaar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gebruiker Bewerken</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                first_name: formData.get('first_name') as string,
                last_name: formData.get('last_name') as string,
                phone: formData.get('phone') as string,
                role: formData.get('role') as string,
                bio: formData.get('bio') as string,
              };
              updateUser(userData);
            }}>
              <div className="space-y-4">
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     User ID
                   </label>
                   <input
                     type="text"
                     value={editingUser.id}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 focus:outline-none text-xs font-mono"
                     readOnly
                   />
                   <p className="text-xs text-gray-500 mt-1">Unieke gebruikers identificatie</p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Email Adres
                   </label>
                   <input
                     type="email"
                     name="email"
                     defaultValue={editingUser.email || ''}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 focus:outline-none"
                     readOnly
                     placeholder="Geen email adres beschikbaar"
                   />
                   <p className="text-xs text-gray-500 mt-1">Email adres kan niet worden gewijzigd</p>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Voornaam
                   </label>
                   <input
                     type="text"
                     name="first_name"
                     defaultValue={editingUser.first_name || ''}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   />
                 </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Achternaam
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    defaultValue={editingUser.last_name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefoon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingUser.phone || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Voer telefoonnummer in..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    name="role"
                    defaultValue={editingUser.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="professional">Professional</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Geboortedatum
                   </label>
                   <input
                     type="date"
                     name="date_of_birth"
                     defaultValue={editingUser.date_of_birth || ''}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Bio
                   </label>
                   <textarea
                     name="bio"
                     rows={3}
                     defaultValue={editingUser.bio || ''}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="Voeg een bio toe..."
                   />
                 </div>
                 
                 <div className="flex items-center space-x-2">
                   <input
                     type="checkbox"
                     name="instroom_completed"
                     id="instroom_completed"
                     defaultChecked={editingUser.instroom_completed || false}
                     className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                   />
                   <label htmlFor="instroom_completed" className="text-sm font-medium text-gray-700">
                     Instroom voltooid
                   </label>
                 </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Opslaan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Gebruiker Deactiveren</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Weet je zeker dat je deze gebruiker wilt deactiveren? Dit zal de gebruiker degraderen naar een customer rol en alle professionele activiteiten deactiveren.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Deze actie kan ongedaan worden gemaakt door de gebruiker opnieuw te bewerken.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Annuleren
              </Button>
              <Button
                onClick={() => deleteUser(showDeleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deactiveren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 