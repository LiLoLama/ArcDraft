import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import TemplatesListPage from './pages/TemplatesList';
import TemplateDetailPage from './pages/TemplateDetail';
import ProposalsListPage from './pages/ProposalsList';
import ProposalDetailPage from './pages/ProposalDetail';
import ProposalAnalyticsPage from './pages/ProposalAnalytics';
import BrandingSettingsPage from './pages/BrandingSettings';
import SecuritySettingsPage from './pages/SecuritySettings';
import AutomationSettingsPage from './pages/AutomationSettings';
import PublicProposalPage from './pages/PublicProposal';
import { AppLayout } from './components/Layout';
import useAuthStore from './store/authStore';

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="templates" element={<TemplatesListPage />} />
          <Route path="templates/:id" element={<TemplateDetailPage />} />
          <Route path="proposals" element={<ProposalsListPage />} />
          <Route path="proposals/:id" element={<ProposalDetailPage />} />
          <Route path="proposals/:id/analytics" element={<ProposalAnalyticsPage />} />
          <Route path="settings/branding" element={<BrandingSettingsPage />} />
          <Route path="settings/security" element={<SecuritySettingsPage />} />
          <Route path="settings/automation" element={<AutomationSettingsPage />} />
        </Route>
        <Route path="/p/:slug" element={<PublicProposalPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
