'use client';

import { useAuth } from '@/shared/hooks/useAuth';
import MarketingPage from './marketing-page';
import { CustomerDashboard } from '@/components/customer/CustomerDashboard';
import { Loading as LoadingSpinner } from '@/shared/components/ui/Loading';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Show different content based on authentication
  if (user) {
    // For now, show CustomerDashboard for all authenticated users
    // TODO: Add role-based routing when user roles are implemented
    return <CustomerDashboard />;
  }

  return <MarketingPage />;
} 