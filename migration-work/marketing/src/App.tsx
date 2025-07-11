import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { ServicesPage } from './pages/ServicesPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ClientDashboard } from './pages/ClientDashboard';
import { ProfessionalDashboard } from './pages/ProfessionalDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { BackofficeDashboard } from './pages/BackofficeDashboard';
import { AboutUsPage } from './pages/AboutUsPage';
import { TermsAndConditionsPage } from './pages/TermsAndConditionsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { ContactPage } from './pages/ContactPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { MolliePaymentStatusPage } from './pages/MolliePaymentStatusPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/diensten" element={<ServicesPage />} />
            <Route path="/over-ons" element={<AboutUsPage />} />
            <Route path="/hoe-werkt-het" element={<HowItWorksPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/algemene-voorwaarden" element={<TermsAndConditionsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/payment-status" element={<MolliePaymentStatusPage />} />
            
            {/* Dashboard routes - will be expanded in next phases */}
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
            <Route path="/backoffice-dashboard" element={<BackofficeDashboard />} />
            
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;