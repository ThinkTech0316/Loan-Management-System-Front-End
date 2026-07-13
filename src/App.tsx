
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { AuthLayout } from './components/layouts/AuthLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrandingProvider } from './contexts/BrandingContext';

// Pages
import Dashboard from './pages/Dashboard';
import Borrowers from './pages/Borrowers';
import Loans from './pages/Loans';
import FixedDeposits from './pages/FixedDeposits';
import Repayments from './pages/Repayments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Staff from './pages/Staff';
import StaffDetails from './pages/StaffDetails';

function ProtectedRoute() {
  const token = localStorage.getItem('auth_token');
  if (!token) return <Navigate to="/login" replace />;
  return <DashboardLayout />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    if (user.role !== 'superadmin') {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    if (user.role === 'superadmin') {
      return <Navigate to="/staff" replace />;
    }
  } catch {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vanniloan-ui-theme">
      <BrandingProvider>
        <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          </Route>

          {/* Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Admin Only Routes (Finance) */}
            <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/borrowers" element={<AdminRoute><Borrowers /></AdminRoute>} />
            <Route path="/loans" element={<AdminRoute><Loans /></AdminRoute>} />
            <Route path="/fixed-deposits" element={<AdminRoute><FixedDeposits /></AdminRoute>} />
            <Route path="/repayments" element={<AdminRoute><Repayments /></AdminRoute>} />
            <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* SuperAdmin Only Routes */}
            <Route path="/staff" element={<SuperAdminRoute><Staff /></SuperAdminRoute>} />
            <Route path="/staff/:id" element={<SuperAdminRoute><StaffDetails /></SuperAdminRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </BrandingProvider>
    </ThemeProvider>
  );
}

export default App;