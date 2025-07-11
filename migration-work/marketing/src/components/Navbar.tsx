import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Home, Settings, ChevronDown, Menu, X, Briefcase, ShoppingBag, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isBackOffice, hasAdminPrivileges, userRole } = useAdmin();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<{ first_name?: string; last_name?: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const navigate = useNavigate();

  // Fetch user profile when user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  // Get display name for user
  const getUserDisplayName = () => {
    if (loadingProfile) return 'Laden...';
    
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    
    if (user?.email) {
      // Extract first part of email as fallback
      return user.email.split('@')[0];
    }
    
    return 'Gebruiker';
  };

  // Get role display name
  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'backoffice': return 'BackOffice';
      case 'professional': return 'Professional';
      case 'client': return 'Klant';
      default: return 'Klant';
    }
  };

  // Get role icon
  const getRoleIcon = () => {
    switch (userRole) {
      case 'backoffice': return <Briefcase className="w-4 h-4" />;
      case 'professional': return <Briefcase className="w-4 h-4" />;
      case 'client': return <ShoppingBag className="w-4 h-4" />;
      default: return <ShoppingBag className="w-4 h-4" />;
    }
  };

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    switch (userRole) {
      case 'backoffice': return '/backoffice-dashboard';
      case 'professional': return '/professional-dashboard';
      case 'client': return '/client-dashboard';
      default: return '/dashboard';
    }
  };

  // Navigate to appropriate dashboard
  const goToDashboard = () => {
    navigate(getDashboardUrl());
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/CS-Logo.png" 
              alt="Care & Service Pinoso" 
              className="h-12 sm:h-14 md:h-16 w-auto max-w-none"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              Home
            </Link>
            
            <Link 
              href="/diensten" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              Diensten
            </Link>
            
            <Link 
              href="/hoe-werkt-het" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              Hoe Werkt Het
            </Link>
            
            <Link 
              href="/over-ons" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              Over Ons
            </Link>
            
            {user ? (
              <>
                <Link 
                  href={getDashboardUrl()} 
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  Dashboard
                </Link>
                
                {/* Show Beheer menu if user has admin privileges */}
                {hasAdminPrivileges && (
                  <Link 
                    href="/backoffice-dashboard" 
                    className="text-gray-700 hover:text-primary-600 transition-colors font-medium flex items-center space-x-1"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Beheer</span>
                  </Link>
                )}
                
                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors font-medium"
                  >
                    {getRoleIcon()}
                    <span>{getUserDisplayName()}</span>
                    {userRole && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        {getRoleDisplayName()}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <button 
                        onClick={goToDashboard}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <Home className="w-4 h-4" />
                        <span>{getRoleDisplayName()} Dashboard</span>
                      </button>
                      <Link 
                        href="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Profiel</span>
                      </Link>
                      {/* Show Beheer in dropdown if user has admin privileges */}
                      {hasAdminPrivileges && (
                        <Link 
                          href="/backoffice-dashboard"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Briefcase className="w-4 h-4" />
                          <span>Beheer</span>
                        </Link>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={() => {
                          handleSignOut();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Uitloggen</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  Inloggen
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  Registreren
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              <Link 
                href="/" 
                className="block text-gray-700 hover:text-primary-600 transition-colors font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              
              <Link 
                href="/diensten" 
                className="block text-gray-700 hover:text-primary-600 transition-colors font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Diensten
              </Link>
              
              <Link 
                href="/hoe-werkt-het" 
                className="block text-gray-700 hover:text-primary-600 transition-colors font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Hoe Werkt Het
              </Link>
              
              <Link 
                href="/over-ons" 
                className="block text-gray-700 hover:text-primary-600 transition-colors font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Over Ons
              </Link>
              
              {user ? (
                <>
                  <button 
                    onClick={() => {
                      navigate(getDashboardUrl());
                      setShowMobileMenu(false);
                    }}
                    className="block text-gray-700 hover:text-primary-600 transition-colors font-medium text-left w-full"
                  >
                    {getRoleDisplayName()} Dashboard
                  </button>
                  <Link 
                    href="/profile" 
                    className="block text-gray-700 hover:text-primary-600 transition-colors font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Profiel
                  </Link>
                  {/* Show Beheer in mobile menu if user has admin privileges */}
                  {hasAdminPrivileges && (
                    <Link 
                      href="/backoffice-dashboard" 
                      className="block text-gray-700 hover:text-primary-600 transition-colors font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Beheer
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowMobileMenu(false);
                    }}
                    className="block text-gray-700 hover:text-primary-600 transition-colors font-medium text-left"
                  >
                    Uitloggen
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="block text-gray-700 hover:text-primary-600 transition-colors font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Inloggen
                  </Link>
                  <Link 
                    href="/signup" 
                    className="block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors font-medium text-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Registreren
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}