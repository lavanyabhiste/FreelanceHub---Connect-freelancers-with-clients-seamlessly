import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { loadCurrentUser } from './slices/authSlice';
import useAuth from './hooks/useAuth';
import useSocketListener from './hooks/useSocketListener';

import MainLayout from './layouts/MainLayout';
import ClientLayout from './layouts/ClientLayout';
import FreelancerLayout from './layouts/FreelancerLayout';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import PublicBrowseProjects from './pages/public/BrowseProjects';
import ClientApplications from './pages/client/ClientApplications';
import ClientMyReviews from './pages/client/MyReviews';
import ClientDashboard from './pages/client/ClientDashboard';
import MyProjects from './pages/client/MyProjects';
import ProjectDetail from './pages/client/ProjectDetail';
import BrowseFreelancers from './pages/client/BrowseFreelancers';
import FreelancerProfile from './pages/client/FreelancerProfile';
import ChatPage from './pages/client/ChatPage';
import ChatListPage from './pages/client/ChatListPage';
import FreelancerDashboard from './pages/freelancer/FreelancerDashboard';
import BrowseProjects from './pages/freelancer/BrowseProjects';
import MyApplications from './pages/freelancer/MyApplications';
import MyFreelancerProjects from './pages/freelancer/MyProjects';
import FreelancerProfilePage from './pages/freelancer/FreelancerProfile';
import FreelancerProjectDetail from './pages/freelancer/FreelancerProjectDetail';
import FreelancerChatPage from './pages/freelancer/FreelancerChatPage';
import FreelancerChatListPage from './pages/freelancer/FreelancerChatListPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProjects from './pages/admin/AdminProjects';
import AdminApplications from './pages/admin/AdminApplications';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Protected route wrapper
const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;
  return children;
};

// Mounts the global Socket.IO listeners — must render INSIDE the Router
// because the hook reads location.pathname to refresh unread counts.
function SocketBridge() {
  useSocketListener();
  return null;
}

export default function App() {
  const dispatch = useDispatch();
  const { token } = useAuth();

  // Rehydrate user from token on app start
  useEffect(() => {
    if (token) dispatch(loadCurrentUser());
  }, []);

  return (
    <BrowserRouter>
      <SocketBridge />
      <Routes>
        {/* Public */}
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
        <Route path="/projects" element={<MainLayout><PublicBrowseProjects /></MainLayout>} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        {/* Client routes */}
        <Route path="/client/*" element={
          <PrivateRoute requiredRole="Client">
            <ClientLayout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ClientDashboard />} />
                <Route path="projects" element={<MyProjects />} />
                <Route path="projects/new" element={<MyProjects />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="projects/:id/applications" element={<ProjectDetail />} />
                <Route path="applications" element={<ClientApplications />} />
                <Route path="reviews" element={<ClientMyReviews />} />
                <Route path="freelancers" element={<BrowseFreelancers />} />
                <Route path="freelancers/:id" element={<FreelancerProfile />} />
                <Route path="chat" element={<ChatListPage />} />
                <Route path="chat/:projectId" element={<ChatPage />} />
              </Routes>
            </ClientLayout>
          </PrivateRoute>
        } />

        {/* Freelancer routes */}
        <Route path="/freelancer/*" element={
          <PrivateRoute requiredRole="Freelancer">
            <FreelancerLayout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<FreelancerDashboard />} />
                <Route path="projects" element={<BrowseProjects />} />
                <Route path="projects/:id" element={<FreelancerProjectDetail />} />
                <Route path="applications" element={<MyApplications />} />
                <Route path="my-projects" element={<MyFreelancerProjects />} />
                <Route path="profile" element={<FreelancerProfilePage />} />
                <Route path="chat" element={<FreelancerChatListPage />} />
                <Route path="chat/:projectId" element={<FreelancerChatPage />} />
              </Routes>
            </FreelancerLayout>
          </PrivateRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <PrivateRoute requiredRole="Admin">
            <AdminLayout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="disputes" element={<AdminDisputes />} />
              </Routes>
            </AdminLayout>
          </PrivateRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
