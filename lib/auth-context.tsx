'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/generated/prisma/enums';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchUser: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for development
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
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS];
      if (!demoUser || demoUser.password !== password) {
        throw new Error('Invalid email or password');
      }

      const authUser: AuthUser = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      };

      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  const switchUser = (email: string) => {
    const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS];
    if (demoUser) {
      const authUser: AuthUser = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      };
      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        switchUser,
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

export { DEMO_USERS };
