import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Pages
import Login from "./pages/Login";
import FacultyHome from "./pages/FacultyHome";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectsTable from "./pages/ProjectsTable";
import ChangePassword from "./pages/ChangePassword";
import HODDashboard from "./pages/HODDashboard";
import CreateUser from "./pages/CreateUser";
import AddProject from "./pages/AddProject";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, loading, profile } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? (
        ['superadmin', 'admin'].includes(profile?.role || '')
          ? <Navigate to="/dashboard" replace />
          : <Navigate to="/home" replace />
      ) : <Login />} />

      <Route path="/home" element={<ProtectedRoute><FacultyHome /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><HODDashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><FacultyHome /></ProtectedRoute>} />
      <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/projects-table" element={<ProtectedRoute><ProjectsTable /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/create-user" element={<ProtectedRoute><CreateUser /></ProtectedRoute>} />
      <Route path="/add-project" element={<ProtectedRoute><AddProject /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="/" element={
        ['superadmin', 'admin'].includes(profile?.role || '')
          ? <Navigate to="/dashboard" replace />
          : <Navigate to="/home" replace />
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

import { ThemeProvider } from "./components/ThemeProvider";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" storageKey="sathyabama-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
