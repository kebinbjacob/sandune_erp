'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppUser } from '@/lib/services/userService';
import { loginWithEmail } from '@/lib/services/authService';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const devAdmin: AppUser = {
  id: 'dev-admin-id',
  employee_id: 'dev-emp-id',
  email: 'admin@sandune.com',
  role: 'SUPER_ADMIN',
  status: 'Active',
  employees: {
    id: 'dev-emp-id',
    name: 'Kebin B Jacob',
    role: 'System Administrator',
    department: 'Management',
    status: 'Active'
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sandune_auth_user');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    if (process.env.NODE_ENV !== 'production') {
      return devAdmin;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for saved user on mount
    const savedUser = localStorage.getItem('sandune_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('sandune_auth_user');
      }
    } else if (process.env.NODE_ENV !== 'production') {
      setUser(devAdmin);
      localStorage.setItem('sandune_auth_user', JSON.stringify(devAdmin));
    }
    setLoading(false);
  }, []);

  const refreshUser = async () => {
    if (!user?.email) return;
    try {
      const { data } = await supabase
        .from('app_users')
        .select('*, employees(*)')
        .eq('email', user.email)
        .single();
        
      if (data) {
        setUser(data as AppUser);
        localStorage.setItem('sandune_auth_user', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  useEffect(() => {
    // Route protection
    if (!loading) {
      const isLoginPage = pathname === '/login';
      if (!user && !isLoginPage && process.env.NODE_ENV === 'production') {
        router.push('/login');
      } else if (user && isLoginPage) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password?: string) => {
    const appUser = await loginWithEmail(email, password);
    setUser(appUser);
    localStorage.setItem('sandune_auth_user', JSON.stringify(appUser));
    router.push('/');
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('sandune_auth_user');
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
          Loading...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
