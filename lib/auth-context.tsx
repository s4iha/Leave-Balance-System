'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/generated/prisma/enums';
import { apiRequestRaw } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: { action: string; resource: string }[];
  requiresPasswordChange?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for development/testing
const DEMO_USERS = {
  'admin@example.com': {
    id: 'admin-id',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN' as UserRole,
    password: 'admin',
  },
  'manager@example.com': {
    id: 'manager-id',
    email: 'manager@example.com',
    name: 'John Manager',
    role: 'MANAGER' as UserRole,
    password: 'manager',
  },
  'emp1@example.com': {
    id: 'emp1-id',
    email: 'emp1@example.com',
    name: 'Alice Johnson',
    role: 'EMPLOYEE' as UserRole,
    password: 'password',
  },
  'emp2@example.com': {
    id: 'emp2-id',
    email: 'emp2@example.com',
    name: 'Bob Smith',
    role: 'EMPLOYEE' as UserRole,
    password: 'password',
  },
  'emp3@example.com': {
    id: 'emp3-id',
    email: 'emp3@example.com',
    name: 'Carol White',
    role: 'EMPLOYEE' as UserRole,
    password: 'password',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on mount
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to restore auth user:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequestRaw<{ success: boolean; data: AuthUser; error?: string }>(
        '/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Invalid email or password');
      }

      const authUser = response.data;
      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));

      // Log login event
      try {
        await apiRequestRaw('/api/v1/auth/audit', {
          method: 'POST',
          body: JSON.stringify({ actionType: 'LOGIN', description: `User ${email} logged in` }),
        }, authUser.id, authUser.email);
      } catch (auditError) {
        console.error('Failed to log login event:', auditError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const currentUser = user;
    
    // Log logout event
    if (currentUser) {
      try {
      await apiRequestRaw('/api/v1/auth/audit', {
        method: 'POST',
        body: JSON.stringify({ actionType: 'LOGOUT', description: `User ${user?.email} logged out` }),
      }, user?.id, user?.email);
    } catch (auditError) {
      console.error('Failed to log logout event:', auditError);
    }
    }

    setUser(null);
    localStorage.removeItem('authUser');
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
