import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function useRoleRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      redirectToDashboard();
    }
  }, [user]);

  const redirectToDashboard = async () => {
    if (!user) return;

    try {
      // Always redirect to professional dashboard
      navigate('/professional-dashboard');
    } catch (err) {
      console.error('Error in role redirect:', err);
      navigate('/professional-dashboard'); // Fallback to professional dashboard
    }
  };

  return { redirectToDashboard };
}