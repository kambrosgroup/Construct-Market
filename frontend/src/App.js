import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from './components/ui/sonner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import AuthCallback from './pages/AuthCallback';

// Builder Pages
import BuilderDashboard from './pages/builder/Dashboard';
import BuilderTasks from './pages/builder/Tasks';
import BuilderTaskDetail from './pages/builder/TaskDetail';
import BuilderTaskCreate from './pages/builder/TaskCreate';
import BuilderContracts from './pages/builder/Contracts';
import BuilderContractDetail from './pages/builder/ContractDetail';
import BuilderPayments from './pages/builder/Payments';
import BuilderInvoices from './pages/builder/Invoices';
import BuilderSettings from './pages/builder/Settings';

// Provider Pages
import ProviderDashboard from './pages/provider/Dashboard';
import ProviderTaskFeed from './pages/provider/TaskFeed';
import ProviderTaskDetail from './pages/provider/TaskDetail';
import ProviderBids from './pages/provider/Bids';
import ProviderContracts from './pages/provider/Contracts';
import ProviderContractDetail from './pages/provider/ContractDetail';
import ProviderWorkOrders from './pages/provider/WorkOrders';
import ProviderWorkOrderDetail from './pages/provider/WorkOrderDetail';
import ProviderRatings from './pages/provider/Ratings';
import ProviderSettings from './pages/provider/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCompanies from './pages/admin/Companies';
import AdminCompliance from './pages/admin/Compliance';
import AdminDisputes from './pages/admin/Disputes';
import AdminAnalytics from './pages/admin/Analytics';

// Shared
import PaymentSuccess from './pages/PaymentSuccess';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
        headers
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('token', response.data.token);
    await checkAuth();
    return response.data;
  };

  const signup = async (data) => {
    const response = await axios.post(`${API}/auth/signup`, data);
    localStorage.setItem('token', response.data.token);
    await checkAuth();
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      // Ignore errors
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.needs_onboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'builder') return <Navigate to="/builder" replace />;
    if (user.role === 'provider') return <Navigate to="/provider" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Role-based redirect
const RoleRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.needs_onboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user.role === 'builder') return <Navigate to="/builder" replace />;
  if (user.role === 'provider') return <Navigate to="/provider" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  
  return <Navigate to="/" replace />;
};

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<RoleRedirect />} />
      
      {/* Payment Success */}
      <Route path="/payments/:paymentId/success" element={<PaymentSuccess />} />

      {/* Builder Routes */}
      <Route path="/builder" element={<ProtectedRoute allowedRoles={['builder']}><BuilderDashboard /></ProtectedRoute>} />
      <Route path="/builder/tasks" element={<ProtectedRoute allowedRoles={['builder']}><BuilderTasks /></ProtectedRoute>} />
      <Route path="/builder/tasks/create" element={<ProtectedRoute allowedRoles={['builder']}><BuilderTaskCreate /></ProtectedRoute>} />
      <Route path="/builder/tasks/:taskId" element={<ProtectedRoute allowedRoles={['builder']}><BuilderTaskDetail /></ProtectedRoute>} />
      <Route path="/builder/contracts" element={<ProtectedRoute allowedRoles={['builder']}><BuilderContracts /></ProtectedRoute>} />
      <Route path="/builder/contracts/:contractId" element={<ProtectedRoute allowedRoles={['builder']}><BuilderContractDetail /></ProtectedRoute>} />
      <Route path="/builder/payments" element={<ProtectedRoute allowedRoles={['builder']}><BuilderPayments /></ProtectedRoute>} />
      <Route path="/builder/invoices" element={<ProtectedRoute allowedRoles={['builder']}><BuilderInvoices /></ProtectedRoute>} />
      <Route path="/builder/settings" element={<ProtectedRoute allowedRoles={['builder']}><BuilderSettings /></ProtectedRoute>} />

      {/* Provider Routes */}
      <Route path="/provider" element={<ProtectedRoute allowedRoles={['provider']}><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/provider/tasks" element={<ProtectedRoute allowedRoles={['provider']}><ProviderTaskFeed /></ProtectedRoute>} />
      <Route path="/provider/tasks/:taskId" element={<ProtectedRoute allowedRoles={['provider']}><ProviderTaskDetail /></ProtectedRoute>} />
      <Route path="/provider/bids" element={<ProtectedRoute allowedRoles={['provider']}><ProviderBids /></ProtectedRoute>} />
      <Route path="/provider/contracts" element={<ProtectedRoute allowedRoles={['provider']}><ProviderContracts /></ProtectedRoute>} />
      <Route path="/provider/contracts/:contractId" element={<ProtectedRoute allowedRoles={['provider']}><ProviderContractDetail /></ProtectedRoute>} />
      <Route path="/provider/work-orders" element={<ProtectedRoute allowedRoles={['provider']}><ProviderWorkOrders /></ProtectedRoute>} />
      <Route path="/provider/work-orders/:workOrderId" element={<ProtectedRoute allowedRoles={['provider']}><ProviderWorkOrderDetail /></ProtectedRoute>} />
      <Route path="/provider/ratings" element={<ProtectedRoute allowedRoles={['provider']}><ProviderRatings /></ProtectedRoute>} />
      <Route path="/provider/settings" element={<ProtectedRoute allowedRoles={['provider']}><ProviderSettings /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['admin']}><AdminCompanies /></ProtectedRoute>} />
      <Route path="/admin/compliance" element={<ProtectedRoute allowedRoles={['admin']}><AdminCompliance /></ProtectedRoute>} />
      <Route path="/admin/disputes" element={<ProtectedRoute allowedRoles={['admin']}><AdminDisputes /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
