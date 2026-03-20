import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

export type AppRole = 'superadmin' | 'admin' | 'pi' | 'co_pi' | 'assistant' | 'jrf' | 'student';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  department_id: string | null;
  department_name?: string;
  mobile_number?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: any | null; // Placeholder for legacy compatibility
  profile: Profile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedProfile = localStorage.getItem('profile');
    const token = localStorage.getItem('token');

    if (savedProfile && token) {
      setProfile(JSON.parse(savedProfile));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, profile: userProfile } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('profile', JSON.stringify(userProfile));
      setProfile(userProfile);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get('/me');
      setProfile(response.data);
      localStorage.setItem('profile', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user: profile, // Map profile to user for compatibility
      profile,
      login,
      logout,
      isAuthenticated: !!profile,
      loading,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Role label helper (moved from AuthContext for centralized role info)
export const getRoleLabel = (role: AppRole): string => {
  const labels: Record<AppRole, string> = {
    superadmin: 'Central Admin (Dean)',
    admin: 'Department Admin (HOD)',
    pi: 'Principal Investigator',
    co_pi: 'Co-Principal Investigator',
    assistant: 'Assistant',
    jrf: 'JRF',
    student: 'Student',
  };
  return labels[role] || 'User';
};
