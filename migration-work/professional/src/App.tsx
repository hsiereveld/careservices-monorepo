import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfessionalDashboard } from './pages/ProfessionalDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsAndConditionsPage } from './pages/TermsAndConditionsPage';
import { MolliePaymentStatusPage } from './pages/MolliePaymentStatusPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Professional routes */}
            <Route path="/dashboard" element={<ProfessionalDashboard />} />
            <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Legal pages */}
            <Route path="/algemene-voorwaarden" element={<TermsAndConditionsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            
            {/* Payment status */}
            <Route path="/payment-status" element={<MolliePaymentStatusPage />} />
            
            {/* Redirect home to dashboard */}
            <Route path="/" element={<Navigate href="/professional-dashboard" replace />} />
            
            {/* Catch all other routes and redirect to dashboard */}
            <Route path="*" element={<Navigate href="/professional-dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;