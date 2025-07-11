import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  Package, 
  Tag, 
  Mail, 
  FileText, 
  Database, 
  CreditCard, 
  Server, 
  Activity, 
  Briefcase, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Search, 
  Filter, 
  RefreshCw,
  User,
  Shield,
  Clock,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';
import { CategoryManagement } from '../components/admin/CategoryManagement';
import { ServiceManagement } from '../components/admin/ServiceManagement';
import { DiscountManagement } from '../components/admin/DiscountManagement';
import { ServiceBundleManagement } from '../components/admin/ServiceBundleManagement';
import { SubscriptionPlanManagement } from '../components/admin/SubscriptionPlanManagement';
import { EmailTemplateManager } from '../components/admin/EmailTemplateManager';
import { UserRoleList } from '../components/admin/UserRoleList';
import { BackupSettings } from '../components/admin/BackupSettings';
import { SystemMonitoring } from '../components/admin/SystemMonitoring';
import { AppSettingsManager } from '../components/admin/AppSettingsManager';
import { PaymentTestingTools } from '../components/admin/PaymentTestingTools';
import { InvoicingManagement } from '../components/admin/InvoicingManagement';
import { PayoutsManagement } from '../components/admin/PayoutsManagement';
import { ContactMessageManagement } from '../components/admin/ContactMessageManagement';
import { BookingManagement } from '../components/admin/BookingManagement';

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isBackOffice, hasAdminPrivileges, loading: roleLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<any>({
    userCount: 0,
    clientCount: 0,
    professionalCount: 0,
    serviceCount: 0,
    bookingCount: 0,
    newContactMessages: 0,
    recentUsers: [],
    recentBookings: []
  });

  useEffect(() => {
    if (user && hasAdminPrivileges && !roleLoading) {
      fetchDashboardData();
    }
  }, [user, hasAdminPrivileges, roleLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all user roles to count them manually
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role');

      if (userRolesError) throw userRolesError;

      // Count roles manually
      const roleCounts = userRoles?.reduce((acc: any, userRole: any) => {
        acc[userRole.role] = (acc[userRole.role] || 0) + 1;
        return acc;
      }, {}) || {};

      // Fetch services count
      const { count: serviceCount, error: serviceError } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });

      if (serviceError) throw serviceError;

      // Fetch bookings count
      const { count: bookingCount, error: bookingError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      if (bookingError) throw bookingError;

      // Fetch new contact messages count
      const { count: newContactMessagesCount, error: contactError } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      if (contactError) throw contactError;

      // Fetch recent users (using profiles and user_roles)
      const { data: recentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (profilesError) throw profilesError;

      // Fetch roles for these profiles
      let recentUsers = [];
      if (recentProfiles && recentProfiles.length > 0) {
        const userIds = recentProfiles.map(profile => profile.id);
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) throw rolesError;

        // Combine profiles with roles
        recentUsers = recentProfiles.map(profile => {
          const userRole = roles?.find(r => r.user_id === profile.id);
          return {
            ...profile,
            role: userRole?.role || 'unknown'
          };
        });
      }

      // Fetch recent bookings
      const { data: recentBookings, error: recentBookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          customer_id,
          service_id,
          booking_date,
          booking_time,
          status,
          estimated_price,
          created_at,
          service:services(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentBookingsError) throw recentBookingsError;

      // Process user roles count
      const clientCount = roleCounts.client || 0;
      const professionalCount = roleCounts.professional || 0;
      const userCount = Object.values(roleCounts).reduce((sum: number, count: any) => sum + count, 0);

      setDashboardData({
        userCount,
        clientCount,
        professionalCount,
        serviceCount: serviceCount || 0,
        bookingCount: bookingCount || 0,
        newContactMessages: newContactMessagesCount || 0,
        recentUsers,
        recentBookings: recentBookings || []
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Fout bij het laden van dashboard gegevens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="text-text-primary text-xl font-medium">Admin dashboard laden...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate href="/login" replace />;
  }

  if (!hasAdminPrivileges) {
    return <Navigate href="/dashboard" replace />;
  }

  const tabs = [
    { id: 'overview', label: 'Overzicht', icon: Activity, admin: false },
    { id: 'users', label: 'Gebruikers', icon: Users, admin: false },
    { id: 'services', label: 'Diensten', icon: Package, admin: false },
    { id: 'categories', label: 'Categorieën', icon: Tag, admin: false },
    { id: 'bookings', label: 'Boekingen', icon: Calendar, admin: false },
    { id: 'discounts', label: 'Kortingen', icon: Tag, admin: false },
    { id: 'bundles', label: 'Bundels', icon: Package, admin: false },
    { id: 'subscriptions', label: 'Abonnementen', icon: Package, admin: false },
    { id: 'emails', label: 'E-mails', icon: Mail, admin: false },
    { id: 'contact', label: 'Contactberichten', icon: MessageSquare, admin: false },
    { id: 'invoicing', label: 'Facturatie', icon: FileText, admin: false },
    { id: 'payouts', label: 'Uitbetalingen', icon: CreditCard, admin: true },
    { id: 'payments', label: 'Betalingen', icon: CreditCard, admin: true },
    { id: 'settings', label: 'Instellingen', icon: Settings, admin: true },
    { id: 'backup', label: 'Backup', icon: Database, admin: true },
    { id: 'system', label: 'Systeem', icon: Server, admin: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.admin || isAdmin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-2">
                {isAdmin ? 'Admin Dashboard' : 'BackOffice Dashboard'}
              </h1>
              <p className="text-text-secondary text-lg">
                {isAdmin ? 'Beheer alle aspecten van het platform' : 'Beheer klanten, professionals en diensten'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${isAdmin ? 'bg-secondary-100 text-secondary-700' : 'bg-orange-100 text-orange-700'}`}>
                {isAdmin ? 'Administrator' : 'BackOffice'}
              </span>
              <button
                onClick={fetchDashboardData}
                className="p-2 text-text-light hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Vernieuwen"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md p-1 mb-8 overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-secondary-500 text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Totaal Gebruikers</p>
                      <p className="text-3xl font-bold text-text-primary">{dashboardData.userCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-4">
                    <div>
                      <p className="text-xs text-text-light">Klanten</p>
                      <p className="text-sm font-semibold">{dashboardData.clientCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-light">Professionals</p>
                      <p className="text-sm font-semibold">{dashboardData.professionalCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Diensten</p>
                      <p className="text-3xl font-bold text-text-primary">{dashboardData.serviceCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-accent-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Boekingen</p>
                      <p className="text-3xl font-bold text-text-primary">{dashboardData.bookingCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-secondary-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Nieuwe Berichten</p>
                      <p className="text-3xl font-bold text-text-primary">{dashboardData.newContactMessages}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Nieuwe Contactberichten</p>
                      <p className="text-3xl font-bold text-text-primary">{dashboardData.newContactMessages}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  {dashboardData.newContactMessages > 0 && (
                    <button
                      onClick={() => setActiveTab('contact')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Bekijk berichten →
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-text-secondary text-sm font-medium">Nieuwe Professionals</p>
                      <p className="text-3xl font-bold text-text-primary">{dashboardData.professionalCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-accent-600" />
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-sm text-accent-600 hover:text-accent-700 font-medium"
                  >
                    Bekijk gebruikers →
                  </button>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-text-primary">Recente Gebruikers</h2>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                  ) : dashboardData.recentUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aangemeld op</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardData.recentUsers.map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary-600" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.first_name && user.last_name 
                                        ? `${user.first_name} ${user.last_name}` 
                                        : 'Naamloos'}
                                    </div>
                                    <div className="text-sm text-gray-500">{user.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.role === 'admin' ? 'bg-secondary-100 text-secondary-800' :
                                  user.role === 'backoffice' ? 'bg-orange-100 text-orange-800' :
                                  user.role === 'professional' ? 'bg-accent-100 text-accent-800' :
                                  user.role === 'client' ? 'bg-primary-100 text-primary-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.role === 'admin' ? 'Administrator' :
                                   user.role === 'backoffice' ? 'BackOffice' :
                                   user.role === 'professional' ? 'Professional' :
                                   user.role === 'client' ? 'Klant' :
                                   user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString('nl-NL')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-text-secondary">Geen recente gebruikers gevonden</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-text-primary">Recente Boekingen</h2>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                  ) : dashboardData.recentBookings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dienst</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardData.recentBookings.map((booking: any) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.service?.name || 'Onbekende dienst'}
                                </div>
                                <div className="text-sm text-gray-500">{booking.customer_id}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {new Date(booking.booking_date).toLocaleDateString('nl-NL')}
                                </div>
                                <div className="text-sm text-gray-500">{booking.booking_time}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status === 'pending' ? 'In afwachting' :
                                   booking.status === 'confirmed' ? 'Bevestigd' :
                                   booking.status === 'completed' ? 'Voltooid' :
                                   booking.status === 'cancelled' ? 'Geannuleerd' :
                                   booking.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                €{booking.estimated_price?.toFixed(2) || '0.00'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-text-secondary">Geen recente boekingen gevonden</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && <UserRoleList />}
          {activeTab === 'services' && <ServiceManagement />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'bookings' && <BookingManagement />}
          {activeTab === 'discounts' && <DiscountManagement />}
          {activeTab === 'bundles' && <ServiceBundleManagement />}
          {activeTab === 'subscriptions' && <SubscriptionPlanManagement />}
          {activeTab === 'emails' && <EmailTemplateManager />}
          {activeTab === 'contact' && <ContactMessageManagement />}
          {activeTab === 'invoicing' && <InvoicingManagement />}
          {activeTab === 'payouts' && <PayoutsManagement />}
          {activeTab === 'payments' && <PaymentTestingTools />}
          {activeTab === 'settings' && <AppSettingsManager />}
          {activeTab === 'backup' && <BackupSettings />}
          {activeTab === 'system' && <SystemMonitoring />}
        </div>
      </div>
    </div>
  );
}