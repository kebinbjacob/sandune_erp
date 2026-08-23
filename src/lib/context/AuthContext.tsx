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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
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
      if (!user && !isLoginPage) {
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
      {/* Hide children if checking auth or if not logged in and not on login page */}
      {loading || (!user && pathname !== '/login') ? (
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
